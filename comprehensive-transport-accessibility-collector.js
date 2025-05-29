#!/usr/bin/env node

import { Client } from 'pg';
import fs from 'fs';

class ComprehensiveTransportAccessibilityCollector {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    this.processedCount = 0;
    this.enhancedCount = 0;
    this.batchSize = 50;
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.logFile = `transport_accessibility_log_${new Date().toISOString().split('T')[0]}.txt`;
  }

  async initialize() {
    if (!this.apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY environment variable is required');
    }
    
    await this.client.connect();
    console.log('🚀 Comprehensive Transport & Accessibility Collector Starting...');
    console.log('🚌 Gathering parking, transport, and accessibility data');
    this.log('System initialized');
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp}: ${message}\n`;
    console.log(message);
    fs.appendFileSync(this.logFile, logEntry);
  }

  async getClassesNeedingTransportData() {
    const query = `
      SELECT id, name, venue, address, postcode, latitude, longitude, town
      FROM classes 
      WHERE is_active = true 
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND (
          parking_available IS NULL 
          OR transport_accessibility IS NULL 
          OR transport_accessibility = ''
          OR venue_accessibility IS NULL 
          OR venue_accessibility = ''
          OR nearest_tube_station IS NULL 
          OR nearest_tube_station = ''
          OR image_urls IS NULL 
          OR image_urls = ''
        )
      ORDER BY 
        CASE 
          WHEN name ILIKE '%community centre%' OR name ILIKE '%leisure centre%' THEN 1
          WHEN venue ILIKE '%school%' OR venue ILIKE '%hall%' THEN 2
          ELSE 3
        END,
        id
      LIMIT $1 OFFSET $2
    `;
    return await this.client.query(query, [this.batchSize, this.processedCount]);
  }

  async findPlaceDetails(classItem) {
    try {
      const searchQuery = `${classItem.venue || classItem.name} ${classItem.address} ${classItem.postcode}`;
      const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&key=${this.apiKey}`;
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (searchData.candidates && searchData.candidates.length > 0) {
        const placeId = searchData.candidates[0].place_id;
        
        // Get detailed place information
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,wheelchair_accessible_entrance,business_status,opening_hours,photos&key=${this.apiKey}`;
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();
        
        return detailsData.result || null;
      }
      
      return null;
    } catch (error) {
      this.log(`❌ Error finding place for ${classItem.name}: ${error.message}`);
      return null;
    }
  }

  async findNearbyParking(latitude, longitude) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=500&type=parking&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const parkingSpots = data.results.slice(0, 3).map(place => ({
          name: place.name,
          distance: this.calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng)
        }));
        
        return {
          available: true,
          type: 'Nearby parking available',
          details: parkingSpots.map(p => `${p.name} (${Math.round(p.distance)}m)`).join(', ')
        };
      }
      
      return {
        available: false,
        type: 'Street parking',
        details: 'Check local parking restrictions'
      };
    } catch (error) {
      this.log(`❌ Error finding parking: ${error.message}`);
      return null;
    }
  }

  async findNearestTubeStation(latitude, longitude) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=2000&type=subway_station&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const nearest = data.results[0];
        const distance = this.calculateDistance(
          latitude, longitude,
          nearest.geometry.location.lat,
          nearest.geometry.location.lng
        );
        
        return {
          name: nearest.name,
          distance: Math.round(distance),
          walkingTime: Math.round(distance / 80) // Approximate walking time
        };
      }
      
      return null;
    } catch (error) {
      this.log(`❌ Error finding tube station: ${error.message}`);
      return null;
    }
  }

  async findNearbyBusStops(latitude, longitude) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=500&type=bus_station&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results.slice(0, 3).map(stop => ({
          name: stop.name,
          distance: Math.round(this.calculateDistance(
            latitude, longitude,
            stop.geometry.location.lat,
            stop.geometry.location.lng
          ))
        }));
      }
      
      return [];
    } catch (error) {
      this.log(`❌ Error finding bus stops: ${error.message}`);
      return [];
    }
  }

  async getBusinessPhotos(placeDetails) {
    try {
      if (placeDetails && placeDetails.photos && placeDetails.photos.length > 0) {
        const photoUrls = [];
        
        // Get up to 3 photos
        for (let i = 0; i < Math.min(3, placeDetails.photos.length); i++) {
          const photo = placeDetails.photos[i];
          const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${this.apiKey}`;
          photoUrls.push(photoUrl);
        }
        
        return photoUrls.join(',');
      }
      
      return null;
    } catch (error) {
      this.log(`❌ Error getting business photos: ${error.message}`);
      return null;
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  async enhanceClassTransportData(classItem) {
    try {
      this.log(`🔍 Processing: ${classItem.name}`);
      
      // Find Google Place details
      const placeDetails = await this.findPlaceDetails(classItem);
      
      // Gather transport and accessibility data
      const [parkingInfo, tubeStation, busStops, businessPhotos] = await Promise.all([
        this.findNearbyParking(classItem.latitude, classItem.longitude),
        this.findNearestTubeStation(classItem.latitude, classItem.longitude),
        this.findNearbyBusStops(classItem.latitude, classItem.longitude),
        this.getBusinessPhotos(placeDetails)
      ]);

      // Determine venue accessibility
      let venueAccessibility = 'Unknown';
      let accessibilityNotes = '';
      
      if (placeDetails) {
        if (placeDetails.wheelchair_accessible_entrance === true) {
          venueAccessibility = 'Wheelchair accessible';
          accessibilityNotes = 'Wheelchair accessible entrance confirmed';
        } else if (placeDetails.wheelchair_accessible_entrance === false) {
          venueAccessibility = 'Limited accessibility';
          accessibilityNotes = 'No wheelchair accessible entrance';
        }
      }

      // Create transport accessibility summary
      let transportSummary = [];
      
      if (tubeStation) {
        transportSummary.push(`${tubeStation.name} (${tubeStation.distance}m walk)`);
      }
      
      if (busStops.length > 0) {
        const nearestBus = busStops[0];
        transportSummary.push(`Bus stops nearby: ${nearestBus.name} (${nearestBus.distance}m)`);
      }
      
      if (parkingInfo && parkingInfo.available) {
        transportSummary.push('Parking available');
      }

      const transportAccessibility = transportSummary.length > 0 
        ? transportSummary.join(' | ') 
        : 'Public transport and parking details to be confirmed';

      // Update database
      await this.updateClassTransportData(classItem.id, {
        parkingAvailable: parkingInfo ? parkingInfo.available : null,
        parkingType: parkingInfo ? parkingInfo.type : null,
        parkingNotes: parkingInfo ? parkingInfo.details : null,
        nearestTubeStation: tubeStation ? `${tubeStation.name} (${tubeStation.distance}m)` : null,
        nearestBusStops: busStops.length > 0 ? busStops : null,
        transportAccessibility: transportAccessibility,
        venueAccessibility: venueAccessibility,
        accessibilityNotes: accessibilityNotes,
        imageUrls: businessPhotos
      });

      this.log(`✅ Enhanced: ${classItem.name}`);
      return true;

    } catch (error) {
      this.log(`❌ Error enhancing ${classItem.name}: ${error.message}`);
      return false;
    }
  }

  async updateClassTransportData(classId, data) {
    const query = `
      UPDATE classes 
      SET 
        parking_available = $1,
        parking_type = $2,
        parking_notes = $3,
        nearest_tube_station = $4,
        nearest_bus_stops = $5,
        transport_accessibility = $6,
        venue_accessibility = $7,
        accessibility_notes = $8,
        image_urls = $9
      WHERE id = $10
    `;

    await this.client.query(query, [
      data.parkingAvailable,
      data.parkingType,
      data.parkingNotes,
      data.nearestTubeStation,
      data.nearestBusStops,
      data.transportAccessibility,
      data.venueAccessibility,
      data.accessibilityNotes,
      data.imageUrls,
      classId
    ]);
  }

  async processBatch() {
    try {
      const result = await this.getClassesNeedingTransportData();
      const classes = result.rows;

      if (classes.length === 0) {
        this.log('✅ All classes processed!');
        return false;
      }

      this.log(`📦 Processing batch of ${classes.length} classes...`);

      for (const classItem of classes) {
        const success = await this.enhanceClassTransportData(classItem);
        if (success) {
          this.enhancedCount++;
        }
        
        // Rate limiting for Google API
        await this.sleep(200);
      }

      this.processedCount += classes.length;
      this.log(`✅ Batch complete. Enhanced: ${this.enhancedCount}`);
      
      return true;
    } catch (error) {
      this.log(`❌ Batch error: ${error.message}`);
      throw error;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async showProgress() {
    const result = await this.client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN transport_accessibility IS NOT NULL AND transport_accessibility != '' THEN 1 END) as with_transport,
        COUNT(CASE WHEN image_urls IS NOT NULL AND image_urls != '' THEN 1 END) as with_images
      FROM classes WHERE is_active = true
    `);
    
    const stats = result.rows[0];
    const transportPercentage = ((stats.with_transport / stats.total) * 100).toFixed(1);
    const imagePercentage = ((stats.with_images / stats.total) * 100).toFixed(1);
    
    this.log(`📊 Progress: ${stats.with_transport}/${stats.total} transport (${transportPercentage}%), ${stats.with_images} images (${imagePercentage}%)`);
    return stats;
  }

  async runCollection() {
    try {
      let hasMoreClasses = true;
      let batchNumber = 1;

      while (hasMoreClasses) {
        this.log(`\n🔄 Processing batch ${batchNumber}...`);
        hasMoreClasses = await this.processBatch();
        
        if (batchNumber % 3 === 0) {
          await this.showProgress();
        }
        
        batchNumber++;
      }

      const finalStats = await this.showProgress();
      this.log(`\n🎉 COMPLETE! Enhanced ${this.enhancedCount} classes with transport/accessibility data!`);

    } catch (error) {
      this.log(`❌ Fatal error: ${error.message}`);
      throw error;
    }
  }

  async close() {
    await this.client.end();
    this.log('Database connection closed');
  }
}

async function runComprehensiveTransportAccessibilityCollector() {
  const collector = new ComprehensiveTransportAccessibilityCollector();
  
  try {
    await collector.initialize();
    await collector.runCollection();
  } catch (error) {
    console.error('❌ Collection failed:', error);
    if (error.message.includes('GOOGLE_PLACES_API_KEY')) {
      console.log('\n📝 To use this script, you need a Google Places API key.');
      console.log('Please provide your GOOGLE_PLACES_API_KEY in the environment variables.');
    }
  } finally {
    await collector.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTransportAccessibilityCollector();
}