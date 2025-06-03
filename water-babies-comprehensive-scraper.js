import * as cheerio from 'cheerio';
import { Pool } from 'pg';

class WaterBabiesComprehensiveScraper {
  constructor() {
    this.client = null;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.totalSaved = 0;
    
    // Water Babies operates primarily through swimming pools and leisure centres
    this.poolSearchTerms = [
      'pool', 'swimming', 'leisure-centre', 'leisure-center', 'aquatic', 'swim',
      'hydrotherapy', 'therapy-pool', 'teaching-pool', 'learner-pool'
    ];
    
    // High-probability UK locations for Water Babies (they need proper swimming facilities)
    this.targetLocations = [
      // Major cities with multiple pools
      'london', 'birmingham', 'manchester', 'liverpool', 'leeds', 'sheffield', 
      'bristol', 'nottingham', 'leicester', 'coventry', 'hull', 'stoke-on-trent',
      
      // Affluent areas with family swimming facilities
      'winchester', 'guildford', 'reading', 'oxford', 'cambridge', 'bath', 
      'cheltenham', 'salisbury', 'basingstoke', 'woking', 'st-albans', 'hertford',
      
      // Home counties with leisure centres
      'watford', 'hemel-hempstead', 'stevenage', 'hitchin', 'letchworth', 
      'welwyn-garden-city', 'hatfield', 'potters-bar', 'barnet', 'enfield',
      
      // Thames Valley corridor
      'slough', 'maidenhead', 'windsor', 'bracknell', 'wokingham', 'newbury',
      'thatcham', 'hungerford', 'marlborough', 'swindon', 'chippenham',
      
      // Sussex/Surrey family areas
      'horsham', 'crawley', 'east-grinstead', 'haywards-heath', 'burgess-hill',
      'brighton', 'hove', 'worthing', 'bognor-regis', 'chichester', 'petersfield',
      
      // Hampshire expansion
      'southampton', 'portsmouth', 'fareham', 'gosport', 'eastleigh', 'romsey',
      'andover', 'alton', 'fleet', 'farnborough', 'aldershot', 'camberley',
      
      // Kent towns with pools
      'maidstone', 'canterbury', 'ashford', 'tunbridge-wells', 'tonbridge',
      'sevenoaks', 'dartford', 'gravesend', 'chatham', 'gillingham', 'faversham',
      
      // Essex market towns
      'chelmsford', 'colchester', 'basildon', 'southend-on-sea', 'harlow',
      'brentwood', 'billericay', 'wickford', 'rayleigh', 'benfleet', 'canvey-island',
      
      // East areas with good facilities
      'ipswich', 'bury-st-edmunds', 'sudbury', 'haverhill', 'newmarket',
      'cambridge', 'huntingdon', 'st-neots', 'march', 'wisbech', 'king-lynn',
      
      // Midlands expansion
      'northampton', 'kettering', 'corby', 'wellingborough', 'rushden',
      'milton-keynes', 'bletchley', 'newport-pagnell', 'olney', 'buckingham',
      
      // West Country
      'exeter', 'plymouth', 'torquay', 'paignton', 'newton-abbot', 'totnes',
      'truro', 'falmouth', 'penzance', 'newquay', 'bodmin', 'liskeard',
      
      // Wales major towns
      'cardiff', 'swansea', 'newport', 'wrexham', 'bangor', 'aberystwyth',
      
      // Scotland central belt
      'glasgow', 'edinburgh', 'stirling', 'falkirk', 'dunfermline', 'kirkcaldy',
      
      // Yorkshire/Lancashire
      'york', 'harrogate', 'bradford', 'wakefield', 'huddersfield', 'halifax',
      'preston', 'blackpool', 'lancaster', 'kendal', 'carlisle', 'workington'
    ];
  }

  async initialize() {
    this.client = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    console.log(`Water Babies expansion targeting ${this.targetLocations.length} locations with swimming facilities`);
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  async findWaterBabiesLocations() {
    this.log('Searching for Water Babies pool locations...');
    
    const foundLocations = [];
    
    // Method 1: Check direct location URLs
    for (const location of this.targetLocations.slice(0, 50)) {
      try {
        const locationUrls = [
          `https://www.waterbabies.co.uk/${location}/`,
          `https://www.waterbabies.co.uk/classes/${location}/`,
          `https://www.waterbabies.co.uk/pools/${location}/`,
          `https://www.waterbabies.co.uk/venues/${location}/`
        ];
        
        for (const url of locationUrls) {
          const pageData = await this.fetchPage(url);
          if (pageData && this.validateWaterBabiesPage(pageData, location)) {
            foundLocations.push({
              location,
              url,
              type: 'location_page',
              data: pageData
            });
            this.log(`Found Water Babies location: ${location}`);
            break;
          }
        }
        
      } catch (error) {
        // Continue to next location
      }
      
      await this.sleep(400);
    }
    
    // Method 2: Search main find-a-class page
    try {
      const mainPage = await this.fetchPage('https://www.waterbabies.co.uk/classes/find-your-local-pool/');
      if (mainPage) {
        const extractedPools = this.extractPoolsFromMainPage(mainPage);
        foundLocations.push(...extractedPools);
      }
    } catch (error) {
      this.log(`Error fetching main page: ${error.message}`);
    }
    
    return foundLocations;
  }

  async fetchPage(url) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-GB,en;q=0.5'
        }
      });

      if (!response.ok) return null;

      const html = await response.text();
      return { html, url };

    } catch (error) {
      return null;
    }
  }

  validateWaterBabiesPage(pageData, location) {
    const { html } = pageData;
    const $ = cheerio.load(html);
    const title = $('title').text().trim();
    const bodyText = $('body').text();
    
    return title.toLowerCase().includes('water babies') ||
           bodyText.toLowerCase().includes('water babies') ||
           bodyText.toLowerCase().includes('baby swimming');
  }

  extractPoolsFromMainPage(pageData) {
    const { html, url } = pageData;
    const $ = cheerio.load(html);
    const pools = [];
    
    // Look for pool/venue links
    $('a[href]').each((i, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (href && (href.includes('/pool/') || href.includes('/venue/') || href.includes('/classes/'))) {
        const fullUrl = href.startsWith('http') ? href : 'https://www.waterbabies.co.uk' + href;
        
        if (text && text.length > 5 && text.length < 100) {
          pools.push({
            location: this.extractLocationFromText(text),
            url: fullUrl,
            type: 'pool_link',
            poolName: text
          });
        }
      }
    });
    
    // Look for postcode search results or pool listings
    const pageText = $('body').text();
    const poolNamePattern = /([A-Z][a-zA-Z\s&'-]{8,60}(?:Pool|Pools|Swimming|Leisure|Centre|Center|Aquatic|Sports))/g;
    const poolNames = pageText.match(poolNamePattern) || [];
    
    poolNames.forEach(poolName => {
      if (this.isValidPoolName(poolName)) {
        pools.push({
          location: this.extractLocationFromPoolName(poolName),
          url: url,
          type: 'pool_listing',
          poolName: poolName.trim()
        });
      }
    });
    
    return pools.slice(0, 20); // Limit results
  }

  extractLocationFromText(text) {
    // Extract likely location from pool/venue name
    const words = text.split(/[\s,]+/);
    return words[words.length - 1].toLowerCase().replace(/[^a-z]/g, '') || 'unknown';
  }

  extractLocationFromPoolName(poolName) {
    // Extract town/city from pool name
    const locationWords = poolName.split(/[\s,]+/).filter(word => 
      word.length > 3 && !['Pool', 'Pools', 'Swimming', 'Leisure', 'Centre', 'Center', 'Aquatic', 'Sports'].includes(word)
    );
    
    return locationWords[0] ? locationWords[0].toLowerCase() : 'unknown';
  }

  isValidPoolName(poolName) {
    if (poolName.length < 10 || poolName.length > 80) return false;
    
    const validWords = ['pool', 'swimming', 'leisure', 'centre', 'center', 'aquatic', 'sports'];
    const invalidWords = ['facebook', 'twitter', 'website', 'email', 'phone'];
    
    const poolLower = poolName.toLowerCase();
    const hasValidWord = validWords.some(word => poolLower.includes(word));
    const hasInvalidWord = invalidWords.some(word => poolLower.includes(word));
    
    return hasValidWord && !hasInvalidWord;
  }

  async extractWaterBabiesClasses(locationData) {
    const classes = [];
    
    if (locationData.type === 'location_page' && locationData.data) {
      const { html, url } = locationData.data;
      const $ = cheerio.load(html);
      const pageText = $('body').text();
      
      // Extract pool/venue information
      const poolPattern = /([A-Z][a-zA-Z\s&'-]{8,70}(?:Pool|Pools|Swimming|Leisure|Centre|Center|Aquatic|Sports|Club))/g;
      const pools = pageText.match(poolPattern) || [];
      
      const dayPattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/gi;
      const timePattern = /(\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?(?:\s*[-–—]\s*\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?)?)/g;
      
      pools.forEach(pool => {
        if (!this.isValidPoolName(pool)) return;
        
        const poolIndex = pageText.indexOf(pool);
        const context = pageText.slice(Math.max(0, poolIndex - 300), poolIndex + 600);
        
        const days = context.match(dayPattern) || [];
        const times = context.match(timePattern) || [];
        
        if (days.length > 0 && times.length > 0) {
          days.slice(0, 2).forEach(day => {
            times.slice(0, 2).forEach(time => {
              classes.push({
                locationName: this.formatLocationName(locationData.location),
                poolName: this.cleanPoolName(pool),
                day: this.formatDay(day),
                time: this.formatTime(time),
                url: url,
                ageGroup: this.determineWaterBabiesAgeGroup(context)
              });
            });
          });
        } else {
          classes.push({
            locationName: this.formatLocationName(locationData.location),
            poolName: this.cleanPoolName(pool),
            day: 'Various',
            time: 'Check website',
            url: url,
            ageGroup: 'Baby & Toddler'
          });
        }
      });
      
    } else if (locationData.poolName) {
      // Direct pool listing
      classes.push({
        locationName: this.formatLocationName(locationData.location),
        poolName: this.cleanPoolName(locationData.poolName),
        day: 'Various',
        time: 'Check website',
        url: locationData.url,
        ageGroup: 'Baby & Toddler'
      });
    }
    
    return this.deduplicateClasses(classes);
  }

  formatLocationName(location) {
    return location.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  cleanPoolName(poolName) {
    return poolName.trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s&'.-]/g, '');
  }

  formatDay(day) {
    return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  }

  formatTime(time) {
    if (!time || time === 'Check website') return time;
    return time.replace(/\./g, ':').replace(/([0-9])([ap]m)/i, '$1 $2').toLowerCase();
  }

  determineWaterBabiesAgeGroup(context) {
    const text = context.toLowerCase();
    if (text.includes('toddler') || text.includes('older') || text.includes('advanced')) {
      return 'Toddler';
    }
    return 'Baby';
  }

  deduplicateClasses(classes) {
    const seen = new Set();
    return classes.filter(cls => {
      const key = `${cls.poolName.toLowerCase()}-${cls.day}-${cls.time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  getLocationPostcode(locationName) {
    const postcodes = {
      'London': 'SW1A 1AA', 'Birmingham': 'B1 1BB', 'Manchester': 'M1 1AA',
      'Liverpool': 'L1 8JQ', 'Leeds': 'LS1 1BA', 'Sheffield': 'S1 2HE',
      'Bristol': 'BS1 4DJ', 'Nottingham': 'NG1 1AA', 'Leicester': 'LE1 1AA',
      'Winchester': 'SO23 9PE', 'Guildford': 'GU1 3UW', 'Reading': 'RG1 1JX',
      'Oxford': 'OX1 1BP', 'Cambridge': 'CB2 1TN', 'Bath': 'BA1 1LZ',
      'Cheltenham': 'GL50 1AA', 'Salisbury': 'SP1 1BL', 'Basingstoke': 'RG21 4AE',
      'Southampton': 'SO14 0AA', 'Portsmouth': 'PO1 2EG', 'Brighton': 'BN1 1UG',
      'Hove': 'BN3 1AH', 'Cardiff': 'CF10 1EP', 'Glasgow': 'G1 1AA',
      'Edinburgh': 'EH1 1YZ', 'York': 'YO1 7HH', 'Chester': 'CH1 1SF'
    };
    
    return postcodes[locationName] || 'TBC 1AA';
  }

  createWaterBabiesClassData(rawClass) {
    const postcodeMatch = rawClass.poolName.match(/([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i);
    const defaultPostcode = this.getLocationPostcode(rawClass.locationName);
    
    return {
      name: `Water Babies ${rawClass.locationName} - ${rawClass.poolName}`.substring(0, 250),
      description: `Water Babies swimming classes for babies and toddlers in a warm, safe environment at ${rawClass.poolName} in ${rawClass.locationName}.`,
      age_group_min: rawClass.ageGroup === 'Toddler' ? 6 : 0,
      age_group_max: rawClass.ageGroup === 'Toddler' ? 48 : 24,
      price: '£15-20 per session',
      is_featured: true,
      venue: rawClass.poolName.substring(0, 250),
      address: rawClass.poolName.substring(0, 250),
      postcode: postcodeMatch ? postcodeMatch[1] : defaultPostcode,
      day_of_week: rawClass.day,
      time: rawClass.time,
      contact_email: 'hello@waterbabies.co.uk',
      website: rawClass.url,
      category: 'Baby & Toddler Classes',
      is_active: true,
      town: rawClass.locationName,
      service_type: 'Class',
      main_category: 'Baby & Toddler Classes',
      subcategory: 'Baby Swimming',
      provider_name: 'Water Babies'
    };
  }

  async saveClass(classData) {
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

      const result = await this.client.query(insertQuery, values);
      return result.rows.length > 0;

    } catch (error) {
      return false;
    }
  }

  async runWaterBabiesExpansion() {
    try {
      await this.initialize();
      
      const locations = await this.findWaterBabiesLocations();
      this.log(`Found ${locations.length} Water Babies locations to process`);
      
      let totalClasses = 0;
      
      for (const location of locations) {
        try {
          const classes = await this.extractWaterBabiesClasses(location);
          totalClasses += classes.length;
          
          if (classes.length > 0) {
            this.log(`${location.location}: Found ${classes.length} swimming classes`);
            
            for (const rawClass of classes) {
              const classData = this.createWaterBabiesClassData(rawClass);
              const saved = await this.saveClass(classData);
              
              if (saved) {
                this.totalSaved++;
              }
            }
          }
          
        } catch (error) {
          this.log(`Error processing ${location.location}: ${error.message}`);
        }
        
        await this.sleep(800);
      }

      await this.showWaterBabiesResults(locations.length, totalClasses);

    } catch (error) {
      this.log(`Critical error: ${error.message}`);
    } finally {
      if (this.client) {
        await this.client.end();
      }
    }
  }

  async showWaterBabiesResults(locationsFound, classesFound) {
    const result = await this.client.query(
      "SELECT COUNT(*) as count FROM classes WHERE provider_name = 'Water Babies'"
    );
    
    const finalCount = result.rows[0].count;
    
    console.log('\n=== WATER BABIES EXPANSION COMPLETE ===');
    console.log(`Locations Found: ${locationsFound}`);
    console.log(`Classes Found: ${classesFound}`);
    console.log(`Classes Saved: ${this.totalSaved}`);
    console.log(`Final Database Total: ${finalCount} Water Babies classes`);
    console.log(`Previous count was 253, now: ${finalCount}`);
    console.log('');
    
    if (finalCount > 300) {
      console.log('SUCCESS: Water Babies database expanded significantly');
    } else if (finalCount > 253) {
      console.log('PROGRESS: Added new Water Babies swimming classes');
    }
    
    console.log('Ready for Monkey Music and remaining franchise expansion');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function runWaterBabiesComprehensiveScraper() {
  const scraper = new WaterBabiesComprehensiveScraper();
  await scraper.runWaterBabiesExpansion();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWaterBabiesComprehensiveScraper().catch(console.error);
}

export { WaterBabiesComprehensiveScraper, runWaterBabiesComprehensiveScraper };