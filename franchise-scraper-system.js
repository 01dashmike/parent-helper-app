const puppeteer = require('puppeteer');
const { Pool } = require('pg');

class FranchiseScrapingSystem {
  constructor() {
    this.browser = null;
    this.page = null;
    this.client = null;
    this.currentScrapeId = Date.now();
    
    // Franchise companies ordered by current database size
    this.franchiseTargets = [
      {
        name: 'Baby Sensory',
        currentCount: 700,
        baseUrl: 'https://www.babysensory.com',
        scraperMethod: 'scrapeBabySensory'
      },
      {
        name: 'Water Babies',
        currentCount: 253,
        baseUrl: 'https://www.waterbabies.co.uk',
        scraperMethod: 'scrapeWaterBabies'
      },
      {
        name: 'Monkey Music',
        currentCount: 110,
        baseUrl: 'https://www.monkeymusic.co.uk',
        scraperMethod: 'scrapeMonkeyMusic'
      },
      {
        name: 'Sing and Sign',
        currentCount: 56,
        baseUrl: 'https://www.singandsign.co.uk',
        scraperMethod: 'scrapeSingAndSign'
      },
      {
        name: 'Toddler Sense',
        currentCount: 54,
        baseUrl: 'https://www.toddlersense.co.uk',
        scraperMethod: 'scrapeToddlerSense'
      },
      {
        name: 'Tumble Tots',
        currentCount: 44,
        baseUrl: 'https://www.tumbletots.com',
        scraperMethod: 'scrapeTumbleTots'
      }
    ];
  }

  async initialize() {
    console.log('Initializing Franchise Scraping System...');
    
    // Database connection
    this.client = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    // Browser setup
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await this.page.setViewport({ width: 1366, height: 768 });
    
    console.log('System initialized successfully');
  }

  log(message, franchise = '') {
    const timestamp = new Date().toISOString();
    const prefix = franchise ? `[${franchise}]` : '';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  // BABY SENSORY SCRAPER
  async scrapeBabySensory() {
    this.log('Starting Baby Sensory scraping...', 'BABY SENSORY');
    const scrapedClasses = [];

    try {
      // Navigate to find-a-class page
      await this.page.goto('https://www.babysensory.com/find-a-class/', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Extract UK location links
      const locationUrls = await this.page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href]'));
        const ukLocations = [];

        links.forEach(link => {
          const href = link.getAttribute('href');
          const text = link.textContent?.trim() || '';
          
          // Look for location URLs like /winchester/, /london/, etc.
          if (href && href.match(/^\/[a-zA-Z][a-zA-Z-]+\/?$/) && href.length > 2) {
            const skipPages = ['about', 'contact', 'find-a-class', 'blog', 'shop', 'training', 'franchise', 'login', 'register'];
            const isLocationPage = !skipPages.some(page => href.includes(page));
            
            if (isLocationPage) {
              ukLocations.push({
                url: 'https://www.babysensory.com' + href,
                name: text || href.replace(/[\/]/g, '').replace(/-/g, ' '),
                path: href
              });
            }
          }
        });

        return [...new Set(ukLocations.map(l => JSON.stringify(l)))].map(l => JSON.parse(l));
      });

      this.log(`Found ${locationUrls.length} potential locations`, 'BABY SENSORY');

      // Scrape each location (limit to first 10 for initial test)
      for (const location of locationUrls.slice(0, 10)) {
        try {
          await this.page.goto(location.url, { waitUntil: 'networkidle2', timeout: 20000 });
          await this.page.waitForTimeout(2000);

          const locationClasses = await this.page.evaluate((loc) => {
            const classes = [];
            const pageText = document.body.textContent || '';
            
            // Find venue names (common patterns for community venues)
            const venuePatterns = [
              /([A-Z][a-zA-Z\s&'-]{3,50}(?:Church|Centre|Center|Hall|School|Club|Academy|Community|Village|Sports|Leisure|Baptist|Methodist|Catholic|Primary|Junior|Infant|Children|Kids|Family|Parish))/g,
              /([A-Z][a-zA-Z\s&'-]{3,50}(?:St\.?\s|Saint\s)[A-Z][a-zA-Z\s&'-]{2,30})/g
            ];

            const dayPattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/gi;
            const timePattern = /(\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?(?:\s*[-–]\s*\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?)?)/g;

            venuePatterns.forEach(pattern => {
              const matches = pageText.match(pattern);
              if (matches) {
                matches.forEach(venue => {
                  const venueIndex = pageText.indexOf(venue);
                  const context = pageText.slice(Math.max(0, venueIndex - 150), venueIndex + 300);
                  
                  const days = context.match(dayPattern) || [];
                  const times = context.match(timePattern) || [];

                  if (days.length > 0 && times.length > 0) {
                    days.forEach(day => {
                      times.forEach(time => {
                        classes.push({
                          locationName: loc.name,
                          locationPath: loc.path,
                          venueName: venue.trim(),
                          day: day,
                          time: time,
                          context: context.slice(0, 100)
                        });
                      });
                    });
                  } else if (venue.trim().length > 10) {
                    // Add venue without specific schedule
                    classes.push({
                      locationName: loc.name,
                      locationPath: loc.path,
                      venueName: venue.trim(),
                      day: 'Various',
                      time: 'Check website',
                      context: context.slice(0, 100)
                    });
                  }
                });
              }
            });

            return classes;
          }, location);

          scrapedClasses.push(...locationClasses);
          this.log(`Scraped ${locationClasses.length} classes from ${location.name}`, 'BABY SENSORY');

        } catch (error) {
          this.log(`Error scraping ${location.name}: ${error.message}`, 'BABY SENSORY');
        }

        await this.sleep(1500); // Respectful delay
      }

    } catch (error) {
      this.log(`Baby Sensory scraping error: ${error.message}`, 'BABY SENSORY');
    }

    return this.enhanceBabySensoryData(scrapedClasses);
  }

  enhanceBabySensoryData(rawClasses) {
    return rawClasses.map(classItem => {
      const postcodeMatch = classItem.venueName?.match(/([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i);
      
      return {
        name: `Baby Sensory - ${classItem.locationName}`,
        business_name: 'Baby Sensory',
        category: 'Baby & Toddler Classes',
        subcategory: 'Sensory Classes',
        description: `Baby Sensory classes combining music, lights, textures and scents to aid your baby's development in ${classItem.locationName}.`,
        venue_name: classItem.venueName,
        address: classItem.venueName,
        postcode: postcodeMatch ? postcodeMatch[1] : null,
        town: classItem.locationName,
        website: `https://www.babysensory.com${classItem.locationPath}`,
        day: classItem.day,
        time: this.cleanTime(classItem.time),
        age_range: 'Baby (0-1 years)',
        pricing: '£8-12 per session',
        contact_email: this.generateEmail(classItem.locationName, 'babysensory.com'),
        is_featured: true,
        is_free: false,
        latitude: null,
        longitude: null
      };
    });
  }

  // WATER BABIES SCRAPER
  async scrapeWaterBabies() {
    this.log('Starting Water Babies scraping...', 'WATER BABIES');
    const scrapedClasses = [];

    try {
      await this.page.goto('https://www.waterbabies.co.uk/classes/find-your-local-pool/', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Water Babies typically has a postcode search - try to extract pool locations
      const poolLocations = await this.page.evaluate(() => {
        const locations = [];
        
        // Look for pool/location links
        const links = Array.from(document.querySelectorAll('a[href]'));
        
        links.forEach(link => {
          const href = link.getAttribute('href');
          const text = link.textContent?.trim() || '';
          
          if (href && (href.includes('/pool/') || href.includes('/classes/') || href.includes('/venue/'))) {
            locations.push({
              url: href.startsWith('http') ? href : 'https://www.waterbabies.co.uk' + href,
              name: text,
              type: 'pool'
            });
          }
        });

        return [...new Set(locations.map(l => JSON.stringify(l)))].map(l => JSON.parse(l));
      });

      this.log(`Found ${poolLocations.length} pool locations`, 'WATER BABIES');

      // Scrape pool details (limit for testing)
      for (const pool of poolLocations.slice(0, 8)) {
        try {
          await this.page.goto(pool.url, { waitUntil: 'networkidle2', timeout: 20000 });
          
          const poolClasses = await this.page.evaluate((poolInfo) => {
            const classes = [];
            const text = document.body.textContent || '';
            
            // Extract pool/venue name
            const poolNameMatch = text.match(/Pool:\s*([^,\n]+)/i) || 
                                 text.match(/Venue:\s*([^,\n]+)/i) ||
                                 text.match(/Location:\s*([^,\n]+)/i);
            
            const poolName = poolNameMatch ? poolNameMatch[1].trim() : poolInfo.name;
            
            // Find schedule information
            const dayPattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/gi;
            const timePattern = /(\d{1,2}[:.]\d{2}\s*(?:am|pm)?(?:\s*[-–]\s*\d{1,2}[:.]\d{2}\s*(?:am|pm)?)?)/g;
            
            const days = text.match(dayPattern) || [];
            const times = text.match(timePattern) || [];
            
            if (days.length > 0 && times.length > 0) {
              days.forEach(day => {
                times.forEach(time => {
                  classes.push({
                    poolName: poolName,
                    day: day,
                    time: time,
                    url: poolInfo.url
                  });
                });
              });
            } else {
              // Add pool without specific schedule
              classes.push({
                poolName: poolName,
                day: 'Various',
                time: 'Check website',
                url: poolInfo.url
              });
            }

            return classes;
          }, pool);

          scrapedClasses.push(...poolClasses);

        } catch (error) {
          this.log(`Error scraping pool ${pool.name}: ${error.message}`, 'WATER BABIES');
        }

        await this.sleep(1500);
      }

    } catch (error) {
      this.log(`Water Babies scraping error: ${error.message}`, 'WATER BABIES');
    }

    return this.enhanceWaterBabiesData(scrapedClasses);
  }

  enhanceWaterBabiesData(rawClasses) {
    return rawClasses.map(classItem => ({
      name: `Water Babies - ${classItem.poolName}`,
      business_name: 'Water Babies',
      category: 'Baby & Toddler Classes',
      subcategory: 'Baby Swimming',
      description: `Water Babies swimming classes for babies and toddlers in a warm, safe environment.`,
      venue_name: classItem.poolName,
      address: classItem.poolName,
      postcode: null,
      town: this.extractTownFromVenue(classItem.poolName),
      website: classItem.url,
      day: classItem.day,
      time: this.cleanTime(classItem.time),
      age_range: 'Baby & Toddler (0-4 years)',
      pricing: '£15-20 per session',
      contact_email: 'hello@waterbabies.co.uk',
      is_featured: true,
      is_free: false,
      latitude: null,
      longitude: null
    }));
  }

  // UTILITY METHODS
  cleanTime(timeStr) {
    if (!timeStr || timeStr === 'Check website') return timeStr;
    
    return timeStr
      .replace(/\./g, ':')
      .replace(/([0-9])([ap]m)/i, '$1 $2')
      .toLowerCase();
  }

  generateEmail(location, domain) {
    const cleanLocation = location.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15);
    return `${cleanLocation}@${domain}`;
  }

  extractTownFromVenue(venueName) {
    // Extract likely town name from venue
    const words = venueName.split(/[\s,]+/);
    return words[words.length - 1] || 'Unknown';
  }

  async saveToDatabase(classes, franchiseName) {
    this.log(`Saving ${classes.length} ${franchiseName} classes to database...`);
    
    let savedCount = 0;
    let duplicateCount = 0;

    for (const classData of classes) {
      try {
        const insertQuery = `
          INSERT INTO classes (
            name, business_name, category, subcategory, description,
            venue_name, address, postcode, town, website,
            day, time, age_range, pricing, contact_email,
            is_featured, is_free, is_active, latitude, longitude
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, true, $18, $19
          )
          ON CONFLICT (name, venue_name, day, time) DO NOTHING
          RETURNING id
        `;

        const values = [
          classData.name, classData.business_name, classData.category,
          classData.subcategory, classData.description, classData.venue_name,
          classData.address, classData.postcode, classData.town,
          classData.website, classData.day, classData.time,
          classData.age_range, classData.pricing, classData.contact_email,
          classData.is_featured, classData.is_free,
          classData.latitude, classData.longitude
        ];

        const result = await this.client.query(insertQuery, values);
        
        if (result.rows.length > 0) {
          savedCount++;
        } else {
          duplicateCount++;
        }

      } catch (error) {
        this.log(`Error saving ${franchiseName} class: ${error.message}`);
      }
    }

    this.log(`${franchiseName}: Saved ${savedCount} new classes, ${duplicateCount} duplicates skipped`);
    return { saved: savedCount, duplicates: duplicateCount };
  }

  async runCompleteFranchiseScraping() {
    try {
      await this.initialize();
      
      const results = {
        timestamp: new Date().toISOString(),
        franchises: []
      };

      // Process each franchise in order
      for (const franchise of this.franchiseTargets.slice(0, 2)) { // Start with first 2
        this.log(`Starting ${franchise.name} scraping...`);
        
        try {
          const scrapedClasses = await this[franchise.scraperMethod]();
          const saveResult = await this.saveToDatabase(scrapedClasses, franchise.name);
          
          results.franchises.push({
            name: franchise.name,
            previousCount: franchise.currentCount,
            scrapedCount: scrapedClasses.length,
            savedCount: saveResult.saved,
            duplicates: saveResult.duplicates
          });

        } catch (error) {
          this.log(`Failed to scrape ${franchise.name}: ${error.message}`);
          results.franchises.push({
            name: franchise.name,
            error: error.message
          });
        }

        // Delay between franchises
        await this.sleep(3000);
      }

      await this.showFinalResults(results);

    } catch (error) {
      this.log(`Critical system error: ${error.message}`);
    } finally {
      await this.close();
    }
  }

  async showFinalResults(results) {
    console.log('\n=== FRANCHISE SCRAPING RESULTS ===');
    console.log(`Completed at: ${results.timestamp}`);
    console.log('');

    let totalScraped = 0;
    let totalSaved = 0;

    results.franchises.forEach(franchise => {
      if (franchise.error) {
        console.log(`❌ ${franchise.name}: FAILED - ${franchise.error}`);
      } else {
        console.log(`✅ ${franchise.name}:`);
        console.log(`   Previous: ${franchise.previousCount} classes`);
        console.log(`   Scraped: ${franchise.scrapedCount} classes`);
        console.log(`   Saved: ${franchise.savedCount} new classes`);
        console.log(`   Duplicates: ${franchise.duplicates} skipped`);
        
        totalScraped += franchise.scrapedCount;
        totalSaved += franchise.savedCount;
      }
      console.log('');
    });

    console.log(`📊 TOTALS: ${totalScraped} scraped, ${totalSaved} saved`);
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Run Google Places API to enhance addresses');
    console.log('   2. Validate and clean scraped data');
    console.log('   3. Process remaining franchises');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.browser) await this.browser.close();
    if (this.client) await this.client.end();
  }
}

// Main execution
async function runFranchiseScrapingSystem() {
  const system = new FranchiseScrapingSystem();
  await system.runCompleteFranchiseScraping();
}

if (require.main === module) {
  runFranchiseScrapingSystem().catch(console.error);
}

module.exports = { FranchiseScrapingSystem, runFranchiseScrapingSystem };