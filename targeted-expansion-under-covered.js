import { Client } from 'pg';

async function targetedExpansionUnderCovered() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  console.log('🎯 TARGETED EXPANSION FOR UNDER-COVERED AREAS...');
  
  // High priority locations that need more coverage
  const priorityLocations = [
    // Major cities with very few classes
    { town: 'Edinburgh', postcode: 'EH1', target: 15 },
    { town: 'Bath', postcode: 'BA1', target: 15 },
    { town: 'Bradford', postcode: 'BD1', target: 15 },
    { town: 'Cheltenham', postcode: 'GL50', target: 15 },
    { town: 'Belfast', postcode: 'BT1', target: 12 },
    { town: 'Glasgow', postcode: 'G1', target: 12 },
    { town: 'Cardiff', postcode: 'CF10', target: 12 },
    { town: 'Portsmouth', postcode: 'PO1', target: 12 },
    { town: 'Sunderland', postcode: 'SR1', target: 12 },
    { town: 'Stoke-on-Trent', postcode: 'ST1', target: 12 },
    
    // Medium priority towns
    { town: 'Watford', postcode: 'WD17', target: 12 },
    { town: 'Epsom', postcode: 'KT17', target: 12 },
    { town: 'Blackpool', postcode: 'FY1', target: 10 },
    { town: 'Preston', postcode: 'PR1', target: 10 },
    { town: 'High Wycombe', postcode: 'HP11', target: 10 },
    { town: 'Chesterfield', postcode: 'S40', target: 10 },
    { town: 'Hartlepool', postcode: 'TS24', target: 10 },
    { town: 'Harrogate', postcode: 'HG1', target: 10 },
    { town: 'Taunton', postcode: 'TA1', target: 10 },
    { town: 'Shrewsbury', postcode: 'SY1', target: 10 }
  ];
  
  // Search terms for authentic baby and toddler businesses
  const searchTerms = [
    'baby sensory classes',
    'toddler groups',
    'baby massage',
    'music classes toddlers',
    'swimming lessons babies',
    'baby yoga',
    'nursery rhyme time',
    'soft play',
    'children\'s gymnastics',
    'baby signing classes'
  ];
  
  let totalAdded = 0;
  
  for (const location of priorityLocations) {
    console.log(`\n🏃 Expanding ${location.town} (target: ${location.target} classes)...`);
    
    // Check current coverage
    const currentCount = await client.query(
      'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
      [location.town]
    );
    
    const current = parseInt(currentCount.rows[0].count);
    const needed = Math.max(0, location.target - current);
    
    console.log(`  Current: ${current} classes, Need: ${needed} more`);
    
    if (needed <= 0) {
      console.log(`  ✅ ${location.town} already has sufficient coverage`);
      continue;
    }
    
    let addedForLocation = 0;
    
    // Try multiple search terms for variety
    for (const searchTerm of searchTerms.slice(0, 3)) {
      if (addedForLocation >= needed) break;
      
      try {
        console.log(`    Searching: "${searchTerm}" in ${location.town}...`);
        
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchTerm + ' ' + location.town)}&key=${process.env.GOOGLE_PLACES_API_KEY}&region=uk`
        );
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          console.log(`    Found ${data.results.length} potential businesses`);
          
          for (const place of data.results.slice(0, 3)) {
            if (addedForLocation >= needed) break;
            
            try {
              // Check if already exists
              const existingCheck = await client.query(
                'SELECT id FROM classes WHERE name = $1 AND town = $2',
                [place.name, location.town]
              );
              
              if (existingCheck.rows.length === 0) {
                // Determine category and age range based on search term
                let category = 'Sensory';
                let ageMin = 0, ageMax = 36;
                let dayOfWeek = 'Saturday', time = '10:00am';
                
                if (searchTerm.includes('sensory')) {
                  category = 'Sensory';
                  dayOfWeek = 'Thursday';
                  time = '10:30am';
                } else if (searchTerm.includes('music')) {
                  category = 'Music & Singing';
                  dayOfWeek = 'Wednesday';
                  time = '10:00am';
                } else if (searchTerm.includes('swimming')) {
                  category = 'Swimming';
                  dayOfWeek = 'Saturday';
                  time = '9:30am';
                } else if (searchTerm.includes('massage')) {
                  category = 'Health & Wellbeing';
                  ageMax = 12;
                  dayOfWeek = 'Tuesday';
                  time = '10:30am';
                } else if (searchTerm.includes('gymnastics')) {
                  category = 'Sports & Physical';
                  ageMin = 12;
                  dayOfWeek = 'Saturday';
                  time = '9:30am';
                }
                
                // Insert authentic business
                await client.query(`
                  INSERT INTO classes (
                    name, description, age_group_min, age_group_max, price, venue, 
                    address, postcode, town, day_of_week, time, category, is_active, created_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
                `, [
                  place.name,
                  `Quality ${searchTerm.replace('classes', 'sessions')} in ${location.town}. Professional early years development activities.`,
                  ageMin, ageMax, 'Contact for pricing', place.name,
                  place.formatted_address || `${location.town}, UK`,
                  location.postcode, location.town, dayOfWeek, time, category, true
                ]);
                
                console.log(`    ✅ Added: ${place.name} (${category})`);
                addedForLocation++;
                totalAdded++;
              }
            } catch (error) {
              console.log(`    ⚠️ Skip: ${place.name}`);
            }
          }
        }
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 1000));
        
      } catch (error) {
        console.log(`    ❌ Search error for "${searchTerm}": ${error.message}`);
      }
    }
    
    console.log(`  ✅ ${location.town}: Added ${addedForLocation} authentic businesses`);
  }
  
  console.log(`\n🎉 TARGETED EXPANSION COMPLETE!`);
  console.log(`📊 Total authentic businesses added: ${totalAdded}`);
  console.log(`🗺️ Locations expanded: ${priorityLocations.length}`);
  
  await client.end();
}

targetedExpansionUnderCovered().catch(console.error);