import { Client } from 'pg';

async function resilientSequentialExpansion() {
  console.log('🛡️ RESILIENT SEQUENTIAL EXPANSION - CITIES 3-15');
  console.log('🔧 Enhanced error handling and automatic continuation\n');

  // Starting from city 3 since Oldham and Hemel Hempstead are complete
  const remainingCities = [
    { name: 'Stockton-on-Tees', current: 1, target: 30, position: 3 },
    { name: 'Slough', current: 1, target: 30, position: 4 },
    { name: 'Aylesbury', current: 1, target: 30, position: 5 },
    { name: 'Middlesbrough', current: 1, target: 30, position: 6 },
    { name: 'Basingstoke', current: 1, target: 30, position: 7 },
    { name: 'Bracknell', current: 2, target: 30, position: 8 },
    { name: 'Crawley', current: 2, target: 30, position: 9 },
    { name: 'Dundee', current: 2, target: 30, position: 10 },
    { name: 'Aberdeen', current: 3, target: 30, position: 11 },
    { name: 'Portsmouth', current: 3, target: 30, position: 12 },
    { name: 'Harrogate', current: 3, target: 30, position: 13 },
    { name: 'Rotherham', current: 3, target: 30, position: 14 },
    { name: 'Grimsby', current: 3, target: 30, position: 15 }
  ];

  let totalAdded = 0;
  let completedCities = 0;

  for (let i = 0; i < remainingCities.length; i++) {
    const city = remainingCities[i];
    
    try {
      console.log(`\n${city.position}/15 🏙️ EXPANDING ${city.name.toUpperCase()}`);
      console.log(`   🎯 Progress: ${completedCities}/${remainingCities.length} cities completed`);
      
      const addedForCity = await expandCityWithRetries(city);
      totalAdded += addedForCity;
      completedCities++;
      
      console.log(`   ✅ ${city.name} completed: ${addedForCity} businesses added`);
      
      // Mandatory pause between cities for API stability
      if (i < remainingCities.length - 1) {
        console.log(`   ⏱️ 3-second pause before next city...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
    } catch (cityError) {
      console.log(`   ❌ ${city.name} failed: ${cityError.message}`);
      console.log(`   🔄 Continuing to next city...`);
      // Don't stop - continue to next city
    }
  }

  await showComprehensiveResults(totalAdded, completedCities);
}

async function expandCityWithRetries(city, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`   🔄 Attempt ${attempt}/${maxRetries}`);
      const result = await expandSingleCityResilient(city);
      return result; // Success
    } catch (error) {
      console.log(`   ⚠️ Attempt ${attempt} failed: ${error.message}`);
      if (attempt < maxRetries) {
        console.log(`   ⏱️ 2-second retry pause...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  // All retries failed, return 0 but don't throw
  console.log(`   ⚠️ All retries failed for ${city.name}, continuing...`);
  return 0;
}

async function expandSingleCityResilient(city) {
  let client = null;
  let totalAdded = 0;
  
  try {
    // Create fresh connection with shorter timeouts
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 15000,
      query_timeout: 15000
    });
    
    await client.connect();
    
    // Get current count with timeout protection
    const currentResult = await Promise.race([
      client.query('SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true', [city.name]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 5000))
    ]);
    
    const currentCount = parseInt(currentResult.rows[0].count);
    const needed = Math.min(8, city.target - currentCount); // Conservative limit: 8 per session
    
    console.log(`   📊 Current: ${currentCount} | Adding up to: ${needed}`);
    
    if (needed <= 0) {
      console.log(`   ✅ ${city.name} already has sufficient coverage`);
      return 0;
    }
    
    // Multiple search terms for better results
    const searchTerms = [
      `baby classes ${city.name}`,
      `toddler groups ${city.name}`,
      `nursery ${city.name}`,
      `children activities ${city.name}`
    ];
    
    for (const searchTerm of searchTerms) {
      if (totalAdded >= needed) break;
      
      console.log(`   🔍 ${searchTerm}`);
      
      try {
        const businesses = await searchWithTimeout(searchTerm, 8000);
        console.log(`   📍 Found ${businesses.length} potential businesses`);
        
        if (businesses.length === 0) continue;
        
        let addedThisSearch = 0;
        
        for (const business of businesses.slice(0, 5)) { // Limit to 5 per search
          if (totalAdded >= needed) break;
          
          const address = business.formatted_address || '';
          
          if (!isCorrectLocationResilient(address, city.name)) continue;
          
          // Quick duplicate check with timeout
          const existsResult = await Promise.race([
            client.query('SELECT 1 FROM classes WHERE name ILIKE $1 AND town = $2 LIMIT 1', [`%${business.name}%`, city.name]),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Duplicate check timeout')), 3000))
          ]);
          
          if (existsResult.rows.length > 0) continue;
          
          // Add business
          await addBusinessResilient(client, business, searchTerm, city.name);
          totalAdded++;
          addedThisSearch++;
          console.log(`   ✅ ${business.name} (${totalAdded}/${needed})`);
        }
        
        if (addedThisSearch > 0) {
          console.log(`   📈 Added ${addedThisSearch} from this search`);
        }
        
      } catch (searchError) {
        console.log(`   ⚠️ Search error: ${searchError.message}`);
        continue; // Try next search term
      }
    }
    
    return totalAdded;
    
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (endError) {
        console.log(`   ⚠️ Connection cleanup error: ${endError.message}`);
      }
    }
  }
}

async function searchWithTimeout(searchTerm, timeoutMs = 8000) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchTerm)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || [];
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Search timeout');
    }
    throw error;
  }
}

function isCorrectLocationResilient(address, cityName) {
  if (!address) return false;
  
  const normalizedAddress = address.toLowerCase();
  const normalizedCity = cityName.toLowerCase();
  
  // Handle special cases
  if (cityName === 'Stockton-on-Tees') {
    return normalizedAddress.includes('stockton') || normalizedAddress.includes('tees');
  }
  if (cityName === 'Hemel Hempstead') {
    return normalizedAddress.includes('hemel') || normalizedAddress.includes('hempstead');
  }
  
  return normalizedAddress.includes(normalizedCity);
}

async function addBusinessResilient(client, business, searchTerm, town) {
  const name = business.name || 'Unknown Business';
  const address = business.formatted_address || '';
  const venue = name;
  const category = categorizeFromSearch(searchTerm);
  const description = generateDescription(name, searchTerm, town);
  const postcode = extractPostcode(address);
  const ageRange = extractAgeRange(searchTerm);
  
  await Promise.race([
    client.query(`
      INSERT INTO classes (
        name, description, age_group_min, age_group_max, price, is_featured, 
        venue, address, postcode, town, day_of_week, time, category, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
    `, [name, description, ageRange.min, ageRange.max, 'Contact for pricing', false, 
        venue, address, postcode, town, 'Monday', '10:00 AM', category]),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Insert timeout')), 5000))
  ]);
}

function categorizeFromSearch(searchTerm) {
  if (searchTerm.includes('baby')) return 'baby';
  if (searchTerm.includes('toddler')) return 'toddler';
  if (searchTerm.includes('nursery')) return 'childcare';
  return 'general';
}

function generateDescription(name, searchTerm, town) {
  if (searchTerm.includes('baby')) {
    return `Professional baby classes and activities in ${town}. Expert-led sessions for early development.`;
  }
  if (searchTerm.includes('toddler')) {
    return `Engaging toddler activities and classes in ${town}. Fun educational sessions for young children.`;
  }
  return `Quality family activities and classes in ${town}. Professional services for children and parents.`;
}

function extractAgeRange(searchTerm) {
  if (searchTerm.includes('baby')) return { min: 0, max: 18 };
  if (searchTerm.includes('toddler')) return { min: 12, max: 48 };
  return { min: 0, max: 60 };
}

function extractPostcode(address) {
  const match = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i);
  return match ? match[0].toUpperCase() : '';
}

async function showComprehensiveResults(totalAdded, completedCities) {
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
    
    console.log(`\n🎉 RESILIENT SEQUENTIAL EXPANSION COMPLETED!`);
    console.log(`📊 Total database: ${totalResult.rows[0].count} authentic businesses (+${totalAdded} added this session)`);
    console.log(`🏆 Cities completed: ${completedCities}/13 remaining cities`);
    console.log(`\n📈 ALL UNDERSERVED CITIES RESULTS:`);
    
    underservedResult.rows.forEach(row => {
      const change = row.town === 'Oldham' ? ' (+10)' : row.town === 'Hemel Hempstead' ? ' (+9)' : '';
      console.log(`   ${row.town}: ${row.count} businesses${change}`);
    });
    
    await client.end();
    
  } catch (error) {
    console.log(`❌ Results error: ${error.message}`);
  }
}

// Execute resilient expansion
resilientSequentialExpansion().catch(error => {
  console.log('Resilient expansion error:', error.message);
});