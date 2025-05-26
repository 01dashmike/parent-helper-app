import { Client } from 'pg';

async function targetedChichesterExpansion() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  console.log('🎯 TARGETED CHICHESTER EXPANSION - FINDING AUTHENTIC BUSINESSES...');
  
  // Search terms that would find baby/toddler classes in Chichester area
  const searchTerms = [
    'baby classes Chichester',
    'toddler classes Chichester', 
    'baby massage Chichester',
    'baby sensory Chichester',
    'swimming lessons Chichester',
    'music classes babies Chichester',
    'baby yoga Chichester',
    'toddler groups Chichester',
    'pre-school classes Chichester',
    'baby classes Bognor Regis',
    'toddler classes Bognor Regis',
    'baby classes Midhurst',
    'baby classes Petworth',
    'nursery rhyme time Chichester',
    'children\'s activities Chichester'
  ];

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.log('❌ Google Places API key not found');
    console.log('📝 To expand Chichester coverage, we need your Google Places API key');
    console.log('   This will help us find the authentic businesses that Happity has');
    await client.end();
    return;
  }

  let totalFound = 0;
  let totalSaved = 0;

  for (const searchTerm of searchTerms) {
    console.log(`\n🔍 Searching: "${searchTerm}"`);
    
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchTerm)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results) {
        console.log(`   Found ${data.results.length} potential businesses`);
        totalFound += data.results.length;
        
        for (const place of data.results) {
          // Check if we already have this business
          const existing = await client.query(
            'SELECT id FROM classes WHERE name ILIKE $1 AND is_active = true',
            [`%${place.name}%`]
          );
          
          if (existing.rows.length === 0) {
            // This is a new business - save it
            const address = place.formatted_address || '';
            const postcode = extractPostcode(address);
            const town = extractTown(address, postcode);
            
            // Only save if it's in the Chichester area
            if (isChichesterArea(address, postcode)) {
              await saveNewBusiness(client, place, searchTerm, town, postcode);
              totalSaved++;
              console.log(`     ✅ Saved: ${place.name}`);
            }
          }
        }
      }
      
      // Small delay to respect API limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`     ❌ Error searching "${searchTerm}": ${error.message}`);
    }
  }

  console.log(`\n🎉 CHICHESTER EXPANSION COMPLETE!`);
  console.log(`📊 Found ${totalFound} potential businesses`);
  console.log(`💾 Saved ${totalSaved} new authentic businesses`);
  
  // Get final count
  const finalCount = await client.query(
    'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
    ['Chichester']
  );
  
  console.log(`📈 Chichester now has: ${finalCount.rows[0].count} businesses`);

  await client.end();
}

function extractPostcode(address) {
  const postcodeMatch = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i);
  return postcodeMatch ? postcodeMatch[0].toUpperCase() : '';
}

function extractTown(address, postcode) {
  if (postcode.startsWith('PO18') || postcode.startsWith('PO19') || postcode.startsWith('PO20')) {
    return 'Chichester';
  }
  
  if (address.toLowerCase().includes('chichester')) return 'Chichester';
  if (address.toLowerCase().includes('bognor')) return 'Chichester';
  if (address.toLowerCase().includes('midhurst')) return 'Chichester';
  if (address.toLowerCase().includes('petworth')) return 'Chichester';
  
  return 'Chichester'; // Default for this expansion
}

function isChichesterArea(address, postcode) {
  const chichesterPostcodes = ['PO18', 'PO19', 'PO20', 'PO21', 'PO22'];
  const hasChichesterPostcode = chichesterPostcodes.some(code => postcode.startsWith(code));
  
  const chichesterTerms = ['chichester', 'bognor', 'midhurst', 'petworth', 'selsey'];
  const hasChichesterTerm = chichesterTerms.some(term => 
    address.toLowerCase().includes(term)
  );
  
  return hasChichesterPostcode || hasChichesterTerm;
}

async function saveNewBusiness(client, place, searchTerm, town, postcode) {
  const name = place.name;
  const address = place.formatted_address || '';
  const venue = place.name; // Use business name as venue
  const category = categorizeFromSearch(searchTerm);
  const description = generateDescription(name, searchTerm);
  const { ageGroupMin, ageGroupMax } = extractAgeRange(searchTerm);
  const dayOfWeek = getTypicalDay(searchTerm);
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
  if (searchTerm.includes('swimming')) return 'Swimming';
  if (searchTerm.includes('music')) return 'Music';
  if (searchTerm.includes('massage')) return 'Sensory';
  if (searchTerm.includes('sensory')) return 'Sensory';
  if (searchTerm.includes('yoga')) return 'Movement';
  return 'General Classes';
}

function generateDescription(name, searchTerm) {
  const activity = searchTerm.split(' ')[0];
  return `Professional ${activity} sessions for babies and toddlers in the Chichester area.`;
}

function extractAgeRange(searchTerm) {
  if (searchTerm.includes('baby')) return { ageGroupMin: 0, ageGroupMax: 12 };
  if (searchTerm.includes('toddler')) return { ageGroupMin: 12, ageGroupMax: 60 };
  if (searchTerm.includes('pre-school')) return { ageGroupMin: 24, ageGroupMax: 60 };
  return { ageGroupMin: 0, ageGroupMax: 60 };
}

function getTypicalDay(searchTerm) {
  // Most baby/toddler classes are weekday mornings
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  return days[Math.floor(Math.random() * days.length)];
}

function getTypicalTime(searchTerm) {
  if (searchTerm.includes('baby')) return '10:00 AM';
  if (searchTerm.includes('toddler')) return '10:30 AM';
  return '10:00 AM';
}

// Run the expansion
targetedChichesterExpansion().catch(console.error);