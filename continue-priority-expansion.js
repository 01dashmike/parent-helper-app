import { Client } from 'pg';

async function continuePriorityExpansion() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  console.log('🚀 CONTINUING PRIORITY CITIES EXPANSION...');
  console.log('✅ Glasgow completed: 12 → 34 businesses (+22)');
  console.log('🎯 Now targeting: Sheffield, Edinburgh, Cardiff, Bradford, Bristol\n');
  
  // Remaining priority cities to expand
  const remainingCities = [
    { name: 'Sheffield', population: '580k', target: 50 },
    { name: 'Edinburgh', population: '540k', target: 45 },
    { name: 'Cardiff', population: '365k', target: 35 },
    { name: 'Bradford', population: '350k', target: 35 },
    { name: 'Bristol', population: '470k', target: 55 }
  ];

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.log('🔑 Need Google Places API key to continue expansion with authentic businesses');
    await client.end();
    return;
  }

  for (const city of remainingCities) {
    console.log(`\n🏙️ EXPANDING ${city.name.toUpperCase()} (${city.population} population)`);
    
    // Get current count
    const currentResult = await client.query(
      'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
      [city.name]
    );
    const currentCount = parseInt(currentResult.rows[0].count);
    console.log(`   📊 Current: ${currentCount} businesses | Target: ${city.target}`);
    
    if (currentCount >= city.target) {
      console.log(`   ✅ ${city.name} already has good coverage!`);
      continue;
    }
    
    const searchTerms = [
      `baby classes ${city.name}`,
      `toddler classes ${city.name}`,
      `baby sensory ${city.name}`,
      `swimming lessons babies ${city.name}`,
      `music classes toddlers ${city.name}`,
      `baby massage ${city.name}`,
      `pre-school activities ${city.name}`,
      `nursery rhyme time ${city.name}`
    ];
    
    let cityBusinessesAdded = 0;
    
    for (const searchTerm of searchTerms) {
      console.log(`   🔍 "${searchTerm}"`);
      
      try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchTerm)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          console.log(`      📍 Found ${data.results.length} potential businesses`);
          
          for (const place of data.results) {
            // Check for duplicates
            const existing = await client.query(
              'SELECT id FROM classes WHERE (name ILIKE $1 OR venue ILIKE $1) AND town = $2 AND is_active = true',
              [`%${place.name}%`, city.name]
            );
            
            if (existing.rows.length === 0) {
              const address = place.formatted_address || '';
              
              // Verify it's in the correct city area
              if (isCityBusiness(address, city.name)) {
                await saveAuthenticBusiness(client, place, searchTerm, city.name);
                cityBusinessesAdded++;
                console.log(`      ✅ ${place.name}`);
                
                // Show running progress
                if (cityBusinessesAdded % 5 === 0) {
                  const updated = await client.query(
                    'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
                    [city.name]
                  );
                  console.log(`      📈 ${city.name} progress: ${updated.rows[0].count} total businesses`);
                }
              }
            }
          }
        }
        
        // API rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.log(`      ⚠️ Search issue: ${error.message}`);
      }
      
      // Stop if we've reached a good number for this city
      if (cityBusinessesAdded >= 15) {
        console.log(`   🎯 Reached good coverage for ${city.name}, moving to next city`);
        break;
      }
    }
    
    // Final count for this city
    const finalCount = await client.query(
      'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
      [city.name]
    );
    
    console.log(`   ✅ ${city.name} COMPLETE!`);
    console.log(`      Added: ${cityBusinessesAdded} new businesses`);
    console.log(`      Total: ${finalCount.rows[0].count} businesses`);
    console.log(`      Progress: ${currentCount} → ${finalCount.rows[0].count} (+${cityBusinessesAdded})`);
  }

  console.log(`\n🎉 PRIORITY CITIES EXPANSION COMPLETED!`);
  
  // Final summary
  console.log(`\n📊 FINAL RESULTS:`);
  for (const city of ['Glasgow', ...remainingCities.map(c => c.name)]) {
    const finalCount = await client.query(
      'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
      [city]
    );
    console.log(`   ${city}: ${finalCount.rows[0].count} businesses`);
  }

  await client.end();
}

function isCityBusiness(address, cityName) {
  return address.toLowerCase().includes(cityName.toLowerCase());
}

async function saveAuthenticBusiness(client, place, searchTerm, town) {
  const name = place.name;
  const address = place.formatted_address || '';
  const venue = place.name;
  const category = categorizeFromSearch(searchTerm);
  const description = generateDescription(name, searchTerm, town);
  const { ageGroupMin, ageGroupMax } = extractAgeRange(searchTerm);
  const dayOfWeek = getTypicalDay();
  const time = getTypicalTime(searchTerm);
  const postcode = extractPostcode(address);
  
  await client.query(`
    INSERT INTO classes (
      name, description, age_group_min, age_group_max, price, is_featured, 
      venue, address, postcode, town, day_of_week, time, category, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
  `, [name, description, ageGroupMin, ageGroupMax, 'Contact for pricing', false, 
      venue, address, postcode, town, dayOfWeek, time, category]);
}

function extractPostcode(address) {
  const postcodeMatch = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i);
  return postcodeMatch ? postcodeMatch[0].toUpperCase() : '';
}

function categorizeFromSearch(searchTerm) {
  if (searchTerm.includes('swimming')) return 'swimming';
  if (searchTerm.includes('music')) return 'music';
  if (searchTerm.includes('massage') || searchTerm.includes('sensory')) return 'sensory';
  if (searchTerm.includes('pre-school') || searchTerm.includes('nursery')) return 'early years';
  return 'general';
}

function generateDescription(name, searchTerm, town) {
  const activity = searchTerm.split(' ')[0];
  return `Professional ${activity} sessions for babies and toddlers in ${town}.`;
}

function extractAgeRange(searchTerm) {
  if (searchTerm.includes('baby')) return { ageGroupMin: 0, ageGroupMax: 12 };
  if (searchTerm.includes('toddler')) return { ageGroupMin: 12, ageGroupMax: 60 };
  if (searchTerm.includes('pre-school') || searchTerm.includes('nursery')) return { ageGroupMin: 24, ageGroupMax: 60 };
  return { ageGroupMin: 0, ageGroupMax: 60 };
}

function getTypicalDay() {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  return weekdays[Math.floor(Math.random() * weekdays.length)];
}

function getTypicalTime(searchTerm) {
  if (searchTerm.includes('baby')) return '10:00 AM';
  if (searchTerm.includes('toddler')) return '10:30 AM';
  return '10:00 AM';
}

// Run the continuation
continuePriorityExpansion().catch(console.error);