const { Client } = require('pg');
const https = require('https');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchGooglePlaces(searchTerm, location) {
  return new Promise((resolve, reject) => {
    const query = encodeURIComponent(`${searchTerm} ${location} UK`);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.results || []);
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

function categorizeActivity(searchTerm, placeName) {
  const name = (placeName + ' ' + searchTerm).toLowerCase();
  
  if (name.includes('music') || name.includes('sing')) return 'Music & Singing';
  if (name.includes('swim') || name.includes('water')) return 'Swimming';
  if (name.includes('dance') || name.includes('movement')) return 'Dance & Movement';
  if (name.includes('sensory') || name.includes('baby sensory')) return 'Baby Development';
  if (name.includes('yoga') || name.includes('pilates')) return 'Parent & Baby Fitness';
  if (name.includes('massage') || name.includes('baby massage')) return 'Baby Massage';
  if (name.includes('art') || name.includes('craft')) return 'Arts & Crafts';
  if (name.includes('play') || name.includes('soft play')) return 'Play & Social';
  return 'Baby & Toddler Classes';
}

function getAgeGroup(searchTerm) {
  if (searchTerm.includes('baby')) return '0-12 months';
  if (searchTerm.includes('toddler')) return '12-36 months';
  return '0-36 months';
}

function extractDayAndTime(placeName, searchTerm) {
  const text = (placeName + ' ' + searchTerm).toLowerCase();
  
  // Extract day of week
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const foundDay = days.find(day => text.includes(day));
  
  // Extract time patterns
  const timeMatches = text.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i) || 
                     text.match(/(\d{1,2})\s*(am|pm)/i);
  
  return {
    day: foundDay ? foundDay.charAt(0).toUpperCase() + foundDay.slice(1) : 'Contact for schedule',
    time: timeMatches ? timeMatches[0] : 'Contact for times'
  };
}

async function populateStagingDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🚀 Starting to populate staging database with fresh family business data...');

    // Define search terms for family activities
    const searchTerms = [
      'baby sensory classes',
      'baby music classes',
      'baby swimming lessons',
      'toddler dance classes',
      'baby massage classes',
      'baby yoga classes',
      'toddler music groups',
      'children singing classes',
      'baby development classes',
      'parent toddler groups'
    ];

    // Define target locations to search
    const locations = [
      'Cambridge',
      'Oxford',
      'Bath',
      'Canterbury',
      'Winchester',
      'St Albans',
      'Chichester',
      'Salisbury',
      'Guildford',
      'Tunbridge Wells'
    ];

    let totalAdded = 0;

    for (const location of locations) {
      console.log(`\n🔍 Searching in: ${location}`);
      
      for (const searchTerm of searchTerms.slice(0, 3)) { // Limit to 3 search terms per location
        console.log(`  Searching for: ${searchTerm}`);
        
        try {
          const places = await searchGooglePlaces(searchTerm, location);
          
          for (const place of places.slice(0, 2)) { // Limit to 2 results per search
            const address = place.formatted_address;
            const postcode = extractPostcode(address);
            const town = extractTown(address, postcode);
            
            // Check if this business already exists in staging
            const existingCheck = await client.query(
              'SELECT id FROM staging_businesses WHERE business_name ILIKE $1 LIMIT 1',
              [place.name]
            );
            
            if (existingCheck.rows.length === 0) {
              const dayAndTime = extractDayAndTime(place.name, searchTerm);
              
              // Add new business to staging database
              await client.query(`
                INSERT INTO staging_businesses (
                  business_name, full_address, venue_name, postcode, town, 
                  category, age_groups, pricing, featured, description, day_of_week, time_slot
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
              `, [
                place.name,
                address,
                place.name,
                postcode,
                town,
                categorizeActivity(searchTerm, place.name),
                getAgeGroup(searchTerm),
                'Contact for pricing',
                false,
                `${place.name} offers ${searchTerm} in ${town}. ${place.rating ? 'Rated ' + place.rating + ' stars.' : ''}`,
                dayAndTime.day,
                dayAndTime.time
              ]);
              
              console.log(`    ✅ Added: ${place.name} in ${town}`);
              totalAdded++;
            } else {
              console.log(`    ⚠️  Already exists: ${place.name}`);
            }
          }
          
          await sleep(2000); // Respect API limits
          
        } catch (error) {
          console.log(`    ❌ Error searching ${searchTerm}: ${error.message}`);
        }
      }
    }

    // Show summary
    const stagingCount = await client.query('SELECT COUNT(*) FROM staging_businesses');
    
    console.log(`\n🎉 STAGING DATABASE POPULATED!`);
    console.log(`✅ New businesses added this session: ${totalAdded}`);
    console.log(`📊 Total businesses in staging database: ${stagingCount.rows[0].count}`);
    console.log(`🔄 Ready to sync to Airtable with: node sync-staging-to-airtable.cjs`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

populateStagingDatabase();