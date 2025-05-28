const { Client } = require('pg');
const https = require('https');
const puppeteer = require('puppeteer');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class CompanySpecificScraper {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    this.browser = null;
  }

  async initialize() {
    await this.client.connect();
    this.browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('🚀 Company-Specific Scraper initialized');
  }

  // Baby Sensory specific scraping
  async scrapeBabySensoryData(entry) {
    console.log(`\n🍼 Scraping Baby Sensory: ${entry.name} in ${entry.town}`);
    
    const page = await this.browser.newPage();
    
    try {
      // Extract franchise area from name
      const franchiseArea = this.extractBabySensoryArea(entry.name);
      const searchUrl = `https://www.babysensory.com/${franchiseArea.toLowerCase().replace(/\s+/g, '-')}`;
      
      console.log(`   Checking website: ${searchUrl}`);
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 10000 });
      
      // Extract class schedules
      const classData = await page.evaluate(() => {
        const data = {
          schedule: [],
          contact: {},
          venues: []
        };
        
        // Look for class timetables
        const scheduleElements = document.querySelectorAll('.timetable, .class-schedule, .session-times');
        scheduleElements.forEach(el => {
          const text = el.textContent;
          if (text.includes('Monday') || text.includes('Tuesday') || text.includes('Wednesday')) {
            data.schedule.push(text.trim());
          }
        });
        
        // Extract contact information
        const phoneElement = document.querySelector('[href^="tel:"]');
        if (phoneElement) data.contact.phone = phoneElement.textContent.trim();
        
        const emailElement = document.querySelector('[href^="mailto:"]');
        if (emailElement) data.contact.email = emailElement.href.replace('mailto:', '');
        
        // Look for venue information
        const venueElements = document.querySelectorAll('.venue, .location, .address');
        venueElements.forEach(el => {
          const venueText = el.textContent.trim();
          if (venueText.length > 10) {
            data.venues.push(venueText);
          }
        });
        
        return data;
      });
      
      await page.close();
      return this.processBabySensoryData(classData, entry);
      
    } catch (error) {
      console.log(`   ⚠️  Website scraping failed: ${error.message}`);
      await page.close();
      return null;
    }
  }

  extractBabySensoryArea(name) {
    // Extract franchise area from class name
    const patterns = [
      /Baby Sensory\s+([^-]+)/i,
      /Baby Sensory\s+&\s+Toddler Sense\s+([^-]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = name.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return 'main';
  }

  processBabySensoryData(webData, entry) {
    const updates = {};
    
    // Extract day and time from web schedule
    if (webData.schedule.length > 0) {
      const scheduleText = webData.schedule.join(' ');
      
      // Extract day patterns
      const dayMatch = scheduleText.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i);
      if (dayMatch) updates.day = dayMatch[1];
      
      // Extract time patterns
      const timeMatch = scheduleText.match(/(\d{1,2}[:.]?\d{0,2}\s*(?:am|pm))/i);
      if (timeMatch) updates.time = timeMatch[1];
      
      // Extract age ranges
      const ageMatch = scheduleText.match(/(birth|newborn|\d+\s*weeks?|\d+\s*months?)/i);
      if (ageMatch) {
        if (ageMatch[1].toLowerCase().includes('birth') || ageMatch[1].toLowerCase().includes('newborn')) {
          updates.age_range = '0-6 months';
        } else if (ageMatch[1].includes('6') && ageMatch[1].includes('month')) {
          updates.age_range = '6-13 months';
        }
      }
    }
    
    // Add contact information
    if (webData.contact.phone) updates.contact_phone = webData.contact.phone;
    if (webData.contact.email) updates.contact_email = webData.contact.email;
    
    return updates;
  }

  // Toddler Sense specific scraping
  async scrapeToddlerSenseData(entry) {
    console.log(`\n🧸 Scraping Toddler Sense: ${entry.name} in ${entry.town}`);
    
    const page = await this.browser.newPage();
    
    try {
      // Try main Toddler Sense website
      await page.goto('https://www.toddlersense.co.uk/find-a-class', { waitUntil: 'networkidle2', timeout: 10000 });
      
      // Search for the specific location
      const locationData = await page.evaluate((town) => {
        const data = {
          classes: [],
          contact: {}
        };
        
        // Look for location-specific information
        const locationElements = document.querySelectorAll('.location-item, .class-location');
        locationElements.forEach(el => {
          if (el.textContent.toLowerCase().includes(town.toLowerCase())) {
            const scheduleInfo = el.querySelector('.schedule, .times');
            if (scheduleInfo) {
              data.classes.push(scheduleInfo.textContent.trim());
            }
            
            const contactInfo = el.querySelector('.contact, .phone, .email');
            if (contactInfo) {
              data.contact.info = contactInfo.textContent.trim();
            }
          }
        });
        
        return data;
      }, entry.town);
      
      await page.close();
      return this.processToddlerSenseData(locationData, entry);
      
    } catch (error) {
      console.log(`   ⚠️  Website scraping failed: ${error.message}`);
      await page.close();
      return null;
    }
  }

  processToddlerSenseData(webData, entry) {
    const updates = {};
    
    if (webData.classes.length > 0) {
      const classText = webData.classes.join(' ');
      
      // Extract typical Toddler Sense patterns
      const dayMatch = classText.match(/(Monday|Tuesday|Wednesday|Thursday|Friday)/i);
      if (dayMatch) updates.day = dayMatch[1];
      
      const timeMatch = classText.match(/(\d{1,2}[:.]?\d{0,2}\s*(?:am|pm))/i);
      if (timeMatch) updates.time = timeMatch[1];
      
      // Toddler Sense is typically for walking toddlers
      updates.age_range = '13 months - 4 years';
    }
    
    if (webData.contact.info) {
      const phoneMatch = webData.contact.info.match(/(\d{5}\s?\d{6}|\d{4}\s?\d{3}\s?\d{4})/);
      if (phoneMatch) updates.contact_phone = phoneMatch[1];
      
      const emailMatch = webData.contact.info.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) updates.contact_email = emailMatch[1];
    }
    
    return updates;
  }

  // Water Babies specific scraping
  async scrapeWaterBabiesData(entry) {
    console.log(`\n🏊 Scraping Water Babies: ${entry.name} in ${entry.town}`);
    
    const page = await this.browser.newPage();
    
    try {
      await page.goto('https://www.waterbabies.co.uk/find-a-class', { waitUntil: 'networkidle2', timeout: 10000 });
      
      // Search for location
      await page.type('input[name="location"], #location-search', entry.town);
      await page.click('button[type="submit"], .search-button');
      await page.waitForTimeout(3000);
      
      const poolData = await page.evaluate(() => {
        const data = {
          pools: [],
          schedule: []
        };
        
        // Extract pool information
        const poolElements = document.querySelectorAll('.pool-location, .venue-info');
        poolElements.forEach(el => {
          const poolName = el.querySelector('.pool-name, .venue-name');
          const address = el.querySelector('.address, .venue-address');
          
          if (poolName && address) {
            data.pools.push({
              name: poolName.textContent.trim(),
              address: address.textContent.trim()
            });
          }
        });
        
        // Extract class schedules
        const scheduleElements = document.querySelectorAll('.class-schedule, .timetable');
        scheduleElements.forEach(el => {
          data.schedule.push(el.textContent.trim());
        });
        
        return data;
      });
      
      await page.close();
      return this.processWaterBabiesData(poolData, entry);
      
    } catch (error) {
      console.log(`   ⚠️  Website scraping failed: ${error.message}`);
      await page.close();
      return null;
    }
  }

  processWaterBabiesData(webData, entry) {
    const updates = {};
    
    // Water Babies typically uses pools, so update venue info
    if (webData.pools.length > 0) {
      const pool = webData.pools[0];
      updates.venue = pool.name;
      if (pool.address && pool.address.length > entry.address?.length) {
        updates.address = pool.address;
      }
    }
    
    if (webData.schedule.length > 0) {
      const scheduleText = webData.schedule.join(' ');
      
      const dayMatch = scheduleText.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i);
      if (dayMatch) updates.day = dayMatch[1];
      
      const timeMatch = scheduleText.match(/(\d{1,2}[:.]?\d{0,2}\s*(?:am|pm))/i);
      if (timeMatch) updates.time = timeMatch[1];
    }
    
    // Water Babies age ranges
    updates.age_range = '0-4 years';
    updates.activity_type = 'SWIMMING';
    
    return updates;
  }

  // Enhanced transport data collection
  async enhanceTransportData(latitude, longitude) {
    if (!latitude || !longitude) return null;
    
    const transport = {
      parking: await this.findNearbyPlaces(latitude, longitude, 'parking'),
      buses: await this.findNearbyPlaces(latitude, longitude, 'bus_station'),
      trains: await this.findNearbyPlaces(latitude, longitude, 'train_station')
    };
    
    return transport;
  }

  async findNearbyPlaces(lat, lng, type) {
    return new Promise((resolve, reject) => {
      const radius = 1000;
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            const places = (result.results || []).slice(0, 3).map(place => ({
              name: place.name,
              distance: this.calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng)
            }));
            resolve(places);
          } catch (error) {
            resolve([]);
          }
        });
      }).on('error', () => resolve([]));
    });
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 1000);
  }

  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  // Main enhancement function
  async enhanceCompanyEntries(companyName, limit = 5) {
    console.log(`\n🔍 Enhancing ${companyName} entries...`);
    
    const pattern = companyName.toLowerCase().replace(/\s+/g, '%');
    const result = await this.client.query(`
      SELECT id, name, address, venue, town, postcode, latitude, longitude, day, time, age_range
      FROM classes 
      WHERE LOWER(name) LIKE '%${pattern}%'
      AND (day IS NULL OR time IS NULL OR contact_phone IS NULL)
      LIMIT ${limit}
    `);

    console.log(`Found ${result.rows.length} entries to enhance`);
    
    let enhanced = 0;
    
    for (const entry of result.rows) {
      let updates = {};
      
      // Company-specific scraping
      if (companyName.toLowerCase().includes('baby sensory')) {
        const webData = await this.scrapeBabySensoryData(entry);
        if (webData) updates = { ...updates, ...webData };
      } else if (companyName.toLowerCase().includes('toddler sense')) {
        const webData = await this.scrapeToddlerSenseData(entry);
        if (webData) updates = { ...updates, ...webData };
      } else if (companyName.toLowerCase().includes('water babies')) {
        const webData = await this.scrapeWaterBabiesData(entry);
        if (webData) updates = { ...updates, ...webData };
      }
      
      // Enhance transport data if coordinates available
      if (entry.latitude && entry.longitude) {
        const transport = await this.enhanceTransportData(entry.latitude, entry.longitude);
        if (transport) {
          if (transport.parking.length > 0) {
            updates.parking_available = true;
            updates.parking_notes = `${transport.parking.length} parking options nearby`;
          }
          if (transport.buses.length > 0) {
            updates.nearest_bus_stops = `{${transport.buses.map(b => `"${b.name}"`).join(',')}}`;
          }
        }
      }
      
      // Apply updates if any found
      if (Object.keys(updates).length > 0) {
        const updateFields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = [entry.id, ...Object.values(updates)];
        
        await this.client.query(`UPDATE classes SET ${updateFields} WHERE id = $1`, values);
        
        console.log(`✅ Enhanced: ${entry.name}`);
        console.log(`   Updates: ${Object.keys(updates).join(', ')}`);
        enhanced++;
      }
      
      await sleep(3000); // Respect rate limits
    }
    
    console.log(`🎉 Enhanced ${enhanced}/${result.rows.length} ${companyName} entries`);
    return enhanced;
  }

  async close() {
    if (this.browser) await this.browser.close();
    await this.client.end();
  }
}

// Run company-specific enhancements
async function runCompanyEnhancements() {
  const scraper = new CompanySpecificScraper();
  
  try {
    await scraper.initialize();
    
    // Process top companies in order
    const companies = [
      'Baby Sensory',
      'Toddler Sense', 
      'Water Babies',
      'Tumble Tots',
      'Tots Play',
      'Sing and Sign'
    ];
    
    for (const company of companies) {
      await scraper.enhanceCompanyEntries(company, 3);
      await sleep(5000); // Pause between companies
    }
    
  } catch (error) {
    console.error('Enhancement error:', error.message);
  } finally {
    await scraper.close();
  }
}

runCompanyEnhancements();