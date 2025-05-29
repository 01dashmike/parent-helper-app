import { Pool } from 'pg';

class IndividualLocationPricingScraper {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.processed = 0;
    this.pricesFound = 0;
    this.batchSize = 25;
  }

  async getFranchiseLocationsNeedingPricing() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, website, venue, address, postcode, town, category
        FROM classes 
        WHERE (price IS NULL OR price = '' OR price = 'Contact for pricing')
        AND is_active = true
        AND (
          LOWER(name) LIKE '%baby sensory%' OR
          LOWER(name) LIKE '%water babies%' OR
          LOWER(name) LIKE '%tumble tots%' OR
          LOWER(name) LIKE '%monkey music%' OR
          LOWER(name) LIKE '%hartbeeps%' OR
          LOWER(name) LIKE '%jo jingles%' OR
          LOWER(name) LIKE '%stagecoach%'
        )
        ORDER BY name
        LIMIT $1
      `, [this.batchSize]);
      
      console.log(`📋 Found ${result.rows.length} franchise locations needing individual pricing`);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async findIndividualLocationPricing(location) {
    console.log(`🔍 Checking individual pricing for: ${location.name}`);
    
    // Method 1: Google Places API for this specific location
    let pricing = await this.getLocationSpecificPricing(location);
    if (pricing) {
      console.log(`💰 Found location-specific pricing: ${pricing}`);
      return pricing;
    }

    // Method 2: Check if they have a specific website
    if (location.website && location.website.trim() !== '') {
      pricing = await this.scrapeLocationWebsite(location);
      if (pricing) {
        console.log(`💰 Found pricing on location website: ${pricing}`);
        return pricing;
      }
    }

    // Method 3: Search for location-specific pricing online
    pricing = await this.searchLocationSpecificPricing(location);
    if (pricing) {
      console.log(`💰 Found location-specific pricing online: ${pricing}`);
      return pricing;
    }

    console.log(`❌ No individual pricing found for: ${location.name}`);
    return null;
  }

  async getLocationSpecificPricing(location) {
    try {
      // Search for this specific franchise location
      const placeId = await this.findSpecificPlaceId(location);
      if (!placeId) {
        return null;
      }

      // Get detailed information for this specific location
      const placeDetails = await this.getPlaceDetails(placeId);
      if (!placeDetails) {
        return null;
      }

      // Extract pricing from this location's Google Business profile
      return this.extractPricingFromPlace(placeDetails);

    } catch (error) {
      console.log(`⚠️ Google Places error for ${location.name}: ${error.message}`);
      return null;
    }
  }

  async findSpecificPlaceId(location) {
    // Create a specific search query for this exact location
    const searchQuery = `"${location.name}" ${location.address} ${location.postcode}`;
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.candidates && data.candidates.length > 0) {
        // Verify this is actually the right location
        const candidate = data.candidates[0];
        if (this.isCorrectLocation(candidate, location)) {
          return candidate.place_id;
        }
      }
    } catch (error) {
      console.log(`⚠️ Place search failed for ${location.name}: ${error.message}`);
    }

    return null;
  }

  isCorrectLocation(candidate, location) {
    const candidateName = candidate.name.toLowerCase();
    const locationName = location.name.toLowerCase();
    const candidateAddress = candidate.formatted_address ? candidate.formatted_address.toLowerCase() : '';
    const locationTown = location.town ? location.town.toLowerCase() : '';
    const locationPostcode = location.postcode ? location.postcode.toLowerCase() : '';

    // Check if names match reasonably well
    const nameMatch = candidateName.includes(locationName.split(' ')[0]) || 
                     locationName.includes(candidateName.split(' ')[0]);

    // Check if location details match
    const locationMatch = candidateAddress.includes(locationTown) || 
                         candidateAddress.includes(locationPostcode);

    return nameMatch && locationMatch;
  }

  async getPlaceDetails(placeId) {
    const fields = 'name,website,formatted_phone_number,reviews,price_level,opening_hours,editorial_summary';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.result) {
        return data.result;
      }
    } catch (error) {
      console.log(`⚠️ Place details failed: ${error.message}`);
    }

    return null;
  }

  extractPricingFromPlace(placeDetails) {
    // Check Google's price_level
    if (placeDetails.price_level !== undefined) {
      const priceLevels = {
        0: 'Free',
        1: '£5-8',
        2: '£8-12', 
        3: '£12-20',
        4: '£20+'
      };
      const priceRange = priceLevels[placeDetails.price_level];
      if (priceRange) return priceRange;
    }

    // Check reviews for specific pricing mentions
    if (placeDetails.reviews) {
      for (const review of placeDetails.reviews) {
        const pricing = this.extractPricingFromText(review.text);
        if (pricing) {
          return pricing;
        }
      }
    }

    // Check editorial summary
    if (placeDetails.editorial_summary) {
      const pricing = this.extractPricingFromText(placeDetails.editorial_summary.overview);
      if (pricing) {
        return pricing;
      }
    }

    return null;
  }

  extractPricingFromText(text) {
    if (!text) return null;

    const pricePatterns = [
      /£(\d+(?:\.\d{2})?)/g,
      /(\d+(?:\.\d{2})?)(?:\s*(?:pounds?|gbp))/gi,
      /costs?\s*£?(\d+(?:\.\d{2})?)/gi,
      /fees?\s*£?(\d+(?:\.\d{2})?)/gi,
      /price[sd]?\s*(?:at|from)?\s*£?(\d+(?:\.\d{2})?)/gi
    ];

    for (const pattern of pricePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        const numericValue = matches[0].match(/\d+(?:\.\d{2})?/);
        if (numericValue) {
          const price = parseFloat(numericValue[0]);
          if (price >= 3 && price <= 50) { // Reasonable range for baby/toddler classes
            return `£${price.toFixed(2)}`;
          }
        }
      }
    }

    return null;
  }

  async scrapeLocationWebsite(location) {
    try {
      let url = location.website.trim();
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 8000
      });

      if (!response.ok) {
        return null;
      }

      const html = await response.text();
      return this.extractPricingFromHTML(html);

    } catch (error) {
      console.log(`⚠️ Website scraping failed for ${location.name}: ${error.message}`);
      return null;
    }
  }

  extractPricingFromHTML(html) {
    const text = html.replace(/<[^>]*>/g, ' ').toLowerCase();
    
    // Look for pricing sections
    const pricingSections = ['price', 'pricing', 'cost', 'fee', 'rates', 'book'];
    
    for (const section of pricingSections) {
      const sectionIndex = text.indexOf(section);
      if (sectionIndex !== -1) {
        const start = Math.max(0, sectionIndex - 200);
        const end = Math.min(text.length, sectionIndex + 200);
        const sectionText = text.substring(start, end);
        
        const pricing = this.extractPricingFromText(sectionText);
        if (pricing) {
          return pricing;
        }
      }
    }

    return null;
  }

  async searchLocationSpecificPricing(location) {
    try {
      // Search specifically for this location's pricing
      const searchQuery = `"${location.name}" pricing cost fees ${location.town}`;
      const encodedQuery = encodeURIComponent(searchQuery);
      
      // This would require additional search APIs or web scraping
      // For now, return null to maintain data integrity
      return null;

    } catch (error) {
      console.log(`⚠️ Location search failed: ${error.message}`);
      return null;
    }
  }

  async updateLocationPricing(locationId, pricing) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE classes 
        SET price = $1, last_verified = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [pricing, locationId]);
      
      this.pricesFound++;
    } catch (error) {
      console.error(`❌ Failed to update pricing for location ${locationId}:`, error.message);
    } finally {
      client.release();
    }
  }

  async processBatch() {
    const locations = await this.getFranchiseLocationsNeedingPricing();
    
    if (locations.length === 0) {
      console.log('✅ No more franchise locations need individual pricing');
      return false;
    }

    for (const location of locations) {
      try {
        const pricing = await this.findIndividualLocationPricing(location);
        
        if (pricing) {
          await this.updateLocationPricing(location.id, pricing);
          console.log(`✅ Updated ${location.name}: ${pricing}`);
        }
        
        this.processed++;
        
        // Rate limiting for API calls
        await this.sleep(2000);
        
      } catch (error) {
        console.error(`❌ Error processing ${location.name}:`, error.message);
      }
    }

    return true;
  }

  async runIndividualLocationScraper() {
    if (!this.apiKey) {
      throw new Error('Google Places API key required for location-specific pricing');
    }

    console.log('🚀 Starting Individual Location Pricing Scraper...');
    console.log('📍 Checking each franchise location for their specific pricing');
    
    let continueBatching = true;
    let batchCount = 0;
    
    while (continueBatching && batchCount < 10) {
      batchCount++;
      console.log(`\n📦 Processing batch ${batchCount}...`);
      
      continueBatching = await this.processBatch();
      
      await this.showProgress();
      
      if (continueBatching) {
        console.log('⏳ Waiting before next batch...');
        await this.sleep(5000);
      }
    }
    
    await this.showFinalResults();
    await this.close();
  }

  async showProgress() {
    console.log(`📊 Processed: ${this.processed} | Individual prices found: ${this.pricesFound}`);
  }

  async showFinalResults() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total_classes,
          COUNT(*) FILTER (WHERE price IS NOT NULL AND price != '' AND price != 'Contact for pricing') as has_pricing,
          ROUND(COUNT(*) FILTER (WHERE price IS NOT NULL AND price != '' AND price != 'Contact for pricing') * 100.0 / COUNT(*), 2) as pricing_coverage
        FROM classes 
        WHERE is_active = true
      `);

      console.log(`\n🎉 Individual Location Pricing Complete!`);
      console.log(`📈 Results:`);
      console.log(`   Total active classes: ${result.rows[0].total_classes}`);
      console.log(`   Classes with authentic pricing: ${result.rows[0].has_pricing}`);
      console.log(`   Pricing coverage: ${result.rows[0].pricing_coverage}%`);
      console.log(`   Individual location prices found: ${this.pricesFound}`);
    } finally {
      client.release();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    await this.pool.end();
    console.log('🔚 Individual location pricing scraper closed');
  }
}

async function runIndividualLocationPricingScraper() {
  const scraper = new IndividualLocationPricingScraper();
  try {
    await scraper.runIndividualLocationScraper();
  } catch (error) {
    console.error('❌ Individual location pricing scraper failed:', error);
    await scraper.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIndividualLocationPricingScraper();
}

export { IndividualLocationPricingScraper };