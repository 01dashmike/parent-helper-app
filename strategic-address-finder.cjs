const { Client } = require('pg');
const Airtable = require('airtable');
const https = require('https');

const token = 'patUmtejVE5l6Lbr7.ec8bcb286d09182ff263889564a7948f02045b359816d0d8a1c175a4d4e96f93';
const baseId = 'app9eOTFWck1sZwTG';

const base = new Airtable({
  apiKey: token
}).base(baseId);

const table = base('tblDcOhMjN0kb8dk4');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function tryMultipleSearchStrategies(businessName) {
  // Create different search variations for family businesses
  const searchVariations = [
    businessName,
    businessName.replace(/&/g, 'and'),
    businessName.split(' ')[0] + ' ' + businessName.split(' ')[1], // First two words
    businessName.split(' ')[0], // Just first word
    businessName + ' UK',
    businessName + ' classes',
    businessName.replace(/®/g, '').replace(/™/g, '').trim()
  ];

  for (const searchTerm of searchVariations) {
    console.log(`  Trying: "${searchTerm}"`);
    
    const result = await searchGooglePlaces(searchTerm);
    if (result && result.address) {
      console.log(`  ✅ Found with: "${searchTerm}"`);
      return result;
    }
    
    await sleep(1000); // Small delay between attempts
  }
  
  return null;
}

async function searchGooglePlaces(query) {
  return new Promise((resolve, reject) => {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.results && result.results.length > 0) {
            const place = result.results[0];
            if (place.formatted_address && place.formatted_address.includes('UK')) {
              resolve({
                address: place.formatted_address,
                name: place.name,
                rating: place.rating,
                placeId: place.place_id
              });
            }
          }
          resolve(null);
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
  
  let cleanAddress = address.replace(/, UK$/, '').replace(/, United Kingdom$/, '');
  if (postcode) {
    cleanAddress = cleanAddress.replace(postcode, '');
  }
  cleanAddress = cleanAddress.trim().replace(/,$/, '');
  
  const parts = cleanAddress.split(',').map(part => part.trim()).filter(part => part);
  return parts.length > 0 ? parts[parts.length - 1] : 'Unknown';
}

async function strategicAddressFinder() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🎯 Starting strategic address research...');

    // Get businesses with missing addresses
    const incompleteRecords = [];
    
    await table.select({
      maxRecords: 10, // Work on 10 at a time
      filterByFormula: "AND({Business_Name} != '', {Full_Address} = '')"
    }).eachPage((records, fetchNextPage) => {
      incompleteRecords.push(...records);
      fetchNextPage();
    });

    console.log(`Researching ${incompleteRecords.length} businesses with strategic search patterns`);

    let successful = 0;

    for (const record of incompleteRecords) {
      const businessName = record.fields['Business_Name'];
      console.log(`\n🔍 Researching: ${businessName}`);
      
      try {
        const addressData = await tryMultipleSearchStrategies(businessName);
        
        if (addressData && addressData.address) {
          const postcode = extractPostcode(addressData.address);
          const town = extractTown(addressData.address, postcode);
          
          // Update database
          await client.query(`
            UPDATE classes 
            SET address = $1, postcode = $2, town = $3
            WHERE name ILIKE $4 AND (address IS NULL OR address = '' OR address = 'Unknown')
          `, [addressData.address, postcode, town, businessName]);
          
          // Update Airtable
          const updateFields = {
            'Full_Address': addressData.address,
            'Postcode': postcode,
            'Town': town
          };
          
          await table.update(record.id, updateFields);
          
          console.log(`✅ SUCCESS: ${businessName}`);
          console.log(`   Address: ${addressData.address}`);
          console.log(`   Town: ${town}`);
          successful++;
        } else {
          console.log(`❌ Not found: ${businessName}`);
        }
        
        // Delay between businesses
        await sleep(2000);
        
      } catch (error) {
        console.log(`❌ Error for ${businessName}: ${error.message}`);
      }
    }

    console.log(`\n🎉 Successfully found addresses for ${successful}/${incompleteRecords.length} businesses!`);
    
    const remaining = 498 - successful;
    console.log(`📊 Directory Status: ${successful} completed, ~${remaining} still need research`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

strategicAddressFinder();