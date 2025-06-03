import * as cheerio from 'cheerio';
import { Pool } from 'pg';

class ComprehensiveUKBabySensoryScraper {
  constructor() {
    this.client = null;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.scrapedClasses = [];
    
    // Comprehensive list of UK cities/towns where Baby Sensory likely operates
    this.ukLocations = [
      // Major Cities
      'london', 'manchester', 'birmingham', 'liverpool', 'leeds', 'sheffield', 'bristol', 'glasgow', 'edinburgh', 'cardiff',
      
      // Home Counties & South East
      'winchester', 'reading', 'oxford', 'cambridge', 'brighton', 'hove', 'guildford', 'woking', 'basingstoke', 'salisbury',
      'swindon', 'slough', 'maidenhead', 'bracknell', 'wokingham', 'newbury', 'andover', 'aldershot', 'farnham', 'camberley',
      'fareham', 'gosport', 'petersfield', 'alton', 'romsey', 'eastleigh', 'southampton', 'portsmouth', 'chichester',
      'horsham', 'crawley', 'redhill', 'reigate', 'dorking', 'leatherhead', 'epsom', 'kingston', 'wimbledon', 'richmond',
      'staines', 'windsor', 'eton', 'marlow', 'high-wycombe', 'chesham', 'amersham', 'beaconsfield', 'gerrards-cross',
      
      // South West
      'bath', 'cheltenham', 'gloucester', 'stroud', 'cirencester', 'tewkesbury', 'worcester', 'hereford', 'ross-on-wye',
      'bournemouth', 'poole', 'dorchester', 'weymouth', 'bridport', 'sherborne', 'yeovil', 'taunton', 'bridgwater',
      'weston-super-mare', 'clevedon', 'portishead', 'nailsea', 'bristol', 'chippenham', 'devizes', 'marlborough',
      'exeter', 'plymouth', 'torquay', 'paignton', 'newton-abbot', 'totnes', 'dartmouth', 'kingsbridge', 'salcombe',
      'barnstaple', 'bideford', 'ilfracombe', 'lynton', 'okehampton', 'tavistock', 'launceston', 'bodmin', 'liskeard',
      'truro', 'falmouth', 'helston', 'penzance', 'st-ives', 'newquay', 'padstow', 'wadebridge', 'camelford', 'bude',
      
      // Midlands
      'coventry', 'leicester', 'nottingham', 'derby', 'northampton', 'milton-keynes', 'luton', 'bedford', 'st-albans',
      'hemel-hempstead', 'watford', 'stevenage', 'hitchin', 'letchworth', 'welwyn', 'hatfield', 'hertford', 'ware',
      'bishops-stortford', 'harlow', 'epping', 'chelmsford', 'colchester', 'ipswich', 'bury-st-edmunds', 'sudbury',
      'rugby', 'warwick', 'leamington-spa', 'stratford-upon-avon', 'redditch', 'bromsgrove', 'kidderminster',
      'stoke-on-trent', 'stafford', 'lichfield', 'burton-upon-trent', 'tamworth', 'cannock', 'wolverhampton',
      
      // North
      'york', 'harrogate', 'ripon', 'thirsk', 'northallerton', 'richmond', 'leyburn', 'hawes', 'settle', 'skipton',
      'keighley', 'ilkley', 'otley', 'wetherby', 'tadcaster', 'selby', 'goole', 'hull', 'beverley', 'driffield',
      'bridlington', 'filey', 'scarborough', 'whitby', 'middlesbrough', 'stockton-on-tees', 'darlington', 'bishop-auckland',
      'durham', 'chester-le-street', 'washington', 'sunderland', 'newcastle', 'gateshead', 'hexham', 'alnwick', 'berwick',
      'carlisle', 'penrith', 'kendal', 'windermere', 'ambleside', 'keswick', 'workington', 'whitehaven', 'barrow-in-furness',
      'lancaster', 'morecambe', 'fleetwood', 'blackpool', 'lytham', 'preston', 'chorley', 'leyland', 'ormskirk',
      'southport', 'formby', 'crosby', 'st-helens', 'warrington', 'runcorn', 'widnes', 'chester', 'ellesmere-port',
      'crewe', 'nantwich', 'congleton', 'macclesfield', 'wilmslow', 'alderley-edge', 'knutsford', 'northwich', 'winsford',
      
      // East
      'norwich', 'great-yarmouth', 'lowestoft', 'thetford', 'diss', 'wymondham', 'cromer', 'sheringham', 'fakenham',
      'kings-lynn', 'downham-market', 'swaffham', 'dereham', 'aylsham', 'north-walsham', 'stalham',
      'peterborough', 'huntingdon', 'st-neots', 'ramsey', 'march', 'wisbech', 'chatteris', 'ely', 'newmarket',
      'haverhill', 'saffron-walden', 'dunmow', 'braintree', 'witham', 'maldon', 'burnham-on-crouch', 'southend',
      'basildon', 'brentwood', 'romford', 'dartford', 'gravesend', 'rochester', 'chatham', 'gillingham', 'sittingbourne',
      'faversham', 'whitstable', 'herne-bay', 'margate', 'ramsgate', 'broadstairs', 'sandwich', 'deal', 'dover',
      'folkestone', 'hythe', 'ashford', 'tenterden', 'cranbrook', 'tonbridge', 'tunbridge-wells', 'sevenoaks',
      'dartford', 'swanley', 'orpington', 'bromley', 'beckenham', 'croydon', 'sutton', 'carshalton', 'wallington',
      
      // Additional areas
      'hastings', 'eastbourne', 'lewes', 'uckfield', 'crowborough', 'heathfield', 'hailsham', 'seaford', 'newhaven',
      'peacehaven', 'rottingdean', 'saltdean', 'telscombe', 'ovingdean', 'patcham', 'hangleton', 'portslade'
    ];
  }

  async initialize() {
    console.log('Initializing Comprehensive UK Baby Sensory Scraper...');
    
    this.client = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    console.log(`Ready to scrape ${this.ukLocations.length} UK locations`);
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
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
        return null;
      }

      return await response.text();
    } catch (error) {
      return null;
    }
  }

  async scrapeLocationBatch(locations) {
    const batchResults = [];
    
    for (const location of locations) {
      try {
        const url = `https://www.babysensory.com/${location}/`;
        const html = await this.fetchPage(url);
        
        if (!html) {
          continue; // Location doesn't exist
        }

        const $ = cheerio.load(html);
        const title = $('title').text().trim();
        
        // Verify this is a valid Baby Sensory franchise page
        if (!title.toLowerCase().includes('baby sensory') || !title.toLowerCase().includes(location.replace('-', ' '))) {
          continue;
        }

        const classes = await this.extractLocationClasses(html, location, url);
        batchResults.push(...classes);
        
        this.log(`${location}: Found ${classes.length} classes`);

      } catch (error) {
        this.log(`${location}: Error - ${error.message}`);
      }

      await this.sleep(800); // Respectful delay
    }
    
    return batchResults;
  }

  async extractLocationClasses(html, locationName, franchiseUrl) {
    const $ = cheerio.load(html);
    const classes = [];
    const pageText = $('body').text();

    // Enhanced venue detection patterns for Baby Sensory
    const venuePatterns = [
      /([A-Z][a-zA-Z\s&'-]{12,70}(?:Church|Centre|Center|Hall|School|Club|Academy|Community|Village|Sports|Leisure|Recreation|Parish))/g,
      /([A-Z][a-zA-Z\s&'-]{8,55}(?:Baptist|Methodist|Catholic|Anglican|Presbyterian|United|Reformed|Evangelical)[\s][A-Z][a-zA-Z\s&'-]{5,45})/g,
      /([A-Z][a-zA-Z\s&'-]{8,55}(?:Primary|Junior|Infant|Nursery|Preparatory)[\s]School)/g,
      /([A-Z][a-zA-Z\s&'-]{8,55}(?:St\.?\s|Saint\s)[A-Z][a-zA-Z\s&'-]{5,50})/g
    ];

    const dayPattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/gi;
    const timePattern = /(\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?(?:\s*[-–—]\s*\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?)?)/g;

    venuePatterns.forEach(pattern => {
      const venues = pageText.match(pattern) || [];
      venues.forEach(venue => {
        if (!this.isValidVenue(venue)) return;
        
        const venueIndex = pageText.indexOf(venue);
        const contextStart = Math.max(0, venueIndex - 300);
        const contextEnd = venueIndex + 600;
        const context = pageText.slice(contextStart, contextEnd);
        
        const days = context.match(dayPattern) || [];
        const times = context.match(timePattern) || [];

        if (days.length > 0 && times.length > 0) {
          // Create specific sessions
          days.slice(0, 3).forEach(day => { // Max 3 days per venue
            times.slice(0, 2).forEach(time => { // Max 2 times per day
              classes.push({
                locationName: this.formatLocationName(locationName),
                franchiseUrl,
                venueName: this.cleanVenueName(venue),
                day: this.formatDay(day),
                time: this.formatTime(time),
                ageGroup: this.determineAgeGroup(context)
              });
            });
          });
        } else if (venue.trim().length > 18) {
          // Add venue with general info
          classes.push({
            locationName: this.formatLocationName(locationName),
            franchiseUrl,
            venueName: this.cleanVenueName(venue),
            day: 'Various',
            time: 'Contact for schedule',
            ageGroup: 'Baby & Toddler'
          });
        }
      });
    });

    return this.removeDuplicates(classes);
  }

  formatLocationName(location) {
    return location.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  isValidVenue(venue) {
    if (venue.length < 18 || venue.length > 85) return false;
    
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
    if (!time) return 'Contact for schedule';
    return time.replace(/\./g, ':').replace(/([0-9])([ap]m)/i, '$1 $2').toLowerCase();
  }

  determineAgeGroup(context) {
    const text = context.toLowerCase();
    if (text.includes('toddler') || text.includes('walking') || text.includes('13')) return 'Toddler';
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

  enhanceClassData(rawClasses) {
    return rawClasses.map(classItem => {
      const postcodeMatch = classItem.venueName.match(/([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i);
      
      return {
        name: `Baby Sensory ${classItem.locationName} - ${classItem.venueName}`.substring(0, 255),
        description: `Baby Sensory classes featuring music, lights, textures and scents to support your baby's development at ${classItem.venueName} in ${classItem.locationName}.`,
        age_group_min: classItem.ageGroup === 'Toddler' ? 13 : 0,
        age_group_max: classItem.ageGroup === 'Toddler' ? 36 : 12,
        price: '£8-12 per session',
        is_featured: true,
        venue: classItem.venueName.substring(0, 255),
        address: classItem.venueName.substring(0, 255),
        postcode: postcodeMatch ? postcodeMatch[1] : null,
        day_of_week: classItem.day,
        time: classItem.time,
        contact_email: this.generateEmail(classItem.locationName),
        website: classItem.franchiseUrl,
        category: 'Baby & Toddler Classes',
        is_active: true,
        town: classItem.locationName,
        service_type: 'Class',
        main_category: 'Baby & Toddler Classes',
        subcategory: 'Sensory Development',
        provider_name: 'Baby Sensory'
      };
    });
  }

  generateEmail(location) {
    const clean = location.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 12);
    return `${clean}@babysensory.com`;
  }

  async saveToDatabase(classes) {
    if (classes.length === 0) return 0;

    this.log(`Saving ${classes.length} Baby Sensory classes to database...`);
    
    let savedCount = 0;

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
        this.log(`Save error: ${error.message.substring(0, 100)}`);
      }
    }

    this.log(`Successfully saved ${savedCount} Baby Sensory classes`);
    return savedCount;
  }

  async runComprehensiveScraping() {
    try {
      await this.initialize();
      
      let totalClasses = [];
      let locationsProcessed = 0;
      const batchSize = 25; // Process in batches
      
      // Process locations in batches
      for (let i = 0; i < this.ukLocations.length; i += batchSize) {
        const batch = this.ukLocations.slice(i, i + batchSize);
        
        this.log(`Processing batch ${Math.floor(i/batchSize) + 1}: ${batch.length} locations`);
        
        const batchClasses = await this.scrapeLocationBatch(batch);
        totalClasses.push(...batchClasses);
        locationsProcessed += batch.length;
        
        this.log(`Batch complete. Found ${batchClasses.length} classes. Total so far: ${totalClasses.length}`);
        
        // Save in batches to avoid memory issues
        if (totalClasses.length >= 50) {
          const enhancedClasses = this.enhanceClassData(totalClasses);
          await this.saveToDatabase(enhancedClasses);
          totalClasses = []; // Reset for next batch
        }
        
        await this.sleep(2000); // Delay between batches
      }
      
      // Save any remaining classes
      if (totalClasses.length > 0) {
        const enhancedClasses = this.enhanceClassData(totalClasses);
        await this.saveToDatabase(enhancedClasses);
      }

      await this.showFinalResults(locationsProcessed);

    } catch (error) {
      this.log(`Critical error: ${error.message}`);
    } finally {
      if (this.client) {
        await this.client.end();
      }
    }
  }

  async showFinalResults(locationsProcessed) {
    // Get count of Baby Sensory classes from database
    const result = await this.client.query(
      "SELECT COUNT(*) as count FROM classes WHERE provider_name = 'Baby Sensory'"
    );
    
    const totalBabySensoryClasses = result.rows[0].count;
    
    console.log('\n=== COMPREHENSIVE BABY SENSORY SCRAPING COMPLETE ===');
    console.log(`UK Locations Processed: ${locationsProcessed}`);
    console.log(`Total Baby Sensory Classes in Database: ${totalBabySensoryClasses}`);
    console.log(`Completion Date: ${new Date().toLocaleDateString()}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Run Google Places API address enhancement');
    console.log('2. Begin Water Babies comprehensive scraping');
    console.log('3. Process Monkey Music and other franchises');
    console.log('4. Set up automated weekly update schedule');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function runComprehensiveUKBabySensoryScraper() {
  const scraper = new ComprehensiveUKBabySensoryScraper();
  await scraper.runComprehensiveScraping();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveUKBabySensoryScraper().catch(console.error);
}

export { ComprehensiveUKBabySensoryScraper, runComprehensiveUKBabySensoryScraper };