const { Client } = require('pg');
const https = require('https');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class CompanyDataEnhancer {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async initialize() {
    await this.client.connect();
    console.log('🚀 Comprehensive Company Data Enhancer initialized');
  }

  // Enhanced Google Places search with multiple strategies
  async enhancedPlacesSearch(businessName, location) {
    const searchQueries = [
      `${businessName} ${location}`,
      `${businessName} baby classes ${location}`,
      `${businessName} toddler classes ${location}`,
      businessName.split(' ').slice(0, 2).join(' ') + ` ${location}` // First two words
    ];

    for (const query of searchQueries) {
      try {
        const result = await this.searchGooglePlaces(query);
        if (result && result.length > 0) {
          return result[0]; // Return first good result
        }
        await sleep(1000);
      } catch (error) {
        console.log(`Search failed for: ${query}`);
      }
    }
    return null;
  }

  async searchGooglePlaces(query) {
    return new Promise((resolve, reject) => {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      
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

  // Get detailed place information including opening hours
  async getPlaceDetails(placeId) {
    return new Promise((resolve, reject) => {
      const fields = 'name,formatted_address,formatted_phone_number,website,opening_hours,rating,price_level,geometry';
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result.result || null);
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });
  }

  // Find nearby transport options
  async findNearbyTransport(latitude, longitude) {
    const transportInfo = {
      parking: [],
      busStops: [],
      trainStations: []
    };

    try {
      // Search for parking near the location
      const parkingResults = await this.searchNearbyPlaces(latitude, longitude, 'parking');
      transportInfo.parking = parkingResults.slice(0, 3).map(place => ({
        name: place.name,
        distance: this.calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng)
      }));

      // Search for bus stops
      const busResults = await this.searchNearbyPlaces(latitude, longitude, 'bus_station');
      transportInfo.busStops = busResults.slice(0, 3).map(place => ({
        name: place.name,
        distance: this.calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng)
      }));

      // Search for train stations
      const trainResults = await this.searchNearbyPlaces(latitude, longitude, 'train_station');
      transportInfo.trainStations = trainResults.slice(0, 2).map(place => ({
        name: place.name,
        distance: this.calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng)
      }));

    } catch (error) {
      console.log('Transport search error:', error.message);
    }

    return transportInfo;
  }

  async searchNearbyPlaces(lat, lng, type) {
    return new Promise((resolve, reject) => {
      const radius = 1000; // 1km radius
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      
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

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 1000); // Return in meters
  }

  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  // Enhance a specific company's data
  async enhanceCompanyData(companyName, limit = 10) {
    console.log(`\n🔍 Enhancing data for: ${companyName}`);
    
    const pattern = companyName.toLowerCase().replace(/\s+/g, '%');
    const result = await this.client.query(`
      SELECT id, name, address, venue, town, postcode, latitude, longitude
      FROM classes 
      WHERE LOWER(name) LIKE '%${pattern}%'
      AND (address IS NULL OR address = '' OR address = 'Unknown' OR latitude IS NULL)
      LIMIT ${limit}
    `);

    console.log(`Found ${result.rows.length} entries needing enhancement`);
    
    let enhanced = 0;

    for (const business of result.rows) {
      console.log(`\nProcessing: ${business.name} in ${business.town}`);
      
      try {
        // Search for place data
        const placeData = await this.enhancedPlacesSearch(business.name, business.town);
        
        if (placeData && placeData.place_id) {
          // Get detailed information
          const details = await this.getPlaceDetails(placeData.place_id);
          
          if (details) {
            const updates = {};
            if (details.formatted_address) updates.address = details.formatted_address;
            if (details.formatted_phone_number) updates.contact_phone = details.formatted_phone_number;
            if (details.website) updates.website = details.website;
            if (details.geometry?.location) {
              updates.latitude = details.geometry.location.lat;
              updates.longitude = details.geometry.location.lng;
            }

            // Get transport information if we have coordinates
            let transport = null;
            if (details.geometry?.location) {
              transport = await this.findNearbyTransport(
                details.geometry.location.lat,
                details.geometry.location.lng
              );
              
              // Store transport data using existing columns
              if (transport && transport.parking && transport.parking.length > 0) {
                updates.parking_available = true;
                updates.parking_type = transport.parking[0].name;
                updates.parking_notes = `${transport.parking.length} parking options within ${Math.round(transport.parking[0].distance)}m`;
              }
              if (transport && transport.busStops && transport.busStops.length > 0) {
                updates.nearest_bus_stops = `{${transport.busStops.map(stop => `"${stop.name} (${Math.round(stop.distance)}m)"`).join(',')}}`;
              }
            }

            if (Object.keys(updates).length > 0) {
              // Build update query dynamically
              const updateFields = Object.keys(updates).map(key => `${key} = $${Object.keys(updates).indexOf(key) + 2}`).join(', ');
              const values = [business.id, ...Object.values(updates)];
              
              await this.client.query(`UPDATE classes SET ${updateFields} WHERE id = $1`, values);
              
              console.log(`✅ Enhanced: ${business.name}`);
              console.log(`   Address: ${updates.address || 'Not found'}`);
              console.log(`   Phone: ${updates.contact_phone || 'Not found'}`);
              console.log(`   Website: ${updates.website || 'Not found'}`);
              if (transport) {
                console.log(`   Parking: ${transport.parking?.length || 0} options found`);
                console.log(`   Buses: ${transport.busStops?.length || 0} stops found`);
                console.log(`   Trains: ${transport.trainStations?.length || 0} stations found`);
              }
              
              enhanced++;
            }
          }
        } else {
          console.log(`⚠️  No place data found for: ${business.name}`);
        }

        await sleep(2000); // Respect API limits
        
      } catch (error) {
        console.log(`❌ Error processing ${business.name}: ${error.message}`);
      }
    }

    console.log(`\n🎉 Enhanced ${enhanced}/${result.rows.length} ${companyName} entries`);
    return enhanced;
  }

  async close() {
    await this.client.end();
  }
}

// Run enhancement for top companies
async function enhanceTopCompanies() {
  const enhancer = new CompanyDataEnhancer();
  
  try {
    await enhancer.initialize();
    
    // Start with Baby Sensory and Toddler Sense as requested
    const companies = ['Baby Sensory', 'Toddler Sense', 'Water Babies', 'Tumble Tots'];
    
    for (const company of companies) {
      await enhancer.enhanceCompanyData(company, 5); // Process 5 entries per company
      await sleep(3000); // Pause between companies
    }
    
  } catch (error) {
    console.error('Enhancement error:', error.message);
  } finally {
    await enhancer.close();
  }
}

enhanceTopCompanies();