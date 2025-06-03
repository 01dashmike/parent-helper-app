import * as cheerio from 'cheerio';
import { Pool } from 'pg';

class WorkingBabySensoryScraper {
  constructor() {
    this.client = null;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.results = {
      locationsProcessed: 0,
      classesFound: 0,
      classesSaved: 0,
      errors: []
    };
    
    // Start with proven working locations from investigation
    this.validLocations = [
      'winchester', 'guildford', 'gloucester', 'manchester', 'sheffield', 'birmingham',
      'bristol', 'reading', 'oxford', 'cambridge', 'brighton', 'southampton',
      'portsmouth', 'bournemouth', 'poole', 'exeter', 'plymouth', 'bath',
      'cheltenham', 'salisbury', 'basingstoke', 'fareham', 'aldershot',
      'woking', 'camberley', 'farnham', 'newbury', 'swindon', 'slough'
    ];
  }

  async initialize() {
    console.log('Initializing Working Baby Sensory Scraper...');
    
    this.client = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    console.log(`Processing ${this.validLocations.length} confirmed Baby Sensory locations`);
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
      
      // Verify this is a Baby Sensory franchise page
      if (title.toLowerCase().includes('baby sensory')) {
        return { html, url, title };
      }
      
      return null;

    } catch (error) {
      this.log(`Error fetching ${location}: ${error.message}`);
      return null;
    }
  }

  extractClassesFromPage(pageData, locationName) {
    const { html, url } = pageData;
    const $ = cheerio.load(html);
    const classes = [];
    const pageText = $('body').text();

    // Baby Sensory venue patterns
    const venuePatterns = [
      /([A-Z][a-zA-Z\s&'-]{15,75}(?:Church|Centre|Center|Hall|School|Club|Academy|Community|Village|Sports|Leisure|Recreation|Parish))/g,
      /([A-Z][a-zA-Z\s&'-]{10,60}(?:Baptist|Methodist|Catholic|Anglican|Presbyterian|United|Reformed|Evangelical)[\s][A-Z][a-zA-Z\s&'-]{5,50})/g,
      /([A-Z][a-zA-Z\s&'-]{10,60}(?:Primary|Junior|Infant|Nursery)[\s]School)/g,
      /([A-Z][a-zA-Z\s&'-]{10,60}(?:St\.?\s|Saint\s)[A-Z][a-zA-Z\s&'-]{5,55})/g
    ];

    const dayPattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/gi;
    const timePattern = /(\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?(?:\s*[-–—to]\s*\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?)?)/g;

    venuePatterns.forEach(pattern => {
      const venues = pageText.match(pattern) || [];
      
      venues.forEach(venue => {
        if (!this.isValidVenue(venue)) return;
        
        const venueIndex = pageText.indexOf(venue);
        const context = pageText.slice(Math.max(0, venueIndex - 250), venueIndex + 500);
        
        const days = context.match(dayPattern) || [];
        const times = context.match(timePattern) || [];

        if (days.length > 0 && times.length > 0) {
          // Create specific class sessions
          days.slice(0, 2).forEach(day => {
            times.slice(0, 2).forEach(time => {
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
    if (venue.length < 20 || venue.length > 85) return false;
    
    const validWords = [
      'church', 'centre', 'center', 'hall', 'school', 'club', 'academy',
      'community', 'village', 'sports', 'leisure', 'recreation', 'baptist',
      'methodist', 'catholic', 'primary', 'junior', 'nursery', 'saint', 'parish'
    ];
    
    const venueLower = venue.toLowerCase();
    return validWords.some(word => venueLower.includes(word));
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

  async saveClassToDatabase(classData) {
    try {
      // Validate required fields first
      if (!classData.name || !classData.venue || !classData.day_of_week) {
        this.log('Skipping class with missing required fields');
        return false;
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
        return true;
      }
      
      return false;

    } catch (error) {
      this.log(`Database save error: ${error.message}`);
      this.results.errors.push(`Save error: ${error.message.substring(0, 100)}`);
      return false;
    }
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

  async processAllLocations() {
    this.log('Starting comprehensive Baby Sensory scraping...');
    
    for (const location of this.validLocations) {
      try {
        this.log(`Processing ${location}...`);
        
        const pageData = await this.fetchLocationPage(location);
        this.results.locationsProcessed++;
        
        if (!pageData) {
          this.log(`${location}: No valid Baby Sensory page found`);
          continue;
        }

        const rawClasses = this.extractClassesFromPage(pageData, location);
        this.results.classesFound += rawClasses.length;
        
        this.log(`${location}: Found ${rawClasses.length} classes`);

        // Save each class individually
        for (const rawClass of rawClasses) {
          const classData = this.createClassData(rawClass);
          const saved = await this.saveClassToDatabase(classData);
          
          if (saved) {
            this.results.classesSaved++;
          }
        }

      } catch (error) {
        this.log(`Error processing ${location}: ${error.message}`);
        this.results.errors.push(`${location}: ${error.message}`);
      }

      await this.sleep(1000); // Respectful delay
    }
  }

  async showResults() {
    console.log('\n=== BABY SENSORY SCRAPING RESULTS ===');
    console.log(`Locations Processed: ${this.results.locationsProcessed}`);
    console.log(`Classes Found: ${this.results.classesFound}`);
    console.log(`Classes Saved: ${this.results.classesSaved}`);
    console.log(`Errors: ${this.results.errors.length}`);
    
    if (this.results.errors.length > 0) {
      console.log('\nFirst 5 errors:');
      this.results.errors.slice(0, 5).forEach(error => {
        console.log(`  - ${error}`);
      });
    }

    // Verify database contents
    try {
      const result = await this.client.query(
        "SELECT COUNT(*) as count FROM classes WHERE provider_name = 'Baby Sensory'"
      );
      
      console.log(`\nTotal Baby Sensory classes in database: ${result.rows[0].count}`);
      
      if (result.rows[0].count > 0) {
        console.log('\nNext steps:');
        console.log('1. Run Google Places API address enhancement');
        console.log('2. Expand to Water Babies scraping');
        console.log('3. Process remaining franchise companies');
      }
      
    } catch (error) {
      console.log(`Error checking database: ${error.message}`);
    }
  }

  async runWorkingScraper() {
    try {
      await this.initialize();
      await this.processAllLocations();
      await this.showResults();
      
    } catch (error) {
      this.log(`Critical error: ${error.message}`);
    } finally {
      if (this.client) {
        await this.client.end();
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function runWorkingBabySensoryScraper() {
  const scraper = new WorkingBabySensoryScraper();
  await scraper.runWorkingScraper();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWorkingBabySensoryScraper().catch(console.error);
}

export { WorkingBabySensoryScraper, runWorkingBabySensoryScraper };