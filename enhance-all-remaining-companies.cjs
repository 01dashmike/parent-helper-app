const { Client } = require('pg');
const https = require('https');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class EnhanceAllRemainingCompanies {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    this.totalEnhanced = 0;
    this.processedCompanies = [];
    this.batchSize = 8; // Small batches for efficiency
  }

  async initialize() {
    await this.client.connect();
    console.log('🚀 ENHANCING ALL REMAINING COMPANIES IN SMALL BATCHES');
  }

  async getAllRemainingCompanies() {
    console.log('\n🔍 Identifying all companies needing enhancement...');
    
    // Get all unique companies with entries that need enhancement
    const result = await this.client.query(`
      WITH company_extract AS (
        SELECT 
          CASE 
            -- Extract company names from various patterns
            WHEN LOWER(name) LIKE '%baby sensory%' THEN 'Baby Sensory'
            WHEN LOWER(name) LIKE '%water babies%' THEN 'Water Babies'
            WHEN LOWER(name) LIKE '%tumble tots%' THEN 'Tumble Tots'
            WHEN LOWER(name) LIKE '%tots play%' THEN 'Tots Play'
            WHEN LOWER(name) LIKE '%sing and sign%' THEN 'Sing and Sign'
            WHEN LOWER(name) LIKE '%toddler sense%' THEN 'Toddler Sense'
            WHEN LOWER(name) LIKE '%moo music%' THEN 'Moo Music'
            WHEN LOWER(name) LIKE '%monkey music%' THEN 'Monkey Music'
            WHEN LOWER(name) LIKE '%adventure babies%' THEN 'Adventure Babies'
            WHEN LOWER(name) LIKE '%artventurers%' THEN 'ARTventurers'
            WHEN LOWER(name) LIKE '%diddi dance%' THEN 'Diddi Dance'
            WHEN LOWER(name) LIKE '%jo jingles%' THEN 'Jo Jingles'
            WHEN LOWER(name) LIKE '%splat messy%' THEN 'Splat Messy Play'
            WHEN LOWER(name) LIKE '%little kickers%' THEN 'Little Kickers'
            WHEN LOWER(name) LIKE '%boogie beat%' THEN 'Boogie Beat'
            WHEN LOWER(name) LIKE '%kindred spirits%' THEN 'Kindred Spirits'
            WHEN LOWER(name) LIKE '%poppies%' THEN 'Poppies'
            WHEN LOWER(name) LIKE '%hartbeeps%' THEN 'Hartbeeps'
            WHEN LOWER(name) LIKE '%mini kickers%' THEN 'Mini Kickers'
            WHEN LOWER(name) LIKE '%swimming%' THEN 'Swimming Classes'
            WHEN LOWER(name) LIKE '%gymnastics%' THEN 'Gymnastics'
            WHEN LOWER(name) LIKE '%dance%' THEN 'Dance Classes'
            WHEN LOWER(name) LIKE '%yoga%' THEN 'Yoga Classes'
            WHEN LOWER(name) LIKE '%music%' THEN 'Music Classes'
            WHEN LOWER(name) LIKE '%martial arts%' THEN 'Martial Arts'
            WHEN LOWER(name) LIKE '%football%' THEN 'Football Classes'
            WHEN LOWER(name) LIKE '%tennis%' THEN 'Tennis Classes'
            -- Extract first two words as company name for others
            ELSE TRIM(SPLIT_PART(SPLIT_PART(name, '-', 1), ' ', 1) || ' ' || SPLIT_PART(SPLIT_PART(name, '-', 1), ' ', 2))
          END as company_name,
          COUNT(*) as total_entries,
          COUNT(CASE WHEN parking_available = true THEN 1 END) as enhanced_parking,
          COUNT(CASE WHEN nearest_bus_stops IS NOT NULL THEN 1 END) as enhanced_buses,
          COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as with_coords
        FROM classes
        GROUP BY company_name
        HAVING COUNT(*) >= 3  -- Only companies with 3+ entries
        AND COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) > 0  -- Has coordinates
        AND (COUNT(CASE WHEN parking_available = true THEN 1 END) < COUNT(*) * 0.5  -- Less than 50% parking coverage
             OR COUNT(CASE WHEN nearest_bus_stops IS NOT NULL THEN 1 END) < COUNT(*) * 0.3)  -- Less than 30% bus coverage
      )
      SELECT company_name, total_entries, enhanced_parking, enhanced_buses, with_coords
      FROM company_extract
      WHERE company_name IS NOT NULL 
      AND LENGTH(company_name) > 3
      AND company_name NOT LIKE '%SELECT%'
      ORDER BY total_entries DESC
      LIMIT 50
    `);

    console.log(`Found ${result.rows.length} companies needing enhancement`);
    return result.rows;
  }

  async enhanceCompaniesByBatch(companies) {
    console.log('\n🎯 PROCESSING COMPANIES IN SMALL BATCHES\n');
    
    // Process companies in batches
    for (let i = 0; i < companies.length; i += this.batchSize) {
      const batch = companies.slice(i, i + this.batchSize);
      
      console.log(`📦 BATCH ${Math.floor(i / this.batchSize) + 1}: Processing ${batch.length} companies`);
      
      const batchPromises = batch.map(company => this.enhanceSpecificCompany(company.company_name, 5)); // Limit 5 per company
      const results = await Promise.all(batchPromises);
      
      const batchTotal = results.reduce((sum, result) => sum + result, 0);
      console.log(`✅ Batch complete: ${batchTotal} total enhancements\n`);
      
      await sleep(2000); // Pause between batches
    }
  }

  async enhanceSpecificCompany(companyName, limit = 5) {
    try {
      // Create flexible search pattern
      const searchTerms = companyName.toLowerCase().split(' ').filter(word => word.length > 2);
      const pattern = searchTerms.join('%');
      
      // Get entries needing enhancement
      const result = await this.client.query(`
        SELECT id, name, latitude, longitude, parking_available, nearest_bus_stops
        FROM classes 
        WHERE LOWER(name) LIKE '%${pattern}%'
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND (parking_available IS NULL OR parking_available = false OR nearest_bus_stops IS NULL)
        ORDER BY id
        LIMIT ${limit}
      `);

      if (result.rows.length === 0) {
        console.log(`✅ ${companyName}: Already enhanced`);
        return 0;
      }

      let enhanced = 0;

      for (const entry of result.rows) {
        try {
          const updates = await this.getEnhancementData(entry);
          
          if (Object.keys(updates).length > 0) {
            const updateFields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
            const values = [entry.id, ...Object.values(updates)];
            
            await this.client.query(`UPDATE classes SET ${updateFields} WHERE id = $1`, values);
            
            enhanced++;
            this.totalEnhanced++;
          }
          
          await sleep(600); // Quick processing
          
        } catch (error) {
          // Continue with next entry
        }
      }
      
      if (enhanced > 0) {
        console.log(`✅ ${companyName}: ${enhanced}/${result.rows.length} enhanced`);
        this.processedCompanies.push({ company: companyName, enhanced });
      }
      
      return enhanced;
      
    } catch (error) {
      console.log(`⚠️ ${companyName}: Processing error`);
      return 0;
    }
  }

  async getEnhancementData(entry) {
    const updates = {};

    try {
      // Get transport data if missing
      if (!entry.parking_available || !entry.nearest_bus_stops) {
        const transport = await this.getTransportData(entry.latitude, entry.longitude);
        
        if (transport.parking.length > 0 && !entry.parking_available) {
          updates.parking_available = true;
          updates.parking_type = transport.parking[0].name;
          updates.parking_notes = `${transport.parking.length} parking options within ${Math.round(transport.parking[0].distance)}m`;
        }
        
        if (transport.buses.length > 0 && !entry.nearest_bus_stops) {
          updates.nearest_bus_stops = `{${transport.buses.map(b => `"${b.name} (${Math.round(b.distance)}m)"`).join(',')}}`;
        }
      }

    } catch (error) {
      // Return empty updates on error
    }

    return updates;
  }

  async getTransportData(latitude, longitude) {
    const transport = { parking: [], buses: [] };

    try {
      // Quick parallel searches
      const [parkingResults, busResults] = await Promise.all([
        this.searchNearbyPlaces(latitude, longitude, 'parking'),
        this.searchNearbyPlaces(latitude, longitude, 'bus_station')
      ]);

      transport.parking = parkingResults.slice(0, 2).map(place => ({
        name: place.name,
        distance: this.calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng)
      }));

      transport.buses = busResults.slice(0, 2).map(place => ({
        name: place.name,
        distance: this.calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng)
      }));

    } catch (error) {
      // Return empty arrays
    }

    return transport;
  }

  async searchNearbyPlaces(lat, lng, type) {
    return new Promise((resolve) => {
      const radius = 500; // Smaller radius for speed
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      
      const timeout = setTimeout(() => resolve([]), 2000); // 2 second timeout
      
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

  async showProgress() {
    console.log('\n📊 === ENHANCEMENT PROGRESS SUMMARY ===');
    
    // Show companies processed in this session
    console.log('\n🎯 COMPANIES ENHANCED THIS SESSION:');
    this.processedCompanies.forEach(item => {
      console.log(`✅ ${item.company}: ${item.enhanced} enhancements`);
    });
    
    console.log(`\n🎊 SESSION TOTALS:`);
    console.log(`✅ Companies processed: ${this.processedCompanies.length}`);
    console.log(`✅ Total enhancements: ${this.totalEnhanced}`);
    console.log(`🚀 Your directory coverage continues to improve!`);
  }

  async close() {
    await this.client.end();
  }
}

// Run enhancement in small batches
async function runBatchEnhancement() {
  const enhancer = new EnhanceAllRemainingCompanies();
  
  try {
    await enhancer.initialize();
    
    // Get all companies needing enhancement
    const companies = await enhancer.getAllRemainingCompanies();
    
    if (companies.length === 0) {
      console.log('🎉 All companies are already enhanced!');
      return;
    }
    
    // Process in small batches
    await enhancer.enhanceCompaniesByBatch(companies);
    
    // Show progress
    await enhancer.showProgress();
    
  } catch (error) {
    console.error('Batch enhancement error:', error.message);
  } finally {
    await enhancer.close();
  }
}

runBatchEnhancement();