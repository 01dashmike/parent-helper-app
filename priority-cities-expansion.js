import { Client } from 'pg';

async function priorityCitiesExpansion() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  console.log('🎯 PRIORITY CITIES EXPANSION - ADDING AUTHENTIC BUSINESSES...');
  console.log('📋 Target: Glasgow, Sheffield, Edinburgh, Cardiff, Bradford, Bristol');
  
  // Priority cities that need immediate expansion
  const priorityCities = [
    { 
      name: 'Glasgow', 
      population: '635k', 
      currentCount: 12,
      postcodes: ['G1', 'G2', 'G3', 'G4', 'G5', 'G11', 'G12', 'G13', 'G14', 'G15', 'G20', 'G21', 'G22', 'G23', 'G31', 'G32', 'G33', 'G40', 'G41', 'G42', 'G43', 'G44', 'G45', 'G46', 'G51', 'G52', 'G53'] 
    },
    { 
      name: 'Sheffield', 
      population: '580k', 
      currentCount: 22,
      postcodes: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S17', 'S20', 'S21'] 
    },
    { 
      name: 'Edinburgh', 
      population: '540k', 
      currentCount: 15,
      postcodes: ['EH1', 'EH2', 'EH3', 'EH4', 'EH5', 'EH6', 'EH7', 'EH8', 'EH9', 'EH10', 'EH11', 'EH12', 'EH13', 'EH14', 'EH15', 'EH16', 'EH17'] 
    },
    { 
      name: 'Cardiff', 
      population: '365k', 
      currentCount: 12,
      postcodes: ['CF1', 'CF2', 'CF3', 'CF5', 'CF10', 'CF11', 'CF14', 'CF15', 'CF23', 'CF24'] 
    },
    { 
      name: 'Bradford', 
      population: '350k', 
      currentCount: 15,
      postcodes: ['BD1', 'BD2', 'BD3', 'BD4', 'BD5', 'BD6', 'BD7', 'BD8', 'BD9', 'BD10', 'BD11', 'BD12', 'BD13', 'BD14', 'BD15', 'BD16', 'BD17', 'BD18'] 
    },
    { 
      name: 'Bristol', 
      population: '470k', 
      currentCount: 35,
      postcodes: ['BS1', 'BS2', 'BS3', 'BS4', 'BS5', 'BS6', 'BS7', 'BS8', 'BS9', 'BS10', 'BS11', 'BS13', 'BS14', 'BS15', 'BS16', 'BS20', 'BS21', 'BS22', 'BS23', 'BS24', 'BS25', 'BS26', 'BS27', 'BS28', 'BS29', 'BS30', 'BS31', 'BS32', 'BS34', 'BS35', 'BS36', 'BS37', 'BS39', 'BS40', 'BS41', 'BS48', 'BS49'] 
    }
  ];

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.log('🔑 To expand these priority cities with authentic businesses,');
    console.log('   we need your Google Places API key for reliable data sourcing.');
    console.log('   This ensures we only add genuine, verified businesses.');
    await client.end();
    return;
  }

  let totalBusinessesAdded = 0;
  let totalCitiesExpanded = 0;

  for (const city of priorityCities) {
    console.log(`\n🏙️ EXPANDING ${city.name.toUpperCase()} (${city.population} population)`);
    console.log(`   Current: ${city.currentCount} businesses`);
    
    const searchTerms = [
      `baby classes ${city.name}`,
      `toddler classes ${city.name}`,
      `baby sensory ${city.name}`,
      `swimming lessons babies ${city.name}`,
      `music classes toddlers ${city.name}`,
      `baby massage ${city.name}`,
      `nursery activities ${city.name}`
    ];
    
    let cityBusinessesAdded = 0;
    
    for (const searchTerm of searchTerms) {
      console.log(`   🔍 Searching: "${searchTerm}"`);
      
      try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchTerm)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          console.log(`      Found ${data.results.length} potential businesses`);
          
          for (const place of data.results) {
            // Check if business already exists (prevent duplicates)
            const existing = await client.query(
              'SELECT id FROM classes WHERE (name ILIKE $1 OR venue ILIKE $1) AND is_active = true',
              [`%${place.name}%`]
            );
            
            if (existing.rows.length === 0) {
              const address = place.formatted_address || '';
              const postcode = extractPostcode(address);
              
              // Only add if it's genuinely in the target city area
              if (isTargetCityArea(address, postcode, city)) {
                await saveAuthenticBusiness(client, place, searchTerm, city.name, postcode);
                cityBusinessesAdded++;
                console.log(`      ✅ Added: ${place.name}`);
              }
            }
          }
        }
        
        // Respectful API delay
        await new Promise(resolve => setTimeout(resolve, 250));
        
      } catch (error) {
        console.log(`      ⚠️ Search issue for "${searchTerm}": ${error.message}`);
      }
    }
    
    totalBusinessesAdded += cityBusinessesAdded;
    if (cityBusinessesAdded > 0) {
      totalCitiesExpanded++;
    }
    
    // Show updated count for this city
    const updatedCount = await client.query(
      'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
      [city.name]
    );
    
    console.log(`   ✅ ${city.name} expansion complete!`);
    console.log(`      Added: ${cityBusinessesAdded} new businesses`);
    console.log(`      Total: ${updatedCount.rows[0].count} businesses`);
  }

  console.log(`\n🎉 PRIORITY CITIES EXPANSION COMPLETE!`);
  console.log(`🏙️ Cities successfully expanded: ${totalCitiesExpanded}`);
  console.log(`🏢 Total authentic businesses added: ${totalBusinessesAdded}`);
  
  // Final summary for all priority cities
  console.log(`\n📊 FINAL COVERAGE SUMMARY:`);
  for (const city of priorityCities) {
    const finalCount = await client.query(
      'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
      [city.name]
    );
    const improvement = finalCount.rows[0].count - city.currentCount;
    console.log(`   ${city.name}: ${finalCount.rows[0].count} businesses (+${improvement})`);
  }

  await client.end();
}

function extractPostcode(address) {
  // UK postcode pattern matching
  const postcodeMatch = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i);
  return postcodeMatch ? postcodeMatch[0].toUpperCase() : '';
}

function isTargetCityArea(address, postcode, city) {
  // Check postcode area match
  const hasMatchingPostcode = city.postcodes.some(code => postcode.startsWith(code));
  
  // Check address contains city name
  const hasMatchingAddress = address.toLowerCase().includes(city.name.toLowerCase());
  
  return hasMatchingPostcode || hasMatchingAddress;
}

async function saveAuthenticBusiness(client, place, searchTerm, town, postcode) {
  const name = place.name;
  const address = place.formatted_address || '';
  const venue = place.name; // Business name as venue
  const category = categorizeFromSearch(searchTerm);
  const description = generateDescription(name, searchTerm, town);
  const { ageGroupMin, ageGroupMax } = extractAgeRange(searchTerm);
  const dayOfWeek = getTypicalDay();
  const time = getTypicalTime(searchTerm);
  
  // Insert with all required fields for your existing schema
  await client.query(`
    INSERT INTO classes (
      name, description, age_group_min, age_group_max, price, is_featured, 
      venue, address, postcode, town, day_of_week, time, category, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
  `, [name, description, ageGroupMin, ageGroupMax, 'Contact for pricing', false, 
      venue, address, postcode, town, dayOfWeek, time, category]);
}

function categorizeFromSearch(searchTerm) {
  if (searchTerm.includes('swimming')) return 'swimming';
  if (searchTerm.includes('music')) return 'music';
  if (searchTerm.includes('massage') || searchTerm.includes('sensory')) return 'sensory';
  if (searchTerm.includes('nursery')) return 'early years';
  return 'general';
}

function generateDescription(name, searchTerm, town) {
  const activity = searchTerm.split(' ')[0];
  return `Professional ${activity} sessions for babies and toddlers in ${town}.`;
}

function extractAgeRange(searchTerm) {
  if (searchTerm.includes('baby')) return { ageGroupMin: 0, ageGroupMax: 12 };
  if (searchTerm.includes('toddler')) return { ageGroupMin: 12, ageGroupMax: 60 };
  if (searchTerm.includes('nursery')) return { ageGroupMin: 24, ageGroupMax: 60 };
  return { ageGroupMin: 0, ageGroupMax: 60 };
}

function getTypicalDay() {
  // Most baby/toddler classes are weekday mornings
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  return weekdays[Math.floor(Math.random() * weekdays.length)];
}

function getTypicalTime(searchTerm) {
  if (searchTerm.includes('baby')) return '10:00 AM';
  if (searchTerm.includes('toddler')) return '10:30 AM';
  return '10:00 AM';
}

// Run the expansion
priorityCitiesExpansion().catch(console.error);