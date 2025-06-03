const { Pool } = require('pg');

class ScrapedAddressEnhancer {
  constructor() {
    this.client = null;
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.enhancedCount = 0;
    this.errorCount = 0;
  }

  async initialize() {
    console.log('Initializing Address Enhancement System...');
    
    if (!this.apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY environment variable required');
    }

    this.client = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    console.log('Address enhancer initialized');
  }

  async getClassesNeedingAddresses() {
    const query = `
      SELECT id, name, business_name, venue_name, address, town, postcode, website
      FROM classes 
      WHERE (postcode IS NULL OR latitude IS NULL) 
      AND venue_name IS NOT NULL 
      AND business_name IN ('Baby Sensory', 'Water Babies', 'Monkey Music', 'Sing and Sign', 'Toddler Sense', 'Tumble Tots')
      ORDER BY business_name, town
      LIMIT 50
    `;

    const result = await this.client.query(query);
    return result.rows;
  }

  async enhanceClassAddress(classItem) {
    try {
      const searchQuery = `${classItem.venue_name} ${classItem.town} UK`;
      const placeDetails = await this.searchGooglePlaces(searchQuery);

      if (placeDetails) {
        await this.updateClassLocation(classItem.id, placeDetails);
        this.enhancedCount++;
        console.log(`Enhanced: ${classItem.name} - ${classItem.venue_name}`);
      } else {
        this.errorCount++;
        console.log(`No results: ${classItem.name} - ${classItem.venue_name}`);
      }

    } catch (error) {
      this.errorCount++;
      console.log(`Error enhancing ${classItem.name}: ${error.message}`);
    }
  }

  async searchGooglePlaces(query) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const place = data.results[0];
        
        return {
          name: place.name,
          address: place.formatted_address,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          postcode: this.extractPostcode(place.formatted_address),
          place_id: place.place_id,
          phone: place.formatted_phone_number || null,
          website: place.website || null,
          rating: place.rating || null
        };
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

  async updateClassLocation(classId, placeDetails) {
    const updateQuery = `
      UPDATE classes 
      SET 
        address = $1,
        postcode = $2,
        latitude = $3,
        longitude = $4,
        google_place_id = $5,
        phone = $6,
        updated_at = NOW()
      WHERE id = $7
    `;

    await this.client.query(updateQuery, [
      placeDetails.address,
      placeDetails.postcode,
      placeDetails.latitude,
      placeDetails.longitude,
      placeDetails.place_id,
      placeDetails.phone,
      classId
    ]);
  }

  async runEnhancement() {
    try {
      await this.initialize();

      const classesNeedingAddresses = await this.getClassesNeedingAddresses();
      console.log(`Found ${classesNeedingAddresses.length} classes needing address enhancement`);

      for (const classItem of classesNeedingAddresses) {
        await this.enhanceClassAddress(classItem);
        
        // Rate limiting for Google Places API
        await this.sleep(100);
      }

      console.log('\n=== ADDRESS ENHANCEMENT COMPLETE ===');
      console.log(`Enhanced: ${this.enhancedCount} classes`);
      console.log(`Errors: ${this.errorCount} classes`);

    } catch (error) {
      console.log(`Enhancement error: ${error.message}`);
    } finally {
      if (this.client) await this.client.end();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function runAddressEnhancement() {
  const enhancer = new ScrapedAddressEnhancer();
  await enhancer.runEnhancement();
}

if (require.main === module) {
  runAddressEnhancement().catch(console.error);
}

module.exports = { ScrapedAddressEnhancer, runAddressEnhancement };