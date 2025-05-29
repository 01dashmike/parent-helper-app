import { Pool } from 'pg';

class ImprovedPricingScraper {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    this.processed = 0;
    this.pricesFound = 0;
    this.batchSize = 8;
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
        AND name NOT LIKE '%Baby Sensory%'
        ORDER BY name
        LIMIT $1
      `, [this.batchSize]);
      
      console.log(`📋 Found ${result.rows.length} businesses with websites to check for session pricing`);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async scrapeWebsitePricing(business) {
    console.log(`🔍 Checking website for: ${business.name}`);
    
    try {
      let url = business.website.trim();
      
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }
      url = url.replace(/\/$/, '');
      
      const pricingUrls = [
        url,
        `${url}/prices`,
        `${url}/pricing`,
        `${url}/book`,
        `${url}/booking`,
        `${url}/classes`,
        `${url}/timetable`
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
            const pricing = this.extractSessionPricing(html, business);
            
            if (pricing) {
              console.log(`💰 Found session pricing: ${pricing} (from ${testUrl})`);
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
        
        await this.sleep(1000);
      }

    } catch (error) {
      console.log(`⚠️ Website error for ${business.name}: ${error.message}`);
    }

    return null;
  }

  extractSessionPricing(html, business) {
    const text = html
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();

    // More specific patterns for session pricing
    const sessionPricePatterns = [
      // Per session/class explicit
      /(?:per|each)\s+(?:session|class|lesson)\s*[:=]?\s*£?\s*(\d+(?:\.\d{2})?)/gi,
      /£?\s*(\d+(?:\.\d{2})?)\s+(?:per|each|\/)\s+(?:session|class|lesson)/gi,
      
      // Session pricing context
      /(?:session|class|lesson)\s+(?:price|cost|fee)\s*[:=]?\s*£?\s*(\d+(?:\.\d{2})?)/gi,
      /(?:single|individual)\s+(?:session|class|lesson)\s*[:=]?\s*£?\s*(\d+(?:\.\d{2})?)/gi,
      
      // Drop-in pricing
      /drop[\s-]?in\s*[:=]?\s*£?\s*(\d+(?:\.\d{2})?)/gi,
      /casual\s+(?:session|class)\s*[:=]?\s*£?\s*(\d+(?:\.\d{2})?)/gi,
      
      // Pay as you go
      /pay\s+as\s+you\s+go\s*[:=]?\s*£?\s*(\d+(?:\.\d{2})?)/gi
    ];

    // Exclude franchise and membership pricing
    const excludePatterns = [
      /membership/i,
      /annual/i,
      /yearly/i,
      /monthly/i,
      /term/i,
      /package/i,
      /bundle/i,
      /block/i,
      /course/i,
      /programme/i,
      /joining fee/i,
      /registration/i
    ];

    let foundPrices = [];

    // Search for session pricing patterns
    for (const pattern of sessionPricePatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        const context = text.substring(Math.max(0, match.index - 100), match.index + 100);
        
        // Skip if context contains excluded terms
        if (excludePatterns.some(exclude => exclude.test(context))) {
          continue;
        }

        const priceValue = parseFloat(match[1]);
        
        // Reasonable session pricing range for UK baby/toddler classes
        if (priceValue >= 3 && priceValue <= 25) {
          foundPrices.push({
            price: priceValue,
            context: context.trim(),
            confidence: this.calculateConfidence(context, business.category)
          });
        }
      }
    }

    // Also check for specific pricing near class/session keywords
    const sessionKeywords = ['session', 'class', 'lesson'];
    for (const keyword of sessionKeywords) {
      let keywordIndex = text.indexOf(keyword);
      while (keywordIndex !== -1) {
        const start = Math.max(0, keywordIndex - 50);
        const end = Math.min(text.length, keywordIndex + 50);
        const contextText = text.substring(start, end);
        
        // Look for price patterns in this context
        const priceMatches = [...contextText.matchAll(/£\s*(\d+(?:\.\d{2})?)/g)];
        for (const match of priceMatches) {
          const priceValue = parseFloat(match[1]);
          
          if (priceValue >= 3 && priceValue <= 25) {
            // Check if it's not excluded pricing
            if (!excludePatterns.some(exclude => exclude.test(contextText))) {
              foundPrices.push({
                price: priceValue,
                context: contextText.trim(),
                confidence: this.calculateConfidence(contextText, business.category)
              });
            }
          }
        }
        
        keywordIndex = text.indexOf(keyword, keywordIndex + 1);
      }
    }

    if (foundPrices.length > 0) {
      // Sort by confidence and price reasonableness
      foundPrices.sort((a, b) => {
        const aScore = a.confidence + (a.price >= 5 && a.price <= 15 ? 50 : 0);
        const bScore = b.confidence + (b.price >= 5 && b.price <= 15 ? 50 : 0);
        return bScore - aScore;
      });

      const bestPrice = foundPrices[0];
      console.log(`   Context: "${bestPrice.context}" (confidence: ${bestPrice.confidence})`);
      
      return `£${bestPrice.price.toFixed(2)}`;
    }

    return null;
  }

  calculateConfidence(context, category) {
    let confidence = 0;
    
    // Higher confidence for explicit session terms
    if (/per session|each session|session price/i.test(context)) confidence += 40;
    if (/per class|each class|class price/i.test(context)) confidence += 35;
    if (/drop.?in/i.test(context)) confidence += 30;
    if (/single|individual/i.test(context)) confidence += 25;
    
    // Category-specific confidence
    if (category === 'Music & Singing' && /music|singing/i.test(context)) confidence += 20;
    if (category === 'General Classes' && /baby|toddler|child/i.test(context)) confidence += 15;
    
    // Negative confidence for bulk/package terms
    if (/block|package|course|term/i.test(context)) confidence -= 30;
    if (/membership|monthly|annual/i.test(context)) confidence -= 40;
    
    return confidence;
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
        console.log(`✅ Updated business ${businessId} with session pricing: ${pricingData.price}`);
        console.log(`   Source: ${pricingData.source}`);
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
      console.log('✅ No more businesses with websites need session pricing checks');
      return false;
    }

    for (const business of businesses) {
      try {
        console.log(`\n🏢 Processing: ${business.name}`);
        console.log(`   Website: ${business.website}`);
        console.log(`   Category: ${business.category}`);
        
        const pricingData = await this.scrapeWebsitePricing(business);
        
        if (pricingData) {
          await this.updateBusinessPricing(business.id, pricingData);
        } else {
          console.log(`   ❌ No valid session pricing found for ${business.name}`);
        }
        
        this.processed++;
        await this.sleep(2000);
        
      } catch (error) {
        console.error(`❌ Error processing ${business.name}:`, error.message);
      }
    }

    return true;
  }

  async showProgress() {
    console.log(`\n📊 Progress: Processed ${this.processed} businesses, found ${this.pricesFound} session prices`);
    
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
      console.log(`💰 Current authentic session pricing coverage: ${has_pricing}/${total} (${coverage}%)`);
      
    } finally {
      client.release();
    }
  }

  async runImprovedPricingScraper() {
    console.log('🚀 Starting Improved Session Pricing Scraper...');
    console.log('🎯 Focusing on authentic per-session pricing only');
    
    let continueBatching = true;
    let batchCount = 0;
    
    while (continueBatching && batchCount < 12) {
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
    console.log('\n🎯 Improved Session Pricing Results:');
    console.log(`✅ Total businesses processed: ${this.processed}`);
    console.log(`💰 Authentic session prices found: ${this.pricesFound}`);
    
    if (this.pricesFound > 0) {
      const client = await this.pool.connect();
      try {
        const examples = await client.query(`
          SELECT name, price, website, category
          FROM classes 
          WHERE price IS NOT NULL 
          AND price != '' 
          AND price != 'Contact for pricing'
          AND last_verified IS NOT NULL
          ORDER BY last_verified DESC
          LIMIT 8
        `);
        
        console.log('\n📋 Recent authentic session pricing discoveries:');
        examples.rows.forEach(row => {
          console.log(`   • ${row.name}: ${row.price} (${row.category})`);
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

async function runImprovedPricingScraper() {
  const scraper = new ImprovedPricingScraper();
  try {
    await scraper.runImprovedPricingScraper();
  } finally {
    await scraper.close();
  }
}

runImprovedPricingScraper().catch(console.error);