import { db } from './server/db.ts';
import { classes } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

// UK Postcode regex for extraction
const postcodeRegex = /([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/gi;

// London boroughs mapping for granular location data
const londonBoroughs = {
  // Central London
  'EC': 'City of London',
  'WC': 'Camden', 
  'W1': 'Westminster',
  'SW1': 'Westminster',
  'E1': 'Tower Hamlets',
  
  // North London
  'N1': 'Islington',
  'N2': 'Barnet', 
  'N3': 'Barnet',
  'N4': 'Haringey',
  'N5': 'Islington',
  'N6': 'Haringey',
  'N7': 'Islington',
  'N8': 'Haringey',
  'N9': 'Enfield',
  'N10': 'Haringey',
  'N11': 'Enfield',
  'N12': 'Barnet',
  'N13': 'Enfield',
  'N14': 'Enfield',
  'N15': 'Haringey',
  'N16': 'Hackney',
  'N17': 'Haringey',
  'N18': 'Enfield',
  'N19': 'Islington',
  'N20': 'Barnet',
  'N21': 'Enfield',
  'N22': 'Haringey',
  'NW1': 'Camden',
  'NW2': 'Brent',
  'NW3': 'Camden',
  'NW4': 'Barnet',
  'NW5': 'Camden',
  'NW6': 'Brent',
  'NW7': 'Barnet',
  'NW8': 'Westminster',
  'NW9': 'Barnet',
  'NW10': 'Brent',
  'NW11': 'Barnet',
  
  // South London
  'SW2': 'Lambeth',
  'SW3': 'Kensington and Chelsea',
  'SW4': 'Lambeth',
  'SW5': 'Kensington and Chelsea',
  'SW6': 'Hammersmith and Fulham',
  'SW7': 'Kensington and Chelsea',
  'SW8': 'Lambeth',
  'SW9': 'Lambeth',
  'SW10': 'Kensington and Chelsea',
  'SW11': 'Wandsworth',
  'SW12': 'Wandsworth',
  'SW13': 'Richmond upon Thames',
  'SW14': 'Richmond upon Thames',
  'SW15': 'Wandsworth',
  'SW16': 'Lambeth',
  'SW17': 'Wandsworth',
  'SW18': 'Wandsworth',
  'SW19': 'Merton',
  'SW20': 'Merton',
  'SE1': 'Southwark',
  'SE2': 'Greenwich',
  'SE3': 'Greenwich',
  'SE4': 'Lewisham',
  'SE5': 'Southwark',
  'SE6': 'Lewisham',
  'SE7': 'Greenwich',
  'SE8': 'Lewisham',
  'SE9': 'Greenwich',
  'SE10': 'Greenwich',
  'SE11': 'Lambeth',
  'SE12': 'Lewisham',
  'SE13': 'Lewisham',
  'SE14': 'Lewisham',
  'SE15': 'Southwark',
  'SE16': 'Southwark',
  'SE17': 'Southwark',
  'SE18': 'Greenwich',
  'SE19': 'Croydon',
  'SE20': 'Bromley',
  'SE21': 'Southwark',
  'SE22': 'Southwark',
  'SE23': 'Lewisham',
  'SE24': 'Lambeth',
  'SE25': 'Croydon',
  'SE26': 'Lewisham',
  'SE27': 'Lambeth',
  'SE28': 'Greenwich',
  
  // East London
  'E2': 'Tower Hamlets',
  'E3': 'Tower Hamlets',
  'E4': 'Waltham Forest',
  'E5': 'Hackney',
  'E6': 'Newham',
  'E7': 'Newham',
  'E8': 'Hackney',
  'E9': 'Hackney',
  'E10': 'Waltham Forest',
  'E11': 'Waltham Forest',
  'E12': 'Newham',
  'E13': 'Newham',
  'E14': 'Tower Hamlets',
  'E15': 'Newham',
  'E16': 'Newham',
  'E17': 'Waltham Forest',
  'E18': 'Redbridge',
  
  // West London
  'W2': 'Westminster',
  'W3': 'Ealing',
  'W4': 'Hounslow',
  'W5': 'Ealing',
  'W6': 'Hammersmith and Fulham',
  'W7': 'Ealing',
  'W8': 'Kensington and Chelsea',
  'W9': 'Westminster',
  'W10': 'Kensington and Chelsea',
  'W11': 'Kensington and Chelsea',
  'W12': 'Hammersmith and Fulham',
  'W13': 'Ealing',
  'W14': 'Hammersmith and Fulham'
};

// Sleep function to respect API rate limits
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Extract postcode from address string
function extractPostcode(address) {
  if (!address) return null;
  const matches = address.match(postcodeRegex);
  return matches ? matches[matches.length - 1].replace(/\s+/g, '').toUpperCase() : null;
}

// Get location data from UK Government Postcode API
async function getLocationFromPostcode(postcode) {
  if (!postcode) return null;
  
  try {
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
    
    if (!response.ok) {
      console.log(`API error for ${postcode}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.result) {
      const result = data.result;
      
      // For London postcodes, use borough-level granularity
      const postcodeArea = cleanPostcode.substring(0, cleanPostcode.length - 3);
      if (londonBoroughs[postcodeArea]) {
        return {
          town: londonBoroughs[postcodeArea],
          district: result.admin_district,
          county: result.admin_county,
          region: result.region,
          latitude: result.latitude,
          longitude: result.longitude
        };
      }
      
      // For other areas, use administrative district
      return {
        town: result.admin_district || result.parish || result.admin_ward,
        district: result.admin_district,
        county: result.admin_county,
        region: result.region,
        latitude: result.latitude,
        longitude: result.longitude
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching location for ${postcode}:`, error.message);
    return null;
  }
}

// Main function to fix location data
async function fixLocationData() {
  console.log('🔄 Starting location data cleanup...');
  
  try {
    // Get all classes from database
    const allClasses = await db.select().from(classes);
    console.log(`📊 Found ${allClasses.length} classes to process`);
    
    let processed = 0;
    let updated = 0;
    let errors = 0;
    
    for (const classItem of allClasses) {
      try {
        processed++;
        console.log(`\n📍 Processing ${processed}/${allClasses.length}: ${classItem.name}`);
        
        // Extract postcode if missing
        let postcode = classItem.postcode;
        if (!postcode || postcode.trim() === '') {
          postcode = extractPostcode(classItem.address);
          console.log(`   📮 Extracted postcode: ${postcode}`);
        }
        
        if (!postcode) {
          console.log(`   ⚠️  No postcode found for: ${classItem.address}`);
          continue;
        }
        
        // Get official location data
        const locationData = await getLocationFromPostcode(postcode);
        
        if (locationData) {
          // Update the class with proper location data
          await db
            .update(classes)
            .set({
              postcode: postcode,
              town: locationData.town,
              // Store additional location data in a structured way
              address: classItem.address // Keep original address
            })
            .where(eq(classes.id, classItem.id));
          
          console.log(`   ✅ Updated: ${classItem.town} → ${locationData.town}`);
          updated++;
        } else {
          console.log(`   ❌ Could not get location data for: ${postcode}`);
          errors++;
        }
        
        // Rate limiting - be respectful to the API
        await sleep(100); // 100ms between requests
        
        // Progress update every 50 items
        if (processed % 50 === 0) {
          console.log(`\n📈 Progress: ${processed}/${allClasses.length} (${Math.round(processed/allClasses.length*100)}%)`);
          console.log(`   ✅ Updated: ${updated}, ❌ Errors: ${errors}`);
        }
        
      } catch (error) {
        console.error(`Error processing class ${classItem.id}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n🎉 Location data cleanup completed!');
    console.log(`📊 Final stats:`);
    console.log(`   📝 Processed: ${processed} classes`);
    console.log(`   ✅ Updated: ${updated} classes`);
    console.log(`   ❌ Errors: ${errors} classes`);
    
    // Show updated town distribution
    console.log('\n📊 Checking new town distribution...');
    const updatedClasses = await db.select().from(classes);
    const townCounts = {};
    
    updatedClasses.forEach(cls => {
      if (cls.town) {
        townCounts[cls.town] = (townCounts[cls.town] || 0) + 1;
      }
    });
    
    const sortedTowns = Object.entries(townCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    
    console.log('\n🏘️  Top 20 towns after cleanup:');
    sortedTowns.forEach(([town, count]) => {
      console.log(`   ${town}: ${count} classes`);
    });
    
    console.log(`\n🏘️  Total unique towns: ${Object.keys(townCounts).length}`);
    
  } catch (error) {
    console.error('Fatal error during location cleanup:', error);
  } finally {
    await sql.end();
    console.log('🔚 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  fixLocationData().catch(console.error);
}

module.exports = { fixLocationData };