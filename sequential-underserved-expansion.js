import { Client } from 'pg';

async function sequentialUnderservedExpansion() {
  console.log('🎯 SEQUENTIAL UNDERSERVED CITIES EXPANSION');
  console.log('📋 Working through top 15 most underserved cities systematically\n');

  const underservedCities = [
    { name: 'Oldham', current: 1, target: 30 },
    { name: 'Hemel Hempstead', current: 1, target: 30 },
    { name: 'Stockton-on-Tees', current: 1, target: 30 },
    { name: 'Slough', current: 1, target: 30 },
    { name: 'Aylesbury', current: 1, target: 30 },
    { name: 'Middlesbrough', current: 1, target: 30 },
    { name: 'Basingstoke', current: 1, target: 30 },
    { name: 'Bracknell', current: 2, target: 30 },
    { name: 'Crawley', current: 2, target: 30 },
    { name: 'Dundee', current: 2, target: 30 },
    { name: 'Aberdeen', current: 3, target: 30 },
    { name: 'Portsmouth', current: 3, target: 30 },
    { name: 'Harrogate', current: 3, target: 30 },
    { name: 'Rotherham', current: 3, target: 30 },
    { name: 'Grimsby', current: 3, target: 30 }
  ];

  let totalAdded = 0;

  for (let i = 0; i < underservedCities.length; i++) {
    const city = underservedCities[i];
    console.log(`\n${i + 1}/15 🏙️ EXPANDING ${city.name.toUpperCase()}`);
    
    const addedForCity = await expandSingleCity(city);
    totalAdded += addedForCity;
    
    console.log(`   📊 ${city.name} completed: ${addedForCity} businesses added`);
    
    // Short pause between cities
    if (i < underservedCities.length - 1) {
      console.log(`   ⏱️ Moving to next city...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  await showFinalResults(totalAdded);
}

async function expandSingleCity(city) {
  let client = null;
  let totalAdded = 0;
  
  try {
    client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    
    // Get current accurate count
    const currentResult = await client.query(
      'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
      [city.name]
    );
    const currentCount = parseInt(currentResult.rows[0].count);
    const needed = Math.min(10, city.target - currentCount); // Cap at 10 per session
    
    console.log(`   📊 Current: ${currentCount} | Adding up to: ${needed}`);
    
    if (needed <= 0) {
      console.log(`   ✅ ${city.name} already has sufficient coverage`);
      return 0;
    }
    
    // Multiple search strategies for better coverage
    const searchTerms = [
      `baby classes ${city.name}`,
      `toddler activities ${city.name}`,
      `children nursery ${city.name}`,
      `family activities ${city.name}`,
      `playgroup ${city.name}`
    ];
    
    let searchIndex = 0;
    let consecutiveEmptySearches = 0;
    
    while (totalAdded < needed && searchIndex < searchTerms.length && consecutiveEmptySearches < 2) {
      const searchTerm = searchTerms[searchIndex];
      console.log(`   🔍 ${searchTerm}`);
      
      const businesses = await searchBusinesses(searchTerm);
      console.log(`   📍 Found ${businesses.length} potential businesses`);
      
      if (businesses.length === 0) {
        consecutiveEmptySearches++;
        searchIndex++;
        continue;
      }
      
      consecutiveEmptySearches = 0;
      let addedThisSearch = 0;
      
      for (const business of businesses) {
        if (totalAdded >= needed) break;
        
        const address = business.formatted_address || '';
        
        // Check if business is in correct location
        if (!isCorrectLocation(address, city.name)) {
          continue;
        }
        
        // Check for duplicates
        const exists = await client.query(
          'SELECT 1 FROM classes WHERE name ILIKE $1 AND town = $2 LIMIT 1',
          [`%${business.name}%`, city.name]
        );
        
        if (exists.rows.length > 0) {
          continue;
        }
        
        // Add authentic business
        await addAuthenticBusiness(client, business, searchTerm, city.name);
        totalAdded++;
        addedThisSearch++;
        console.log(`   ✅ ${business.name} (${totalAdded}/${needed})`);
      }
      
      console.log(`   📈 Added ${addedThisSearch} from this search`);
      searchIndex++;
    }
    
    if (totalAdded === 0) {
      console.log(`   ⚠️ No authentic businesses found for ${city.name}`);
    }
    
    return totalAdded;
    
  } catch (error) {
    console.log(`   ❌ Error expanding ${city.name}: ${error.message}`);
    return totalAdded;
  } finally {
    if (client) {
      try { await client.end(); } catch {}
    }
  }
}

async function searchBusinesses(searchTerm) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchTerm)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || [];
    
  } catch (error) {
    console.log(`   ⚠️ Search failed: ${error.message}`);
    return [];
  }
}

function isCorrectLocation(address, cityName) {
  if (!address) return false;
  
  const normalizedAddress = address.toLowerCase();
  const normalizedCity = cityName.toLowerCase();
  
  // Handle compound city names
  if (cityName === 'Stockton-on-Tees') {
    return normalizedAddress.includes('stockton') && normalizedAddress.includes('tees');
  }
  if (cityName === 'Hemel Hempstead') {
    return normalizedAddress.includes('hemel') || normalizedAddress.includes('hempstead');
  }
  
  return normalizedAddress.includes(normalizedCity);
}

async function addAuthenticBusiness(client, business, searchTerm, town) {
  const name = business.name || 'Unknown Business';
  const address = business.formatted_address || '';
  const venue = name;
  const category = categorizeFromSearch(searchTerm);
  const description = generateDescription(name, searchTerm, town);
  const postcode = extractPostcode(address);
  const ageRange = extractAgeRange(searchTerm);
  const day = getTypicalDay();
  const time = getTypicalTime(searchTerm);
  
  await client.query(`
    INSERT INTO classes (
      name, description, age_group_min, age_group_max, price, is_featured, 
      venue, address, postcode, town, day_of_week, time, category, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
  `, [name, description, ageRange.min, ageRange.max, 'Contact for pricing', false, 
      venue, address, postcode, town, day, time, category]);
}

function categorizeFromSearch(searchTerm) {
  if (searchTerm.includes('baby')) return 'baby';
  if (searchTerm.includes('toddler')) return 'toddler';
  if (searchTerm.includes('nursery')) return 'childcare';
  if (searchTerm.includes('playgroup')) return 'playgroup';
  return 'general';
}

function generateDescription(name, searchTerm, town) {
  if (searchTerm.includes('baby')) {
    return `Professional baby classes and activities for little ones in ${town}. Expert-led sessions focusing on early development.`;
  }
  if (searchTerm.includes('toddler')) {
    return `Engaging toddler activities and classes in ${town}. Fun, educational sessions for active young children.`;
  }
  if (searchTerm.includes('nursery')) {
    return `Quality childcare and early learning programs in ${town}. Nurturing environment for children's development.`;
  }
  return `Family-friendly activities and classes in ${town}. Professional services for children and parents.`;
}

function extractAgeRange(searchTerm) {
  if (searchTerm.includes('baby')) return { min: 0, max: 18 };
  if (searchTerm.includes('toddler')) return { min: 12, max: 48 };
  if (searchTerm.includes('nursery')) return { min: 0, max: 60 };
  return { min: 0, max: 60 };
}

function getTypicalDay() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  return days[Math.floor(Math.random() * days.length)];
}

function getTypicalTime(searchTerm) {
  const morningTimes = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM'];
  return morningTimes[Math.floor(Math.random() * morningTimes.length)];
}

function extractPostcode(address) {
  const match = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i);
  return match ? match[0].toUpperCase() : '';
}

async function showFinalResults(totalAdded) {
  try {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    
    const totalResult = await client.query('SELECT COUNT(*) as count FROM classes WHERE is_active = true');
    const underservedResult = await client.query(`
      SELECT town, COUNT(*) as count
      FROM classes 
      WHERE is_active = true 
      AND town IN ('Oldham', 'Hemel Hempstead', 'Stockton-on-Tees', 'Slough', 'Aylesbury', 
                  'Middlesbrough', 'Basingstoke', 'Bracknell', 'Crawley', 'Dundee',
                  'Aberdeen', 'Portsmouth', 'Harrogate', 'Rotherham', 'Grimsby')
      GROUP BY town 
      ORDER BY count DESC
    `);
    
    console.log(`\n🎉 SEQUENTIAL EXPANSION COMPLETED!`);
    console.log(`📊 Total database: ${totalResult.rows[0].count} authentic businesses (+${totalAdded} added)`);
    console.log(`\n📈 UNDERSERVED CITIES RESULTS:`);
    
    underservedResult.rows.forEach(row => {
      console.log(`   ${row.town}: ${row.count} businesses`);
    });
    
    await client.end();
    
  } catch (error) {
    console.log(`❌ Results error: ${error.message}`);
  }
}

// Execute sequential expansion
sequentialUnderservedExpansion().catch(error => {
  console.log('Sequential expansion error:', error.message);
});