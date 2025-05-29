import { Pool } from 'pg';

class FixedPricingScraper {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    this.processed = 0;
    this.pricesFound = 0;
    this.batchSize = 10;
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
          console.log(`  📄 Testing: ${testUrl}`);
          
          const response = await fetch(testUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000,
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
          console.log(`  ⚠️ Error accessing ${testUrl}: ${pageError.message}`);
          continue;
        }
        
        // Brief delay between page requests
        await this.sleep(1000);
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
      const result = await client.query(`
        UPDATE classes 
        SET price = $1, last_verified = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, name, price
      `, [pricingData.price, businessId]);
      
      if (result.rowCount > 0) {
        this.pricesFound++;
        console.log(`✅ Successfully updated business ${businessId} with pricing: ${pricingData.price}`);
        console.log(`   Source: ${pricingData.source}`);
      } else {
        console.log(`⚠️ No rows updated for business ${businessId}`);
      }
      
    } catch (error) {
      console.error(`❌ Database update failed for business ${businessId}:`, error.message);
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
        console.log(`\n🏢 Processing: ${business.name}`);
        console.log(`   Website: ${business.website}`);
        
        const pricingData = await this.scrapeWebsitePricing(business);
        
        if (pricingData) {
          await this.updateBusinessPricing(business.id, pricingData);
        } else {
          console.log(`   ❌ No pricing found for ${business.name}`);
        }
        
        this.processed++;
        
        // Rate limiting to be respectful to websites
        await this.sleep(2000);
        
      } catch (error) {
        console.error(`❌ Error processing ${business.name}:`, error.message);
      }
    }

    return true;
  }

  async showProgress() {
    console.log(`\n📊 Progress: Processed ${this.processed} businesses, found ${this.pricesFound} authentic prices`);
    
    // Show current pricing coverage
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE price IS NOT NULL AND price != '' AND price != 'Contact for pricing') as has_pricing
        FROM classes WHERE is_active = true
      `);
      
      const { total, has_pricing } = result.rows[0];
      const coverage = ((has_pricing / total) * 100).toFixed(2);
      console.log(`💰 Current pricing coverage: ${has_pricing}/${total} (${coverage}%)`);
      
    } finally {
      client.release();
    }
  }

  async runFixedPricingScraper() {
    console.log('🚀 Starting Fixed Pricing Scraper...');
    console.log('🌐 Extracting authentic pricing from verified business websites');
    
    let continueBatching = true;
    let batchCount = 0;
    
    while (continueBatching && batchCount < 10) {
      batchCount++;
      console.log(`\n📦 Processing batch ${batchCount}...`);
      
      continueBatching = await this.processBatch();
      
      await this.showProgress();
      
      if (continueBatching) {
        console.log('⏱️ Waiting before next batch...');
        await this.sleep(5000);
      }
    }

    await this.showFinalResults();
  }

  async showFinalResults() {
    console.log('\n🎯 Fixed Pricing Scraper Results:');
    console.log(`✅ Total businesses processed: ${this.processed}`);
    console.log(`💰 Authentic prices found: ${this.pricesFound}`);
    
    if (this.pricesFound > 0) {
      // Show some examples of the pricing found
      const client = await this.pool.connect();
      try {
        const examples = await client.query(`
          SELECT name, price, website
          FROM classes 
          WHERE price IS NOT NULL 
          AND price != '' 
          AND price != 'Contact for pricing'
          AND last_verified IS NOT NULL
          ORDER BY last_verified DESC
          LIMIT 5
        `);
        
        console.log('\n📋 Recent authentic pricing discoveries:');
        examples.rows.forEach(row => {
          console.log(`   • ${row.name}: ${row.price}`);
        });
      } finally {
        client.release();
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    await this.pool.end();
  }
}

async function runFixedPricingScraper() {
  const scraper = new FixedPricingScraper();
  try {
    await scraper.runFixedPricingScraper();
  } finally {
    await scraper.close();
  }
}

runFixedPricingScraper().catch(console.error);