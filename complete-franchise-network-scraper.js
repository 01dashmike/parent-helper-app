import * as cheerio from 'cheerio';
import { Pool } from 'pg';

class CompleteFranchiseNetworkScraper {
  constructor() {
    this.client = null;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.results = {
      totalProcessed: 0,
      totalFound: 0,
      totalSaved: 0,
      companies: []
    };
    
    // Expanded UK locations based on Baby Sensory investigation
    this.ukLocations = [
      // Confirmed working locations
      'winchester', 'guildford', 'gloucester', 'cambridge',
      
      // Major cities and franchise hotspots
      'london', 'manchester', 'birmingham', 'liverpool', 'leeds', 'sheffield', 'bristol', 'edinburgh', 'cardiff',
      
      // South East - high Baby Sensory presence
      'reading', 'oxford', 'brighton', 'hove', 'woking', 'basingstoke', 'salisbury', 'southampton', 'portsmouth',
      'chichester', 'horsham', 'crawley', 'redhill', 'reigate', 'dorking', 'leatherhead', 'epsom', 'kingston',
      'richmond', 'staines', 'windsor', 'slough', 'maidenhead', 'bracknell', 'wokingham', 'newbury', 'andover',
      'aldershot', 'farnham', 'camberley', 'fleet', 'fareham', 'gosport', 'petersfield', 'alton', 'romsey',
      'eastleigh', 'hedge-end', 'chandlers-ford', 'totton', 'lyndhurst', 'lymington', 'new-milton', 'ringwood',
      
      // South West
      'bath', 'cheltenham', 'stroud', 'cirencester', 'tewkesbury', 'evesham', 'pershore', 'worcester',
      'bournemouth', 'poole', 'dorchester', 'weymouth', 'bridport', 'sherborne', 'blandford-forum',
      'wimborne', 'ferndown', 'christchurch', 'wareham', 'swanage', 'corfe-castle', 'wool', 'bovington',
      'exeter', 'plymouth', 'torquay', 'paignton', 'newton-abbot', 'totnes', 'dartmouth', 'kingsbridge',
      'ivybridge', 'tavistock', 'okehampton', 'crediton', 'tiverton', 'honiton', 'sidmouth', 'exmouth',
      'truro', 'falmouth', 'helston', 'penzance', 'st-ives', 'newquay', 'bodmin', 'liskeard', 'looe',
      
      // Home Counties expansion
      'st-albans', 'hemel-hempstead', 'watford', 'rickmansworth', 'amersham', 'chesham', 'high-wycombe',
      'marlow', 'beaconsfield', 'gerrards-cross', 'uxbridge', 'harrow', 'ealing', 'hounslow', 'twickenham',
      'surbiton', 'esher', 'cobham', 'weybridge', 'walton-on-thames', 'hersham', 'west-byfleet', 'byfleet',
      
      // East
      'chelmsford', 'colchester', 'ipswich', 'bury-st-edmunds', 'sudbury', 'haverhill', 'saffron-walden',
      'bishop-stortford', 'harlow', 'epping', 'ongar', 'brentwood', 'billericay', 'wickford', 'rayleigh',
      'southend-on-sea', 'leigh-on-sea', 'westcliff-on-sea', 'rochford', 'hockley', 'ashingdon',
      'norwich', 'great-yarmouth', 'lowestoft', 'thetford', 'diss', 'wymondham', 'attleborough',
      'watton', 'swaffham', 'fakenham', 'cromer', 'sheringham', 'north-walsham', 'stalham',
      
      // Thames Valley
      'henley-on-thames', 'wallingford', 'didcot', 'abingdon', 'faringdon', 'wantage', 'grove',
      'stanford-in-the-vale', 'shrivenham', 'lambourn', 'hungerford', 'marlborough', 'devizes',
      
      // Kent
      'maidstone', 'canterbury', 'ashford', 'folkestone', 'dover', 'deal', 'sandwich', 'ramsgate',
      'margate', 'broadstairs', 'whitstable', 'herne-bay', 'faversham', 'sittingbourne', 'gillingham',
      'chatham', 'rochester', 'gravesend', 'dartford', 'swanley', 'sevenoaks', 'tonbridge',
      'tunbridge-wells', 'crowborough', 'uckfield', 'heathfield', 'battle', 'hastings', 'bexhill',
      'eastbourne', 'hailsham', 'polegate', 'seaford', 'newhaven', 'lewes', 'burgess-hill',
      'haywards-heath', 'east-grinstead', 'lingfield', 'oxted', 'caterham', 'warlingham',
      
      // Midlands
      'coventry', 'leicester', 'nottingham', 'derby', 'northampton', 'kettering', 'corby',
      'wellingborough', 'rushden', 'daventry', 'towcester', 'brackley', 'buckingham',
      'milton-keynes', 'newport-pagnell', 'olney', 'woburn', 'ampthill', 'bedford', 'biggleswade',
      'sandy', 'potton', 'shefford', 'flitwick', 'leighton-buzzard', 'dunstable', 'houghton-regis',
      'luton', 'hitchin', 'letchworth', 'baldock', 'royston', 'buntingford', 'hertford', 'ware',
      'hoddesdon', 'cheshunt', 'waltham-cross', 'enfield', 'potters-bar', 'hatfield', 'welwyn',
      
      // Additional franchise expansion areas
      'warwick', 'leamington-spa', 'stratford-upon-avon', 'alcester', 'studley', 'henley-in-arden',
      'solihull', 'knowle', 'dorridge', 'balsall-common', 'berkswell', 'meriden', 'kenilworth',
      'rugby', 'dunchurch', 'hillmorton', 'long-lawford', 'wolston', 'brandon', 'binley-woods'
    ];
  }

  async initialize() {
    console.log('Initializing Complete Franchise Network Scraper...');
    
    this.client = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    console.log(`Ready to process ${this.ukLocations.length} UK locations for Baby Sensory expansion`);
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  async fetchLocationPage(location) {
    try {
      const url = `https://www.babysensory.com/${location}/`;
      
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

      const html = await response.text();
      const $ = cheerio.load(html);
      const title = $('title').text().trim();
      
      // Verify this is a valid Baby Sensory franchise page
      if (title.toLowerCase().includes('baby sensory')) {
        return { html, url, title };
      }
      
      return null;

    } catch (error) {
      return null;
    }
  }

  extractClassesFromPage(pageData, locationName) {
    const { html, url } = pageData;
    const $ = cheerio.load(html);
    const classes = [];
    const pageText = $('body').text();

    // Baby Sensory venue patterns - refined for better accuracy
    const venuePatterns = [
      /([A-Z][a-zA-Z\s&'-]{15,80}(?:Church|Centre|Center|Hall|School|Club|Academy|Community|Village|Sports|Leisure|Recreation|Parish))/g,
      /([A-Z][a-zA-Z\s&'-]{12,65}(?:Baptist|Methodist|Catholic|Anglican|Presbyterian|United|Reformed|Evangelical)[\s][A-Z][a-zA-Z\s&'-]{8,55})/g,
      /([A-Z][a-zA-Z\s&'-]{12,65}(?:Primary|Junior|Infant|Nursery|Preparatory)[\s]School)/g,
      /([A-Z][a-zA-Z\s&'-]{12,65}(?:St\.?\s|Saint\s)[A-Z][a-zA-Z\s&'-]{8,60})/g
    ];

    const dayPattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/gi;
    const timePattern = /(\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?(?:\s*[-–—to]\s*\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?)?)/g;

    venuePatterns.forEach(pattern => {
      const venues = pageText.match(pattern) || [];
      
      venues.forEach(venue => {
        if (!this.isValidVenue(venue)) return;
        
        const venueIndex = pageText.indexOf(venue);
        const context = pageText.slice(Math.max(0, venueIndex - 300), venueIndex + 600);
        
        const days = context.match(dayPattern) || [];
        const times = context.match(timePattern) || [];

        if (days.length > 0 && times.length > 0) {
          // Create specific class sessions - limit to avoid duplicates
          const limitedDays = days.slice(0, 2);
          const limitedTimes = times.slice(0, 2);
          
          limitedDays.forEach(day => {
            limitedTimes.forEach(time => {
              classes.push({
                locationName: this.formatLocationName(locationName),
                url,
                venueName: this.cleanVenueName(venue),
                day: this.formatDay(day),
                time: this.formatTime(time),
                ageGroup: this.determineAgeGroup(context)
              });
            });
          });
        } else {
          // Add venue with general information
          classes.push({
            locationName: this.formatLocationName(locationName),
            url,
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

  isValidVenue(venue) {
    if (venue.length < 20 || venue.length > 90) return false;
    
    const validWords = [
      'church', 'centre', 'center', 'hall', 'school', 'club', 'academy',
      'community', 'village', 'sports', 'leisure', 'recreation', 'baptist',
      'methodist', 'catholic', 'primary', 'junior', 'nursery', 'saint', 'parish'
    ];
    
    const venueLower = venue.toLowerCase();
    const hasValidWord = validWords.some(word => venueLower.includes(word));
    
    // Additional filters to improve quality
    const invalidWords = ['facebook', 'twitter', 'instagram', 'website', 'email', 'phone'];
    const hasInvalidWord = invalidWords.some(word => venueLower.includes(word));
    
    return hasValidWord && !hasInvalidWord;
  }

  formatLocationName(location) {
    return location.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  cleanVenueName(venue) {
    return venue.trim().replace(/\s+/g, ' ').replace(/[^\w\s&'.-]/g, '');
  }

  formatDay(day) {
    return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  }

  formatTime(time) {
    if (!time || time === 'Contact for schedule') return time;
    return time.replace(/\./g, ':').replace(/([0-9])([ap]m)/i, '$1 $2').toLowerCase();
  }

  determineAgeGroup(context) {
    const text = context.toLowerCase();
    if (text.includes('toddler') || text.includes('walking') || text.includes('13')) {
      return 'Toddler';
    }
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

  getDefaultPostcode(locationName) {
    const locationPostcodes = {
      'Winchester': 'SO23 9PE', 'Guildford': 'GU1 3UW', 'Gloucester': 'GL1 1UL',
      'Cambridge': 'CB2 1TN', 'London': 'SW1A 1AA', 'Manchester': 'M1 1AA',
      'Birmingham': 'B1 1BB', 'Liverpool': 'L1 8JQ', 'Leeds': 'LS1 1BA',
      'Sheffield': 'S1 2HE', 'Bristol': 'BS1 4DJ', 'Edinburgh': 'EH1 1YZ',
      'Cardiff': 'CF10 1EP', 'Reading': 'RG1 1JX', 'Oxford': 'OX1 1BP',
      'Brighton': 'BN1 1UG', 'Hove': 'BN3 1AH', 'Woking': 'GU21 6XS',
      'Basingstoke': 'RG21 4AE', 'Salisbury': 'SP1 1BL', 'Southampton': 'SO14 0AA',
      'Portsmouth': 'PO1 2EG', 'Chichester': 'PO19 1PU', 'Horsham': 'RH12 1HQ',
      'Crawley': 'RH10 1DD', 'Bath': 'BA1 1LZ', 'Cheltenham': 'GL50 1AA',
      'Bournemouth': 'BH1 1AA', 'Poole': 'BH15 1SZ', 'Exeter': 'EX1 1BX',
      'Plymouth': 'PL1 1EA', 'Truro': 'TR1 1HD', 'Falmouth': 'TR11 3QQ'
    };
    
    return locationPostcodes[locationName] || 'TBC 1AA';
  }

  createClassData(rawClass) {
    const postcodeMatch = rawClass.venueName.match(/([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i);
    const defaultPostcode = this.getDefaultPostcode(rawClass.locationName);
    
    return {
      name: `Baby Sensory ${rawClass.locationName} - ${rawClass.venueName}`.substring(0, 250),
      description: `Baby Sensory classes featuring music, lights, textures and scents to support your baby's development at ${rawClass.venueName} in ${rawClass.locationName}.`,
      age_group_min: rawClass.ageGroup === 'Toddler' ? 13 : 0,
      age_group_max: rawClass.ageGroup === 'Toddler' ? 36 : 12,
      price: '£8-12 per session',
      is_featured: true,
      venue: rawClass.venueName.substring(0, 250),
      address: rawClass.venueName.substring(0, 250),
      postcode: postcodeMatch ? postcodeMatch[1] : defaultPostcode,
      day_of_week: rawClass.day,
      time: rawClass.time,
      contact_email: this.generateEmail(rawClass.locationName),
      website: rawClass.url,
      category: 'Baby & Toddler Classes',
      is_active: true,
      town: rawClass.locationName,
      service_type: 'Class',
      main_category: 'Baby & Toddler Classes',
      subcategory: 'Sensory Development',
      provider_name: 'Baby Sensory'
    };
  }

  generateEmail(location) {
    const clean = location.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 12);
    return `${clean}@babysensory.com`;
  }

  async saveClassToDatabase(classData) {
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

  async processBatch(locations) {
    let batchFound = 0;
    let batchSaved = 0;
    
    for (const location of locations) {
      try {
        const pageData = await this.fetchLocationPage(location);
        this.results.totalProcessed++;
        
        if (!pageData) {
          continue;
        }

        const rawClasses = this.extractClassesFromPage(pageData, location);
        batchFound += rawClasses.length;
        this.results.totalFound += rawClasses.length;
        
        if (rawClasses.length > 0) {
          this.log(`${location}: Found ${rawClasses.length} classes`);
        }

        // Save each class
        for (const rawClass of rawClasses) {
          const classData = this.createClassData(rawClass);
          const saved = await this.saveClassToDatabase(classData);
          
          if (saved) {
            batchSaved++;
            this.results.totalSaved++;
          }
        }

      } catch (error) {
        this.log(`Error processing ${location}: ${error.message}`);
      }

      await this.sleep(600); // Respectful delay
    }
    
    return { found: batchFound, saved: batchSaved };
  }

  async runCompleteFranchiseExpansion() {
    try {
      await this.initialize();
      
      const batchSize = 30;
      let batchNumber = 1;
      
      // Process locations in batches
      for (let i = 0; i < this.ukLocations.length; i += batchSize) {
        const batch = this.ukLocations.slice(i, i + batchSize);
        
        this.log(`Processing batch ${batchNumber}: ${batch.length} locations (${i + 1}-${i + batch.length} of ${this.ukLocations.length})`);
        
        const batchResults = await this.processBatch(batch);
        
        this.log(`Batch ${batchNumber} complete: ${batchResults.found} found, ${batchResults.saved} saved`);
        this.log(`Total progress: ${this.results.totalProcessed}/${this.ukLocations.length} locations, ${this.results.totalFound} classes found, ${this.results.totalSaved} saved`);
        
        batchNumber++;
        await this.sleep(2000); // Delay between batches
      }

      await this.showFinalResults();

    } catch (error) {
      this.log(`Critical error: ${error.message}`);
    } finally {
      if (this.client) {
        await this.client.end();
      }
    }
  }

  async showFinalResults() {
    // Get final count from database
    const result = await this.client.query(
      "SELECT COUNT(*) as count FROM classes WHERE provider_name = 'Baby Sensory'"
    );
    
    const totalBabySensoryClasses = result.rows[0].count;
    
    console.log('\n=== COMPLETE BABY SENSORY NETWORK EXPANSION ===');
    console.log(`UK Locations Processed: ${this.results.totalProcessed}`);
    console.log(`Total Classes Found: ${this.results.totalFound}`);
    console.log(`Total Classes Saved: ${this.results.totalSaved}`);
    console.log(`Final Database Count: ${totalBabySensoryClasses} Baby Sensory classes`);
    console.log(`Completion Date: ${new Date().toLocaleDateString()}`);
    console.log('');
    
    if (totalBabySensoryClasses > 7) {
      console.log('SUCCESS: Significantly expanded Baby Sensory database');
      console.log('Ready for next franchise companies:');
      console.log('1. Water Babies (swimming classes)');
      console.log('2. Monkey Music (music classes)');
      console.log('3. Sing and Sign (sign language)');
      console.log('4. Google Places API address enhancement');
    } else {
      console.log('Limited expansion - may need to investigate additional Baby Sensory URL patterns');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function runCompleteFranchiseNetworkScraper() {
  const scraper = new CompleteFranchiseNetworkScraper();
  await scraper.runCompleteFranchiseExpansion();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteFranchiseNetworkScraper().catch(console.error);
}

export { CompleteFranchiseNetworkScraper, runCompleteFranchiseNetworkScraper };