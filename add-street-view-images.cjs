const { Pool } = require('pg');
const https = require('https');

// Google Street View Static API configuration
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const STREET_VIEW_BASE_URL = 'https://maps.googleapis.com/maps/api/streetview';

class StreetViewEnhancer {
  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.processed = 0;
    this.enhanced = 0;
  }

  async addStreetViewImages() {
    console.log('🏢 ADDING GOOGLE STREET VIEW IMAGES');
    console.log('=' .repeat(50));
    
    if (!GOOGLE_API_KEY) {
      console.log('❌ GOOGLE_PLACES_API_KEY not found');
      console.log('Please provide your Google API key for Street View access');
      return;
    }

    const client = await this.pool.connect();
    
    try {
      // Get venues that need Street View images (first 20 for testing)
      const result = await client.query(`
        SELECT id, name, address, postcode, latitude, longitude 
        FROM classes 
        WHERE street_view_image_url IS NULL 
        AND address IS NOT NULL 
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
        LIMIT 20
      `);

      console.log(`📍 Found ${result.rows.length} venues needing Street View images`);

      for (const venue of result.rows) {
        await this.addStreetViewForVenue(client, venue);
        this.processed++;
        
        // Small delay to respect API limits
        await this.sleep(200);
      }

      console.log('\n🎉 STREET VIEW ENHANCEMENT COMPLETE!');
      console.log(`📊 Processed: ${this.processed} venues`);
      console.log(`🏢 Enhanced: ${this.enhanced} with Street View images`);

    } catch (error) {
      console.error('Error in Street View enhancement:', error.message);
    } finally {
      client.release();
      await this.pool.end();
    }
  }

  async addStreetViewForVenue(client, venue) {
    try {
      console.log(`🔍 Processing: ${venue.name}`);
      
      // Generate Google Street View Static API URL
      const streetViewUrl = this.generateStreetViewUrl(venue);
      
      // Test if the Street View image is available
      const isImageAvailable = await this.testStreetViewImage(streetViewUrl);
      
      if (isImageAvailable) {
        // Update database with Street View URL
        await client.query(
          'UPDATE classes SET street_view_image_url = $1 WHERE id = $2',
          [streetViewUrl, venue.id]
        );
        
        console.log(`✅ ${venue.name}: Street View image added`);
        this.enhanced++;
      } else {
        console.log(`⚠️ ${venue.name}: No Street View available`);
      }

    } catch (error) {
      console.log(`❌ ${venue.name}: Error - ${error.message}`);
    }
  }

  generateStreetViewUrl(venue) {
    const params = new URLSearchParams({
      size: '600x400',           // Image size
      location: `${venue.latitude},${venue.longitude}`,
      heading: '0',              // Direction camera is facing
      pitch: '0',                // Up/down angle
      fov: '90',                 // Field of view
      key: GOOGLE_API_KEY
    });

    return `${STREET_VIEW_BASE_URL}?${params.toString()}`;
  }

  async testStreetViewImage(url) {
    return new Promise((resolve) => {
      const testUrl = url + '&size=1x1'; // Tiny test image
      
      https.get(testUrl, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          // If we get actual image data, Street View is available
          resolve(response.statusCode === 200 && data.length > 1000);
        });
      }).on('error', () => {
        resolve(false);
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the Street View enhancement
async function runStreetViewEnhancement() {
  const enhancer = new StreetViewEnhancer();
  await enhancer.addStreetViewImages();
}

if (require.main === module) {
  runStreetViewEnhancement().catch(console.error);
}

module.exports = { StreetViewEnhancer };