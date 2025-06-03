import { Pool } from 'pg';

class StreamlinedAddressEnhancer {
  constructor() {
    this.client = null;
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.enhancedCount = 0;
    this.errorCount = 0;
  }

  async initialize() {
    console.log('Initializing streamlined address enhancement...');
    
    if (!this.apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY environment variable required');
    }

    this.client = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    console.log('Ready to enhance franchise addresses with Google Places API');
  }

  async getClassesNeedingEnhancement() {
    const query = `
      SELECT id, name, provider_name, venue, town, postcode
      FROM classes 
      WHERE (latitude IS NULL OR longitude IS NULL) 
      AND venue IS NOT NULL 
      AND provider_name IN ('Baby Sensory', 'Water Babies', 'Monkey Music', 'Sing and Sign', 'Toddler Sense', 'Tumble Tots')
      AND created_at > NOW() - INTERVAL '24 hours'
      AND LENGTH(venue) > 10
      AND LENGTH(venue) < 100
      ORDER BY provider_name, town
      LIMIT 100
    `;

    const result = await this.client.query(query);
    return result.rows;
  }

  async enhanceClassLocation(classItem) {
    try {
      const cleanVenue = this.cleanVenueName(classItem.venue);
      const searchQuery = `${cleanVenue} ${classItem.town} UK`;
      
      console.log(`Searching: ${searchQuery}`);
      
      const placeDetails = await this.searchGooglePlaces(searchQuery);

      if (placeDetails) {
        await this.updateClassCoordinates(classItem.id, placeDetails);
        this.enhancedCount++;
        console.log(`Enhanced: ${classItem.provider_name} - ${cleanVenue} in ${classItem.town}`);
        return true;
      } else {
        this.errorCount++;
        console.log(`No results for: ${cleanVenue} in ${classItem.town}`);
        return false;
      }

    } catch (error) {
      this.errorCount++;
      console.log(`Error enhancing ${classItem.name}: ${error.message}`);
      return false;
    }
  }

  cleanVenueName(venue) {
    // Clean up venue names that may have data quality issues
    return venue
      .replace(/WOW Centre.*?For/g, 'WOW Centre')
      .replace(/\d{4,}/g, '') // Remove long numbers
      .replace(/([A-Z]{2,}\d+[A-Z]*)/g, '') // Remove postcodes
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 80);
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
          rating: place.rating || null
        };
      }

      if (data.status === 'OVER_QUERY_LIMIT') {
        console.log('Google Places API quota exceeded');
        return null;
      }

      return null;

    } catch (error) {
      console.log(`Google Places API error: ${error.message}`);
      return null;
    }
  }

  extractPostcode(address) {
    const postcodeMatch = address.match(/([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i);
    return postcodeMatch ? postcodeMatch[1] : null;
  }

  async updateClassCoordinates(classId, placeDetails) {
    const updateQuery = `
      UPDATE classes 
      SET 
        latitude = $1,
        longitude = $2,
        address = COALESCE($3, address),
        postcode = COALESCE($4, postcode)
      WHERE id = $5
    `;

    await this.client.query(updateQuery, [
      placeDetails.latitude,
      placeDetails.longitude,
      placeDetails.address,
      placeDetails.postcode,
      classId
    ]);
  }

  async runStreamlinedEnhancement() {
    try {
      await this.initialize();

      const classesNeedingEnhancement = await this.getClassesNeedingEnhancement();
      console.log(`Found ${classesNeedingEnhancement.length} franchise classes needing coordinate enhancement`);

      if (classesNeedingEnhancement.length === 0) {
        console.log('No classes need enhancement at this time');
        return;
      }

      for (const classItem of classesNeedingEnhancement) {
        await this.enhanceClassLocation(classItem);
        
        // Rate limiting for Google Places API (2000 requests per day limit)
        await this.sleep(200);
      }

      await this.showEnhancementResults();

    } catch (error) {
      console.log(`Enhancement error: ${error.message}`);
    } finally {
      if (this.client) await this.client.end();
    }
  }

  async showEnhancementResults() {
    console.log('\n=== ADDRESS ENHANCEMENT COMPLETE ===');
    console.log(`Enhanced: ${this.enhancedCount} franchise classes`);
    console.log(`Errors: ${this.errorCount} classes`);
    
    // Show sample of enhanced data
    const sampleQuery = `
      SELECT provider_name, venue, town, latitude, longitude
      FROM classes 
      WHERE latitude IS NOT NULL 
      AND longitude IS NOT NULL
      AND provider_name IN ('Baby Sensory', 'Water Babies', 'Monkey Music', 'Sing and Sign', 'Toddler Sense', 'Tumble Tots')
      AND created_at > NOW() - INTERVAL '3 hours'
      LIMIT 5
    `;
    
    const sampleResult = await this.client.query(sampleQuery);
    
    if (sampleResult.rows.length > 0) {
      console.log('\nSample enhanced locations:');
      sampleResult.rows.forEach(row => {
        console.log(`${row.provider_name}: ${row.venue}, ${row.town} (${row.latitude}, ${row.longitude})`);
      });
    }

    // Get total enhanced count
    const totalQuery = `
      SELECT COUNT(*) as enhanced_count
      FROM classes 
      WHERE latitude IS NOT NULL 
      AND longitude IS NOT NULL
      AND provider_name IN ('Baby Sensory', 'Water Babies', 'Monkey Music', 'Sing and Sign', 'Toddler Sense', 'Tumble Tots')
    `;
    
    const totalResult = await this.client.query(totalQuery);
    console.log(`\nTotal franchise classes with coordinates: ${totalResult.rows[0].enhanced_count}`);
    
    if (this.enhancedCount > 0) {
      console.log('\nFranchise location data enhancement successful');
      console.log('Classes now have accurate coordinates for map display and distance calculations');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function runStreamlinedAddressEnhancer() {
  const enhancer = new StreamlinedAddressEnhancer();
  await enhancer.runStreamlinedEnhancement();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runStreamlinedAddressEnhancer().catch(console.error);
}

export { StreamlinedAddressEnhancer, runStreamlinedAddressEnhancer };