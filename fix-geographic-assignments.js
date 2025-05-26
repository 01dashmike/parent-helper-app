import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get proper administrative areas from government postcode API
async function getProperGeographicArea(postcode) {
  try {
    const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
    if (response.ok) {
      const data = await response.json();
      if (data.result) {
        return {
          borough: data.result.admin_district,
          ward: data.result.admin_ward,
          parish: data.result.parish,
          county: data.result.admin_county,
          region: data.result.region
        };
      }
    }
  } catch (error) {
    console.error(`Error fetching postcode ${postcode}:`, error.message);
  }
  return null;
}

// Determine correct town/borough assignment
function getCorrectTownAssignment(postcodeData, currentTown, postcode) {
  const { borough, ward, parish, county } = postcodeData;
  
  // London borough logic - use admin_district for London postcodes
  if (postcode.match(/^(E|EC|N|NW|SE|SW|W|WC)\d/)) {
    // London postcode areas - use borough name
    if (borough && borough !== 'City of London') {
      return borough;
    }
    return currentTown; // Keep current if can't determine borough
  }
  
  // Poole/Bournemouth specific logic
  if (postcode.match(/^BH\d/)) {
    // BH1-BH11 = Bournemouth, BH12+ = Poole (generally)
    const bhNumber = parseInt(postcode.match(/BH(\d+)/)?.[1] || '0');
    if (bhNumber >= 1 && bhNumber <= 11) {
      return 'Bournemouth';
    } else if (bhNumber >= 12) {
      return 'Poole';
    }
    // Use API data as fallback
    if (borough) {
      return borough;
    }
  }
  
  // For other areas, prefer admin_district (borough) over current assignment
  if (borough && borough !== currentTown) {
    return borough;
  }
  
  return currentTown; // Keep current if no better option
}

async function fixGeographicAssignments() {
  try {
    console.log('🗺️ Starting geographic assignment fixes...');
    
    // Get all classes with potentially incorrect assignments
    const result = await pool.query(`
      SELECT id, name, town, postcode, address 
      FROM classes 
      WHERE 
        (town = 'London' AND postcode ~ '^(E|EC|N|NW|SE|SW|W|WC)') OR
        (town IN ('Poole', 'Bournemouth') AND postcode ~ '^BH') OR
        (town = 'London' AND postcode IS NOT NULL)
      ORDER BY town, postcode
    `);
    
    console.log(`Found ${result.rows.length} classes to review for geographic assignment`);
    
    let londonFixed = 0;
    let pooleFixed = 0;
    let otherFixed = 0;
    let failed = 0;
    
    for (const classItem of result.rows) {
      if (!classItem.postcode) continue;
      
      console.log(`\n📍 Checking: ${classItem.name} (${classItem.town}, ${classItem.postcode})`);
      
      const postcodeData = await getProperGeographicArea(classItem.postcode);
      if (postcodeData) {
        const correctTown = getCorrectTownAssignment(postcodeData, classItem.town, classItem.postcode);
        
        if (correctTown !== classItem.town) {
          // Update the town assignment
          await pool.query(`
            UPDATE classes 
            SET town = $1 
            WHERE id = $2
          `, [correctTown, classItem.id]);
          
          console.log(`  ✅ Updated: ${classItem.town} → ${correctTown}`);
          
          // Track what type of fix this was
          if (classItem.town === 'London') {
            londonFixed++;
          } else if (classItem.town === 'Poole' || classItem.town === 'Bournemouth') {
            pooleFixed++;
          } else {
            otherFixed++;
          }
        } else {
          console.log(`  ➡️ Correct: ${classItem.town} (no change needed)`);
        }
      } else {
        console.log(`  ❌ Could not verify postcode: ${classItem.postcode}`);
        failed++;
      }
      
      await sleep(250); // Rate limiting for API
    }
    
    console.log(`\n🎉 Geographic assignment fixes complete!`);
    console.log(`London borough assignments: ${londonFixed}`);
    console.log(`Poole/Bournemouth fixes: ${pooleFixed}`);
    console.log(`Other area fixes: ${otherFixed}`);
    console.log(`Failed lookups: ${failed}`);
    
    // Show updated statistics
    console.log(`\n📊 Updated Geographic Distribution:`);
    
    const londonStats = await pool.query(`
      SELECT town, COUNT(*) as count 
      FROM classes 
      WHERE postcode ~ '^(E|EC|N|NW|SE|SW|W|WC)' 
      GROUP BY town 
      ORDER BY count DESC 
      LIMIT 10
    `);
    
    console.log('\nLondon Areas:');
    londonStats.rows.forEach(row => {
      console.log(`  ${row.town}: ${row.count} classes`);
    });
    
    const dorsetStats = await pool.query(`
      SELECT town, COUNT(*) as count 
      FROM classes 
      WHERE town IN ('Poole', 'Bournemouth') 
      GROUP BY town 
      ORDER BY count DESC
    `);
    
    console.log('\nDorset Areas:');
    dorsetStats.rows.forEach(row => {
      console.log(`  ${row.town}: ${row.count} classes`);
    });
    
  } catch (error) {
    console.error('❌ Error during geographic assignment fixes:', error);
  } finally {
    await pool.end();
  }
}

fixGeographicAssignments();