const { Client } = require('pg');
const https = require('https');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class TopCompaniesEnhancer {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Company-specific data patterns and official websites
    this.companyData = {
      'Baby Sensory': {
        website: 'babysensory.com',
        typicalAgeRanges: ['0-6 months', '6-13 months'],
        activityType: 'SENSORY',
        defaultDuration: 45,
        franchisePattern: /Baby Sensory\s+([^-\(]+)/i
      },
      'Toddler Sense': {
        website: 'toddlersense.co.uk',
        typicalAgeRanges: ['13 months - 4 years'],
        activityType: 'SENSORY',
        defaultDuration: 45,
        franchisePattern: /Toddler Sense\s+([^-\(]+)/i
      },
      'Water Babies': {
        website: 'waterbabies.co.uk',
        typicalAgeRanges: ['0-4 years'],
        activityType: 'SWIMMING',
        defaultDuration: 30,
        franchisePattern: /Water Babies\s+([^-\(]+)/i
      },
      'Tumble Tots': {
        website: 'tumbletots.com',
        typicalAgeRanges: ['6 months - 7 years'],
        activityType: 'MOVEMENT',
        defaultDuration: 45,
        franchisePattern: /Tumble Tots\s+([^-\(]+)/i
      },
      'Tots Play': {
        website: 'totsplay.co.uk',
        typicalAgeRanges: ['0-5 years'],
        activityType: 'SENSORY',
        defaultDuration: 45,
        franchisePattern: /Tots Play\s+([^-\(]+)/i
      },
      'Sing and Sign': {
        website: 'singandsign.co.uk',
        typicalAgeRanges: ['6 months - 4 years'],
        activityType: 'LANGUAGE',
        defaultDuration: 40,
        franchisePattern: /Sing and Sign\s+([^-\(]+)/i
      }
    };
  }

  async initialize() {
    await this.client.connect();
    console.log('🚀 Top Companies Enhancer initialized');
  }

  // Enhanced Google Places search with company-specific strategies
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

  async getPlaceDetails(placeId) {
    return new Promise((resolve, reject) => {
      const fields = 'name,formatted_address,formatted_phone_number,website,opening_hours,rating,geometry';
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

  // Extract franchise location from business name
  extractFranchiseLocation(businessName, companyName) {
    const companyInfo = this.companyData[companyName];
    if (!companyInfo) return null;
    
    const match = businessName.match(companyInfo.franchisePattern);
    return match ? match[1].trim() : null;
  }

  // Extract day and time from business name
  extractSchedulingFromName(businessName) {
    const scheduling = {};
    
    // Extract day patterns
    const dayMatch = businessName.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i);
    if (dayMatch) scheduling.day = dayMatch[1];
    
    // Extract time patterns
    const timeMatch = businessName.match(/(\d{1,2}[:.]?\d{0,2}\s*(?:am|pm))/i);
    if (timeMatch) scheduling.time = timeMatch[1];
    
    // Extract age range patterns
    const agePatterns = [
      /(\d+)\s*-\s*(\d+)\s*months?/i,
      /(\d+)m\s*-\s*(\d+)m/i,
      /(birth|newborn)\s*-\s*(\d+)\s*months?/i,
      /(\d+)\s*weeks?\s*-\s*(\d+)\s*months?/i
    ];
    
    for (const pattern of agePatterns) {
      const match = businessName.match(pattern);
      if (match) {
        if (match[1].toLowerCase().includes('birth') || match[1].toLowerCase().includes('newborn')) {
          scheduling.age_range = `0-${match[2]} months`;
        } else {
          scheduling.age_range = `${match[1]}-${match[2]} months`;
        }
        break;
      }
    }
    
    return scheduling;
  }

  // Find transport options near coordinates
  async findTransportOptions(latitude, longitude) {
    const transport = {
      parking: [],
      buses: [],
      trains: []
    };

    try {
      // Search for parking
      const parkingResults = await this.searchNearbyPlaces(latitude, longitude, 'parking');
      transport.parking = parkingResults.slice(0, 3).map(place => ({
        name: place.name,
        distance: this.calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng)
      }));

      // Search for bus stops
      const busResults = await this.searchNearbyPlaces(latitude, longitude, 'bus_station');
      transport.buses = busResults.slice(0, 3).map(place => ({
        name: place.name,
        distance: this.calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng)
      }));

      // Search for train stations
      const trainResults = await this.searchNearbyPlaces(latitude, longitude, 'train_station');
      transport.trains = trainResults.slice(0, 2).map(place => ({
        name: place.name,
        distance: this.calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng)
      }));

    } catch (error) {
      console.log('Transport search error:', error.message);
    }

    return transport;
  }

  async searchNearbyPlaces(lat, lng, type) {
    return new Promise((resolve, reject) => {
      const radius = 1000;
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result.results || []);
          } catch (error) {
            resolve([]);
          }
        });
      }).on('error', () => resolve([]));
    });
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 1000);
  }

  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  // Enhance a specific company's entries
  async enhanceCompanyEntries(companyName, limit = 10) {
    console.log(`\n🎯 Enhancing ${companyName} entries...`);
    
    const companyInfo = this.companyData[companyName];
    if (!companyInfo) {
      console.log(`❌ No enhancement data available for ${companyName}`);
      return 0;
    }
    
    const pattern = companyName.toLowerCase().replace(/\s+/g, '%');
    const result = await this.client.query(`
      SELECT id, name, address, venue, postcode, latitude, longitude, 
             day_of_week, time, age_group_min, age_group_max, contact_phone, website
      FROM classes 
      WHERE LOWER(name) LIKE '%${pattern}%'
      AND (day_of_week = '' OR time = '' OR contact_phone IS NULL OR latitude IS NULL)
      LIMIT ${limit}
    `);

    console.log(`Found ${result.rows.length} ${companyName} entries needing enhancement`);
    
    let enhanced = 0;

    for (const entry of result.rows) {
      console.log(`\nProcessing: ${entry.name} in ${entry.town}`);
      
      try {
        const updates = {};
        
        // Extract scheduling information from name
        const scheduling = this.extractSchedulingFromName(entry.name);
        if (scheduling.day && (entry.day_of_week === '' || !entry.day_of_week)) {
          updates.day_of_week = scheduling.day;
        }
        if (scheduling.time && (entry.time === '' || !entry.time)) {
          updates.time = scheduling.time;
        }
        
        // Extract age range from scheduling and convert to min/max
        if (scheduling.age_range) {
          const ageMatch = scheduling.age_range.match(/(\d+)-(\d+)/);
          if (ageMatch) {
            updates.age_group_min = parseInt(ageMatch[1]);
            updates.age_group_max = parseInt(ageMatch[2]);
          }
        }
        
        // Search for location data if missing coordinates
        if (!entry.latitude || !entry.longitude) {
          const franchiseLocation = this.extractFranchiseLocation(entry.name, companyName);
          const searchQuery = franchiseLocation ? 
            `${companyName} ${franchiseLocation} ${entry.town}` : 
            `${companyName} ${entry.town}`;
          
          const places = await this.searchGooglePlaces(searchQuery);
          
          if (places.length > 0) {
            const place = places[0];
            const details = await this.getPlaceDetails(place.place_id);
            
            if (details) {
              if (details.formatted_address) updates.address = details.formatted_address;
              if (details.formatted_phone_number) updates.contact_phone = details.formatted_phone_number;
              if (details.website) updates.website = details.website;
              if (details.geometry?.location) {
                updates.latitude = details.geometry.location.lat;
                updates.longitude = details.geometry.location.lng;
              }
              
              // Get transport information
              if (details.geometry?.location) {
                const transport = await this.findTransportOptions(
                  details.geometry.location.lat,
                  details.geometry.location.lng
                );
                
                if (transport.parking.length > 0) {
                  updates.parking_available = true;
                  updates.parking_type = transport.parking[0].name;
                  updates.parking_notes = `${transport.parking.length} parking options within ${Math.round(transport.parking[0].distance)}m`;
                }
                
                if (transport.buses.length > 0) {
                  updates.nearest_bus_stops = `{${transport.buses.map(b => `"${b.name} (${Math.round(b.distance)}m)"`).join(',')}}`;
                }
              }
            }
          }
        } else if (entry.latitude && entry.longitude) {
          // Enhance transport for existing coordinates
          const transport = await this.findTransportOptions(entry.latitude, entry.longitude);
          
          if (transport.parking.length > 0 && !updates.parking_available) {
            updates.parking_available = true;
            updates.parking_type = transport.parking[0].name;
            updates.parking_notes = `${transport.parking.length} parking options within ${Math.round(transport.parking[0].distance)}m`;
          }
          
          if (transport.buses.length > 0 && !entry.nearest_bus_stops) {
            updates.nearest_bus_stops = `{${transport.buses.map(b => `"${b.name} (${Math.round(b.distance)}m)"`).join(',')}}`;
          }
        }
        
        // Apply updates
        if (Object.keys(updates).length > 0) {
          const updateFields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
          const values = [entry.id, ...Object.values(updates)];
          
          await this.client.query(`UPDATE classes SET ${updateFields} WHERE id = $1`, values);
          
          console.log(`✅ Enhanced: ${entry.name}`);
          console.log(`   Updates: ${Object.keys(updates).join(', ')}`);
          enhanced++;
        } else {
          console.log(`⚪ No updates needed for: ${entry.name}`);
        }
        
        await sleep(1000); // Respect API limits
        
      } catch (error) {
        console.log(`❌ Error processing ${entry.name}: ${error.message}`);
      }
    }

    console.log(`🎉 Enhanced ${enhanced}/${result.rows.length} ${companyName} entries\n`);
    return enhanced;
  }

  async close() {
    await this.client.end();
  }
}

// Run enhancements for all top companies
async function enhanceAllTopCompanies() {
  const enhancer = new TopCompaniesEnhancer();
  
  try {
    await enhancer.initialize();
    
    console.log('🏆 ENHANCING TOP COMPANIES IN ORDER:');
    console.log('1. Baby Sensory (265 entries)');
    console.log('2. Toddler Sense (43 entries)');
    console.log('3. Water Babies (97 entries)');
    console.log('4. Tumble Tots (51 entries)');
    console.log('5. Tots Play (48 entries)');
    console.log('6. Sing and Sign (45 entries)\n');
    
    const companies = [
      'Baby Sensory',
      'Toddler Sense', 
      'Water Babies',
      'Tumble Tots',
      'Tots Play',
      'Sing and Sign'
    ];
    
    let totalEnhanced = 0;
    
    for (const company of companies) {
      const enhanced = await enhancer.enhanceCompanyEntries(company, 5);
      totalEnhanced += enhanced;
      await sleep(3000); // Pause between companies
    }
    
    console.log(`\n🎊 TOTAL ENHANCED: ${totalEnhanced} entries across all top companies!`);
    
  } catch (error) {
    console.error('Enhancement error:', error.message);
  } finally {
    await enhancer.close();
  }
}

enhanceAllTopCompanies();