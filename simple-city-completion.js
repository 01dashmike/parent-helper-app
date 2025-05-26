import { Client } from 'pg';

async function simpleCityCompletion() {
  console.log('🎯 SIMPLE CITY COMPLETION');
  console.log('🚀 Direct approach for remaining cities\n');

  // Process one city at a time, very simply
  const cities = ['Middlesbrough', 'Basingstoke', 'Bracknell', 'Crawley', 'Dundee'];
  
  for (const cityName of cities) {
    console.log(`\n🏙️ ${cityName.toUpperCase()}`);
    await processCitySimple(cityName);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✅ Batch complete');
}

async function processCitySimple(cityName) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    
    // Get current count
    const result = await client.query('SELECT COUNT(*) as count FROM classes WHERE town = $1', [cityName]);
    const current = parseInt(result.rows[0].count);
    console.log(`   Current: ${current}`);
    
    // Search for businesses
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=baby classes ${cityName}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      let added = 0;
      
      for (let i = 0; i < Math.min(3, data.results.length) && added < 3; i++) {
        const business = data.results[i];
        const address = business.formatted_address || '';
        
        if (address.toLowerCase().includes(cityName.toLowerCase())) {
          // Check if exists
          const exists = await client.query(
            'SELECT 1 FROM classes WHERE name ILIKE $1 AND town = $2 LIMIT 1',
            [`%${business.name}%`, cityName]
          );
          
          if (exists.rows.length === 0) {
            // Add business
            await client.query(`
              INSERT INTO classes (
                name, description, age_group_min, age_group_max, price, is_featured, 
                venue, address, postcode, town, day_of_week, time, category, is_active
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
            `, [
              business.name,
              `Professional activities for babies and toddlers in ${cityName}.`,
              0, 60, 'Contact for pricing', false,
              business.name, address, '', cityName, 'Monday', '10:00 AM', 'general'
            ]);
            
            added++;
            console.log(`   ✅ ${business.name}`);
          }
        }
      }
      console.log(`   Added: ${added} businesses`);
    } else {
      console.log(`   No results found`);
    }
    
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  } finally {
    await client.end();
  }
}

simpleCityCompletion().catch(console.error);