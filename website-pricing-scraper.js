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
      url = url.replace(/\/$/, '');
      
      // Try multiple pricing-related pages
      const pricingUrls = [
        url,
        `${url}/prices`,
        `${url}/pricing`,
        `${url}/book`,
        `${url}/booking`,
        `${url}/classes`,
        `${url}/sessions`
      ];

      for (const testUrl of pricingUrls) {
        try {
          const response = await fetch(testUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 8000,
            redirect: 'follow'
          });

          if (response.ok) {
            const html = await response.text();
            const pricing = this.extractPricingFromHTML(html, business.name);
            
            if (pricing) {
              console.log(`💰 Found pricing: ${pricing} (from ${testUrl})`);
              return {
                price: pricing,
                source: testUrl
              };
            }
          }
        } catch (pageError) {
          // Continue to next URL
          continue;
        }
        
        // Brief delay between page requests
        await this.sleep(500);
      }

    } catch (error) {
      console.log(`⚠️ Website error for ${business.name}: ${error.message}`);
    }

    return null;
  }

  extractPricingFromHTML(html, businessName) {
    // Clean HTML and extract text
    const text = html
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();

    // Enhanced pricing patterns
    const pricePatterns = [
      // Direct pricing with currency
      /£\s*(\d+(?:\.\d{2})?)/g,
      /(\d+(?:\.\d{2})?)\s*pounds?/gi,
      
      // Contextual pricing phrases
      /(?:price|cost|fee|charge)[s]?\s*(?:is|are|:|-|from)?\s*£?\s*(\d+(?:\.\d{2})?)/gi,
      /(?:starting|from)\s*(?:at|just)?\s*£?\s*(\d+(?:\.\d{2})?)/gi,
      /(?:only|just)\s*£?\s*(\d+(?:\.\d{2})?)/gi,
      
      // Per session/class pricing
      /£?\s*(\d+(?:\.\d{2})?)\s*(?:per|each|\/)\s*(?:session|class|lesson|visit)/gi,
      /(?:session|class|lesson)\s*[:@]\s*£?\s*(\d+(?:\.\d{2})?)/gi,
      
      // Block booking
      /£?\s*(\d+(?:\.\d{2})?)\s*for\s*\d+\s*(?:sessions|classes)/gi,
      /\d+\s*(?:sessions|classes)\s*for\s*£?\s*(\d+(?:\.\d{2})?)/gi
    ];

    // Target pricing-related sections
    const pricingKeywords = [
      'price', 'pricing', 'cost', 'fee', 'book', 'booking', 'payment', 'session', 'class'
    ];

    let allPrices = [];

    // Search the entire text first
    for (const pattern of pricePatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        const priceValue = parseFloat(match[1] || match[0].replace(/[£\s]/g, ''));
        if (priceValue >= 3 && priceValue <= 200) {
          allPrices.push(priceValue);
        }
      }
    }

    // Also search around pricing keywords for better context
    for (const keyword of pricingKeywords) {
      let keywordIndex = text.indexOf(keyword);
      while (keywordIndex !== -1) {
        const start = Math.max(0, keywordIndex - 200);
        const end = Math.min(text.length, keywordIndex + 200);
        const contextText = text.substring(start, end);
        
        for (const pattern of pricePatterns) {
          const matches = [...contextText.matchAll(pattern)];
          for (const match of matches) {
            const priceValue = parseFloat(match[1] || match[0].replace(/[£\s]/g, ''));
            if (priceValue >= 3 && priceValue <= 200) {
              allPrices.push(priceValue);
            }
          }
        }
        
        keywordIndex = text.indexOf(keyword, keywordIndex + 1);
      }
    }

    if (allPrices.length > 0) {
      // Count frequency of each price
      const priceFreq = {};
      allPrices.forEach(price => {
        priceFreq[price] = (priceFreq[price] || 0) + 1;
      });

      // Sort by frequency, then by reasonableness
      const sortedPrices = Object.keys(priceFreq)
        .map(p => parseFloat(p))
        .sort((a, b) => {
          // Prefer prices between £5-£50
          const aScore = (a >= 5 && a <= 50 ? 100 : 0) + priceFreq[a];
          const bScore = (b >= 5 && b <= 50 ? 100 : 0) + priceFreq[b];
          return bScore - aScore;
        });

      const bestPrice = sortedPrices[0];
      return `£${bestPrice.toFixed(2)}`;
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