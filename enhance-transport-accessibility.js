import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { classes } from './shared/schema.js';
import { eq } from 'drizzle-orm';

// Initialize database connection
const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql, { schema: { classes } });

// Sleep function to respect API rate limits
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check for nearby parking using Google Places API
async function findNearbyParking(latitude, longitude) {
  try {
    const radius = 200; // 200 meters for parking search
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=parking&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Analyze parking options
      const parkingTypes = data.results.map(place => {
        const name = place.name.toLowerCase();
        if (name.includes('free') || name.includes('complimentary')) {
          return 'free';
        } else if (name.includes('pay') || name.includes('paid') || place.price_level > 0) {
          return 'paid';
        }
        return 'unknown';
      });
      
      const hasFreeParking = parkingTypes.includes('free');
      const hasPaidParking = parkingTypes.includes('paid');
      
      return {
        available: true,
        type: hasFreeParking ? 'free' : (hasPaidParking ? 'paid' : 'street'),
        notes: `${data.results.length} parking option${data.results.length > 1 ? 's' : ''} within 200m`
      };
    }
    
    // Check for street parking indicators
    return {
      available: true,
      type: 'street',
      notes: 'Street parking may be available nearby'
    };
    
  } catch (error) {
    console.error('Error checking parking:', error.message);
    return null;
  }
}

// Find nearest London Underground stations
async function findNearestTubeStation(latitude, longitude) {
  try {
    const radius = 800; // 800 meters for tube station search
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&keyword=tube+station+underground&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const nearestStation = data.results[0];
      const distance = Math.round(
        calculateDistance(latitude, longitude, 
                         nearestStation.geometry.location.lat, 
                         nearestStation.geometry.location.lng) * 1000
      );
      
      return `${nearestStation.name} (${distance}m walk)`;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding tube station:', error.message);
    return null;
  }
}

// Find nearby bus stops
async function findNearbyBusStops(latitude, longitude) {
  try {
    const radius = 400; // 400 meters for bus stop search
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&keyword=bus+stop&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results.slice(0, 3).map(stop => {
        const distance = Math.round(
          calculateDistance(latitude, longitude, 
                           stop.geometry.location.lat, 
                           stop.geometry.location.lng) * 1000
        );
        return `${stop.name} (${distance}m)`;
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error finding bus stops:', error.message);
    return [];
  }
}

// Analyze venue accessibility from Google Places details
async function analyzeVenueAccessibility(placeId, venueName) {
  try {
    if (!placeId) return null;
    
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=wheelchair_accessible_entrance,reviews&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.result) {
      const result = data.result;
      let accessibility = 'unknown';
      let notes = [];
      
      // Check wheelchair accessibility
      if (result.wheelchair_accessible_entrance === true) {
        accessibility = 'wheelchair-accessible';
        notes.push('Wheelchair accessible entrance');
      } else if (result.wheelchair_accessible_entrance === false) {
        accessibility = 'stairs-only';
        notes.push('No wheelchair access');
      }
      
      // Analyze reviews for accessibility mentions
      if (result.reviews) {
        const accessibilityMentions = result.reviews
          .map(review => review.text.toLowerCase())
          .filter(text => 
            text.includes('buggy') || text.includes('pushchair') || 
            text.includes('wheelchair') || text.includes('step') ||
            text.includes('accessible') || text.includes('stairs')
          );
        
        if (accessibilityMentions.length > 0) {
          const positiveMentions = accessibilityMentions.filter(text =>
            text.includes('buggy friendly') || text.includes('step-free') ||
            text.includes('easy access') || text.includes('accessible')
          );
          
          if (positiveMentions.length > 0) {
            accessibility = accessibility === 'unknown' ? 'buggy-friendly' : accessibility;
            notes.push('Mentioned as buggy/pushchair friendly in reviews');
          }
        }
      }
      
      // Determine transport accessibility based on venue accessibility
      let transportAccessibility = 'unknown';
      if (accessibility === 'wheelchair-accessible') {
        transportAccessibility = 'step-free';
      } else if (accessibility === 'stairs-only') {
        transportAccessibility = 'difficult';
      } else {
        transportAccessibility = 'limited';
      }
      
      return {
        venueAccessibility: accessibility,
        transportAccessibility: transportAccessibility,
        notes: notes.join('. ')
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error analyzing accessibility:', error.message);
    return null;
  }
}

// Calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI/180);
}

// Get place ID for a venue
async function getPlaceId(venueName, address) {
  try {
    const query = encodeURIComponent(`${venueName} ${address}`);
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].place_id;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting place ID:', error.message);
    return null;
  }
}

// Main function to enhance transport and accessibility data
async function enhanceTransportAccessibility() {
  console.log('🚗🚌 Starting transport and accessibility enhancement...');
  
  try {
    // Check if Google Places API key is available
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      console.log('⚠️  Google Places API key not found. Please add GOOGLE_PLACES_API_KEY to environment variables.');
      console.log('📋 This is needed to fetch parking, transport, and accessibility information.');
      return;
    }
    
    // Get all classes that have coordinates
    const allClasses = await db.select().from(classes).where(
      sql`latitude IS NOT NULL AND longitude IS NOT NULL`
    );
    
    console.log(`📍 Found ${allClasses.length} classes with coordinates to enhance`);
    
    let processed = 0;
    let enhanced = 0;
    
    for (const classItem of allClasses) {
      try {
        processed++;
        console.log(`\n🔄 Processing ${processed}/${allClasses.length}: ${classItem.name}`);
        
        const lat = parseFloat(classItem.latitude);
        const lng = parseFloat(classItem.longitude);
        
        // Find parking information
        console.log('   🚗 Checking parking options...');
        const parkingInfo = await findNearbyParking(lat, lng);
        await sleep(200); // Rate limiting
        
        // Find transport options
        console.log('   🚌 Finding transport options...');
        const tubeStation = await findNearestTubeStation(lat, lng);
        await sleep(200);
        
        const busStops = await findNearbyBusStops(lat, lng);
        await sleep(200);
        
        // Analyze accessibility
        console.log('   ♿ Analyzing accessibility...');
        const placeId = await getPlaceId(classItem.venue, classItem.address);
        await sleep(200);
        
        const accessibilityInfo = placeId ? 
          await analyzeVenueAccessibility(placeId, classItem.venue) : null;
        await sleep(200);
        
        // Update the class with transport and accessibility data
        const updateData = {
          parkingAvailable: parkingInfo?.available || null,
          parkingType: parkingInfo?.type || null,
          parkingNotes: parkingInfo?.notes || null,
          nearestTubeStation: tubeStation,
          nearestBusStops: busStops.length > 0 ? busStops : null,
          transportAccessibility: accessibilityInfo?.transportAccessibility || null,
          venueAccessibility: accessibilityInfo?.venueAccessibility || null,
          accessibilityNotes: accessibilityInfo?.notes || null
        };
        
        await db
          .update(classes)
          .set(updateData)
          .where(eq(classes.id, classItem.id));
        
        // Log what was found
        const enhancements = [];
        if (parkingInfo) enhancements.push(`Parking: ${parkingInfo.type}`);
        if (tubeStation) enhancements.push(`Tube: ${tubeStation}`);
        if (busStops.length > 0) enhancements.push(`${busStops.length} bus stops`);
        if (accessibilityInfo) enhancements.push(`Access: ${accessibilityInfo.venueAccessibility}`);
        
        console.log(`   ✅ Enhanced: ${enhancements.join(', ')}`);
        enhanced++;
        
        // Progress update every 20 items
        if (processed % 20 === 0) {
          console.log(`\n📈 Progress: ${processed}/${allClasses.length} (${Math.round(processed/allClasses.length*100)}%)`);
          console.log(`   ✅ Enhanced: ${enhanced} classes`);
        }
        
      } catch (error) {
        console.error(`Error processing class ${classItem.id}:`, error.message);
      }
    }
    
    console.log('\n🎉 Transport and accessibility enhancement completed!');
    console.log(`📊 Final stats:`);
    console.log(`   📝 Processed: ${processed} classes`);
    console.log(`   ✅ Enhanced: ${enhanced} classes`);
    
    // Show sample of enhanced data
    const enhancedSample = await db.select().from(classes).where(
      sql`parking_available IS NOT NULL OR nearest_tube_station IS NOT NULL`
    ).limit(5);
    
    console.log('\n📋 Sample enhanced classes:');
    enhancedSample.forEach(cls => {
      console.log(`   • ${cls.name}`);
      if (cls.parkingType) console.log(`     🚗 Parking: ${cls.parkingType}`);
      if (cls.nearestTubeStation) console.log(`     🚇 Tube: ${cls.nearestTubeStation}`);
      if (cls.venueAccessibility) console.log(`     ♿ Access: ${cls.venueAccessibility}`);
    });
    
  } catch (error) {
    console.error('Error during transport enhancement:', error);
  } finally {
    await sql.end();
    console.log('🔚 Database connection closed');
  }
}

// Run the enhancement
if (import.meta.url === `file://${process.argv[1]}`) {
  enhanceTransportAccessibility().catch(console.error);
}

export { enhanceTransportAccessibility };