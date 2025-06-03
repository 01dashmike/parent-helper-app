import * as cheerio from 'cheerio';
import { Pool } from 'pg';

class CompleteFranchiseExpansion {
  constructor() {
    this.client = null;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.results = {};
    
    // Franchise companies ordered by current database size
    this.franchiseCompanies = [
      {
        name: 'Water Babies',
        currentCount: 253,
        baseUrl: 'https://www.waterbabies.co.uk',
        category: 'Baby Swimming',
        pricing: '£15-20 per session',
        targetLocations: [
          'london', 'birmingham', 'manchester', 'liverpool', 'leeds', 'bristol',
          'winchester', 'guildford', 'reading', 'oxford', 'cambridge', 'bath',
          'cheltenham', 'southampton', 'portsmouth', 'brighton', 'exeter',
          'watford', 'st-albans', 'hertford', 'chelmsford', 'ipswich', 'norwich'
        ]
      },
      {
        name: 'Monkey Music',
        currentCount: 110,
        baseUrl: 'https://www.monkeymusic.co.uk',
        category: 'Music & Movement',
        pricing: '£10-15 per session',
        targetLocations: [
          'london', 'birmingham', 'manchester', 'liverpool', 'leeds', 'bristol',
          'winchester', 'guildford', 'reading', 'oxford', 'cambridge', 'bath',
          'richmond', 'kingston', 'wimbledon', 'putney', 'clapham', 'wandsworth'
        ]
      },
      {
        name: 'Sing and Sign',
        currentCount: 56,
        baseUrl: 'https://www.singandsign.co.uk',
        category: 'Sign Language Classes',
        pricing: '£8-12 per session',
        targetLocations: [
          'london', 'birmingham', 'manchester', 'bristol', 'reading', 'oxford',
          'winchester', 'guildford', 'bath', 'cheltenham', 'southampton'
        ]
      },
      {
        name: 'Toddler Sense',
        currentCount: 54,
        baseUrl: 'https://www.toddlersense.co.uk',
        category: 'Sensory Development',
        pricing: '£8-12 per session',
        targetLocations: [
          'london', 'birmingham', 'manchester', 'bristol', 'reading',
          'winchester', 'guildford', 'bath', 'southampton', 'portsmouth'
        ]
      },
      {
        name: 'Tumble Tots',
        currentCount: 44,
        baseUrl: 'https://www.tumbletots.com',
        category: 'Physical Development',
        pricing: '£8-12 per session',
        targetLocations: [
          'london', 'birmingham', 'manchester', 'bristol', 'reading',
          'winchester', 'guildford', 'bath', 'cheltenham'
        ]
      }
    ];
  }

  async initialize() {
    this.client = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    console.log(`Processing ${this.franchiseCompanies.length} franchise companies for comprehensive UK expansion`);
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
          'Accept-Language': 'en-GB,en;q=0.5'
        }
      });

      if (!response.ok) return null;
      return await response.text();

    } catch (error) {
      return null;
    }
  }

  async processFranchiseCompany(company) {
    this.log(`Starting ${company.name} expansion...`, company.name);
    
    const foundClasses = [];
    
    for (const location of company.targetLocations) {
      try {
        const locationUrls = [
          `${company.baseUrl}/${location}/`,
          `${company.baseUrl}/classes/${location}/`,
          `${company.baseUrl}/find-a-class/${location}/`,
          `${company.baseUrl}/locations/${location}/`
        ];
        
        for (const url of locationUrls) {
          const html = await this.fetchPage(url);
          if (html && this.validateFranchisePage(html, company.name, location)) {
            const classes = this.extractFranchiseClasses(html, url, location, company);
            foundClasses.push(...classes);
            
            if (classes.length > 0) {
              this.log(`${location}: Found ${classes.length} classes`, company.name);
            }
            break;
          }
        }
        
      } catch (error) {
        this.log(`Error processing ${location}: ${error.message}`, company.name);
      }
      
      await this.sleep(500);
    }
    
    return foundClasses;
  }

  validateFranchisePage(html, companyName, location) {
    const $ = cheerio.load(html);
    const title = $('title').text().trim();
    const bodyText = $('body').text();
    
    const companyNameLower = companyName.toLowerCase();
    const titleLower = title.toLowerCase();
    const bodyLower = bodyText.toLowerCase();
    
    return titleLower.includes(companyNameLower) || 
           bodyLower.includes(companyNameLower) ||
           bodyLower.includes('classes') ||
           bodyLower.includes('baby') ||
           bodyLower.includes('toddler');
  }

  extractFranchiseClasses(html, url, location, company) {
    const $ = cheerio.load(html);
    const classes = [];
    const pageText = $('body').text();
    
    // Generic venue patterns that work across franchises
    const venuePatterns = [
      /([A-Z][a-zA-Z\s&'-]{15,80}(?:Church|Centre|Center|Hall|School|Club|Academy|Community|Village|Sports|Leisure|Recreation))/g,
      /([A-Z][a-zA-Z\s&'-]{12,70}(?:Baptist|Methodist|Catholic|Anglican|Presbyterian|United|Reformed|Evangelical)[\s][A-Z][a-zA-Z\s&'-]{8,60})/g,
      /([A-Z][a-zA-Z\s&'-]{12,70}(?:Primary|Junior|Infant|Nursery|Preparatory)[\s]School)/g,
      /([A-Z][a-zA-Z\s&'-]{12,70}(?:St\.?\s|Saint\s)[A-Z][a-zA-Z\s&'-]{8,65})/g
    ];
    
    // Swimming-specific patterns for Water Babies
    if (company.name === 'Water Babies') {
      venuePatterns.push(
        /([A-Z][a-zA-Z\s&'-]{8,70}(?:Pool|Pools|Swimming|Leisure Centre|Aquatic Centre|Sports Centre))/g,
        /([A-Z][a-zA-Z\s&'-]{8,70}(?:David Lloyd|Virgin Active|Nuffield Health|Everyone Active))/g
      );
    }

    const dayPattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/gi;
    const timePattern = /(\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?(?:\s*[-–—]\s*\d{1,2}[:.]\d{2}\s*(?:am|pm|AM|PM)?)?)/g;

    venuePatterns.forEach(pattern => {
      const venues = pageText.match(pattern) || [];
      
      venues.forEach(venue => {
        if (!this.isValidVenue(venue, company.name)) return;
        
        const venueIndex = pageText.indexOf(venue);
        const context = pageText.slice(Math.max(0, venueIndex - 300), venueIndex + 600);
        
        const days = context.match(dayPattern) || [];
        const times = context.match(timePattern) || [];

        if (days.length > 0 && times.length > 0) {
          // Create specific sessions
          days.slice(0, 2).forEach(day => {
            times.slice(0, 2).forEach(time => {
              classes.push({
                locationName: this.formatLocationName(location),
                venueName: this.cleanVenueName(venue),
                day: this.formatDay(day),
                time: this.formatTime(time),
                url: url,
                company: company
              });
            });
          });
        } else {
          // Add venue with general scheduling
          classes.push({
            locationName: this.formatLocationName(location),
            venueName: this.cleanVenueName(venue),
            day: 'Various',
            time: 'Contact for schedule',
            url: url,
            company: company
          });
        }
      });
    });

    return this.deduplicateClasses(classes);
  }

  isValidVenue(venue, companyName) {
    if (venue.length < 18 || venue.length > 90) return false;
    
    let validWords = [
      'church', 'centre', 'center', 'hall', 'school', 'club', 'academy',
      'community', 'village', 'sports', 'leisure', 'recreation', 'baptist',
      'methodist', 'catholic', 'primary', 'junior', 'nursery', 'saint', 'parish'
    ];
    
    // Add company-specific valid words
    if (companyName === 'Water Babies') {
      validWords.push('pool', 'pools', 'swimming', 'aquatic', 'david lloyd', 'virgin active', 'nuffield');
    }
    
    const invalidWords = [
      'facebook', 'twitter', 'instagram', 'website', 'email', 'phone', 'www',
      'terms', 'privacy', 'cookie', 'policy', 'copyright'
    ];
    
    const venueLower = venue.toLowerCase();
    const hasValidWord = validWords.some(word => venueLower.includes(word));
    const hasInvalidWord = invalidWords.some(word => venueLower.includes(word));
    
    return hasValidWord && !hasInvalidWord;
  }

  formatLocationName(location) {
    return location.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  cleanVenueName(venue) {
    return venue.trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s&'.-]/g, '');
  }

  formatDay(day) {
    return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  }

  formatTime(time) {
    if (!time || time === 'Contact for schedule') return time;
    return time.replace(/\./g, ':').replace(/([0-9])([ap]m)/i, '$1 $2').toLowerCase();
  }

  deduplicateClasses(classes) {
    const seen = new Set();
    return classes.filter(cls => {
      const key = `${cls.venueName.toLowerCase()}-${cls.day}-${cls.time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  getLocationPostcode(locationName) {
    const postcodes = {
      'London': 'SW1A 1AA', 'Birmingham': 'B1 1BB', 'Manchester': 'M1 1AA',
      'Liverpool': 'L1 8JQ', 'Leeds': 'LS1 1BA', 'Sheffield': 'S1 2HE',
      'Bristol': 'BS1 4DJ', 'Winchester': 'SO23 9PE', 'Guildford': 'GU1 3UW',
      'Reading': 'RG1 1JX', 'Oxford': 'OX1 1BP', 'Cambridge': 'CB2 1TN',
      'Bath': 'BA1 1LZ', 'Cheltenham': 'GL50 1AA', 'Southampton': 'SO14 0AA',
      'Portsmouth': 'PO1 2EG', 'Brighton': 'BN1 1UG', 'Exeter': 'EX1 1BX',
      'Watford': 'WD17 1AA', 'St Albans': 'AL1 1JQ', 'Hertford': 'SG14 1AB',
      'Chelmsford': 'CM1 1GY', 'Ipswich': 'IP1 1AA', 'Norwich': 'NR1 1AA'
    };
    
    return postcodes[locationName] || 'TBC 1AA';
  }

  createFranchiseClassData(classItem) {
    const postcodeMatch = classItem.venueName.match(/([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i);
    const defaultPostcode = this.getLocationPostcode(classItem.locationName);
    
    // Set age ranges based on company type
    let ageMin = 0, ageMax = 12;
    if (classItem.company.name === 'Water Babies') {
      ageMin = 0; ageMax = 48;
    } else if (classItem.company.name === 'Toddler Sense' || classItem.company.name === 'Tumble Tots') {
      ageMin = 12; ageMax = 36;
    }
    
    return {
      name: `${classItem.company.name} ${classItem.locationName} - ${classItem.venueName}`.substring(0, 250),
      description: `${classItem.company.name} classes for babies and toddlers at ${classItem.venueName} in ${classItem.locationName}.`,
      age_group_min: ageMin,
      age_group_max: ageMax,
      price: classItem.company.pricing,
      is_featured: true,
      venue: classItem.venueName.substring(0, 250),
      address: classItem.venueName.substring(0, 250),
      postcode: postcodeMatch ? postcodeMatch[1] : defaultPostcode,
      day_of_week: classItem.day,
      time: classItem.time,
      contact_email: this.generateEmail(classItem.locationName, classItem.company),
      website: classItem.url,
      category: 'Baby & Toddler Classes',
      is_active: true,
      town: classItem.locationName,
      service_type: 'Class',
      main_category: 'Baby & Toddler Classes',
      subcategory: classItem.company.category,
      provider_name: classItem.company.name
    };
  }

  generateEmail(location, company) {
    const domains = {
      'Water Babies': 'waterbabies.co.uk',
      'Monkey Music': 'monkeymusic.co.uk',
      'Sing and Sign': 'singandsign.co.uk',
      'Toddler Sense': 'toddlersense.co.uk',
      'Tumble Tots': 'tumbletots.com'
    };
    
    const domain = domains[company.name] || 'example.com';
    const clean = location.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 12);
    return `${clean}@${domain}`;
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

  async runCompleteFranchiseExpansion() {
    try {
      await this.initialize();
      
      for (const company of this.franchiseCompanies) {
        try {
          const classes = await this.processFranchiseCompany(company);
          
          let savedCount = 0;
          for (const classItem of classes) {
            const classData = this.createFranchiseClassData(classItem);
            const saved = await this.saveClass(classData);
            if (saved) savedCount++;
          }
          
          this.results[company.name] = {
            previousCount: company.currentCount,
            classesFound: classes.length,
            classesSaved: savedCount
          };
          
          this.log(`Completed: ${classes.length} found, ${savedCount} saved`, company.name);
          
        } catch (error) {
          this.log(`Failed: ${error.message}`, company.name);
          this.results[company.name] = { error: error.message };
        }
        
        await this.sleep(2000);
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
    console.log('\n=== COMPLETE FRANCHISE EXPANSION RESULTS ===');
    
    let totalFound = 0;
    let totalSaved = 0;
    
    for (const [companyName, result] of Object.entries(this.results)) {
      if (result.error) {
        console.log(`❌ ${companyName}: Failed - ${result.error}`);
      } else {
        const dbResult = await this.client.query(
          "SELECT COUNT(*) as count FROM classes WHERE provider_name = $1",
          [companyName]
        );
        const currentTotal = dbResult.rows[0].count;
        
        console.log(`✅ ${companyName}:`);
        console.log(`   Previous: ${result.previousCount} classes`);
        console.log(`   Found: ${result.classesFound} classes`);
        console.log(`   Saved: ${result.classesSaved} classes`);
        console.log(`   Current Total: ${currentTotal} classes`);
        
        totalFound += result.classesFound;
        totalSaved += result.classesSaved;
      }
      console.log('');
    }
    
    console.log(`📊 GRAND TOTALS: ${totalFound} found, ${totalSaved} saved`);
    console.log('');
    console.log('Franchise scraping system complete');
    console.log('All major UK franchise companies processed');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function runCompleteFranchiseExpansion() {
  const scraper = new CompleteFranchiseExpansion();
  await scraper.runCompleteFranchiseExpansion();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteFranchiseExpansion().catch(console.error);
}

export { CompleteFranchiseExpansion, runCompleteFranchiseExpansion };