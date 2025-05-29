import { Pool } from 'pg';

class AuthenticPricingScraper {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.processed = 0;
    this.pricesFound = 0;
    this.batchSize = 50;
  }

  async getClassesNeedingPricing() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, website, contact_email, venue, address, postcode, town, category
        FROM classes 
        WHERE (price IS NULL OR price = '' OR price = 'Contact for pricing')
        AND is_active = true
        AND website IS NOT NULL 
        AND website != ''
        ORDER BY id
        LIMIT $1
      `, [this.batchSize]);
      
      console.log(`📋 Found ${result.rows.length} classes with websites to check for pricing`);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async findAuthenticPricing(classItem) {
    console.log(`🔍 Searching authentic pricing for: ${classItem.name}`);
    
    // Method 1: Check Google Places API for pricing information
    let pricing = await this.getGooglePlacesPricing(classItem);
    if (pricing) {
      console.log(`💰 Found pricing via Google Places: ${pricing}`);
      return pricing;
    }

    // Method 2: Check business website for pricing
    pricing = await this.scrapeWebsitePricing(classItem.website, classItem.name);
    if (pricing) {
      console.log(`💰 Found pricing on website: ${pricing}`);
      return pricing;
    }

    console.log(`❌ No authentic pricing found for: ${classItem.name}`);
    return null;
  }

  async getGooglePlacesPricing(classItem) {
    try {
      // First, find the place ID
      const placeId = await this.findPlaceId(classItem);
      if (!placeId) {
        return null;
      }

      // Get detailed place information
      const placeDetails = await this.getPlaceDetails(placeId);
      if (!placeDetails) {
        return null;
      }

      // Check for pricing in place details
      const pricing = this.extractPricingFromPlaceDetails(placeDetails);
      return pricing;

    } catch (error) {
      console.log(`⚠️ Google Places API error: ${error.message}`);
      return null;
    }
  }

  async findPlaceId(classItem) {
    const searchQuery = `${classItem.name} ${classItem.address} ${classItem.postcode}`;
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name&key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].place_id;
      }
    } catch (error) {
      console.log(`⚠️ Place search failed: ${error.message}`);
    }

    return null;
  }

  async getPlaceDetails(placeId) {
    const fields = 'name,website,formatted_phone_number,editorial_summary,reviews,price_level,opening_hours';
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

  extractPricingFromPlaceDetails(placeDetails) {
    // Check price_level (0-4 scale from Google)
    if (placeDetails.price_level !== undefined) {
      const priceLevels = {
        0: 'Free',
        1: '£5-10',
        2: '£10-20', 
        3: '£20-40',
        4: '£40+'
      };
      return priceLevels[placeDetails.price_level];
    }

    // Check reviews for pricing mentions
    if (placeDetails.reviews) {
      for (const review of placeDetails.reviews) {
        const pricing = this.extractPricingFromText(review.text);
        if (pricing) {
          return pricing;
        }
      }
    }

    // Check editorial summary for pricing
    if (placeDetails.editorial_summary && placeDetails.editorial_summary.overview) {
      const pricing = this.extractPricingFromText(placeDetails.editorial_summary.overview);
      if (pricing) {
        return pricing;
      }
    }

    return null;
  }

  extractPricingFromText(text) {
    if (!text) return null;

    // Look for UK pricing patterns
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
          // Only accept reasonable pricing (£1-£200)
          if (price >= 1 && price <= 200) {
            return `£${price.toFixed(2)}`;
          }
        }
      }
    }

    return null;
  }

  async scrapeWebsitePricing(website, businessName) {
    try {
      // Clean up website URL
      let url = website.trim();
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      if (!response.ok) {
        return null;
      }

      const html = await response.text();
      const pricing = this.extractPricingFromHTML(html);
      return pricing;

    } catch (error) {
      console.log(`⚠️ Website scraping failed: ${error.message}`);
      return null;
    }
  }

  extractPricingFromHTML(html) {
    // Remove HTML tags and get text content
    const text = html.replace(/<[^>]*>/g, ' ').toLowerCase();
    
    // Look for pricing sections
    const pricingSections = ['price', 'pricing', 'cost', 'fee', 'rates', 'charges'];
    
    for (const section of pricingSections) {
      const sectionIndex = text.indexOf(section);
      if (sectionIndex !== -1) {
        // Get text around the pricing section (500 chars)
        const start = Math.max(0, sectionIndex - 250);
        const end = Math.min(text.length, sectionIndex + 250);
        const sectionText = text.substring(start, end);
        
        const pricing = this.extractPricingFromText(sectionText);
        if (pricing) {
          return pricing;
        }
      }
    }

    return null;
  }

  async updateClassPricing(classId, pricing) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE classes 
        SET price = $1, last_verified = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [pricing, classId]);
      
      this.pricesFound++;
    } catch (error) {
      console.error(`❌ Failed to update pricing for class ${classId}:`, error.message);
    } finally {
      client.release();
    }
  }

  async processBatch() {
    const classesToProcess = await this.getClassesNeedingPricing();
    
    if (classesToProcess.length === 0) {
      console.log('✅ No more classes with websites need pricing information');
      return false;
    }

    for (const classItem of classesToProcess) {
      try {
        const pricing = await this.findAuthenticPricing(classItem);
        
        if (pricing) {
          await this.updateClassPricing(classItem.id, pricing);
          console.log(`✅ Updated ${classItem.name}: ${pricing}`);
        }
        
        this.processed++;
        
        // Rate limiting for API calls
        await this.sleep(1000);
        
      } catch (error) {
        console.error(`❌ Error processing ${classItem.name}:`, error.message);
      }
    }

    return true;
  }

  async runAuthenticPricingScraper() {
    if (!this.apiKey) {
      throw new Error('Google Places API key not found. Please set GOOGLE_PLACES_API_KEY environment variable.');
    }

    console.log('🚀 Starting Authentic Pricing Scraper...');
    
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
    console.log(`📊 Processed: ${this.processed} | Authentic prices found: ${this.pricesFound} | Success rate: ${this.processed > 0 ? Math.round((this.pricesFound / this.processed) * 100) : 0}%`);
  }

  async showFinalResults() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total_classes,
          COUNT(*) FILTER (WHERE price IS NOT NULL AND price != '' AND price != 'Contact for pricing') as has_authentic_pricing,
          ROUND(COUNT(*) FILTER (WHERE price IS NOT NULL AND price != '' AND price != 'Contact for pricing') * 100.0 / COUNT(*), 2) as pricing_coverage
        FROM classes 
        WHERE is_active = true
      `);

      console.log(`\n🎉 Authentic Pricing Scraper Complete!`);
      console.log(`📈 Final Results:`);
      console.log(`   Total active classes: ${result.rows[0].total_classes}`);
      console.log(`   Classes with authentic pricing: ${result.rows[0].has_authentic_pricing}`);
      console.log(`   Authentic pricing coverage: ${result.rows[0].pricing_coverage}%`);
      console.log(`   Authentic prices found this session: ${this.pricesFound}`);
    } finally {
      client.release();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    await this.pool.end();
    console.log('🔚 Authentic pricing scraper closed');
  }
}

async function runAuthenticPricingScraper() {
  const scraper = new AuthenticPricingScraper();
  try {
    await scraper.runAuthenticPricingScraper();
  } catch (error) {
    console.error('❌ Authentic pricing scraper failed:', error);
    await scraper.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAuthenticPricingScraper();
}

export { AuthenticPricingScraper };