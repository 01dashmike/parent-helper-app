import * as cheerio from 'cheerio';
import { Pool } from 'pg';

class FranchiseScrapingMaster {
  constructor() {
    this.client = null;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    // Franchise companies ordered by your database size
    this.franchiseCompanies = [
      {
        name: 'Baby Sensory',
        currentCount: 700,
        baseUrl: 'https://www.babysensory.com',
        scraperMethod: 'scrapeBabySensory',
        testUrls: [
          'https://www.babysensory.com/winchester/',
          'https://www.babysensory.com/guildford/',
          'https://www.babysensory.com/reading/',
          'https://www.babysensory.com/oxford/',
          'https://www.babysensory.com/bristol/'
        ]
      },
      {
        name: 'Water Babies',
        currentCount: 253,
        baseUrl: 'https://www.waterbabies.co.uk',
        scraperMethod: 'scrapeWaterBabies',
        testUrls: [
          'https://www.waterbabies.co.uk/classes/find-your-local-pool/'
        ]
      },
      {
        name: 'Monkey Music',
        currentCount: 110,
        baseUrl: 'https://www.monkeymusic.co.uk',
        scraperMethod: 'scrapeMonkeyMusic',
        testUrls: [
          'https://www.monkeymusic.co.uk/find-a-class/'
        ]
      }
    ];
  }

  async initialize() {
    console.log('Initializing Franchise Scraping Master System...');
    
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
          if (response.status === 404) return null;
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.text();
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.sleep(1000 * (i + 1));
      }
    }
  }

  // BABY SENSORY SCRAPER
  async scrapeBabySensory() {
    this.log('Starting Baby Sensory franchise scraping...', 'BABY SENSORY');
    const classes = [];

    const franchiseUrls = [
      'https://www.babysensory.com/winchester/',
      'https://www.babysensory.com/guildford/',
      'https://www.babysensory.com/reading/',
      'https://www.babysensory.com/oxford/',
      'https://www.babysensory.com/bristol/',
      'https://www.babysensory.com/bath/',
      'https://www.babysensory.com/cheltenham/',
      'https://www.babysensory.com/gloucester/',
      'https://www.babysensory.com/swindon/',
      'https://www.babysensory.com/salisbury/',
      'https://www.babysensory.com/bournemouth/',
      'https://www.babysensory.com/poole/',
      'https://www.babysensory.com/dorchester/',
      'https://www.babysensory.com/weymouth/',
      'https://www.babysensory.com/exeter/',
      'https://www.babysensory.com/plymouth/',
      'https://www.babysensory.com/torquay/',
      'https://www.babysensory.com/newton-abbot/',
      'https://www.babysensory.com/barnstaple/',
      'https://www.babysensory.com/truro/',
      'https://www.babysensory.com/falmouth/',
      'https://www.babysensory.com/penzance/',
      'https://www.babysensory.com/newquay/',
      'https://www.babysensory.com/bodmin/',
      'https://www.babysensory.com/launceston/'
    ];

    for (const url of franchiseUrls.slice(0, 10)) { // Start with 10 locations
      try {
        const locationName = this.extractLocationFromUrl(url);
        const html = await this.fetchPage(url);
        
        if (!html) {
          this.log(`${locationName}: No page found`, 'BABY SENSORY');
          continue;
        }

        const locationClasses = await this.extractBabySensoryClasses(html, url, locationName);
        classes.push(...locationClasses);
        
        this.log(`${locationName}: Found ${locationClasses.length} classes`, 'BABY SENSORY');

      } catch (error) {
        this.log(`Error scraping ${url}: ${error.message}`, 'BABY SENSORY');
      }

      await this.sleep(1000);
    }

    return this.enhanceBabySensoryClasses(classes);
  }

  async extractBabySensoryClasses(html, franchiseUrl, locationName) {
    const $ = cheerio.load(html);
    const classes = [];
    const pageText = $('body').text();

    // Enhanced venue detection patterns
    const venuePatterns = [
      /([A-Z][a-zA-Z\s&'-]{8,60}(?:Church|Centre|Center|Hall|School|Club|Academy|Community|Village|Sports|Leisure|Recreation|Parish))/g,
      /([A-Z][a-zA-Z\s&'-]{5,50}(?:Baptist|Methodist|Catholic|Anglican|Presbyterian|United|Reformed|Evangelical)[\s][A-Z][a-zA-Z\s&'-]{3,40})/g,
      /([A-Z][a-zA-Z\s&'-]{5,50}(?:Primary|Junior|Infant|Nursery|Preparatory)[\s]School)/g,
      /([A-Z][a-zA-Z\s&'-]{5,50}(?:St\.?\s|Saint\s)[A-Z][a-zA-Z\s&'-]{3,40})/g
    ];

    const dayPattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/gi;
    const timePattern = /(\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?(?:\s*[-–—]\s*\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?)?)/g;

    venuePatterns.forEach(pattern => {
      const venues = pageText.match(pattern) || [];
      venues.forEach(venue => {
        if (venue.length < 15 || venue.length > 80) return;
        
        const venueIndex = pageText.indexOf(venue);
        const context = pageText.slice(Math.max(0, venueIndex - 300), venueIndex + 600);
        
        const days = context.match(dayPattern) || [];
        const times = context.match(timePattern) || [];

        if (days.length > 0 && times.length > 0) {
          days.slice(0, 2).forEach(day => { // Limit to 2 days per venue
            times.slice(0, 2).forEach(time => { // Limit to 2 times per day
              classes.push({
                locationName,
                franchiseUrl,
                venueName: this.cleanVenueName(venue),
                day: this.capitalizeDay(day),
                time: this.cleanTime(time),
                ageGroup: this.extractAgeGroup(context)
              });
            });
          });
        } else if (this.isValidVenue(venue)) {
          classes.push({
            locationName,
            franchiseUrl,
            venueName: this.cleanVenueName(venue),
            day: 'Various',
            time: 'Contact for times',
            ageGroup: 'Baby & Toddler'
          });
        }
      });
    });

    return this.deduplicateClasses(classes);
  }

  enhanceBabySensoryClasses(rawClasses) {
    return rawClasses.map(classItem => ({
      name: `Baby Sensory ${classItem.locationName} - ${classItem.venueName}`,
      description: `Baby Sensory classes featuring music, lights, textures and scents to support your baby's development at ${classItem.venueName} in ${classItem.locationName}.`,
      age_group_min: classItem.ageGroup === 'Toddler' ? 13 : 0,
      age_group_max: classItem.ageGroup === 'Toddler' ? 36 : 12,
      price: '£8-12 per session',
      is_featured: true,
      venue: classItem.venueName,
      address: classItem.venueName,
      postcode: this.extractPostcode(classItem.venueName),
      day_of_week: classItem.day,
      time: classItem.time,
      contact_email: this.generateEmail(classItem.locationName, 'babysensory.com'),
      website: classItem.franchiseUrl,
      category: 'Baby & Toddler Classes',
      is_active: true,
      town: classItem.locationName,
      service_type: 'Class',
      main_category: 'Baby & Toddler Classes',
      subcategory: 'Sensory Development',
      provider_name: 'Baby Sensory'
    }));
  }

  // WATER BABIES SCRAPER
  async scrapeWaterBabies() {
    this.log('Starting Water Babies franchise scraping...', 'WATER BABIES');
    const classes = [];

    try {
      const html = await this.fetchPage('https://www.waterbabies.co.uk/classes/find-your-local-pool/');
      if (!html) return [];

      const $ = cheerio.load(html);
      const poolUrls = [];

      // Extract pool/venue links
      $('a[href]').each((i, element) => {
        const href = $(element).attr('href');
        if (href && (href.includes('/pool/') || href.includes('/venue/') || href.includes('/classes/'))) {
          const fullUrl = href.startsWith('http') ? href : 'https://www.waterbabies.co.uk' + href;
          poolUrls.push(fullUrl);
        }
      });

      // Scrape individual pools
      for (const poolUrl of poolUrls.slice(0, 8)) {
        try {
          const poolHtml = await this.fetchPage(poolUrl);
          if (poolHtml) {
            const poolClasses = await this.extractWaterBabiesClasses(poolHtml, poolUrl);
            classes.push(...poolClasses);
          }
        } catch (error) {
          this.log(`Error scraping pool ${poolUrl}: ${error.message}`, 'WATER BABIES');
        }
        await this.sleep(1500);
      }

    } catch (error) {
      this.log(`Water Babies scraping error: ${error.message}`, 'WATER BABIES');
    }

    return this.enhanceWaterBabiesClasses(classes);
  }

  async extractWaterBabiesClasses(html, poolUrl) {
    const $ = cheerio.load(html);
    const classes = [];
    const pageText = $('body').text();

    // Find pool name
    const poolNameMatch = pageText.match(/Pool[:\s]*([^,\n\.]{10,60})/i) || 
                         pageText.match(/Venue[:\s]*([^,\n\.]{10,60})/i) ||
                         pageText.match(/Location[:\s]*([^,\n\.]{10,60})/i);
    
    const poolName = poolNameMatch ? poolNameMatch[1].trim() : 'Water Babies Pool';
    const location = this.extractLocationFromPoolName(poolName);

    // Extract schedule
    const dayPattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/gi;
    const timePattern = /(\d{1,2}[:.]\d{2}\s*(?:am|pm)?(?:\s*[-–]\s*\d{1,2}[:.]\d{2}\s*(?:am|pm)?)?)/g;

    const days = pageText.match(dayPattern) || [];
    const times = pageText.match(timePattern) || [];

    if (days.length > 0 && times.length > 0) {
      days.slice(0, 3).forEach(day => {
        times.slice(0, 2).forEach(time => {
          classes.push({
            poolName,
            location,
            poolUrl,
            day: this.capitalizeDay(day),
            time: this.cleanTime(time)
          });
        });
      });
    } else {
      classes.push({
        poolName,
        location,
        poolUrl,
        day: 'Various',
        time: 'Check website'
      });
    }

    return classes;
  }

  enhanceWaterBabiesClasses(rawClasses) {
    return rawClasses.map(classItem => ({
      name: `Water Babies - ${classItem.poolName}`,
      description: `Water Babies swimming classes for babies and toddlers in a warm, safe environment at ${classItem.poolName}.`,
      age_group_min: 0,
      age_group_max: 48,
      price: '£15-20 per session',
      is_featured: true,
      venue: classItem.poolName,
      address: classItem.poolName,
      postcode: null,
      day_of_week: classItem.day,
      time: classItem.time,
      contact_email: 'hello@waterbabies.co.uk',
      website: classItem.poolUrl,
      category: 'Baby & Toddler Classes',
      is_active: true,
      town: classItem.location,
      service_type: 'Class',
      main_category: 'Baby & Toddler Classes',
      subcategory: 'Baby Swimming',
      provider_name: 'Water Babies'
    }));
  }

  // UTILITY METHODS
  extractLocationFromUrl(url) {
    const match = url.match(/\/([a-zA-Z-]+)\/?$/);
    if (match) {
      return match[1].split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    return 'Unknown';
  }

  extractLocationFromPoolName(poolName) {
    const words = poolName.split(/[\s,]+/);
    return words[words.length - 1] || 'Unknown';
  }

  cleanVenueName(venue) {
    return venue.trim().replace(/\s+/g, ' ').replace(/[^\w\s&'.-]/g, '');
  }

  cleanTime(time) {
    if (!time) return 'Contact for times';
    return time.replace(/\./g, ':').replace(/([0-9])([ap]m)/i, '$1 $2').toLowerCase();
  }

  capitalizeDay(day) {
    return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  }

  extractAgeGroup(context) {
    const text = context.toLowerCase();
    if (text.includes('toddler') || text.includes('walking')) return 'Toddler';
    return 'Baby';
  }

  extractPostcode(text) {
    const match = text.match(/([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i);
    return match ? match[1] : null;
  }

  generateEmail(location, domain) {
    const clean = location.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 12);
    return `${clean}@${domain}`;
  }

  isValidVenue(venue) {
    const name = venue.toLowerCase();
    const validWords = ['church', 'centre', 'center', 'hall', 'school', 'club', 'community'];
    return validWords.some(word => name.includes(word)) && venue.length >= 15;
  }

  deduplicateClasses(classes) {
    const seen = new Set();
    return classes.filter(cls => {
      const key = `${cls.venueName}-${cls.day}-${cls.time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async saveToDatabase(classes, companyName) {
    if (classes.length === 0) {
      this.log(`No ${companyName} classes to save`);
      return { saved: 0, errors: 0 };
    }

    this.log(`Saving ${classes.length} ${companyName} classes...`);
    
    let savedCount = 0;
    let errorCount = 0;

    for (const classData of classes) {
      try {
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
          classData.name, classData.description, classData.age_group_min,
          classData.age_group_max, classData.price, classData.is_featured,
          classData.venue, classData.address, classData.postcode,
          classData.day_of_week, classData.time, classData.contact_email,
          classData.website, classData.category, classData.is_active,
          classData.town, classData.service_type, classData.main_category,
          classData.subcategory, classData.provider_name
        ];

        await this.client.query(insertQuery, values);
        savedCount++;

      } catch (error) {
        errorCount++;
        this.log(`Save error: ${error.message.substring(0, 100)}...`);
      }
    }

    this.log(`${companyName}: Saved ${savedCount}, Errors ${errorCount}`);
    return { saved: savedCount, errors: errorCount };
  }

  async runMasterScraping() {
    try {
      await this.initialize();
      
      const results = {
        timestamp: new Date().toISOString(),
        companies: []
      };

      // Process each franchise company
      for (const company of this.franchiseCompanies.slice(0, 2)) { // Start with first 2
        this.log(`Processing ${company.name}...`);
        
        try {
          const scrapedClasses = await this[company.scraperMethod]();
          const saveResult = await this.saveToDatabase(scrapedClasses, company.name);
          
          results.companies.push({
            name: company.name,
            previousCount: company.currentCount,
            scrapedCount: scrapedClasses.length,
            savedCount: saveResult.saved,
            errors: saveResult.errors
          });

        } catch (error) {
          this.log(`${company.name} failed: ${error.message}`);
          results.companies.push({
            name: company.name,
            error: error.message
          });
        }

        await this.sleep(2000);
      }

      await this.showMasterResults(results);

    } catch (error) {
      this.log(`Master system error: ${error.message}`);
    } finally {
      if (this.client) await this.client.end();
    }
  }

  async showMasterResults(results) {
    console.log('\n=== FRANCHISE SCRAPING MASTER RESULTS ===');
    console.log(`Completed: ${results.timestamp}`);
    console.log('');

    let totalScraped = 0;
    let totalSaved = 0;

    results.companies.forEach(company => {
      if (company.error) {
        console.log(`❌ ${company.name}: FAILED - ${company.error}`);
      } else {
        console.log(`✅ ${company.name}:`);
        console.log(`   Database before: ${company.previousCount} classes`);
        console.log(`   Scraped: ${company.scrapedCount} classes`);
        console.log(`   Successfully saved: ${company.savedCount} classes`);
        console.log(`   Save errors: ${company.errors}`);
        
        totalScraped += company.scrapedCount;
        totalSaved += company.savedCount;
      }
      console.log('');
    });

    console.log(`📊 TOTALS: ${totalScraped} scraped, ${totalSaved} saved`);
    console.log('');
    console.log('Scripts saved for future automation:');
    console.log('- franchise-scraping-master.js (this file)');
    console.log('- comprehensive-baby-sensory-scraper.js');
    console.log('- enhance-scraped-addresses.js');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run Google Places API address enhancement');
    console.log('2. Process remaining franchise companies');
    console.log('3. Set up automated weekly scraping');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function runFranchiseScrapingMaster() {
  const master = new FranchiseScrapingMaster();
  await master.runMasterScraping();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runFranchiseScrapingMaster().catch(console.error);
}

export { FranchiseScrapingMaster, runFranchiseScrapingMaster };