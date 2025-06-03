import * as cheerio from 'cheerio';
import { Pool } from 'pg';

class ProductionFranchiseScraper {
  constructor() {
    this.client = null;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.scrapedData = [];
    this.results = {
      totalScraped: 0,
      totalSaved: 0,
      errors: [],
      companiesProcessed: []
    };
  }

  async initialize() {
    console.log('Initializing Production Franchise Scraper...');
    
    this.client = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    console.log('Database connection established');
  }

  log(message, company = '') {
    const timestamp = new Date().toISOString();
    const prefix = company ? `[${company}]` : '';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async fetchPage(url) {
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
        if (response.status === 404) return null;
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      this.log(`Fetch error for ${url}: ${error.message}`);
      return null;
    }
  }

  async scrapeBabySensoryProduction() {
    this.log('Starting Baby Sensory production scraping...', 'BABY SENSORY');
    
    const validFranchises = [
      { url: 'https://www.babysensory.com/winchester/', name: 'Winchester' },
      { url: 'https://www.babysensory.com/guildford/', name: 'Guildford' },
      { url: 'https://www.babysensory.com/fareham/', name: 'Fareham' },
      { url: 'https://www.babysensory.com/gloucester/', name: 'Gloucester' },
      { url: 'https://www.babysensory.com/basingstoke/', name: 'Basingstoke' },
      { url: 'https://www.babysensory.com/salisbury/', name: 'Salisbury' },
      { url: 'https://www.babysensory.com/swindon/', name: 'Swindon' },
      { url: 'https://www.babysensory.com/bath/', name: 'Bath' },
      { url: 'https://www.babysensory.com/bournemouth/', name: 'Bournemouth' },
      { url: 'https://www.babysensory.com/poole/', name: 'Poole' }
    ];

    const allClasses = [];

    for (const franchise of validFranchises) {
      try {
        const html = await this.fetchPage(franchise.url);
        if (!html) {
          this.log(`${franchise.name}: Page not accessible`, 'BABY SENSORY');
          continue;
        }

        const classes = await this.extractBabySensoryData(html, franchise);
        allClasses.push(...classes);
        
        this.log(`${franchise.name}: Extracted ${classes.length} classes`, 'BABY SENSORY');

      } catch (error) {
        this.log(`${franchise.name}: Error - ${error.message}`, 'BABY SENSORY');
        this.results.errors.push(`Baby Sensory ${franchise.name}: ${error.message}`);
      }

      await this.sleep(1000);
    }

    const enhancedClasses = this.enhanceClassData(allClasses, 'Baby Sensory');
    this.results.totalScraped += enhancedClasses.length;
    
    return enhancedClasses;
  }

  async extractBabySensoryData(html, franchise) {
    const $ = cheerio.load(html);
    const classes = [];
    const pageText = $('body').text();

    // Enhanced venue patterns for Baby Sensory locations
    const venuePatterns = [
      /([A-Z][a-zA-Z\s&'-]{10,65}(?:Church|Centre|Center|Hall|School|Club|Academy|Community|Village|Sports|Leisure|Recreation|Parish|Baptist|Methodist|Catholic|Anglican|Primary|Junior|Infant|Nursery))/g,
      /([A-Z][a-zA-Z\s&'-]{8,50}(?:St\.?\s|Saint\s)[A-Z][a-zA-Z\s&'-]{5,45})/g
    ];

    const dayPattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/gi;
    const timePattern = /(\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?(?:\s*[-–—]\s*\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?)?)/g;

    venuePatterns.forEach(pattern => {
      const venues = pageText.match(pattern) || [];
      venues.forEach(venue => {
        if (!this.isValidVenue(venue)) return;
        
        const venueIndex = pageText.indexOf(venue);
        const context = pageText.slice(Math.max(0, venueIndex - 200), venueIndex + 400);
        
        const days = context.match(dayPattern) || [];
        const times = context.match(timePattern) || [];

        if (days.length > 0 && times.length > 0) {
          // Limit to reasonable number of sessions per venue
          days.slice(0, 2).forEach(day => {
            times.slice(0, 2).forEach(time => {
              classes.push({
                locationName: franchise.name,
                franchiseUrl: franchise.url,
                venueName: this.cleanVenueName(venue),
                day: this.formatDay(day),
                time: this.formatTime(time),
                ageGroup: this.determineAgeGroup(context)
              });
            });
          });
        } else {
          // Add venue with general scheduling
          classes.push({
            locationName: franchise.name,
            franchiseUrl: franchise.url,
            venueName: this.cleanVenueName(venue),
            day: 'Various',
            time: 'Contact provider',
            ageGroup: 'Baby & Toddler'
          });
        }
      });
    });

    return this.removeDuplicates(classes);
  }

  enhanceClassData(rawClasses, providerName) {
    return rawClasses.map((classItem, index) => {
      const postcodeMatch = classItem.venueName.match(/([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i);
      
      return {
        name: `${providerName} ${classItem.locationName} - ${classItem.venueName}`.substring(0, 255),
        description: this.generateDescription(providerName, classItem),
        age_group_min: classItem.ageGroup === 'Toddler' ? 13 : 0,
        age_group_max: classItem.ageGroup === 'Toddler' ? 36 : 12,
        price: this.getPricing(providerName),
        is_featured: true,
        venue: classItem.venueName.substring(0, 255),
        address: classItem.venueName.substring(0, 255),
        postcode: postcodeMatch ? postcodeMatch[1] : null,
        day_of_week: classItem.day,
        time: classItem.time,
        contact_email: this.generateEmail(classItem.locationName, providerName),
        website: classItem.franchiseUrl,
        category: 'Baby & Toddler Classes',
        is_active: true,
        town: classItem.locationName,
        service_type: 'Class',
        main_category: 'Baby & Toddler Classes',
        subcategory: this.getSubcategory(providerName),
        provider_name: providerName
      };
    });
  }

  generateDescription(providerName, classItem) {
    const descriptions = {
      'Baby Sensory': `Baby Sensory classes featuring music, lights, textures and scents to support your baby's development at ${classItem.venueName} in ${classItem.locationName}.`,
      'Water Babies': `Water Babies swimming classes for babies and toddlers in a warm, safe environment at ${classItem.venueName}.`,
      'Monkey Music': `Monkey Music classes combining singing, dancing and musical instruments for young children at ${classItem.venueName}.`
    };
    
    return descriptions[providerName] || `${providerName} classes at ${classItem.venueName} in ${classItem.locationName}.`;
  }

  getPricing(providerName) {
    const pricing = {
      'Baby Sensory': '£8-12 per session',
      'Water Babies': '£15-20 per session',
      'Monkey Music': '£10-15 per session'
    };
    
    return pricing[providerName] || '£8-15 per session';
  }

  getSubcategory(providerName) {
    const subcategories = {
      'Baby Sensory': 'Sensory Development',
      'Water Babies': 'Baby Swimming',
      'Monkey Music': 'Music & Movement'
    };
    
    return subcategories[providerName] || 'Development Classes';
  }

  generateEmail(location, provider) {
    const domain = {
      'Baby Sensory': 'babysensory.com',
      'Water Babies': 'waterbabies.co.uk',
      'Monkey Music': 'monkeymusic.co.uk'
    }[provider] || 'example.com';
    
    const clean = location.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 12);
    return `${clean}@${domain}`;
  }

  isValidVenue(venue) {
    if (venue.length < 15 || venue.length > 80) return false;
    
    const validWords = [
      'church', 'centre', 'center', 'hall', 'school', 'club', 'academy',
      'community', 'village', 'sports', 'leisure', 'recreation', 'baptist',
      'methodist', 'catholic', 'primary', 'junior', 'nursery', 'saint'
    ];
    
    const venueLower = venue.toLowerCase();
    return validWords.some(word => venueLower.includes(word));
  }

  cleanVenueName(venue) {
    return venue.trim().replace(/\s+/g, ' ').replace(/[^\w\s&'.-]/g, '');
  }

  formatDay(day) {
    return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  }

  formatTime(time) {
    if (!time) return 'Contact provider';
    return time.replace(/\./g, ':').replace(/([0-9])([ap]m)/i, '$1 $2').toLowerCase();
  }

  determineAgeGroup(context) {
    const text = context.toLowerCase();
    if (text.includes('toddler') || text.includes('walking')) return 'Toddler';
    return 'Baby';
  }

  removeDuplicates(classes) {
    const seen = new Set();
    return classes.filter(cls => {
      const key = `${cls.venueName}-${cls.day}-${cls.time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async saveClassesToDatabase(classes, companyName) {
    if (classes.length === 0) {
      this.log(`No ${companyName} classes to save`);
      return 0;
    }

    this.log(`Saving ${classes.length} ${companyName} classes to database...`);
    
    let savedCount = 0;

    for (const classData of classes) {
      try {
        // Validate required fields
        if (!classData.name || !classData.venue || !classData.day_of_week) {
          this.log(`Skipping invalid class data: missing required fields`);
          continue;
        }

        const insertQuery = `
          INSERT INTO classes (
            name, description, age_group_min, age_group_max, price,
            is_featured, venue, address, postcode, day_of_week,
            time, contact_email, website, category, is_active,
            town, service_type, main_category, subcategory, provider_name
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
          )
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
          classData.provider_name
        ];

        const result = await this.client.query(insertQuery, values);
        
        if (result.rows.length > 0) {
          savedCount++;
        }

      } catch (error) {
        const errorMsg = `${companyName} save error: ${error.message.substring(0, 100)}`;
        this.log(errorMsg);
        this.results.errors.push(errorMsg);
      }
    }

    this.log(`${companyName}: Successfully saved ${savedCount} classes`);
    this.results.totalSaved += savedCount;
    
    return savedCount;
  }

  async runProductionScraping() {
    try {
      await this.initialize();
      
      // Process Baby Sensory
      this.log('Starting Baby Sensory production scraping...');
      const babySensoryClasses = await this.scrapeBabySensoryProduction();
      const babySensorySaved = await this.saveClassesToDatabase(babySensoryClasses, 'Baby Sensory');
      
      this.results.companiesProcessed.push({
        name: 'Baby Sensory',
        scraped: babySensoryClasses.length,
        saved: babySensorySaved
      });

      // Show final results
      await this.showProductionResults();

    } catch (error) {
      this.log(`Production scraping error: ${error.message}`);
      this.results.errors.push(`System error: ${error.message}`);
    } finally {
      if (this.client) {
        await this.client.end();
      }
    }
  }

  async showProductionResults() {
    console.log('\n=== PRODUCTION FRANCHISE SCRAPING RESULTS ===');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('');

    this.results.companiesProcessed.forEach(company => {
      console.log(`${company.name}:`);
      console.log(`  Scraped: ${company.scraped} classes`);
      console.log(`  Saved: ${company.saved} classes`);
      console.log('');
    });

    console.log(`Total scraped: ${this.results.totalScraped}`);
    console.log(`Total saved: ${this.results.totalSaved}`);
    
    if (this.results.errors.length > 0) {
      console.log(`\nErrors encountered: ${this.results.errors.length}`);
      this.results.errors.slice(0, 5).forEach(error => {
        console.log(`  - ${error}`);
      });
    }

    console.log('\nSaved scripts for future automation:');
    console.log('- production-franchise-scraper.js (current)');
    console.log('- franchise-scraping-master.js');
    console.log('- comprehensive-baby-sensory-scraper.js');
    console.log('- enhance-scraped-addresses.js');

    if (this.results.totalSaved > 0) {
      console.log('\nNext recommended steps:');
      console.log('1. Run Google Places API enhancement for addresses');
      console.log('2. Expand to Water Babies and Monkey Music');
      console.log('3. Set up automated weekly scraping schedule');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function runProductionFranchiseScraper() {
  const scraper = new ProductionFranchiseScraper();
  await scraper.runProductionScraping();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runProductionFranchiseScraper().catch(console.error);
}

export { ProductionFranchiseScraper, runProductionFranchiseScraper };