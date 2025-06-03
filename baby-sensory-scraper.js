import puppeteer from 'puppeteer';
import { Pool } from 'pg';

class BabySensoryScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.client = null;
    this.scrapedData = [];
    this.baseUrl = 'https://www.babysensory.com';
    this.logFile = `baby_sensory_scrape_${new Date().toISOString().split('T')[0]}.log`;
  }

  async initialize() {
    console.log('🚀 Initializing Baby Sensory Scraper...');
    
    // Initialize database connection
    this.client = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    // Initialize browser
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Set user agent to avoid blocking
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log('✅ Browser and database initialized');
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
  }

  async findAllUKLocations() {
    this.log('🔍 Finding all UK Baby Sensory locations...');
    
    try {
      await this.page.goto(`${this.baseUrl}/find-a-class/`, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for location links to load
      await this.page.waitForSelector('a[href*="/"], .location-link, .franchise-link', { timeout: 10000 });

      // Extract all UK location URLs
      const locationUrls = await this.page.evaluate((baseUrl) => {
        const links = Array.from(document.querySelectorAll('a[href]'));
        const ukLocations = [];

        links.forEach(link => {
          const href = link.getAttribute('href');
          const text = link.textContent?.trim() || '';
          
          // Look for location-specific URLs (like /winchester/, /london/, etc.)
          if (href && href.includes('/') && !href.includes('http') && href.length > 2) {
            // Skip common pages that aren't locations
            const skipPages = ['about', 'contact', 'find-a-class', 'blog', 'shop', 'training', 'franchise'];
            const isSkipPage = skipPages.some(page => href.includes(page));
            
            if (!isSkipPage && href.match(/^\/[a-zA-Z-]+\/?$/)) {
              ukLocations.push({
                url: href.startsWith('http') ? href : baseUrl + href,
                name: text,
                path: href
              });
            }
          }
        });

        // Remove duplicates
        const uniqueLocations = ukLocations.filter((location, index, self) => 
          index === self.findIndex(l => l.url === location.url)
        );

        return uniqueLocations;
      }, this.baseUrl);

      this.log(`📍 Found ${locationUrls.length} potential UK locations`);
      return locationUrls;

    } catch (error) {
      this.log(`❌ Error finding locations: ${error.message}`);
      return [];
    }
  }

  async scrapeLocationClasses(location) {
    this.log(`🏫 Scraping classes for ${location.name} (${location.url})`);
    
    try {
      await this.page.goto(location.url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for page content to load
      await this.page.waitForTimeout(2000);

      // Extract class information from the page
      const classData = await this.page.evaluate((locationInfo) => {
        const classes = [];
        
        // Look for various selectors that might contain class information
        const possibleSelectors = [
          '.class-info', '.timetable', '.schedule', '.classes',
          '[class*="class"]', '[class*="timetable"]', '[class*="schedule"]',
          'table', '.venue', '.session'
        ];

        let foundElements = [];
        possibleSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          foundElements.push(...Array.from(elements));
        });

        // If no specific class elements found, look at the page text
        if (foundElements.length === 0) {
          foundElements = [document.body];
        }

        foundElements.forEach(element => {
          const text = element.textContent || element.innerText || '';
          const html = element.innerHTML || '';

          // Look for venue names (often contain "Church", "Centre", "Hall", "School")
          const venuePatterns = [
            /([A-Z][a-zA-Z\s&'-]+(?:Church|Centre|Center|Hall|School|Club|Academy|Community|Village|Sports|Leisure|Baptist|Methodist|Catholic|Primary|Junior|Infant|Children|Kids|Family))/g,
            /([A-Z][a-zA-Z\s&'-]+(?:St\.?\s|Saint\s)[A-Z][a-zA-Z\s]+)/g
          ];

          venuePatterns.forEach(pattern => {
            const venues = text.match(pattern);
            if (venues) {
              venues.forEach(venue => {
                // Look for day and time patterns near this venue
                const venueIndex = text.indexOf(venue);
                const contextText = text.slice(Math.max(0, venueIndex - 100), venueIndex + 300);
                
                // Extract days and times
                const dayPattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/gi;
                const timePattern = /(\d{1,2}[:.]\d{2}\s*(?:am|pm)?(?:\s*-\s*\d{1,2}[:.]\d{2}\s*(?:am|pm)?)?)/gi;
                
                const days = contextText.match(dayPattern) || [];
                const times = contextText.match(timePattern) || [];

                if (days.length > 0 && times.length > 0) {
                  days.forEach(day => {
                    times.forEach(time => {
                      classes.push({
                        locationName: locationInfo.name,
                        locationPath: locationInfo.path,
                        venueName: venue.trim(),
                        day: day,
                        time: time,
                        rawText: contextText.slice(0, 200) // For debugging
                      });
                    });
                  });
                } else if (venue.length > 5) {
                  // Add venue even without specific times (we can enhance later)
                  classes.push({
                    locationName: locationInfo.name,
                    locationPath: locationInfo.path,
                    venueName: venue.trim(),
                    day: null,
                    time: null,
                    rawText: contextText.slice(0, 200)
                  });
                }
              });
            }
          });
        });

        return classes;
      }, location);

      this.log(`📊 Found ${classData.length} classes for ${location.name}`);
      return classData;

    } catch (error) {
      this.log(`❌ Error scraping ${location.name}: ${error.message}`);
      return [];
    }
  }

  async enhanceClassData(classData) {
    this.log('🔧 Enhancing class data with additional information...');
    
    const enhancedClasses = [];

    for (const classItem of classData) {
      try {
        // Extract postcode from venue name if possible
        const postcodeMatch = classItem.venueName?.match(/([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i);
        const postcode = postcodeMatch ? postcodeMatch[1] : null;

        // Determine age range (Baby Sensory typically has age-specific sessions)
        let ageRange = 'Baby (0-1 years)'; // Default for Baby Sensory
        const text = classItem.rawText?.toLowerCase() || '';
        if (text.includes('toddler') || text.includes('13') || text.includes('walking')) {
          ageRange = 'Toddler (1-2 years)';
        }

        // Clean and format time
        let formattedTime = classItem.time;
        if (formattedTime) {
          formattedTime = formattedTime.replace(/[\.]/g, ':');
          if (!formattedTime.includes('am') && !formattedTime.includes('pm')) {
            // Assume morning times for baby classes
            const hour = parseInt(formattedTime.split(':')[0]);
            if (hour >= 9 && hour <= 11) {
              formattedTime += 'am';
            } else if (hour >= 1 && hour <= 5) {
              formattedTime += 'pm';
            }
          }
        }

        const enhancedClass = {
          name: `Baby Sensory - ${classItem.locationName}`,
          business_name: 'Baby Sensory',
          category: 'Baby & Toddler Classes',
          subcategory: 'Sensory Classes',
          description: `Baby Sensory classes combining music, lights, textures and scents to aid your baby's development in ${classItem.locationName}.`,
          venue_name: classItem.venueName,
          address: classItem.venueName, // We'll enhance this later
          postcode: postcode,
          town: classItem.locationName,
          website: `https://www.babysensory.com${classItem.locationPath}`,
          day: classItem.day,
          time: formattedTime,
          age_range: ageRange,
          pricing: '£8-12 per session', // Typical Baby Sensory pricing
          contact_email: `${classItem.locationName.toLowerCase().replace(/\s+/g, '')}@babysensory.com`,
          is_featured: true,
          is_free: false,
          data_source: 'baby_sensory_scraper',
          scraped_at: new Date().toISOString()
        };

        enhancedClasses.push(enhancedClass);

      } catch (error) {
        this.log(`⚠️ Error enhancing class data: ${error.message}`);
      }
    }

    this.log(`✨ Enhanced ${enhancedClasses.length} classes`);
    return enhancedClasses;
  }

  async saveToDatabase(classes) {
    this.log('💾 Saving classes to database...');
    
    let savedCount = 0;

    for (const classData of classes) {
      try {
        const insertQuery = `
          INSERT INTO classes (
            name, business_name, category, subcategory, description,
            venue_name, address, postcode, town, website,
            day, time, age_range, pricing, contact_email,
            is_featured, is_free, is_active
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, true
          )
          ON CONFLICT (name, venue_name, day, time) DO NOTHING
          RETURNING id
        `;

        const values = [
          classData.name,
          classData.business_name,
          classData.category,
          classData.subcategory,
          classData.description,
          classData.venue_name,
          classData.address,
          classData.postcode,
          classData.town,
          classData.website,
          classData.day,
          classData.time,
          classData.age_range,
          classData.pricing,
          classData.contact_email,
          classData.is_featured,
          classData.is_free
        ];

        const result = await this.client.query(insertQuery, values);
        
        if (result.rows.length > 0) {
          savedCount++;
        }

      } catch (error) {
        this.log(`❌ Error saving class ${classData.name}: ${error.message}`);
      }
    }

    this.log(`✅ Successfully saved ${savedCount} new classes to database`);
    return savedCount;
  }

  async runFullScrape() {
    try {
      await this.initialize();
      
      // Step 1: Find all UK locations
      const locations = await this.findAllUKLocations();
      
      if (locations.length === 0) {
        this.log('❌ No locations found. Check if Baby Sensory website structure has changed.');
        return;
      }

      // Step 2: Scrape each location
      let allClasses = [];
      for (const location of locations.slice(0, 5)) { // Start with first 5 locations for testing
        const classes = await this.scrapeLocationClasses(location);
        allClasses.push(...classes);
        
        // Add delay between requests to be respectful
        await this.sleep(2000);
      }

      // Step 3: Enhance and clean the data
      const enhancedClasses = await this.enhanceClassData(allClasses);

      // Step 4: Save to database
      const savedCount = await this.saveToDatabase(enhancedClasses);

      // Step 5: Show summary
      await this.showResults(locations.length, allClasses.length, enhancedClasses.length, savedCount);

    } catch (error) {
      this.log(`💥 Critical error: ${error.message}`);
    } finally {
      await this.close();
    }
  }

  async showResults(locationsFound, rawClasses, enhancedClasses, savedClasses) {
    console.log('\n📊 BABY SENSORY SCRAPING RESULTS');
    console.log('================================');
    console.log(`🌍 UK Locations Found: ${locationsFound}`);
    console.log(`📚 Raw Classes Extracted: ${rawClasses}`);
    console.log(`✨ Enhanced Classes: ${enhancedClasses}`);
    console.log(`💾 Successfully Saved: ${savedClasses}`);
    console.log(`📅 Scraped on: ${new Date().toLocaleDateString()}`);
    
    if (savedClasses > 0) {
      console.log('\n✅ Scraping completed successfully!');
      console.log('💡 Next steps:');
      console.log('   1. Review the new classes in your database');
      console.log('   2. Run address enhancement script for missing postcodes');
      console.log('   3. Verify pricing and contact information');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
    if (this.client) {
      await this.client.end();
    }
  }
}

// Main execution function
async function runBabySensoryScraper() {
  const scraper = new BabySensoryScraper();
  await scraper.runFullScrape();
}

// Allow running directly or as module
if (import.meta.url === `file://${process.argv[1]}`) {
  runBabySensoryScraper().catch(console.error);
}

export { BabySensoryScraper, runBabySensoryScraper };