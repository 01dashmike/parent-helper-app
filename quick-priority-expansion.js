import { Client } from 'pg';

async function quickPriorityExpansion() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  const remainingTowns = ['Glasgow', 'Cardiff', 'Swansea', 'Belfast', 'Grimsby'];
  const searchTerms = ['baby sensory classes', 'toddler groups', 'baby massage'];
  
  console.log('🎯 Quick Priority Towns Expansion...');
  
  for (const town of remainingTowns) {
    console.log(`\nExpanding ${town}...`);
    let addedCount = 0;
    
    for (const searchTerm of searchTerms) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
        const params = new URLSearchParams({
          query: `${searchTerm} ${town}`,
          key: process.env.GOOGLE_PLACES_API_KEY,
          type: 'establishment',
          region: 'uk'
        });
        
        const response = await fetch(`${url}?${params}`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          console.log(`  Found ${data.results.length} results for "${searchTerm}"`);
          
          for (const place of data.results.slice(0, 2)) {
            try {
              const existingCheck = await client.query(
                'SELECT id FROM classes WHERE name = $1 AND town = $2',
                [place.name, town]
              );
              
              if (existingCheck.rows.length === 0) {
                await client.query(`
                  INSERT INTO classes (
                    name, description, age_group_min, age_group_max, price, is_featured,
                    venue, address, postcode, town, day_of_week, time, 
                    category, is_active, created_at
                  ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
                  )
                `, [
                  place.name,
                  `Quality ${searchTerm} in ${town}. Supporting child development through engaging activities.`,
                  0, 24, 'Contact for pricing', false,
                  place.name, place.formatted_address || `${town}, UK`,
                  town === 'Glasgow' ? 'G1' : town === 'Cardiff' ? 'CF1' : town === 'Swansea' ? 'SA1' : town === 'Belfast' ? 'BT1' : 'DN31',
                  town, 'Various days', 'Various times',
                  searchTerm.includes('sensory') ? 'Sensory' : searchTerm.includes('massage') ? 'Movement' : 'Sensory',
                  true, new Date()
                ]);
                
                console.log(`    ✅ Added: ${place.name}`);
                addedCount++;
              }
            } catch (error) {
              console.log(`    ⚠️ Error adding ${place.name}`);
            }
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
      } catch (error) {
        console.log(`  ⚠️ Error with "${searchTerm}": ${error.message}`);
      }
    }
    
    console.log(`✅ ${town}: Added ${addedCount} classes`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  await client.end();
  console.log('\n🎉 Quick expansion completed!');
}

quickPriorityExpansion().catch(console.error);