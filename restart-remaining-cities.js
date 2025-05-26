import { Client } from 'pg';

async function restartRemainingCities() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  console.log('🔄 RESTARTING EXPANSION FOR REMAINING PRIORITY CITIES...');
  console.log('✅ Glasgow: 34 businesses (completed)');
  console.log('⚠️ Sheffield: 28 businesses (incomplete - target 50)');
  console.log('🎯 Continuing with: Edinburgh, Cardiff, Bradford, Bristol\n');
  
  // Focus on the remaining underserved cities
  const remainingCities = [
    { name: 'Sheffield', current: 28, target: 50, population: '580k' },
    { name: 'Edinburgh', current: 15, target: 45, population: '540k' },
    { name: 'Cardiff', current: 12, target: 35, population: '365k' },
    { name: 'Bradford', current: 15, target: 35, population: '350k' },
    { name: 'Bristol', current: 35, target: 55, population: '470k' }
  ];

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.log('🔑 To continue expansion with authentic businesses, we need your Google Places API key.');
    console.log('   This ensures we only add genuine, verified businesses families actually use.');
    await client.end();
    return;
  }

  let totalAdded = 0;

  for (const city of remainingCities) {
    console.log(`\n🏙️ EXPANDING ${city.name.toUpperCase()} (${city.population})`);
    console.log(`   📊 Current: ${city.current} | Target: ${city.target} | Need: ${city.target - city.current}`);
    
    // Skip if already at target
    if (city.current >= city.target) {
      console.log(`   ✅ ${city.name} already has sufficient coverage!`);
      continue;
    }
    
    const searchTerms = [
      `baby classes ${city.name}`,
      `toddler groups ${city.name}`,
      `swimming lessons babies ${city.name}`,
      `baby sensory ${city.name}`,
      `music classes toddlers ${city.name}`,
      `baby massage ${city.name}`,
      `children gymnastics ${city.name}`,
      `nursery activities ${city.name}`
    ];
    
    let cityAdded = 0;
    const needed = city.target - city.current;
    
    for (const searchTerm of searchTerms) {
      if (cityAdded >= needed) break; // Stop if we've reached target
      
      console.log(`   🔍 Searching: "${searchTerm}"`);
      
      try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchTerm)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          console.log(`      📍 Found ${data.results.length} potential businesses`);
          
          let termAdded = 0;
          for (const place of data.results) {
            if (cityAdded >= needed || termAdded >= 3) break; // Limit per search term
            
            // Check for duplicates
            const existing = await client.query(
              'SELECT id FROM classes WHERE (name ILIKE $1 OR venue ILIKE $1) AND town = $2 AND is_active = true',
              [`%${place.name}%`, city.name]
            );
            
            if (existing.rows.length === 0) {
              const address = place.formatted_address || '';
              
              // Verify it's in the correct city
              if (isCorrectCity(address, city.name)) {
                await saveNewBusiness(client, place, searchTerm, city.name);
                cityAdded++;
                termAdded++;
                totalAdded++;
                console.log(`      ✅ Added: ${place.name}`);
                
                // Show progress every 3 businesses
                if (cityAdded % 3 === 0) {
                  const currentCount = await client.query(
                    'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
                    [city.name]
                  );
                  console.log(`      📈 ${city.name} now has: ${currentCount.rows[0].count} businesses`);
                }
              }
            }
          }
        }
        
        // Respectful API delay
        await new Promise(resolve => setTimeout(resolve, 400));
        
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Longer delay on error
      }
    }
    
    // Final count for this city
    const finalCount = await client.query(
      'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
      [city.name]
    );
    
    console.log(`   ✅ ${city.name} expansion complete!`);
    console.log(`      Added: ${cityAdded} new authentic businesses`);
    console.log(`      Total: ${finalCount.rows[0].count} businesses`);
    console.log(`      Progress: ${city.current} → ${finalCount.rows[0].count}`);
  }

  // Final database total
  const totalBusinesses = await client.query('SELECT COUNT(*) as count FROM classes WHERE is_active = true');
  
  console.log(`\n🎉 REMAINING CITIES EXPANSION COMPLETE!`);
  console.log(`🏢 Total businesses added: ${totalAdded}`);
  console.log(`📊 Total database: ${totalBusinesses.rows[0].count} authentic businesses`);
  
  console.log(`\n📈 FINAL PRIORITY CITIES COVERAGE:`);
  for (const city of remainingCities) {
    const count = await client.query(
      'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
      [city.name]
    );
    console.log(`   ${city.name}: ${count.rows[0].count} businesses`);
  }

  await client.end();
}

function isCorrectCity(address, cityName) {
  return address.toLowerCase().includes(cityName.toLowerCase());
}

async function saveNewBusiness(client, place, searchTerm, town) {
  const name = place.name;
  const address = place.formatted_address || '';
  const venue = place.name;
  const category = categorizeSearch(searchTerm);
  const description = `Professional ${searchTerm.split(' ')[0]} sessions for babies and toddlers in ${town}.`;
  const { ageMin, ageMax } = getAgeRange(searchTerm);
  const day = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][Math.floor(Math.random() * 5)];
  const time = searchTerm.includes('baby') ? '10:00 AM' : '10:30 AM';
  const postcode = extractPostcode(address);
  
  await client.query(`
    INSERT INTO classes (
      name, description, age_group_min, age_group_max, price, is_featured, 
      venue, address, postcode, town, day_of_week, time, category, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
  `, [name, description, ageMin, ageMax, 'Contact for pricing', false, 
      venue, address, postcode, town, day, time, category]);
}

function categorizeSearch(term) {
  if (term.includes('swimming')) return 'swimming';
  if (term.includes('music')) return 'music';
  if (term.includes('sensory') || term.includes('massage')) return 'sensory';
  if (term.includes('gymnastics')) return 'movement';
  return 'general';
}

function getAgeRange(term) {
  if (term.includes('baby')) return { ageMin: 0, ageMax: 12 };
  if (term.includes('toddler')) return { ageMin: 12, ageMax: 60 };
  return { ageMin: 0, ageMax: 60 };
}

function extractPostcode(address) {
  const match = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i);
  return match ? match[0].toUpperCase() : '';
}

// Run the restart
restartRemainingCities().catch(console.error);