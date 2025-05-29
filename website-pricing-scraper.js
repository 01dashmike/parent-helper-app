import { Pool } from 'pg';

class WebsitePricingScraper {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    this.processed = 0;
    this.pricesFound = 0;
    this.batchSize = 20;
  }

  async getBusinessesWithWebsites() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, website, venue, address, postcode, town, category
        FROM classes 
        WHERE (price IS NULL OR price = '' OR price = 'Contact for pricing')
        AND is_active = true
        AND website IS NOT NULL 
        AND website != ''
        AND TRIM(website) != ''
        ORDER BY name
        LIMIT $1
      `, [this.batchSize]);
      
      console.log(`📋 Found ${result.rows.length} businesses with websites to check for pricing`);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async scrapeWebsitePricing(business) {
    console.log(`🔍 Checking website for: ${business.name}`);
    
    try {
      let url = business.website.trim();
      
      // Clean up common URL issues
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }
      
      // Remove common suffixes that might cause issues
      url = url.replace(/\/$/, ''); // Remove trailing slash
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000,
        redirect: 'follow'
      });

      if (!response.ok) {
        console.log(`⚠️ Website returned ${response.status} for ${business.name}`);
        return null;
      }

      const html = await response.text();
      const pricing = this.extractPricingFromHTML(html, business.name);
      
      if (pricing) {
        console.log(`💰 Found pricing on website: ${pricing}`);
        return {
          price: pricing,
          source: business.website
        };
      }

    } catch (error) {
      console.log(`⚠️ Website error for ${business.name}: ${error.message}`);
    }

    return null;
  }

  extractPricingFromHTML(html, businessName) {
    // Remove HTML tags and clean up text
    const text = html
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();

    // Pricing patterns to look for
    const pricePatterns = [
      // Standard UK pricing
      /£\s*(\d+(?:\.\d{2})?)/g,
      /(\d+(?:\.\d{2})?)\s*(?:pounds?|gbp)/gi,
      
      // Context-aware pricing
      /(?:cost|price|fee|charge)[s]?\s*[:\-]?\s*£?\s*(\d+(?:\.\d{2})?)/gi,
      /(?:from|starting)\s*(?:at)?\s*£?\s*(\d+(?:\.\d{2})?)/gi,
      /£?\s*(\d+(?:\.\d{2})?)\s*(?:per|each|session|class|lesson)/gi,
      
      // Block booking patterns
      /(\d+(?:\.\d{2})?)\s*(?:for|per)\s*\d+\s*(?:sessions|classes|lessons)/gi
    ];

    // Pricing sections to focus on
    const pricingSections = [
      'price', 'pricing', 'cost', 'fee', 'fees', 'rates', 'charges',
      'book', 'booking', 'payment', 'session', 'class', 'lesson'
    ];

    let foundPrices = [];

    // Look for pricing in relevant sections
    for (const section of pricingSections) {
      const sectionIndex = text.indexOf(section);
      if (sectionIndex !== -1) {
        // Extract text around the pricing section
        const start = Math.max(0, sectionIndex - 300);
        const end = Math.min(text.length, sectionIndex + 300);
        const sectionText = text.substring(start, end);
        
        // Apply pricing patterns to this section
        for (const pattern of pricePatterns) {
          const matches = [...sectionText.matchAll(pattern)];
          for (const match of matches) {
            const priceStr = match[1] || match[0];
            const price = parseFloat(priceStr.replace(/[£\s]/g, ''));
            
            // Validate price is reasonable for UK classes
            if (price >= 3 && price <= 100) {
              foundPrices.push(price);
            }
          }
        }
      }
    }

    // If we found prices, return the most common or reasonable one
    if (foundPrices.length > 0) {
      // Remove duplicates and sort
      const uniquePrices = [...new Set(foundPrices)].sort((a, b) => a - b);
      
      // Return the most reasonable price (not too low, not too high)
      const reasonablePrice = uniquePrices.find(p => p >= 5 && p <= 50) || uniquePrices[0];
      
      return `£${reasonablePrice.toFixed(2)}`;
    }

    return null;
  }

  async updateBusinessPricing(businessId, pricingData) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE classes 
        SET price = $1, last_verified = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [pricingData.price, businessId]);
      
      this.pricesFound++;
      console.log(`✅ Updated ${businessId} with authentic pricing: ${pricingData.price} (Source: ${pricingData.source})`);
    } catch (error) {
      console.error(`❌ Failed to update pricing for business ${businessId}:`, error.message);
    } finally {
      client.release();
    }
  }

  async processBatch() {
    const businesses = await this.getBusinessesWithWebsites();
    
    if (businesses.length === 0) {
      console.log('✅ No more businesses with websites need pricing checks');
      return false;
    }

    for (const business of businesses) {
      try {
        const pricingData = await this.scrapeWebsitePricing(business);
        
        if (pricingData) {
          await this.updateBusinessPricing(business.id, pricingData);
        }
        
        this.processed++;
        
        // Rate limiting to be respectful to websites
        await this.sleep(3000);
        
      } catch (error) {
        console.error(`❌ Error processing ${business.name}:`, error.message);
      }
    }

    return true;
  }

  async runWebsitePricingScraper() {
    console.log('🚀 Starting Website Pricing Scraper...');
    console.log('🌐 Checking individual business websites for authentic pricing');
    
    let continueBatching = true;
    let batchCount = 0;
    
    while (continueBatching && batchCount < 15) {
      batchCount++;
      console.log(`\n📦 Processing batch ${batchCount}...`);
      
      continueBatching = await this.processBatch();
      
      await this.showProgress();
      
      if (continueBatching) {
        console.log('⏳ Brief pause between batches...');
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

      console.log(`\n🎉 Website Pricing Scraper Complete!`);
      console.log(`📈 Results:`);
      console.log(`   Total active classes: ${result.rows[0].total_classes}`);
      console.log(`   Classes with authentic pricing: ${result.rows[0].has_authentic_pricing}`);
      console.log(`   Pricing coverage: ${result.rows[0].pricing_coverage}%`);
      console.log(`   Authentic website prices found: ${this.pricesFound}`);
    } finally {
      client.release();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    await this.pool.end();
    console.log('🔚 Website pricing scraper closed');
  }
}

async function runWebsitePricingScraper() {
  const scraper = new WebsitePricingScraper();
  try {
    await scraper.runWebsitePricingScraper();
  } catch (error) {
    console.error('❌ Website pricing scraper failed:', error);
    await scraper.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runWebsitePricingScraper();
}

export { WebsitePricingScraper };