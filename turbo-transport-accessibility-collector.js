#!/usr/bin/env node

import { Client } from 'pg';
import fs from 'fs';

class TurboTransportAccessibilityCollector {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    this.processedCount = 0;
    this.enhancedCount = 0;
    this.batchSize = 100; // Increased batch size
    this.concurrentRequests = 8; // Process multiple venues in parallel
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.logFile = `turbo_transport_log_${new Date().toISOString().split('T')[0]}.txt`;
    this.processedVenues = new Set(); // Track processed venues to avoid duplicates
    this.venueCache = new Map(); // Cache results for duplicate venues
  }

  async initialize() {
    if (!this.apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY environment variable is required');
    }
    
    await this.client.connect();
    console.log('🚀 Turbo Transport & Accessibility Collector Starting...');
    console.log('⚡ Optimized for maximum speed and quality');
    this.log('System initialized with turbo settings');
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp}: ${message}\n`;
    console.log(message);
    fs.appendFileSync(this.logFile, logEntry);
  }

  async getUniqueClassesNeedingTransportData() {
    const query = `
      WITH unique_venues AS (
        SELECT DISTINCT ON (venue, postcode) 
          id, name, venue, address, postcode, latitude, longitude, town
        FROM classes 
        WHERE is_active = true 
          AND latitude IS NOT NULL 
          AND longitude IS NOT NULL
          AND (
            transport_accessibility IS NULL 
            OR transport_accessibility = ''
            OR image_urls IS NULL 
            OR image_urls = ''
          )
      )
      SELECT * FROM unique_venues
      ORDER BY 
        CASE 
          WHEN venue ILIKE '%leisure centre%' OR venue ILIKE '%community centre%' THEN 1
          WHEN venue ILIKE '%school%' OR venue ILIKE '%hall%' THEN 2
          WHEN venue ILIKE '%gymnastics%' OR venue ILIKE '%dance%' THEN 3
          ELSE 4
        END,
        venue, postcode
      LIMIT $1 OFFSET $2
    `;
    return await this.client.query(query, [this.batchSize, this.processedCount]);
  }

  async findPlaceDetailsOptimized(classItem) {
    const venueKey = `${classItem.venue || classItem.name}_${classItem.postcode}`;
    
    // Check cache first
    if (this.venueCache.has(venueKey)) {
      return this.venueCache.get(venueKey);
    }

    try {
      const searchQuery = `${classItem.venue || classItem.name} ${classItem.postcode}`;
      const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&key=${this.apiKey}`;
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (searchData.candidates && searchData.candidates.length > 0) {
        const placeId = searchData.candidates[0].place_id;
        
        // Get comprehensive place information including contact details
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,wheelchair_accessible_entrance,business_status,opening_hours,photos,geometry,website,formatted_phone_number&key=${this.apiKey}`;
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();
        
        const result = detailsData.result || null;
        
        // Cache the result
        this.venueCache.set(venueKey, result);
        return result;
      }
      
      this.venueCache.set(venueKey, null);
      return null;
    } catch (error) {
      this.log(`❌ Error finding place for ${classItem.name}: ${error.message}`);
      this.venueCache.set(venueKey, null);
      return null;
    }
  }

  async findNearbyServicesOptimized(latitude, longitude) {
    try {
      // Run parking, tube, and bus searches in parallel
      const [parkingData, tubeData, busData] = await Promise.all([
        this.findNearbyParking(latitude, longitude),
        this.findNearestTubeStation(latitude, longitude),
        this.findNearbyBusStops(latitude, longitude)
      ]);

      return { parkingData, tubeData, busData };
    } catch (error) {
      this.log(`❌ Error finding nearby services: ${error.message}`);
      return { parkingData: null, tubeData: null, busData: [] };
    }
  }

  async findNearbyParking(latitude, longitude) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=300&type=parking&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const parkingSpots = data.results.slice(0, 2).map(place => ({
          name: place.name,
          distance: this.calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng)
        }));
        
        return {
          available: true,
          type: 'Nearby parking',
          details: parkingSpots.map(p => `${p.name} (${Math.round(p.distance)}m)`).join(', ')
        };
      }
      
      return {
        available: false,
        type: 'Street parking',
        details: 'Check local restrictions'
      };
    } catch (error) {
      return null;
    }
  }

  async findNearestTubeStation(latitude, longitude) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=1500&type=subway_station&key=${this.apiKey}`;
      
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
          walkingTime: Math.round(distance / 80)
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async findNearbyBusStops(latitude, longitude) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=400&type=bus_station&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results.slice(0, 2).map(stop => ({
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
      return [];
    }
  }

  async getBusinessPhotosOptimized(placeDetails) {
    try {
      if (placeDetails && placeDetails.photos && placeDetails.photos.length > 0) {
        // Get up to 2 photos for faster processing
        const photoUrls = placeDetails.photos.slice(0, 2).map(photo => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${this.apiKey}`
        );
        
        return photoUrls.join(',');
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
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

  async extractEmailFromWebsite(website) {
    try {
      if (!website) return null;
      
      const response = await fetch(website, { 
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)' }
      });
      const html = await response.text();
      
      // Look for email addresses in the HTML
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const emails = html.match(emailRegex);
      
      if (emails && emails.length > 0) {
        // Filter out common generic emails and return the first relevant one
        const filteredEmails = emails.filter(email => 
          !email.includes('noreply') && 
          !email.includes('no-reply') &&
          !email.includes('donotreply') &&
          !email.includes('example.com') &&
          !email.includes('test@')
        );
        
        return filteredEmails[0] || null;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async enhanceClassTransportDataOptimized(classItem) {
    try {
      const venueKey = `${classItem.venue || classItem.name}_${classItem.postcode}`;
      
      // Skip if already processed this venue
      if (this.processedVenues.has(venueKey)) {
        return false;
      }

      // Get place details and nearby services in parallel
      const [placeDetails, nearbyServices] = await Promise.all([
        this.findPlaceDetailsOptimized(classItem),
        this.findNearbyServicesOptimized(classItem.latitude, classItem.longitude)
      ]);

      const { parkingData, tubeData, busData } = nearbyServices;
      const businessPhotos = await this.getBusinessPhotosOptimized(placeDetails);

      // Extract contact information
      let contactEmail = null;
      let contactPhone = null;
      let businessWebsite = null;

      if (placeDetails) {
        contactPhone = placeDetails.formatted_phone_number || null;
        businessWebsite = placeDetails.website || null;
        
        // Try to extract email from the business website
        if (businessWebsite) {
          contactEmail = await this.extractEmailFromWebsite(businessWebsite);
        }
      }

      // Determine accessibility
      let venueAccessibility = 'To be confirmed';
      let accessibilityNotes = 'Accessibility information to be verified';
      
      if (placeDetails) {
        if (placeDetails.wheelchair_accessible_entrance === true) {
          venueAccessibility = 'Wheelchair accessible';
          accessibilityNotes = 'Wheelchair accessible entrance confirmed';
        } else if (placeDetails.wheelchair_accessible_entrance === false) {
          venueAccessibility = 'Limited accessibility';
          accessibilityNotes = 'No wheelchair accessible entrance confirmed';
        }
      }

      // Build transport summary
      const transportParts = [];
      
      if (tubeData) {
        transportParts.push(`${tubeData.name} (${tubeData.distance}m walk)`);
      }
      
      if (busData.length > 0) {
        transportParts.push(`Bus: ${busData[0].name} (${busData[0].distance}m)`);
      }
      
      if (parkingData && parkingData.available) {
        transportParts.push('Parking available');
      }

      const transportAccessibility = transportParts.length > 0 
        ? transportParts.join(' | ') 
        : 'Transport details to be confirmed';

      // Update all classes for this venue
      await this.updateAllClassesForVenue(classItem, {
        parkingAvailable: parkingData ? parkingData.available : null,
        parkingType: parkingData ? parkingData.type : null,
        parkingNotes: parkingData ? parkingData.details : null,
        nearestTubeStation: tubeData ? `${tubeData.name} (${tubeData.distance}m)` : null,
        nearestBusStops: busData.length > 0 ? busData : null,
        transportAccessibility: transportAccessibility,
        venueAccessibility: venueAccessibility,
        accessibilityNotes: accessibilityNotes,
        imageUrls: businessPhotos,
        contactEmail: contactEmail,
        contactPhone: contactPhone,
        businessWebsite: businessWebsite
      });

      this.processedVenues.add(venueKey);
      this.log(`✅ Enhanced venue: ${classItem.venue || classItem.name}${contactEmail ? ' (with email)' : ''}`);
      return true;

    } catch (error) {
      this.log(`❌ Error enhancing ${classItem.name}: ${error.message}`);
      return false;
    }
  }

  async updateAllClassesForVenue(classItem, data) {
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
        image_urls = $9,
        email = COALESCE($10, email),
        phone = COALESCE($11, phone),
        website = COALESCE($12, website)
      WHERE (venue = $13 OR name = $13) 
        AND postcode = $14 
        AND is_active = true
    `;

    const result = await this.client.query(query, [
      data.parkingAvailable,
      data.parkingType,
      data.parkingNotes,
      data.nearestTubeStation,
      data.nearestBusStops,
      data.transportAccessibility,
      data.venueAccessibility,
      data.accessibilityNotes,
      data.imageUrls,
      data.contactEmail,
      data.contactPhone,
      data.businessWebsite,
      classItem.venue || classItem.name,
      classItem.postcode
    ]);

    return result.rowCount;
  }

  async processBatchConcurrently() {
    try {
      const result = await this.getUniqueClassesNeedingTransportData();
      const classes = result.rows;

      if (classes.length === 0) {
        this.log('✅ All venues processed!');
        return false;
      }

      this.log(`📦 Processing batch of ${classes.length} unique venues...`);

      // Process venues in smaller concurrent chunks
      const chunkSize = this.concurrentRequests;
      const chunks = [];
      for (let i = 0; i < classes.length; i += chunkSize) {
        chunks.push(classes.slice(i, i + chunkSize));
      }

      let batchEnhanced = 0;

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(classItem => 
          this.enhanceClassTransportDataOptimized(classItem)
        );
        
        const results = await Promise.all(chunkPromises);
        batchEnhanced += results.filter(success => success).length;
        
        // Brief delay between chunks to respect API limits
        await this.sleep(500);
      }

      this.processedCount += classes.length;
      this.enhancedCount += batchEnhanced;
      this.log(`✅ Batch complete. Enhanced ${batchEnhanced} venues. Total: ${this.enhancedCount}`);
      
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
        COUNT(CASE WHEN image_urls IS NOT NULL AND image_urls != '' THEN 1 END) as with_images,
        COUNT(CASE WHEN parking_available = true THEN 1 END) as with_parking
      FROM classes WHERE is_active = true
    `);
    
    const stats = result.rows[0];
    const transportPercentage = ((stats.with_transport / stats.total) * 100).toFixed(1);
    const imagePercentage = ((stats.with_images / stats.total) * 100).toFixed(1);
    
    this.log(`📊 Progress: ${stats.with_transport}/${stats.total} transport (${transportPercentage}%), ${stats.with_images} images (${imagePercentage}%), ${stats.with_parking} parking`);
    return stats;
  }

  async runTurboCollection() {
    try {
      let hasMoreClasses = true;
      let batchNumber = 1;

      while (hasMoreClasses) {
        const startTime = Date.now();
        this.log(`\n🔄 Processing batch ${batchNumber}...`);
        
        hasMoreClasses = await this.processBatchConcurrently();
        
        const duration = Date.now() - startTime;
        const rate = this.enhancedCount > 0 ? Math.round(this.enhancedCount / ((Date.now() - startTime) / 1000)) : 0;
        
        this.log(`⚡ Batch ${batchNumber} completed in ${Math.round(duration/1000)}s (${rate} venues/sec)`);
        
        if (batchNumber % 2 === 0) {
          await this.showProgress();
        }
        
        batchNumber++;
      }

      const finalStats = await this.showProgress();
      this.log(`\n🎉 TURBO COMPLETE! Enhanced ${this.enhancedCount} venues with transport data!`);
      this.log(`📈 Final coverage: ${finalStats.with_transport} classes with transport data`);

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

async function runTurboTransportAccessibilityCollector() {
  const collector = new TurboTransportAccessibilityCollector();
  
  try {
    await collector.initialize();
    await collector.runTurboCollection();
  } catch (error) {
    console.error('❌ Collection failed:', error);
    if (error.message.includes('GOOGLE_PLACES_API_KEY')) {
      console.log('\n📝 To use this script, you need a Google Places API key.');
    }
  } finally {
    await collector.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTurboTransportAccessibilityCollector();
}