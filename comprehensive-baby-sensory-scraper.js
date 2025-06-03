import * as cheerio from 'cheerio';
import { Pool } from 'pg';

class ComprehensiveBabySensoryScraper {
  constructor() {
    this.client = null;
    this.baseUrl = 'https://www.babysensory.com';
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.franchiseUrls = [
      // Known Baby Sensory franchise locations from their website structure
      'https://www.babysensory.com/winchester/',
      'https://www.babysensory.com/guildford/',
      'https://www.babysensory.com/aldershot/',
      'https://www.babysensory.com/eastleigh/',
      'https://www.babysensory.com/basingstoke/',
      'https://www.babysensory.com/andover/',
      'https://www.babysensory.com/romsey/',
      'https://www.babysensory.com/fareham/',
      'https://www.babysensory.com/gosport/',
      'https://www.babysensory.com/petersfield/',
      'https://www.babysensory.com/alton/',
      'https://www.babysensory.com/farnham/',
      'https://www.babysensory.com/woking/',
      'https://www.babysensory.com/camberley/',
      'https://www.babysensory.com/fleet/',
      'https://www.babysensory.com/reading/',
      'https://www.babysensory.com/wokingham/',
      'https://www.babysensory.com/bracknell/',
      'https://www.babysensory.com/maidenhead/',
      'https://www.babysensory.com/slough/',
      'https://www.babysensory.com/windsor/',
      'https://www.babysensory.com/staines/',
      'https://www.babysensory.com/kingston/',
      'https://www.babysensory.com/wimbledon/',
      'https://www.babysensory.com/richmond/',
      'https://www.babysensory.com/surbiton/',
      'https://www.babysensory.com/epsom/',
      'https://www.babysensory.com/leatherhead/',
      'https://www.babysensory.com/dorking/',
      'https://www.babysensory.com/redhill/',
      'https://www.babysensory.com/reigate/',
      'https://www.babysensory.com/crawley/',
      'https://www.babysensory.com/horsham/',
      'https://www.babysensory.com/worthing/',
      'https://www.babysensory.com/brighton/',
      'https://www.babysensory.com/hove/',
      'https://www.babysensory.com/lewes/',
      'https://www.babysensory.com/eastbourne/',
      'https://www.babysensory.com/hastings/',
      'https://www.babysensory.com/tunbridge-wells/',
      'https://www.babysensory.com/sevenoaks/',
      'https://www.babysensory.com/maidstone/',
      'https://www.babysensory.com/canterbury/',
      'https://www.babysensory.com/ashford/',
      'https://www.babysensory.com/folkestone/',
      'https://www.babysensory.com/dover/',
      'https://www.babysensory.com/margate/',
      'https://www.babysensory.com/ramsgate/',
      'https://www.babysensory.com/oxford/',
      'https://www.babysensory.com/banbury/',
      'https://www.babysensory.com/witney/',
      'https://www.babysensory.com/abingdon/',
      'https://www.babysensory.com/didcot/',
      'https://www.babysensory.com/henley/',
      'https://www.babysensory.com/thame/',
      'https://www.babysensory.com/bicester/',
      'https://www.babysensory.com/cheltenham/',
      'https://www.babysensory.com/gloucester/',
      'https://www.babysensory.com/stroud/',
      'https://www.babysensory.com/cirencester/',
      'https://www.babysensory.com/tewkesbury/',
      'https://www.babysensory.com/bath/',
      'https://www.babysensory.com/bristol/',
      'https://www.babysensory.com/weston-super-mare/',
      'https://www.babysensory.com/bridgwater/',
      'https://www.babysensory.com/taunton/',
      'https://www.babysensory.com/yeovil/',
      'https://www.babysensory.com/frome/',
      'https://www.babysensory.com/wells/',
      'https://www.babysensory.com/glastonbury/',
      'https://www.babysensory.com/burnham-on-sea/',
      'https://www.babysensory.com/minehead/',
      'https://www.babysensory.com/exeter/',
      'https://www.babysensory.com/plymouth/',
      'https://www.babysensory.com/torquay/',
      'https://www.babysensory.com/paignton/',
      'https://www.babysensory.com/newton-abbot/',
      'https://www.babysensory.com/totnes/',
      'https://www.babysensory.com/kingsbridge/',
      'https://www.babysensory.com/barnstaple/',
      'https://www.babysensory.com/bideford/',
      'https://www.babysensory.com/ilfracombe/',
      'https://www.babysensory.com/okehampton/',
      'https://www.babysensory.com/tavistock/',
      'https://www.babysensory.com/launceston/',
      'https://www.babysensory.com/bodmin/',
      'https://www.babysensory.com/liskeard/',
      'https://www.babysensory.com/looe/',
      'https://www.babysensory.com/fowey/',
      'https://www.babysensory.com/st-austell/',
      'https://www.babysensory.com/truro/',
      'https://www.babysensory.com/falmouth/',
      'https://www.babysensory.com/helston/',
      'https://www.babysensory.com/penzance/',
      'https://www.babysensory.com/st-ives/',
      'https://www.babysensory.com/newquay/',
      'https://www.babysensory.com/bude/',
      'https://www.babysensory.com/camborne/',
      'https://www.babysensory.com/redruth/'
    ];
  }

  async initialize() {
    console.log('Initializing Comprehensive Baby Sensory Scraper...');
    
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
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-GB,en;q=0.5',
            'DNT': '1',
            'Connection': 'keep-alive'
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            return null; // Page doesn't exist
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.text();
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.sleep(1000 * (i + 1));
      }
    }
  }

  async scrapeFranchiseLocation(franchiseUrl) {
    const locationName = this.extractLocationName(franchiseUrl);
    this.log(`Scraping ${locationName}...`);
    
    try {
      const html = await this.fetchPage(franchiseUrl);
      
      if (!html) {
        this.log(`${locationName}: Page not found`);
        return [];
      }

      const $ = cheerio.load(html);
      const classes = [];
      
      // Extract page text for analysis
      const pageText = $('body').text();
      
      // Look for venue information in various formats
      const venuePatterns = [
        // Standard community venues
        /([A-Z][a-zA-Z\s&'-]{5,60}(?:Church|Centre|Center|Hall|School|Club|Academy|Community|Village|Sports|Leisure|Recreation))/g,
        // Religious venues  
        /([A-Z][a-zA-Z\s&'-]{3,50}(?:Baptist|Methodist|Catholic|Anglican|Presbyterian|United|Reformed|Evangelical)[\s][A-Z][a-zA-Z\s&'-]{2,30})/g,
        // Educational venues
        /([A-Z][a-zA-Z\s&'-]{3,50}(?:Primary|Junior|Infant|Nursery|School|College|University))/g,
        // Specific venue types
        /([A-Z][a-zA-Z\s&'-]{3,50}(?:St\.?\s|Saint\s)[A-Z][a-zA-Z\s&'-]{2,40})/g
      ];

      // Day and time patterns
      const dayPattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/gi;
      const timePattern = /(\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?(?:\s*[-–—]\s*\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?)?)/g;

      // Process each venue pattern
      venuePatterns.forEach(pattern => {
        const venues = pageText.match(pattern);
        if (venues) {
          venues.forEach(venue => {
            if (venue.length < 10 || venue.length > 80) return; // Filter reasonable venue names
            
            const venueIndex = pageText.indexOf(venue);
            const contextStart = Math.max(0, venueIndex - 250);
            const contextEnd = venueIndex + 500;
            const context = pageText.slice(contextStart, contextEnd);
            
            // Find schedule information near this venue
            const days = context.match(dayPattern) || [];
            const times = context.match(timePattern) || [];

            if (days.length > 0 && times.length > 0) {
              // Create specific class entries for each day/time
              days.forEach(day => {
                times.forEach(time => {
                  classes.push({
                    locationName: locationName,
                    franchiseUrl: franchiseUrl,
                    venueName: this.cleanVenueName(venue),
                    day: day.charAt(0).toUpperCase() + day.slice(1).toLowerCase(),
                    time: this.cleanTime(time),
                    context: context.slice(0, 200)
                  });
                });
              });
            } else {
              // Add venue without specific schedule if it looks legitimate
              if (this.isLegitimateVenue(venue)) {
                classes.push({
                  locationName: locationName,
                  franchiseUrl: franchiseUrl,
                  venueName: this.cleanVenueName(venue),
                  day: 'Various',
                  time: 'Contact for schedule',
                  context: context.slice(0, 200)
                });
              }
            }
          });
        }
      });

      // Remove duplicates and filter quality
      const uniqueClasses = this.filterAndDeduplicateClasses(classes);
      
      this.log(`${locationName}: Found ${uniqueClasses.length} classes`);
      return uniqueClasses;

    } catch (error) {
      this.log(`${locationName}: Error - ${error.message}`);
      return [];
    }
  }

  extractLocationName(url) {
    const match = url.match(/\/([a-zA-Z-]+)\/?$/);
    if (match) {
      return match[1].split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    return 'Unknown';
  }

  cleanVenueName(venue) {
    return venue
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s&'.-]/g, '');
  }

  cleanTime(time) {
    if (!time) return 'Contact for schedule';
    
    return time
      .replace(/\./g, ':')
      .replace(/([0-9])([ap]m)/i, '$1 $2')
      .toLowerCase()
      .trim();
  }

  isLegitimateVenue(venue) {
    const name = venue.toLowerCase();
    
    // Check for legitimate venue indicators
    const legitimateWords = [
      'church', 'centre', 'center', 'hall', 'school', 'club', 'academy',
      'community', 'village', 'sports', 'leisure', 'recreation', 'baptist',
      'methodist', 'catholic', 'primary', 'junior', 'nursery', 'saint', 'st.'
    ];
    
    const hasLegitimateWord = legitimateWords.some(word => name.includes(word));
    const hasReasonableLength = venue.length >= 15 && venue.length <= 70;
    
    return hasLegitimateWord && hasReasonableLength;
  }

  filterAndDeduplicateClasses(classes) {
    // Remove duplicates based on venue name, day, and time
    const seen = new Set();
    return classes.filter(classItem => {
      const key = `${classItem.venueName}-${classItem.day}-${classItem.time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  enhanceClassData(rawClasses) {
    this.log(`Enhancing ${rawClasses.length} classes...`);
    
    return rawClasses.map(classItem => {
      // Extract postcode if present
      const postcodeMatch = classItem.venueName.match(/([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i);
      
      // Determine age groups based on context
      let ageMin = 0, ageMax = 13;
      const context = classItem.context.toLowerCase();
      
      if (context.includes('toddler') || context.includes('walking')) {
        ageMin = 13;
        ageMax = 36;
      } else if (context.includes('baby') || context.includes('newborn')) {
        ageMin = 0;
        ageMax = 12;
      }

      return {
        name: `Baby Sensory - ${classItem.locationName} - ${classItem.venueName}`,
        description: `Baby Sensory classes combining music, lights, textures and scents to support your baby's development. Held at ${classItem.venueName} in ${classItem.locationName}.`,
        age_group_min: ageMin,
        age_group_max: ageMax,
        price: '£8-12 per session',
        is_featured: true,
        venue: classItem.venueName,
        address: classItem.venueName,
        postcode: postcodeMatch ? postcodeMatch[1] : null,
        day_of_week: classItem.day,
        time: classItem.time,
        contact_email: this.generateContactEmail(classItem.locationName),
        website: classItem.franchiseUrl,
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
    if (classes.length === 0) {
      this.log('No classes to save');
      return { saved: 0, errors: 0 };
    }

    this.log(`Saving ${classes.length} classes to database...`);
    
    let savedCount = 0;
    let errorCount = 0;

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
          RETURNING id
        `;

        const values = [
          classData.name, classData.description, classData.age_group_min,
          classData.age_group_max, classData.price, classData.is_featured,
          classData.venue, classData.address, classData.postcode,
          classData.day_of_week, classData.time, classData.contact_email,
          classData.website, classData.category, classData.is_active,
          classData.town, classData.service_type, classData.main_category,
          classData.subcategory, classData.provider_name, classData.latitude,
          classData.longitude
        ];

        const result = await this.client.query(insertQuery, values);
        savedCount++;

      } catch (error) {
        errorCount++;
        this.log(`Error saving class: ${error.message}`);
      }
    }

    this.log(`Saved ${savedCount} classes, ${errorCount} errors`);
    return { saved: savedCount, errors: errorCount };
  }

  async runComprehensiveScraping() {
    try {
      await this.initialize();
      
      let allClasses = [];
      let processedCount = 0;
      const totalFranchises = this.franchiseUrls.length;
      
      // Process first 20 franchises for initial run
      const franchisesToProcess = this.franchiseUrls.slice(0, 20);
      
      for (const franchiseUrl of franchisesToProcess) {
        const classes = await this.scrapeFranchiseLocation(franchiseUrl);
        allClasses.push(...classes);
        processedCount++;
        
        this.log(`Progress: ${processedCount}/${franchisesToProcess.length} franchises processed`);
        
        // Respectful delay
        await this.sleep(1000);
      }

      // Enhance and save data
      const enhancedClasses = this.enhanceClassData(allClasses);
      const saveResult = await this.saveToDatabase(enhancedClasses);

      // Show results
      await this.showResults(totalFranchises, processedCount, allClasses.length, enhancedClasses.length, saveResult);

    } catch (error) {
      this.log(`Critical error: ${error.message}`);
    } finally {
      if (this.client) {
        await this.client.end();
      }
    }
  }

  async showResults(totalFranchises, processed, rawClasses, enhanced, saveResult) {
    console.log('\n=== COMPREHENSIVE BABY SENSORY RESULTS ===');
    console.log(`Total Franchise Locations: ${totalFranchises}`);
    console.log(`Processed Locations: ${processed}`);
    console.log(`Raw Classes Found: ${rawClasses}`);
    console.log(`Enhanced Classes: ${enhanced}`);
    console.log(`Successfully Saved: ${saveResult.saved}`);
    console.log(`Save Errors: ${saveResult.errors}`);
    console.log(`Completion Date: ${new Date().toLocaleDateString()}`);
    
    if (saveResult.saved > 0) {
      console.log('\nBaby Sensory scraping completed successfully!');
      console.log('Next steps:');
      console.log('1. Enhance addresses using Google Places API');
      console.log('2. Process remaining franchise locations');
      console.log('3. Begin Water Babies scraping');
    } else {
      console.log('\nNo new classes were saved. Check for existing data or validation issues.');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function runComprehensiveBabySensoryScraper() {
  const scraper = new ComprehensiveBabySensoryScraper();
  await scraper.runComprehensiveScraping();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveBabySensoryScraper().catch(console.error);
}

export { ComprehensiveBabySensoryScraper, runComprehensiveBabySensoryScraper };