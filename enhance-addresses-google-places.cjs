const { Client } = require('pg');
const https = require('https');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchGooglePlaces(businessName) {
  return new Promise((resolve, reject) => {
    const query = encodeURIComponent(`${businessName} UK baby toddler classes`);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.results && result.results.length > 0) {
            const place = result.results[0];
            resolve({
              address: place.formatted_address,
              name: place.name,
              placeId: place.place_id,
              rating: place.rating,
              types: place.types
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

function extractPostcode(address) {
  if (!address) return null;
  const postcodeMatch = address.match(/[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][ABD-HJLNP-UW-Z]{2}/i);
  return postcodeMatch ? postcodeMatch[0].toUpperCase() : null;
}

function extractTown(address, postcode) {
  if (!address) return 'Unknown';
  
  // Remove postcode and country from address
  let cleanAddress = address.replace(/, UK$/, '').replace(postcode || '', '').trim();
  
  // Get the last part before postcode as town
  const parts = cleanAddress.split(',').map(part => part.trim()).filter(part => part);
  return parts.length > 0 ? parts[parts.length - 1] : 'Unknown';
}

async function enhanceBusinessAddresses() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔍 Finding businesses with missing addresses...');

    // Get businesses with empty addresses
    const result = await client.query(`
      SELECT id, name, town 
      FROM classes 
      WHERE (address IS NULL OR address = '' OR address = 'Unknown') 
      AND name IS NOT NULL 
      AND name != ''
      LIMIT 20
    `);

    console.log(`Found ${result.rows.length} businesses to enhance`);

    let enhanced = 0;
    
    for (const business of result.rows) {
      console.log(`\nEnhancing: ${business.name}`);
      
      try {
        const placeData = await searchGooglePlaces(business.name);
        
        if (placeData && placeData.address) {
          const postcode = extractPostcode(placeData.address);
          const town = extractTown(placeData.address, postcode);
          
          await client.query(`
            UPDATE classes 
            SET address = $1, postcode = $2, town = $3
            WHERE id = $4
          `, [placeData.address, postcode, town, business.id]);
          
          console.log(`✅ Enhanced: ${business.name}`);
          console.log(`   Address: ${placeData.address}`);
          console.log(`   Town: ${town}`);
          enhanced++;
        } else {
          console.log(`⚠️  No address found for: ${business.name}`);
        }
        
        // Delay to respect API limits
        await sleep(1000);
        
      } catch (error) {
        console.log(`❌ Error for ${business.name}: ${error.message}`);
      }
    }

    console.log(`\n🎉 Successfully enhanced ${enhanced} businesses with authentic addresses!`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

enhanceBusinessAddresses();