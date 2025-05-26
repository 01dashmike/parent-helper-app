import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Extract postcode from class name when available
function extractPostcodeFromName(name) {
  const postcodePattern = /([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/gi;
  const match = name.match(postcodePattern);
  return match ? match[0].replace(/\s/g, ' ').toUpperCase() : null;
}

// Extract town from class name
function extractTownFromName(name) {
  // Common patterns: "Baby Sensory [Town]", "[Town] Baby Classes", etc.
  const patterns = [
    /Baby Sensory\s+(.+?)(?:\s+&|\s*$)/i,
    /Basking Babies.*?-\s*(.+?)(?:\s*,|\s*$)/i,
    /Bloom.*?Classes\s+(.+?)(?:\s*$)/i,
    /(.+?)\s+Baby\s+Classes/i,
    /(.+?)\s+Toddler\s+Classes/i
  ];
  
  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

// Get location data from government postcode API
async function getLocationFromPostcode(postcode) {
  try {
    const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
    if (response.ok) {
      const data = await response.json();
      if (data.result) {
        return {
          town: data.result.admin_district || data.result.parish || data.result.admin_ward,
          address: `${data.result.parish || data.result.admin_ward}, ${data.result.admin_district}`,
          latitude: data.result.latitude,
          longitude: data.result.longitude
        };
      }
    }
  } catch (error) {
    console.error(`Error fetching postcode ${postcode}:`, error.message);
  }
  return null;
}

// Search for nearby postcodes based on extracted town
async function searchNearbyPostcode(townName) {
  try {
    const response = await fetch(`https://api.postcodes.io/places?q=${encodeURIComponent(townName)}&limit=1`);
    if (response.ok) {
      const data = await response.json();
      if (data.result && data.result.length > 0) {
        const place = data.result[0];
        // Get a sample postcode for this area
        const postcodeResponse = await fetch(`https://api.postcodes.io/postcodes?lon=${place.longitude}&lat=${place.latitude}&limit=1`);
        if (postcodeResponse.ok) {
          const postcodeData = await postcodeResponse.json();
          if (postcodeData.result && postcodeData.result.length > 0) {
            return postcodeData.result[0].postcode;
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error searching for town ${townName}:`, error.message);
  }
  return null;
}

async function enhanceMissingAddresses() {
  try {
    console.log('🔍 Finding classes with missing address information...');
    
    const result = await pool.query(`
      SELECT id, name, town, postcode, address, latitude, longitude 
      FROM classes 
      WHERE (address IS NULL OR address = '' OR town IS NULL OR town = '') 
      AND name IS NOT NULL
      ORDER BY id
    `);
    
    console.log(`Found ${result.rows.length} classes needing address enhancement`);
    
    let enhanced = 0;
    let failed = 0;
    
    for (const classItem of result.rows) {
      console.log(`\n📍 Processing: ${classItem.name}`);
      
      let locationData = null;
      let foundPostcode = classItem.postcode;
      
      // Try to extract postcode from name if not available
      if (!foundPostcode) {
        foundPostcode = extractPostcodeFromName(classItem.name);
        console.log(`  Extracted postcode from name: ${foundPostcode || 'none found'}`);
      }
      
      // If we have a postcode, get location data
      if (foundPostcode) {
        locationData = await getLocationFromPostcode(foundPostcode);
        await sleep(200); // Rate limiting
      }
      
      // If no postcode, try to extract town and search for it
      if (!locationData) {
        const extractedTown = extractTownFromName(classItem.name);
        if (extractedTown) {
          console.log(`  Extracted town from name: ${extractedTown}`);
          const nearbyPostcode = await searchNearbyPostcode(extractedTown);
          if (nearbyPostcode) {
            locationData = await getLocationFromPostcode(nearbyPostcode);
            foundPostcode = nearbyPostcode;
            await sleep(200);
          }
        }
      }
      
      // Update the database with enhanced information
      if (locationData) {
        const updateQuery = `
          UPDATE classes 
          SET 
            address = COALESCE(NULLIF(address, ''), $2),
            town = COALESCE(NULLIF(town, ''), $3),
            postcode = COALESCE(NULLIF(postcode, ''), $4),
            latitude = COALESCE(latitude, $5),
            longitude = COALESCE(longitude, $6)
          WHERE id = $1
        `;
        
        await pool.query(updateQuery, [
          classItem.id,
          locationData.address,
          locationData.town,
          foundPostcode,
          locationData.latitude,
          locationData.longitude
        ]);
        
        console.log(`  ✅ Enhanced: ${locationData.town}, ${foundPostcode}`);
        enhanced++;
      } else {
        console.log(`  ❌ Could not enhance address data`);
        failed++;
      }
      
      await sleep(300); // Be respectful to the API
    }
    
    console.log(`\n🎉 Address enhancement complete!`);
    console.log(`Enhanced: ${enhanced} classes`);
    console.log(`Failed: ${failed} classes`);
    
    // Show final statistics
    const finalCheck = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN address IS NOT NULL AND address != '' THEN 1 END) as with_address,
        COUNT(CASE WHEN town IS NOT NULL AND town != '' THEN 1 END) as with_town
      FROM classes
    `);
    
    const stats = finalCheck.rows[0];
    console.log(`\n📊 Final Statistics:`);
    console.log(`Total classes: ${stats.total}`);
    console.log(`With address: ${stats.with_address} (${((stats.with_address/stats.total)*100).toFixed(1)}%)`);
    console.log(`With town: ${stats.with_town} (${((stats.with_town/stats.total)*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('❌ Error during address enhancement:', error);
  } finally {
    await pool.end();
  }
}

enhanceMissingAddresses();