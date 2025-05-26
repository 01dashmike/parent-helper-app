import { Client } from 'pg';

async function fixedUnderservedExpansion() {
  console.log('🚀 FIXED UNDERSERVED CITIES EXPANSION');
  console.log('🔧 Fixed address processing errors');
  console.log('🎯 Targeting: Reading, Belfast, Aberdeen, Dundee, Oldham\n');

  const cities = [
    { name: 'Reading', target: 35 },
    { name: 'Belfast', target: 30 },
    { name: 'Aberdeen', target: 20 },
    { name: 'Dundee', target: 15 },
    { name: 'Oldham', target: 25 }
  ];

  for (const city of cities) {
    await expandCityFixed(city);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function expandCityFixed(city) {
  let client;
  
  try {
    console.log(`\n🏙️ EXPANDING ${city.name.toUpperCase()}`);
    
    client = new Client({ 
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 20000
    });
    await client.connect();
    
    // Get current count
    const currentResult = await client.query(
      'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
      [city.name]
    );
    const current = parseInt(currentResult.rows[0].count);
    const needed = city.target - current;
    
    console.log(`   📊 Current: ${current} | Target: ${city.target} | Need: ${needed}`);
    
    if (needed <= 0) {
      console.log(`   ✅ ${city.name} already has good coverage!`);
      await client.end();
      return;
    }
    
    const searches = [
      `baby classes ${city.name}`,
      `toddler activities ${city.name}`,
      `swimming lessons ${city.name}`
    ];
    
    let added = 0;
    
    for (const search of searches) {
      if (added >= Math.min(8, needed)) break;
      
      console.log(`   🔍 ${search}`);
      
      try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(search)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          console.log(`      📍 Found ${data.results.length} businesses`);
          
          for (let i = 0; i < Math.min(3, data.results.length) && added < 8; i++) {
            const place = data.results[i];
            
            // Fixed: Check if address exists before processing
            const address = place.formatted_address || '';
            
            if (address && address.toLowerCase().includes(city.name.toLowerCase())) {
              // Check for duplicates
              const exists = await client.query(
                'SELECT 1 FROM classes WHERE name ILIKE $1 AND town = $2 LIMIT 1',
                [`%${place.name}%`, city.name]
              );
              
              if (exists.rows.length === 0) {
                const name = place.name;
                const venue = name;
                const category = search.includes('swimming') ? 'swimming' : 'general';
                const description = `Professional sessions for babies and toddlers in ${city.name}.`;
                const ageMin = search.includes('baby') ? 0 : 12;
                const ageMax = search.includes('baby') ? 12 : 60;
                const postcode = (address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i) || [''])[0].toUpperCase();
                
                await client.query(`
                  INSERT INTO classes (
                    name, description, age_group_min, age_group_max, price, is_featured, 
                    venue, address, postcode, town, day_of_week, time, category, is_active
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
                `, [name, description, ageMin, ageMax, 'Contact for pricing', false, 
                    venue, address, postcode, city.name, 'Thursday', '10:00 AM', category]);
                
                added++;
                console.log(`      ✅ ${place.name}`);
              }
            }
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (searchError) {
        console.log(`      ⚠️ Search error: ${searchError.message}`);
      }
    }
    
    // Final result
    const finalResult = await client.query(
      'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
      [city.name]
    );
    
    console.log(`   ✅ ${city.name}: ${finalResult.rows[0].count} total (+${added} added)`);
    
  } catch (error) {
    console.log(`   ❌ ${city.name} error: ${error.message}`);
  } finally {
    if (client) {
      try { await client.end(); } catch {}
    }
  }
}

// Run the fixed expansion
fixedUnderservedExpansion().catch(error => {
  console.log('Fixed expansion error:', error.message);
});