import { Pool } from 'pg';

class WaterBabiesCoordinateEnhancer {
  constructor() {
    this.client = null;
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.enhancedCount = 0;
    this.errorCount = 0;
  }

  async initialize() {
    console.log('Initializing Water Babies coordinate enhancement...');
    
    if (!this.apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY environment variable required');
    }

    this.client = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    console.log('Ready to enhance Water Babies swimming class locations');
  }

  async getWaterBabiesClasses() {
    const query = `
      SELECT id, name, provider_name, venue, town, postcode, address
      FROM classes 
      WHERE (latitude IS NULL OR longitude IS NULL) 
      AND venue IS NOT NULL 
      AND provider_name = 'Water Babies'
      AND LENGTH(venue) > 5
      ORDER BY town, venue
    `;

    const result = await this.client.query(query);
    return result.rows;
  }

  async enhanceWaterBabiesLocation(classItem) {
    try {
      const cleanVenue = this.cleanWaterBabiesVenue(classItem.venue);
      
      // Water Babies specific search strategies
      const searchQueries = [
        `${cleanVenue} swimming pool ${classItem.town} UK`,
        `${cleanVenue} leisure centre ${classItem.town} UK`,
        `${cleanVenue} ${classItem.town} swimming`,
        `${this.extractPoolName(cleanVenue)} ${classItem.town} UK`
      ];

      console.log(`Searching Water Babies location: ${cleanVenue} in ${classItem.town}`);

      for (const query of searchQueries) {
        const placeDetails = await this.searchGooglePlaces(query);
        
        if (placeDetails && this.isValidSwimmingLocation(placeDetails, classItem)) {
          await this.updateClassCoordinates(classItem.id, placeDetails);
          this.enhancedCount++;
          console.log(`Enhanced: Water Babies - ${cleanVenue} in ${classItem.town}`);
          return true;
        }
        
        // Short delay between search attempts
        await this.sleep(100);
      }

      this.errorCount++;
      console.log(`No suitable swimming location found for: ${cleanVenue} in ${classItem.town}`);
      return false;

    } catch (error) {
      this.errorCount++;
      console.log(`Error enhancing Water Babies ${classItem.venue}: ${error.message}`);
      return false;
    }
  }

  cleanWaterBabiesVenue(venue) {
    return venue
      .replace(/Water Babies\s*/gi, '')
      .replace(/Swimming\s*Classes?\s*/gi, '')
      .replace(/Baby\s*Swimming\s*/gi, '')
      .replace(/\b\d{4,}\b/g, '') // Remove long numbers
      .replace(/\b[A-Z]{2,}\d+[A-Z]*\b/g, '') // Remove postcodes
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 80);
  }

  extractPoolName(venue) {
    // Extract the main pool/leisure centre name
    const keywords = venue
      .split(/\s+/)
      .filter(word => 
        word.length > 2 && 
        !['and', 'the', 'at', 'in', 'of', 'for'].includes(word.toLowerCase())
      )
      .slice(0, 3)
      .join(' ');
    
    return keywords || venue.split(' ')[0];
  }

  async searchGooglePlaces(query) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const place = data.results[0];
        
        return {
          name: place.name,
          address: place.formatted_address,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          postcode: this.extractPostcode(place.formatted_address),
          rating: place.rating || null,
          types: place.types || []
        };
      }

      if (data.status === 'OVER_QUERY_LIMIT') {
        console.log('Google Places API quota exceeded - pausing');
        await this.sleep(3000);
        return null;
      }

      return null;

    } catch (error) {
      console.log(`Google Places API error for "${query}": ${error.message}`);
      return null;
    }
  }

  isValidSwimmingLocation(placeDetails, classItem) {
    const address = placeDetails.address.toLowerCase();
    const town = classItem.town.toLowerCase();
    const types = placeDetails.types || [];
    
    // Check if it's a relevant location for swimming classes
    const hasSwimmingKeywords = address.includes('pool') || 
                               address.includes('leisure') || 
                               address.includes('sport') ||
                               types.some(type => type.includes('gym') || type.includes('establishment'));
    
    const isCorrectLocation = address.includes(town) || 
                             address.includes('uk') || 
                             address.includes('united kingdom');
    
    return isCorrectLocation && (hasSwimmingKeywords || types.length > 0);
  }

  extractPostcode(address) {
    const postcodeMatch = address.match(/([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i);
    return postcodeMatch ? postcodeMatch[1] : null;
  }

  async updateClassCoordinates(classId, placeDetails) {
    try {
      const updateQuery = `
        UPDATE classes 
        SET 
          latitude = $1,
          longitude = $2,
          address = COALESCE(NULLIF($3, ''), address),
          postcode = COALESCE(NULLIF($4, ''), postcode)
        WHERE id = $5
      `;

      await this.client.query(updateQuery, [
        placeDetails.latitude,
        placeDetails.longitude,
        placeDetails.address,
        placeDetails.postcode,
        classId
      ]);
    } catch (error) {
      if (error.message.includes('numeric field overflow')) {
        console.log(`Coordinate overflow for Water Babies class ${classId} - skipping`);
      } else {
        throw error;
      }
    }
  }

  async runWaterBabiesEnhancement() {
    try {
      await this.initialize();

      const waterBabiesClasses = await this.getWaterBabiesClasses();
      console.log(`Found ${waterBabiesClasses.length} Water Babies swimming classes needing coordinates`);

      if (waterBabiesClasses.length === 0) {
        console.log('All Water Babies classes already have coordinates');
        await this.showCurrentStatus();
        return;
      }

      for (let i = 0; i < waterBabiesClasses.length; i++) {
        const classItem = waterBabiesClasses[i];
        
        await this.enhanceWaterBabiesLocation(classItem);
        
        // Progress indicator
        if ((i + 1) % 5 === 0) {
          console.log(`Progress: ${i + 1}/${waterBabiesClasses.length} processed (${this.enhancedCount} enhanced, ${this.errorCount} errors)`);
        }

        // Rate limiting for Google Places API
        await this.sleep(200);
      }

      await this.showWaterBabiesResults();

    } catch (error) {
      console.log(`Water Babies enhancement error: ${error.message}`);
    } finally {
      if (this.client) await this.client.end();
    }
  }

  async showWaterBabiesResults() {
    console.log('\n=== WATER BABIES COORDINATE ENHANCEMENT COMPLETE ===');
    console.log(`Enhanced: ${this.enhancedCount} Water Babies swimming locations`);
    console.log(`Errors: ${this.errorCount} locations`);
    
    // Get final Water Babies status
    const statusQuery = `
      SELECT 
        COUNT(*) as total_classes,
        COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as enhanced_classes,
        ROUND(100.0 * COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) / COUNT(*), 1) as percentage_enhanced,
        COUNT(DISTINCT town) as towns_covered
      FROM classes 
      WHERE provider_name = 'Water Babies'
    `;
    
    const statusResult = await this.client.query(statusQuery);
    const status = statusResult.rows[0];
    
    console.log(`\nWater Babies Enhancement Status:`);
    console.log(`${status.enhanced_classes}/${status.total_classes} swimming classes (${status.percentage_enhanced}%) across ${status.towns_covered} towns`);

    // Show sample enhanced Water Babies locations
    const sampleQuery = `
      SELECT venue, town, latitude, longitude
      FROM classes 
      WHERE latitude IS NOT NULL 
      AND longitude IS NOT NULL
      AND provider_name = 'Water Babies'
      ORDER BY RANDOM()
      LIMIT 5
    `;
    
    const sampleResult = await this.client.query(sampleQuery);
    
    if (sampleResult.rows.length > 0) {
      console.log('\nSample enhanced Water Babies swimming locations:');
      sampleResult.rows.forEach(row => {
        console.log(`${row.venue}, ${row.town} (${row.latitude}, ${row.longitude})`);
      });
    }

    console.log('\nWater Babies swimming class locations now ready for accurate map display');
  }

  async showCurrentStatus() {
    const statusQuery = `
      SELECT 
        COUNT(*) as total_classes,
        COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as enhanced_classes
      FROM classes 
      WHERE provider_name = 'Water Babies'
    `;
    
    const result = await this.client.query(statusQuery);
    const status = result.rows[0];
    
    console.log(`Water Babies current status: ${status.enhanced_classes}/${status.total_classes} classes with coordinates`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function runWaterBabiesCoordinateEnhancer() {
  const enhancer = new WaterBabiesCoordinateEnhancer();
  await enhancer.runWaterBabiesEnhancement();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWaterBabiesCoordinateEnhancer().catch(console.error);
}

export { WaterBabiesCoordinateEnhancer, runWaterBabiesCoordinateEnhancer };