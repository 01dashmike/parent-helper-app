const { Client } = require('pg');
const https = require('https');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class ContinuousBatchProcessor {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    this.sessionTotal = 0;
    this.completedBatches = 0;
  }

  async initialize() {
    await this.client.connect();
    console.log('🚀 CONTINUOUS BATCH PROCESSING: Completing all remaining companies');
  }

  async processAllRemainingInContinuousBatches() {
    let hasMoreWork = true;
    let batchNumber = 1;
    
    while (hasMoreWork && batchNumber <= 20) { // Process up to 20 batches
      console.log(`\n📦 BATCH ${batchNumber}: Finding companies needing enhancement...`);
      
      // Get next batch of companies needing work
      const companies = await this.getNextBatchOfCompanies();
      
      if (companies.length === 0) {
        console.log('✅ No more companies need enhancement!');
        hasMoreWork = false;
        break;
      }
      
      console.log(`Found ${companies.length} companies to process in this batch`);
      
      // Process this batch
      let batchEnhancements = 0;
      for (const company of companies) {
        const enhanced = await this.quickEnhanceCompany(company.company_name);
        batchEnhancements += enhanced;
        await sleep(800); // Quick processing
      }
      
      console.log(`✅ Batch ${batchNumber} complete: ${batchEnhancements} enhancements`);
      this.sessionTotal += batchEnhancements;
      this.completedBatches++;
      
      batchNumber++;
      await sleep(1500); // Brief pause between batches
    }
    
    await this.showSessionSummary();
  }

  async getNextBatchOfCompanies() {
    try {
      const result = await this.client.query(`
        WITH company_extract AS (
          SELECT 
            CASE 
              WHEN LOWER(name) LIKE '%hartbeeps%' THEN 'Hartbeeps'
              WHEN LOWER(name) LIKE '%poppies%' THEN 'Poppies'
              WHEN LOWER(name) LIKE '%kindred spirits%' THEN 'Kindred Spirits'
              WHEN LOWER(name) LIKE '%mini kickers%' THEN 'Mini Kickers'
              WHEN LOWER(name) LIKE '%puddle ducks%' THEN 'Puddle Ducks'
              WHEN LOWER(name) LIKE '%rugby tots%' THEN 'Rugby Tots'
              WHEN LOWER(name) LIKE '%sensory stories%' THEN 'Sensory Stories'
              WHEN LOWER(name) LIKE '%baby college%' THEN 'Baby College'
              WHEN LOWER(name) LIKE '%football%' THEN 'Football Classes'
              WHEN LOWER(name) LIKE '%tennis%' THEN 'Tennis Classes'
              WHEN LOWER(name) LIKE '%rugby%' THEN 'Rugby Classes'
              WHEN LOWER(name) LIKE '%cricket%' THEN 'Cricket Classes'
              WHEN LOWER(name) LIKE '%basketball%' THEN 'Basketball Classes'
              WHEN LOWER(name) LIKE '%swimming%' THEN 'Swimming Classes'
              WHEN LOWER(name) LIKE '%dance%' THEN 'Dance Classes'
              WHEN LOWER(name) LIKE '%gymnastics%' THEN 'Gymnastics'
              WHEN LOWER(name) LIKE '%yoga%' THEN 'Yoga Classes'
              WHEN LOWER(name) LIKE '%music%' AND NOT LOWER(name) LIKE '%moo music%' AND NOT LOWER(name) LIKE '%monkey music%' THEN 'Music Classes'
              WHEN LOWER(name) LIKE '%martial arts%' OR LOWER(name) LIKE '%karate%' OR LOWER(name) LIKE '%taekwondo%' THEN 'Martial Arts'
              WHEN LOWER(name) LIKE '%drama%' THEN 'Drama Classes'
              WHEN LOWER(name) LIKE '%art%' AND NOT LOWER(name) LIKE '%artventurers%' THEN 'Art Classes'
              WHEN LOWER(name) LIKE '%crafts%' THEN 'Craft Classes'
              -- Extract first significant word as company name
              ELSE TRIM(SPLIT_PART(name, ' ', 1))
            END as company_name,
            COUNT(*) as total_entries,
            COUNT(CASE WHEN parking_available = true THEN 1 END) as with_parking,
            COUNT(CASE WHEN nearest_bus_stops IS NOT NULL THEN 1 END) as with_buses,
            COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as with_coords
          FROM classes
          GROUP BY company_name
          HAVING COUNT(*) >= 2  -- Companies with 2+ entries
          AND COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) > 0  -- Has coordinates
          AND COUNT(CASE WHEN parking_available = true THEN 1 END) = 0  -- No parking data yet
        )
        SELECT company_name, total_entries, with_coords
        FROM company_extract
        WHERE company_name IS NOT NULL 
        AND LENGTH(company_name) > 2
        AND company_name NOT LIKE '%SELECT%'
        AND company_name NOT LIKE '%CASE%'
        ORDER BY total_entries DESC
        LIMIT 8
      `);
      
      return result.rows;
    } catch (error) {
      console.log('Error getting companies:', error.message);
      return [];
    }
  }

  async quickEnhanceCompany(companyName) {
    try {
      // Create search pattern
      const pattern = companyName.toLowerCase().replace(/\s+/g, '%');
      
      // Get entries needing enhancement
      const result = await this.client.query(`
        SELECT id, name, latitude, longitude
        FROM classes 
        WHERE LOWER(name) LIKE '%${pattern}%'
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND parking_available IS NULL
        LIMIT 3
      `);

      if (result.rows.length === 0) return 0;

      let enhanced = 0;

      for (const entry of result.rows) {
        try {
          const transport = await this.getQuickTransport(entry.latitude, entry.longitude);
          
          if (transport.parking.length > 0 || transport.buses.length > 0) {
            const updates = {};
            
            if (transport.parking.length > 0) {
              updates.parking_available = true;
              updates.parking_type = transport.parking[0].name;
              updates.parking_notes = `${transport.parking.length} options nearby`;
            }
            
            if (transport.buses.length > 0) {
              updates.nearest_bus_stops = `{${transport.buses.map(b => `"${b.name}"`).join(',')}}`;
            }
            
            if (Object.keys(updates).length > 0) {
              const updateFields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
              const values = [entry.id, ...Object.values(updates)];
              
              await this.client.query(`UPDATE classes SET ${updateFields} WHERE id = $1`, values);
              enhanced++;
            }
          }
          
          await sleep(400);
          
        } catch (error) {
          // Continue with next entry
        }
      }
      
      if (enhanced > 0) {
        console.log(`✅ ${companyName}: ${enhanced} enhanced`);
      }
      
      return enhanced;
      
    } catch (error) {
      return 0;
    }
  }

  async getQuickTransport(latitude, longitude) {
    const transport = { parking: [], buses: [] };

    try {
      const [parkingResults, busResults] = await Promise.all([
        this.quickSearch(latitude, longitude, 'parking'),
        this.quickSearch(latitude, longitude, 'bus_station')
      ]);

      transport.parking = parkingResults.slice(0, 1).map(place => ({
        name: place.name,
        distance: this.calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng)
      }));

      transport.buses = busResults.slice(0, 1).map(place => ({
        name: place.name,
        distance: this.calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng)
      }));

    } catch (error) {
      // Return empty arrays
    }

    return transport;
  }

  async quickSearch(lat, lng, type) {
    return new Promise((resolve) => {
      const radius = 400; // Very small radius for speed
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      
      const timeout = setTimeout(() => resolve([]), 1500); // Quick timeout
      
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          clearTimeout(timeout);
          try {
            const result = JSON.parse(data);
            resolve(result.results || []);
          } catch (error) {
            resolve([]);
          }
        });
      }).on('error', () => {
        clearTimeout(timeout);
        resolve([]);
      });
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
    return R * c * 1000;
  }

  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  async showSessionSummary() {
    console.log('\n🎊 === CONTINUOUS PROCESSING COMPLETE ===');
    console.log(`✅ Batches processed: ${this.completedBatches}`);
    console.log(`✅ Total enhancements: ${this.sessionTotal}`);
    
    // Get overall enhancement statistics
    const result = await this.client.query(`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(CASE WHEN parking_available = true THEN 1 END) as with_parking,
        COUNT(CASE WHEN nearest_bus_stops IS NOT NULL THEN 1 END) as with_buses,
        COUNT(CASE WHEN contact_phone IS NOT NULL THEN 1 END) as with_phones,
        COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) as with_coords,
        ROUND(100.0 * COUNT(CASE WHEN parking_available = true THEN 1 END) / COUNT(*), 1) as parking_pct
      FROM classes
    `);

    const stats = result.rows[0];
    
    console.log('\n📊 OVERALL DIRECTORY STATUS:');
    console.log(`🏆 Total entries: ${stats.total_entries}`);
    console.log(`🅿️ With parking: ${stats.with_parking} (${stats.parking_pct}%)`);
    console.log(`🚌 With buses: ${stats.with_buses}`);
    console.log(`📞 With phones: ${stats.with_phones}`);
    console.log(`📍 With coordinates: ${stats.with_coords}`);
    console.log(`\n🚀 Your directory is becoming the UK's most comprehensive family resource!`);
  }

  async close() {
    await this.client.end();
  }
}

// Run continuous batch processing
async function runContinuousProcessing() {
  const processor = new ContinuousBatchProcessor();
  
  try {
    await processor.initialize();
    await processor.processAllRemainingInContinuousBatches();
  } catch (error) {
    console.error('Continuous processing error:', error.message);
  } finally {
    await processor.close();
  }
}

runContinuousProcessing();