import * as cheerio from 'cheerio';
import { Pool } from 'pg';

class LightweightBabySensoryScraper {
  constructor() {
    this.client = null;
    this.scrapedData = [];
    this.baseUrl = 'https://www.babysensory.com';
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  async initialize() {
    console.log('Initializing Baby Sensory Scraper...');
    
    this.client = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    console.log('Database connection established');
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  async fetchPage(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-GB,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.text();
      } catch (error) {
        this.log(`Attempt ${i + 1} failed for ${url}: ${error.message}`);
        if (i === retries - 1) throw error;
        await this.sleep(2000 * (i + 1)); // Exponential backoff
      }
    }
  }

  async findUKLocations() {
    this.log('Finding UK Baby Sensory locations...');
    
    try {
      const html = await this.fetchPage(`${this.baseUrl}/find-a-class/`);
      const $ = cheerio.load(html);
      
      const locations = [];
      
      // Extract location links
      $('a[href]').each((i, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().trim();
        
        if (href && href.match(/^\/[a-zA-Z][a-zA-Z-]+\/?$/)) {
          const skipPages = ['about', 'contact', 'find-a-class', 'blog', 'shop', 'training', 'franchise', 'login', 'register'];
          const isLocationPage = !skipPages.some(page => href.includes(page));
          
          if (isLocationPage && text && text.length > 1) {
            locations.push({
              url: href.startsWith('http') ? href : this.baseUrl + href,
              name: text.replace(/[^a-zA-Z\s]/g, '').trim(),
              path: href
            });
          }
        }
      });

      // Remove duplicates
      const uniqueLocations = locations.filter((location, index, self) => 
        index === self.findIndex(l => l.url === location.url)
      );

      this.log(`Found ${uniqueLocations.length} potential UK locations`);
      return uniqueLocations;

    } catch (error) {
      this.log(`Error finding locations: ${error.message}`);
      return [];
    }
  }

  async scrapeLocationDetails(location) {
    this.log(`Scraping ${location.name}...`);
    
    try {
      const html = await this.fetchPage(location.url);
      const $ = cheerio.load(html);
      
      const classes = [];
      const pageText = $.text();
      
      // Extract venue information using regex patterns
      const venuePatterns = [
        /([A-Z][a-zA-Z\s&'-]{5,60}(?:Church|Centre|Center|Hall|School|Club|Academy|Community|Village|Sports|Leisure|Baptist|Methodist|Catholic|Primary|Junior|Infant|Children|Kids|Family|Parish|Recreation|Community))/g,
        /([A-Z][a-zA-Z\s&'-]{3,50}(?:St\.?\s|Saint\s)[A-Z][a-zA-Z\s&'-]{2,40})/g
      ];

      const dayPattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/gi;
      const timePattern = /(\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?(?:\s*[-–—]\s*\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?)?)/g;

      venuePatterns.forEach(pattern => {
        const venues = pageText.match(pattern);
        if (venues) {
          venues.forEach(venue => {
            const venueIndex = pageText.indexOf(venue);
            const contextStart = Math.max(0, venueIndex - 200);
            const contextEnd = venueIndex + 400;
            const context = pageText.slice(contextStart, contextEnd);
            
            const days = context.match(dayPattern) || [];
            const times = context.match(timePattern) || [];

            if (days.length > 0 && times.length > 0) {
              // Create entries for each day/time combination
              days.forEach(day => {
                times.forEach(time => {
                  classes.push({
                    locationName: location.name,
                    locationPath: location.path,
                    venueName: venue.trim(),
                    day: day.charAt(0).toUpperCase() + day.slice(1).toLowerCase(),
                    time: time.trim(),
                    context: context.slice(0, 150)
                  });
                });
              });
            } else if (venue.trim().length > 15) {
              // Add venue without specific schedule
              classes.push({
                locationName: location.name,
                locationPath: location.path,
                venueName: venue.trim(),
                day: 'Various',
                time: 'See website',
                context: context.slice(0, 150)
              });
            }
          });
        }
      });

      // Remove duplicate venues
      const uniqueClasses = classes.filter((classItem, index, self) => 
        index === self.findIndex(c => 
          c.venueName === classItem.venueName && 
          c.day === classItem.day && 
          c.time === classItem.time
        )
      );

      this.log(`Found ${uniqueClasses.length} classes in ${location.name}`);
      return uniqueClasses;

    } catch (error) {
      this.log(`Error scraping ${location.name}: ${error.message}`);
      return [];
    }
  }

  enhanceClassData(rawClasses) {
    this.log('Enhancing class data...');
    
    return rawClasses.map(classItem => {
      // Extract postcode if present in venue name
      const postcodeMatch = classItem.venueName.match(/([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i);
      
      // Clean time format
      let cleanTime = classItem.time;
      if (cleanTime && cleanTime !== 'See website') {
        cleanTime = cleanTime
          .replace(/\./g, ':')
          .replace(/([0-9])([ap]m)/i, '$1 $2')
          .toLowerCase();
      }

      // Determine age range based on context
      let ageRange = 'Baby (0-1 years)';
      const contextLower = classItem.context.toLowerCase();
      if (contextLower.includes('toddler') || contextLower.includes('walking') || contextLower.includes('13')) {
        ageRange = 'Toddler (1-2 years)';
      }

      return {
        name: `Baby Sensory - ${classItem.locationName}`,
        description: `Baby Sensory classes featuring music, lights, textures and scents to aid your baby's development in ${classItem.locationName}.`,
        age_group_min: 0,
        age_group_max: 24,
        price: '£8-12 per session',
        is_featured: true,
        venue: classItem.venueName,
        address: classItem.venueName,
        postcode: postcodeMatch ? postcodeMatch[1] : null,
        day_of_week: classItem.day,
        time: cleanTime,
        contact_email: this.generateContactEmail(classItem.locationName),
        website: `${this.baseUrl}${classItem.locationPath}`,
        category: 'Baby & Toddler Classes',
        is_active: true,
        town: classItem.locationName,
        service_type: 'Class',
        main_category: 'Baby & Toddler Classes',
        subcategory: 'Sensory Development',
        provider_name: 'Baby Sensory',
        latitude: null,
        longitude: null
      };
    });
  }

  generateContactEmail(locationName) {
    const cleanLocation = locationName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15);
    return `${cleanLocation}@babysensory.com`;
  }

  async saveToDatabase(classes) {
    this.log(`Saving ${classes.length} classes to database...`);
    
    let savedCount = 0;
    let duplicateCount = 0;

    for (const classData of classes) {
      try {
        const insertQuery = `
          INSERT INTO classes (
            name, description, age_group_min, age_group_max, price,
            is_featured, venue, address, postcode, day_of_week,
            time, contact_email, website, category, is_active,
            town, service_type, main_category, subcategory, provider_name,
            latitude, longitude
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22
          )
          ON CONFLICT (name, venue, day_of_week, time) DO NOTHING
          RETURNING id
        `;

        const values = [
          classData.name,
          classData.description,
          classData.age_group_min,
          classData.age_group_max,
          classData.price,
          classData.is_featured,
          classData.venue,
          classData.address,
          classData.postcode,
          classData.day_of_week,
          classData.time,
          classData.contact_email,
          classData.website,
          classData.category,
          classData.is_active,
          classData.town,
          classData.service_type,
          classData.main_category,
          classData.subcategory,
          classData.provider_name,
          classData.latitude,
          classData.longitude
        ];

        const result = await this.client.query(insertQuery, values);
        
        if (result.rows.length > 0) {
          savedCount++;
        } else {
          duplicateCount++;
        }

      } catch (error) {
        this.log(`Error saving class ${classData.name}: ${error.message}`);
      }
    }

    this.log(`Saved ${savedCount} new classes, ${duplicateCount} duplicates skipped`);
    return { saved: savedCount, duplicates: duplicateCount };
  }

  async runScraping() {
    try {
      await this.initialize();
      
      // Find all UK locations
      const locations = await this.findUKLocations();
      
      if (locations.length === 0) {
        this.log('No locations found. Website structure may have changed.');
        return;
      }

      // Scrape first 8 locations for initial test
      let allClasses = [];
      const locationsToScrape = locations.slice(0, 8);
      
      for (const location of locationsToScrape) {
        const classes = await this.scrapeLocationDetails(location);
        allClasses.push(...classes);
        
        // Respectful delay between requests
        await this.sleep(1500);
      }

      // Enhance the data
      const enhancedClasses = this.enhanceClassData(allClasses);

      // Save to database
      const saveResult = await this.saveToDatabase(enhancedClasses);

      // Show results
      await this.showResults(locations.length, allClasses.length, enhancedClasses.length, saveResult);

    } catch (error) {
      this.log(`Critical error: ${error.message}`);
    } finally {
      if (this.client) {
        await this.client.end();
      }
    }
  }

  async showResults(totalLocations, rawClasses, enhancedClasses, saveResult) {
    console.log('\n=== BABY SENSORY SCRAPING RESULTS ===');
    console.log(`Total UK Locations Found: ${totalLocations}`);
    console.log(`Locations Processed: 8 (initial test)`);
    console.log(`Raw Classes Extracted: ${rawClasses}`);
    console.log(`Enhanced Classes: ${enhancedClasses}`);
    console.log(`Successfully Saved: ${saveResult.saved}`);
    console.log(`Duplicates Skipped: ${saveResult.duplicates}`);
    console.log(`Scraped: ${new Date().toLocaleDateString()}`);
    
    if (saveResult.saved > 0) {
      console.log('\nScraping completed successfully!');
      console.log('Next steps:');
      console.log('1. Run address enhancement with Google Places API');
      console.log('2. Process remaining locations');
      console.log('3. Move to Water Babies scraping');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function runLightweightBabySensoryScraper() {
  const scraper = new LightweightBabySensoryScraper();
  await scraper.runScraping();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runLightweightBabySensoryScraper().catch(console.error);
}

export { LightweightBabySensoryScraper, runLightweightBabySensoryScraper };