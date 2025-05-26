const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { classes } = require('./shared/schema.ts');
const { eq, sql } = require('drizzle-orm');

// Initialize database connection
const sqlConnection = postgres(process.env.DATABASE_URL);
const db = drizzle(sqlConnection);

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

function toRadians(degrees) {
  return degrees * (Math.PI/180);
}

// Get nearby towns for a given location
async function getNearbyTowns(latitude, longitude, maxDistance = 10) {
  try {
    const response = await fetch(`https://api.postcodes.io/postcodes?lon=${longitude}&lat=${latitude}&radius=${maxDistance * 1000}&limit=100`);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    if (data.result) {
      // Extract unique towns from nearby postcodes
      const nearbyTowns = new Set();
      
      data.result.forEach(postcode => {
        if (postcode.admin_district) {
          nearbyTowns.add(postcode.admin_district);
        }
        if (postcode.parish && postcode.parish !== postcode.admin_district) {
          nearbyTowns.add(postcode.parish);
        }
      });
      
      return Array.from(nearbyTowns);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching nearby towns:', error.message);
    return [];
  }
}

// Add new columns for multi-location support
async function addMultiLocationColumns() {
  console.log('📊 Adding multi-location support columns...');
  
  try {
    // Add columns for storing multiple locations and coordinates
    await sqlConnection`
      ALTER TABLE classes 
      ADD COLUMN IF NOT EXISTS additional_towns TEXT[],
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
      ADD COLUMN IF NOT EXISTS search_radius_km INTEGER DEFAULT 5
    `;
    
    console.log('✅ Multi-location columns added successfully');
  } catch (error) {
    console.error('Error adding columns:', error.message);
  }
}

// Update class with multiple location assignments
async function setupMultiLocationAssignments() {
  console.log('🌍 Setting up multi-location assignments...');
  
  try {
    // First add the necessary columns
    await addMultiLocationColumns();
    
    // Get all classes that have been processed with location data
    const allClasses = await db.select().from(classes);
    console.log(`📍 Processing ${allClasses.length} classes for multi-location assignment`);
    
    let processed = 0;
    let updated = 0;
    
    for (const classItem of allClasses) {
      try {
        processed++;
        
        // Skip if no postcode
        if (!classItem.postcode) {
          continue;
        }
        
        // Get coordinates for this postcode
        const response = await fetch(`https://api.postcodes.io/postcodes/${classItem.postcode.replace(/\s+/g, '')}`);
        
        if (!response.ok) {
          continue;
        }
        
        const data = await response.json();
        
        if (data.result) {
          const { latitude, longitude } = data.result;
          
          // Determine search radius based on location type
          let searchRadius = 5; // Default 5km for smaller towns
          
          // For London and major cities, use smaller radius for more granular search
          if (classItem.town && (
            classItem.town.includes('London') || 
            classItem.town.includes('Birmingham') || 
            classItem.town.includes('Manchester') || 
            classItem.town.includes('Liverpool') || 
            classItem.town.includes('Leeds')
          )) {
            searchRadius = 2; // 2km for dense urban areas
          }
          
          // Get nearby towns within the search radius
          const nearbyTowns = await getNearbyTowns(latitude, longitude, searchRadius);
          
          // Filter out the primary town to avoid duplication
          const additionalTowns = nearbyTowns.filter(town => 
            town !== classItem.town && town && town.length > 2
          );
          
          // Update the class with coordinate and multi-location data
          await sqlConnection`
            UPDATE classes 
            SET 
              latitude = ${latitude},
              longitude = ${longitude},
              search_radius_km = ${searchRadius},
              additional_towns = ${additionalTowns}
            WHERE id = ${classItem.id}
          `;
          
          console.log(`   ✅ ${classItem.name}: ${classItem.town} + ${additionalTowns.length} nearby (${additionalTowns.slice(0, 3).join(', ')}${additionalTowns.length > 3 ? '...' : ''})`);
          updated++;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Progress update
        if (processed % 25 === 0) {
          console.log(`📈 Progress: ${processed}/${allClasses.length} (${Math.round(processed/allClasses.length*100)}%)`);
        }
        
      } catch (error) {
        console.error(`Error processing class ${classItem.id}:`, error.message);
      }
    }
    
    console.log('\n🎉 Multi-location assignment completed!');
    console.log(`📊 Stats: ${updated} classes updated with nearby town data`);
    
  } catch (error) {
    console.error('Error in multi-location setup:', error);
  }
}

// Update search functionality to include nearby towns
async function createEnhancedSearchFunction() {
  console.log('🔍 Creating enhanced search function...');
  
  try {
    // Create a function that searches across primary and additional towns
    await sqlConnection`
      CREATE OR REPLACE FUNCTION search_classes_by_location(search_town TEXT)
      RETURNS TABLE(
        id INTEGER,
        name TEXT,
        description TEXT,
        town TEXT,
        postcode TEXT,
        address TEXT,
        category TEXT,
        day_of_week TEXT,
        time TEXT,
        price TEXT,
        age_group_min INTEGER,
        age_group_max INTEGER,
        is_featured BOOLEAN,
        venue TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        social_media TEXT,
        google_rating DECIMAL,
        google_reviews_count INTEGER,
        distance_match TEXT
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          c.id,
          c.name,
          c.description,
          c.town,
          c.postcode,
          c.address,
          c.category,
          c.day_of_week,
          c.time,
          c.price,
          c.age_group_min,
          c.age_group_max,
          c.is_featured,
          c.venue,
          c.phone,
          c.email,
          c.website,
          c.social_media,
          c.google_rating,
          c.google_reviews_count,
          CASE 
            WHEN c.town ILIKE '%' || search_town || '%' THEN 'primary'
            WHEN search_town = ANY(c.additional_towns) THEN 'nearby'
            ELSE 'extended'
          END as distance_match
        FROM classes c
        WHERE 
          c.is_active = true
          AND (
            c.town ILIKE '%' || search_town || '%'
            OR search_town = ANY(c.additional_towns)
            OR EXISTS (
              SELECT 1 FROM unnest(c.additional_towns) as nearby_town
              WHERE nearby_town ILIKE '%' || search_town || '%'
            )
          )
        ORDER BY 
          CASE 
            WHEN c.town ILIKE '%' || search_town || '%' THEN 1
            WHEN search_town = ANY(c.additional_towns) THEN 2
            ELSE 3
          END,
          c.is_featured DESC,
          c.google_rating DESC NULLS LAST,
          c.name;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    console.log('✅ Enhanced search function created successfully');
    
  } catch (error) {
    console.error('Error creating search function:', error.message);
  }
}

// Main execution function
async function setupMultiLocationSystem() {
  console.log('🚀 Setting up multi-location assignment system...');
  
  try {
    await setupMultiLocationAssignments();
    await createEnhancedSearchFunction();
    
    console.log('\n🎉 Multi-location system setup completed!');
    console.log('📍 Classes can now appear in searches for nearby towns');
    console.log('🔍 Enhanced search function created for better location matching');
    
  } catch (error) {
    console.error('Error setting up multi-location system:', error);
  } finally {
    await sqlConnection.end();
    console.log('🔚 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  setupMultiLocationSystem().catch(console.error);
}

module.exports = { setupMultiLocationSystem };