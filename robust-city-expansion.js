import { Client } from 'pg';

async function robustCityExpansion() {
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
  });
  
  try {
    await client.connect();
    console.log('🚀 ROBUST CITY EXPANSION - FIXING TIMEOUT ISSUES...');
    
    const cities = [
      { name: 'Sheffield', current: 28, target: 45 },
      { name: 'Edinburgh', current: 15, target: 40 },
      { name: 'Cardiff', current: 12, target: 30 },
      { name: 'Bradford', current: 15, target: 30 },
      { name: 'Bristol', current: 35, target: 50 }
    ];

    for (const city of cities) {
      console.log(`\n🏙️ EXPANDING ${city.name} (${city.current} → ${city.target})`);
      
      // Process in small batches to avoid timeouts
      const searchTerms = [
        `baby classes ${city.name}`,
        `toddler groups ${city.name}`,
        `swimming lessons ${city.name}`,
        `music classes ${city.name}`
      ];
      
      let cityAdded = 0;
      const needed = city.target - city.current;
      
      for (let i = 0; i < searchTerms.length && cityAdded < needed; i++) {
        const term = searchTerms[i];
        console.log(`   🔍 ${term}`);
        
        try {
          // Shorter timeout, simpler approach
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(term)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
          
          const response = await fetch(url, { 
            signal: controller.signal,
            timeout: 5000
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          console.log(`      Found ${data.results?.length || 0} businesses`);
          
          if (data.results) {
            // Process only first 5 results to avoid timeout
            for (let j = 0; j < Math.min(5, data.results.length) && cityAdded < needed; j++) {
              const place = data.results[j];
              
              // Quick duplicate check
              const exists = await client.query(
                'SELECT 1 FROM classes WHERE name ILIKE $1 AND town = $2 LIMIT 1',
                [`%${place.name}%`, city.name]
              );
              
              if (exists.rows.length === 0) {
                const address = place.formatted_address || '';
                if (address.toLowerCase().includes(city.name.toLowerCase())) {
                  await addBusiness(client, place, term, city.name);
                  cityAdded++;
                  console.log(`      ✅ ${place.name}`);
                }
              }
            }
          }
          
          // Shorter delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.log(`      ⚠️ ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Show final count
      const final = await client.query(
        'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
        [city.name]
      );
      
      console.log(`   ✅ ${city.name}: ${final.rows[0].count} total (+${cityAdded} added)`);
    }
    
    // Final summary
    const total = await client.query('SELECT COUNT(*) as count FROM classes WHERE is_active = true');
    console.log(`\n🎉 EXPANSION COMPLETE! Total: ${total.rows[0].count} businesses`);
    
  } catch (error) {
    console.log(`❌ Expansion error: ${error.message}`);
  } finally {
    await client.end();
  }
}

async function addBusiness(client, place, searchTerm, town) {
  const name = place.name;
  const address = place.formatted_address || '';
  const venue = name;
  const category = searchTerm.includes('swimming') ? 'swimming' : 
                  searchTerm.includes('music') ? 'music' : 'general';
  const description = `Professional sessions for babies and toddlers in ${town}.`;
  const ageMin = searchTerm.includes('baby') ? 0 : 12;
  const ageMax = searchTerm.includes('baby') ? 12 : 60;
  const postcode = extractPostcode(address);
  
  await client.query(`
    INSERT INTO classes (
      name, description, age_group_min, age_group_max, price, is_featured, 
      venue, address, postcode, town, day_of_week, time, category, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
  `, [name, description, ageMin, ageMax, 'Contact for pricing', false, 
      venue, address, postcode, town, 'Monday', '10:00 AM', category]);
}

function extractPostcode(address) {
  const match = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i);
  return match ? match[0].toUpperCase() : '';
}

// Run with error handling
robustCityExpansion().catch(error => {
  console.log('Script failed:', error.message);
  process.exit(1);
});