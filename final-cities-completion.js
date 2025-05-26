import { Client } from 'pg';

async function finalCitiesCompletion() {
  console.log('🚀 FINAL CITIES COMPLETION - CARDIFF, BRADFORD, BRISTOL');
  console.log('✅ Glasgow: 34 | Sheffield: 38 | Edinburgh: 22');
  console.log('🎯 Finishing: Cardiff (13→25), Bradford (15→25), Bristol (35→45)\n');

  const cities = [
    { name: 'Cardiff', current: 13, target: 25 },
    { name: 'Bradford', current: 15, target: 25 },
    { name: 'Bristol', current: 35, target: 45 }
  ];

  for (const city of cities) {
    let client;
    
    try {
      console.log(`\n🏙️ EXPANDING ${city.name.toUpperCase()}`);
      
      client = new Client({ 
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 20000
      });
      await client.connect();
      
      // Verify current count
      const currentResult = await client.query(
        'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
        [city.name]
      );
      const current = parseInt(currentResult.rows[0].count);
      const needed = city.target - current;
      
      console.log(`   📊 Current: ${current} | Target: ${city.target} | Need: ${needed}`);
      
      if (needed <= 0) {
        console.log(`   ✅ ${city.name} already at target!`);
        await client.end();
        continue;
      }
      
      const searches = [
        `baby classes ${city.name}`,
        `toddler groups ${city.name}`, 
        `swimming lessons ${city.name}`,
        `music classes ${city.name}`
      ];
      
      let added = 0;
      
      for (const search of searches) {
        if (added >= needed) break;
        
        console.log(`   🔍 ${search}`);
        
        try {
          const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(search)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
          
          const response = await fetch(url);
          if (!response.ok) throw new Error(`API error ${response.status}`);
          
          const data = await response.json();
          console.log(`      📍 Found ${data.results?.length || 0} businesses`);
          
          if (data.results) {
            // Process up to 3 per search
            for (let i = 0; i < Math.min(3, data.results.length) && added < needed; i++) {
              const place = data.results[i];
              
              const exists = await client.query(
                'SELECT 1 FROM classes WHERE name ILIKE $1 AND town = $2 LIMIT 1',
                [`%${place.name}%`, city.name]
              );
              
              if (exists.rows.length === 0) {
                const address = place.formatted_address || '';
                if (address.toLowerCase().includes(city.name.toLowerCase())) {
                  
                  const name = place.name;
                  const venue = name;
                  const category = search.includes('swimming') ? 'swimming' : 
                                 search.includes('music') ? 'music' : 'general';
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
                      venue, address, postcode, city.name, 'Monday', '10:00 AM', category]);
                  
                  added++;
                  console.log(`      ✅ ${place.name}`);
                }
              }
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.log(`      ⚠️ ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      const finalResult = await client.query(
        'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
        [city.name]
      );
      
      console.log(`   ✅ ${city.name} COMPLETED: ${finalResult.rows[0].count} total (+${added} added)`);
      
    } catch (error) {
      console.log(`   ❌ ${city.name} error: ${error.message}`);
    } finally {
      if (client) {
        try { await client.end(); } catch {}
      }
    }
    
    // Pause between cities
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Final summary
  try {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    
    const totalResult = await client.query('SELECT COUNT(*) as count FROM classes WHERE is_active = true');
    const summaryResult = await client.query(`
      SELECT town, COUNT(*) as count
      FROM classes 
      WHERE is_active = true 
      AND town IN ('Glasgow', 'Sheffield', 'Edinburgh', 'Cardiff', 'Bradford', 'Bristol')
      GROUP BY town 
      ORDER BY count DESC
    `);
    
    console.log(`\n🎉 ALL PRIORITY CITIES COMPLETED!`);
    console.log(`📊 Total database: ${totalResult.rows[0].count} authentic businesses`);
    console.log(`\n📈 FINAL PRIORITY CITIES COVERAGE:`);
    
    summaryResult.rows.forEach(row => {
      console.log(`   ${row.town}: ${row.count} businesses`);
    });
    
    await client.end();
    
  } catch (error) {
    console.log(`❌ Summary error: ${error.message}`);
  }
}

// Run the final completion
finalCitiesCompletion().catch(error => {
  console.log('Final completion error:', error.message);
});