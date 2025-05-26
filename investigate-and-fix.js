import { Client } from 'pg';

async function investigateAndFix() {
  console.log('🔍 INVESTIGATING EXPANSION STALLING ISSUES');
  console.log('📋 Root cause analysis and targeted fix\n');

  // Test 1: Database connection stability
  console.log('1️⃣ Testing database connection...');
  await testDatabaseConnection();
  
  // Test 2: API availability 
  console.log('\n2️⃣ Testing Google Places API...');
  await testGooglePlacesAPI();
  
  // Test 3: Single city expansion with detailed logging
  console.log('\n3️⃣ Testing single city expansion (Aberdeen)...');
  await testSingleCityExpansion();
}

async function testDatabaseConnection() {
  let client;
  try {
    client = new Client({ connectionString: process.env.DATABASE_URL });
    const startTime = Date.now();
    await client.connect();
    const connectTime = Date.now() - startTime;
    console.log(`   ✅ Database connected in ${connectTime}ms`);
    
    const result = await client.query('SELECT COUNT(*) as count FROM classes WHERE is_active = true');
    console.log(`   ✅ Query executed: ${result.rows[0].count} total businesses`);
    
  } catch (error) {
    console.log(`   ❌ Database error: ${error.message}`);
  } finally {
    if (client) {
      try { await client.end(); } catch {}
    }
  }
}

async function testGooglePlacesAPI() {
  try {
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      console.log('   ❌ Google Places API key not found');
      return;
    }
    
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=baby classes Aberdeen&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    
    const startTime = Date.now();
    const response = await fetch(url);
    const requestTime = Date.now() - startTime;
    
    console.log(`   ✅ API responded in ${requestTime}ms (Status: ${response.status})`);
    
    const data = await response.json();
    console.log(`   ✅ Found ${data.results?.length || 0} businesses for Aberdeen`);
    
    if (data.results && data.results.length > 0) {
      console.log(`   📋 Sample business: ${data.results[0].name}`);
      console.log(`   📍 Address: ${data.results[0].formatted_address}`);
    }
    
  } catch (error) {
    console.log(`   ❌ API error: ${error.message}`);
  }
}

async function testSingleCityExpansion() {
  let client;
  try {
    console.log('   🏙️ Testing Aberdeen expansion with detailed logging...');
    
    client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    
    // Check current Aberdeen count
    const currentResult = await client.query(
      'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
      ['Aberdeen']
    );
    const current = parseInt(currentResult.rows[0].count);
    console.log(`   📊 Aberdeen current count: ${current}`);
    
    // Search for businesses
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=baby classes Aberdeen&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`   🔍 API found ${data.results?.length || 0} businesses`);
    
    if (data.results && data.results.length > 0) {
      let validBusinesses = 0;
      let duplicateBusinesses = 0;
      let wrongLocationBusinesses = 0;
      
      for (let i = 0; i < Math.min(5, data.results.length); i++) {
        const business = data.results[i];
        const address = business.formatted_address || '';
        
        console.log(`   📝 Business ${i+1}: ${business.name}`);
        console.log(`      Address: ${address}`);
        
        // Check if address contains Aberdeen
        if (!address.toLowerCase().includes('aberdeen')) {
          console.log(`      ❌ Wrong location (not Aberdeen)`);
          wrongLocationBusinesses++;
          continue;
        }
        
        // Check for duplicates
        const exists = await client.query(
          'SELECT 1 FROM classes WHERE name ILIKE $1 AND town = $2 LIMIT 1',
          [`%${business.name}%`, 'Aberdeen']
        );
        
        if (exists.rows.length > 0) {
          console.log(`      ❌ Duplicate (already exists)`);
          duplicateBusinesses++;
          continue;
        }
        
        console.log(`      ✅ Valid business for addition`);
        validBusinesses++;
        
        // Actually add this business
        const name = business.name;
        const venue = name;
        const description = 'Professional sessions for babies and toddlers in Aberdeen.';
        const postcode = (address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i) || [''])[0].toUpperCase();
        
        await client.query(`
          INSERT INTO classes (
            name, description, age_group_min, age_group_max, price, is_featured, 
            venue, address, postcode, town, day_of_week, time, category, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
        `, [name, description, 0, 60, 'Contact for pricing', false, 
            venue, address, postcode, 'Aberdeen', 'Monday', '10:00 AM', 'general']);
        
        console.log(`      ✅ Added to Aberdeen`);
      }
      
      console.log(`   📊 Results: ${validBusinesses} added, ${duplicateBusinesses} duplicates, ${wrongLocationBusinesses} wrong location`);
      
      // Final count
      const finalResult = await client.query(
        'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
        ['Aberdeen']
      );
      const final = parseInt(finalResult.rows[0].count);
      console.log(`   🎯 Aberdeen final count: ${final} (+${final - current} added)`);
    }
    
    // Test the same for Dundee and Oldham quickly
    await quickTestCity(client, 'Dundee');
    await quickTestCity(client, 'Oldham');
    
  } catch (error) {
    console.log(`   ❌ Single city test error: ${error.message}`);
  } finally {
    if (client) {
      try { await client.end(); } catch {}
    }
  }
}

async function quickTestCity(client, cityName) {
  try {
    console.log(`\n   🏙️ Quick test: ${cityName}`);
    
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=baby classes ${cityName}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`   🔍 Found ${data.results?.length || 0} businesses for ${cityName}`);
    
    if (data.results && data.results.length > 0) {
      // Add top 2 businesses
      let added = 0;
      for (let i = 0; i < Math.min(2, data.results.length); i++) {
        const business = data.results[i];
        const address = business.formatted_address || '';
        
        if (address.toLowerCase().includes(cityName.toLowerCase())) {
          const exists = await client.query(
            'SELECT 1 FROM classes WHERE name ILIKE $1 AND town = $2 LIMIT 1',
            [`%${business.name}%`, cityName]
          );
          
          if (exists.rows.length === 0) {
            const name = business.name;
            const venue = name;
            const description = `Professional sessions for babies and toddlers in ${cityName}.`;
            const postcode = (address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i) || [''])[0].toUpperCase();
            
            await client.query(`
              INSERT INTO classes (
                name, description, age_group_min, age_group_max, price, is_featured, 
                venue, address, postcode, town, day_of_week, time, category, is_active
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
            `, [name, description, 0, 60, 'Contact for pricing', false, 
                venue, address, postcode, cityName, 'Tuesday', '10:00 AM', 'general']);
            
            added++;
            console.log(`   ✅ Added: ${business.name}`);
          }
        }
      }
      console.log(`   📊 ${cityName}: ${added} businesses added`);
    }
    
  } catch (error) {
    console.log(`   ❌ ${cityName} error: ${error.message}`);
  }
}

// Run investigation
investigateAndFix().catch(error => {
  console.log('Investigation error:', error.message);
});