import { Pool } from 'pg';

class ComprehensiveCoordinateEnhancer {
  constructor() {
    this.client = null;
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.enhancedCount = 0;
    this.errorCount = 0;
    this.processedProviders = new Set();
  }

  async initialize() {
    console.log('Initializing comprehensive coordinate enhancement...');
    
    if (!this.apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY environment variable required');
    }

    this.client = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    console.log('Ready to enhance all franchise locations with precise coordinates');
  }

  async getAllClassesNeedingCoordinates() {
    const query = `
      SELECT id, name, provider_name, venue, town, postcode, address
      FROM classes 
      WHERE (latitude IS NULL OR longitude IS NULL) 
      AND venue IS NOT NULL 
      AND provider_name IN ('Baby Sensory', 'Water Babies', 'Monkey Music', 'Sing and Sign', 'Toddler Sense', 'Tumble Tots')
      AND LENGTH(venue) > 5
      AND LENGTH(venue) < 150
      ORDER BY provider_name, town, venue
    `;

    const result = await this.client.query(query);
    return result.rows;
  }

  async enhanceLocationBatch(classes) {
    console.log(`Processing ${classes.length} franchise locations for coordinate enhancement`);

    for (let i = 0; i < classes.length; i++) {
      const classItem = classes[i];
      
      try {
        const success = await this.enhanceClassLocation(classItem);
        
        if (success) {
          this.enhancedCount++;
          this.processedProviders.add(classItem.provider_name);
        } else {
          this.errorCount++;
        }

        // Progress indicator
        if ((i + 1) % 10 === 0) {
          console.log(`Progress: ${i + 1}/${classes.length} processed (${this.enhancedCount} enhanced, ${this.errorCount} errors)`);
        }

        // Rate limiting for Google Places API
        await this.sleep(150);

      } catch (error) {
        this.errorCount++;
        console.log(`Error processing ${classItem.provider_name} - ${classItem.venue}: ${error.message}`);
      }
    }
  }

  async enhanceClassLocation(classItem) {
    const cleanVenue = this.cleanAndOptimizeVenueName(classItem.venue);
    
    // Multiple search strategies for better results
    const searchQueries = [
      `${cleanVenue} ${classItem.town} UK`,
      `${cleanVenue} ${classItem.postcode || classItem.town}`,
      `${this.extractKeywords(cleanVenue)} ${classItem.town} UK`
    ];

    for (const query of searchQueries) {
      const placeDetails = await this.searchGooglePlaces(query);
      
      if (placeDetails && this.isRelevantLocation(placeDetails, classItem)) {
        await this.updateClassCoordinates(classItem.id, placeDetails);
        console.log(`Enhanced: ${classItem.provider_name} - ${cleanVenue} in ${classItem.town}`);
        return true;
      }
    }

    console.log(`No suitable location found for: ${cleanVenue} in ${classItem.town}`);
    return false;
  }

  cleanAndOptimizeVenueName(venue) {
    return venue
      .replace(/WOW Centre.*?For/g, 'WOW Centre')
      .replace(/All classes are held at our/gi, '')
      .replace(/Mondays?\s*-\s*|Tuesdays?\s*-\s*|Wednesdays?\s*-\s*|Thursdays?\s*-\s*|Fridays?\s*-\s*|Saturdays?\s*-\s*|Sundays?\s*-\s*/gi, '')
      .replace(/\b\d{4,}\b/g, '') // Remove long numbers
      .replace(/\b[A-Z]{2,}\d+[A-Z]*\b/g, '') // Remove postcodes
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);
  }

  extractKeywords(venue) {
    // Extract the most relevant parts of venue names
    const keywords = venue
      .replace(/Centre|Hall|Church|School|Club|Community/gi, '')
      .split(/\s+/)
      .filter(word => word.length > 2)
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
        await this.sleep(2000);
        return null;
      }

      return null;

    } catch (error) {
      console.log(`Google Places API error for "${query}": ${error.message}`);
      return null;
    }
  }

  isRelevantLocation(placeDetails, classItem) {
    // Basic validation to ensure we found a reasonable location
    const address = placeDetails.address.toLowerCase();
    const town = classItem.town.toLowerCase();
    
    // Check if the address contains the expected town/city
    return address.includes(town) || address.includes('uk') || address.includes('united kingdom');
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
        console.log(`Coordinate overflow for class ${classId} - skipping`);
      } else {
        throw error;
      }
    }
  }

  async runComprehensiveEnhancement() {
    try {
      await this.initialize();

      const allClasses = await this.getAllClassesNeedingCoordinates();
      console.log(`Found ${allClasses.length} franchise classes needing coordinate enhancement`);

      if (allClasses.length === 0) {
        console.log('All franchise classes already have coordinates');
        await this.showFinalStatus();
        return;
      }

      // Group by provider for organized processing
      const classesByProvider = {};
      allClasses.forEach(cls => {
        if (!classesByProvider[cls.provider_name]) {
          classesByProvider[cls.provider_name] = [];
        }
        classesByProvider[cls.provider_name].push(cls);
      });

      // Process each provider's classes
      for (const [provider, classes] of Object.entries(classesByProvider)) {
        console.log(`\nProcessing ${provider} classes (${classes.length} locations)`);
        await this.enhanceLocationBatch(classes);
      }

      await this.showComprehensiveResults();

    } catch (error) {
      console.log(`Enhancement error: ${error.message}`);
    } finally {
      if (this.client) await this.client.end();
    }
  }

  async showComprehensiveResults() {
    console.log('\n=== COMPREHENSIVE COORDINATE ENHANCEMENT COMPLETE ===');
    console.log(`Enhanced: ${this.enhancedCount} franchise locations`);
    console.log(`Errors: ${this.errorCount} locations`);
    console.log(`Providers processed: ${Array.from(this.processedProviders).join(', ')}`);
    
    // Get final enhancement status
    const statusQuery = `
      SELECT 
        provider_name,
        COUNT(*) as total_classes,
        COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as enhanced_classes,
        ROUND(100.0 * COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) / COUNT(*), 1) as percentage_enhanced
      FROM classes 
      WHERE provider_name IN ('Baby Sensory', 'Water Babies', 'Monkey Music', 'Sing and Sign', 'Toddler Sense', 'Tumble Tots')
      GROUP BY provider_name
      ORDER BY total_classes DESC
    `;
    
    const statusResult = await this.client.query(statusQuery);
    
    console.log('\nFranchise Enhancement Status:');
    statusResult.rows.forEach(row => {
      console.log(`${row.provider_name}: ${row.enhanced_classes}/${row.total_classes} classes (${row.percentage_enhanced}%)`);
    });

    // Show sample enhanced locations
    const sampleQuery = `
      SELECT provider_name, venue, town, latitude, longitude
      FROM classes 
      WHERE latitude IS NOT NULL 
      AND longitude IS NOT NULL
      AND provider_name IN ('Baby Sensory', 'Water Babies', 'Monkey Music', 'Sing and Sign', 'Toddler Sense', 'Tumble Tots')
      ORDER BY RANDOM()
      LIMIT 5
    `;
    
    const sampleResult = await this.client.query(sampleQuery);
    
    if (sampleResult.rows.length > 0) {
      console.log('\nSample enhanced franchise locations:');
      sampleResult.rows.forEach(row => {
        console.log(`${row.provider_name}: ${row.venue}, ${row.town} (${row.latitude}, ${row.longitude})`);
      });
    }

    console.log('\nFranchise coordinate enhancement system complete');
    console.log('All locations now ready for accurate map display and distance calculations');
  }

  async showFinalStatus() {
    const statusQuery = `
      SELECT 
        provider_name,
        COUNT(*) as total_classes,
        COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as enhanced_classes
      FROM classes 
      WHERE provider_name IN ('Baby Sensory', 'Water Babies', 'Monkey Music', 'Sing and Sign', 'Toddler Sense', 'Tumble Tots')
      GROUP BY provider_name
      ORDER BY total_classes DESC
    `;
    
    const result = await this.client.query(statusQuery);
    
    console.log('Current franchise enhancement status:');
    result.rows.forEach(row => {
      console.log(`${row.provider_name}: ${row.enhanced_classes}/${row.total_classes} classes with coordinates`);
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function runComprehensiveCoordinateEnhancer() {
  const enhancer = new ComprehensiveCoordinateEnhancer();
  await enhancer.runComprehensiveEnhancement();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveCoordinateEnhancer().catch(console.error);
}

export { ComprehensiveCoordinateEnhancer, runComprehensiveCoordinateEnhancer };