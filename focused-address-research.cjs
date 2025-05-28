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

async function searchGooglePlacesForAddress(businessName) {
  return new Promise((resolve, reject) => {
    // Try different search strategies for family businesses
    const searchQueries = [
      `${businessName} baby classes contact address`,
      `${businessName} toddler classes UK`,
      `${businessName} children's activities`,
      businessName
    ];
    
    const query = encodeURIComponent(searchQueries[0]);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.results && result.results.length > 0) {
            const place = result.results[0];
            if (place.formatted_address) {
              resolve({
                address: place.formatted_address,
                name: place.name,
                rating: place.rating
              });
            } else {
              resolve(null);
            }
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
  
  let cleanAddress = address.replace(/, UK$/, '').replace(/, United Kingdom$/, '');
  if (postcode) {
    cleanAddress = cleanAddress.replace(postcode, '');
  }
  cleanAddress = cleanAddress.trim().replace(/,$/, '');
  
  const parts = cleanAddress.split(',').map(part => part.trim()).filter(part => part);
  return parts.length > 0 ? parts[parts.length - 1] : 'Unknown';
}

async function focusedAddressResearch() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔍 Starting focused address research...');

    // Get a small batch of incomplete records to work on
    const incompleteRecords = [];
    
    await table.select({
      maxRecords: 5, // Start with just 5 businesses
      filterByFormula: "AND({Business_Name} != '', {Full_Address} = '')"
    }).eachPage((records, fetchNextPage) => {
      incompleteRecords.push(...records);
      fetchNextPage();
    });

    console.log(`Researching ${incompleteRecords.length} businesses for missing addresses`);

    let found = 0;

    for (const record of incompleteRecords) {
      const businessName = record.fields['Business_Name'];
      console.log(`\nResearching: ${businessName}`);
      
      try {
        const addressData = await searchGooglePlacesForAddress(businessName);
        
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
          
          console.log(`✅ Found address: ${businessName}`);
          console.log(`   Location: ${addressData.address}`);
          found++;
        } else {
          console.log(`⚠️  No address found: ${businessName}`);
        }
        
        // Respect API limits
        await sleep(2000);
        
      } catch (error) {
        console.log(`❌ Error researching ${businessName}: ${error.message}`);
      }
    }

    console.log(`\n🎉 Successfully found addresses for ${found} businesses!`);
    console.log(`📊 Progress: ${found}/${incompleteRecords.length} in this batch`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

focusedAddressResearch();