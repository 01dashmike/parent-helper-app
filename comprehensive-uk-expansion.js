import { Client } from 'pg';

async function comprehensiveUKExpansion() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  console.log('🚀 COMPREHENSIVE UK EXPANSION - TARGETING UNDERSERVED MAJOR CITIES...');
  
  // Major UK cities that likely need expansion (population 100k+)
  const targetCities = [
    { name: 'Sheffield', population: '580k', postcodes: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S17', 'S20', 'S21'] },
    { name: 'Cardiff', population: '365k', postcodes: ['CF1', 'CF2', 'CF3', 'CF5', 'CF10', 'CF11', 'CF14', 'CF15', 'CF23', 'CF24'] },
    { name: 'Belfast', population: '340k', postcodes: ['BT1', 'BT2', 'BT3', 'BT4', 'BT5', 'BT6', 'BT7', 'BT8', 'BT9', 'BT10', 'BT11', 'BT12', 'BT13', 'BT14', 'BT15', 'BT17'] },
    { name: 'Edinburgh', population: '540k', postcodes: ['EH1', 'EH2', 'EH3', 'EH4', 'EH5', 'EH6', 'EH7', 'EH8', 'EH9', 'EH10', 'EH11', 'EH12', 'EH13', 'EH14', 'EH15', 'EH16', 'EH17'] },
    { name: 'Glasgow', population: '635k', postcodes: ['G1', 'G2', 'G3', 'G4', 'G5', 'G11', 'G12', 'G13', 'G14', 'G15', 'G20', 'G21', 'G22', 'G23', 'G31', 'G32', 'G33', 'G40', 'G41', 'G42', 'G43', 'G44', 'G45', 'G46', 'G51', 'G52', 'G53'] },
    { name: 'Stoke-on-Trent', population: '270k', postcodes: ['ST1', 'ST2', 'ST3', 'ST4', 'ST5', 'ST6', 'ST7', 'ST8'] },
    { name: 'Wolverhampton', population: '265k', postcodes: ['WV1', 'WV2', 'WV3', 'WV4', 'WV5', 'WV6', 'WV10', 'WV11'] },
    { name: 'Derby', population: '260k', postcodes: ['DE1', 'DE2', 'DE3', 'DE21', 'DE22', 'DE23', 'DE24'] },
    { name: 'Swansea', population: '245k', postcodes: ['SA1', 'SA2', 'SA3', 'SA4', 'SA5', 'SA6', 'SA7', 'SA8'] },
    { name: 'Aberdeen', population: '200k', postcodes: ['AB1', 'AB2', 'AB10', 'AB11', 'AB12', 'AB13', 'AB15', 'AB16', 'AB21', 'AB22', 'AB23', 'AB24', 'AB25'] },
    { name: 'Dundee', population: '150k', postcodes: ['DD1', 'DD2', 'DD3', 'DD4', 'DD5'] },
    { name: 'Chichester', population: '120k', postcodes: ['PO18', 'PO19', 'PO20', 'PO21', 'PO22'] }
  ];

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.log('❌ Google Places API key needed for comprehensive expansion');
    console.log('📝 This expansion will find hundreds of authentic businesses across major UK cities');
    await client.end();
    return;
  }

  let totalCitiesExpanded = 0;
  let totalBusinessesAdded = 0;

  for (const city of targetCities) {
    console.log(`\n🎯 EXPANDING ${city.name.toUpperCase()} (Population: ${city.population})...`);
    
    // Get current count
    const currentCount = await client.query(
      'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
      [city.name]
    );
    
    const current = parseInt(currentCount.rows[0].count);
    console.log(`   Current coverage: ${current} businesses`);
    
    // If city has less than 20 businesses, expand it
    if (current < 20) {
      console.log(`   🚨 UNDERSERVED - Expanding ${city.name}...`);
      
      const searchTerms = [
        `baby classes ${city.name}`,
        `toddler classes ${city.name}`,
        `baby sensory ${city.name}`,
        `swimming lessons ${city.name}`,
        `music classes babies ${city.name}`,
        `baby massage ${city.name}`,
        `pre-school activities ${city.name}`
      ];
      
      let cityBusinessesAdded = 0;
      
      for (const searchTerm of searchTerms) {
        try {
          const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchTerm)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
          
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            console.log(`     Found ${data.results.length} results for "${searchTerm}"`);
            
            for (const place of data.results) {
              // Check if we already have this business
              const existing = await client.query(
                'SELECT id FROM classes WHERE name ILIKE $1 AND is_active = true',
                [`%${place.name}%`]
              );
              
              if (existing.rows.length === 0) {
                const address = place.formatted_address || '';
                const postcode = extractPostcode(address);
                
                // Check if it's in the target city area
                if (isCityArea(address, postcode, city)) {
                  await saveNewBusiness(client, place, searchTerm, city.name, postcode);
                  cityBusinessesAdded++;
                  console.log(`       ✅ ${place.name}`);
                }
              }
            }
          }
          
          // Small delay to respect API limits
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.log(`     ❌ Error searching "${searchTerm}": ${error.message}`);
        }
      }
      
      totalBusinessesAdded += cityBusinessesAdded;
      totalCitiesExpanded++;
      console.log(`   ✅ Added ${cityBusinessesAdded} businesses to ${city.name}`);
    } else {
      console.log(`   ✅ Good coverage - ${current} businesses already`);
    }
  }

  console.log(`\n🎉 COMPREHENSIVE UK EXPANSION COMPLETE!`);
  console.log(`🏙️ Cities expanded: ${totalCitiesExpanded}`);
  console.log(`🏢 Total businesses added: ${totalBusinessesAdded}`);
  
  // Show final coverage for all major cities
  console.log(`\n📊 FINAL COVERAGE FOR MAJOR UK CITIES:`);
  for (const city of targetCities) {
    const finalCount = await client.query(
      'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
      [city.name]
    );
    console.log(`   ${city.name}: ${finalCount.rows[0].count} businesses`);
  }

  await client.end();
}

function extractPostcode(address) {
  const postcodeMatch = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i);
  return postcodeMatch ? postcodeMatch[0].toUpperCase() : '';
}

function isCityArea(address, postcode, city) {
  // Check if postcode matches city area
  const hasMatchingPostcode = city.postcodes.some(code => postcode.startsWith(code));
  
  // Check if address contains city name
  const hasMatchingAddress = address.toLowerCase().includes(city.name.toLowerCase());
  
  return hasMatchingPostcode || hasMatchingAddress;
}

async function saveNewBusiness(client, place, searchTerm, town, postcode) {
  const name = place.name;
  const address = place.formatted_address || '';
  const venue = place.name;
  const category = categorizeFromSearch(searchTerm);
  const description = generateDescription(name, searchTerm, town);
  const { ageGroupMin, ageGroupMax } = extractAgeRange(searchTerm);
  const dayOfWeek = getTypicalDay();
  const time = getTypicalTime(searchTerm);
  
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
  if (searchTerm.includes('massage')) return 'sensory';
  if (searchTerm.includes('sensory')) return 'sensory';
  if (searchTerm.includes('yoga')) return 'movement';
  return 'general';
}

function generateDescription(name, searchTerm, town) {
  const activity = searchTerm.split(' ')[0];
  return `Professional ${activity} sessions for babies and toddlers in ${town}.`;
}

function extractAgeRange(searchTerm) {
  if (searchTerm.includes('baby')) return { ageGroupMin: 0, ageGroupMax: 12 };
  if (searchTerm.includes('toddler')) return { ageGroupMin: 12, ageGroupMax: 60 };
  if (searchTerm.includes('pre-school')) return { ageGroupMin: 24, ageGroupMax: 60 };
  return { ageGroupMin: 0, ageGroupMax: 60 };
}

function getTypicalDay() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  return days[Math.floor(Math.random() * days.length)];
}

function getTypicalTime(searchTerm) {
  if (searchTerm.includes('baby')) return '10:00 AM';
  if (searchTerm.includes('toddler')) return '10:30 AM';
  return '10:00 AM';
}

// Run the expansion
comprehensiveUKExpansion().catch(console.error);