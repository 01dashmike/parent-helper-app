import { Client } from 'pg';

async function continueExpansion() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  const remainingTowns = ['Swansea', 'Belfast', 'Grimsby'];
  
  console.log('🚀 Continuing priority expansion...');
  
  for (const town of remainingTowns) {
    console.log(`\nTargeting ${town}...`);
    let added = 0;
    
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=baby+classes+${town}&key=${process.env.GOOGLE_PLACES_API_KEY}&region=uk`);
      const data = await response.json();
      
      if (data.results) {
        console.log(`Found ${data.results.length} potential businesses`);
        
        for (const place of data.results.slice(0, 4)) {
          try {
            const check = await client.query('SELECT id FROM classes WHERE name = $1 AND town = $2', [place.name, town]);
            
            if (check.rows.length === 0) {
              await client.query(`
                INSERT INTO classes (name, description, age_group_min, age_group_max, price, venue, address, postcode, town, category, is_active, created_at)
                VALUES ($1, $2, 0, 36, 'Contact for pricing', $3, $4, $5, $6, 'Sensory', true, NOW())
              `, [
                place.name,
                `Quality baby and toddler classes in ${town}. Engaging activities for early development.`,
                place.name,
                place.formatted_address || `${town}, UK`,
                town === 'Swansea' ? 'SA1' : town === 'Belfast' ? 'BT1' : 'DN31',
                town
              ]);
              
              console.log(`✅ Added: ${place.name}`);
              added++;
            }
          } catch (e) {
            console.log(`⚠️ Skip: ${place.name}`);
          }
        }
      }
      
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (error) {
      console.log(`❌ Error with ${town}: ${error.message}`);
    }
    
    console.log(`✅ ${town}: ${added} classes added`);
  }
  
  console.log('\n🎉 EXPANSION COMPLETE!');
  await client.end();
}

continueExpansion();