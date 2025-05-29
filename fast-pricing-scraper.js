import { Pool } from 'pg';

class FastPricingScraper {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 8,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    this.processed = 0;
    this.pricesFound = 0;
    this.batchSize = 40;
    this.concurrentRequests = 6;
  }

  async getClassesNeedingPricing() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, venue, website, category, town, postcode
        FROM classes 
        WHERE website IS NOT NULL 
        AND website != '' 
        AND TRIM(website) != ''
        AND (price IS NULL OR price = '' OR price = 'Contact for pricing')
        AND is_active = true
        ORDER BY RANDOM()
        LIMIT $1
      `, [this.batchSize]);
      
      console.log(`📋 Found ${result.rows.length} businesses with websites to check for pricing`);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async processBatchConcurrently(classes) {
    const chunks = [];
    for (let i = 0; i < classes.length; i += this.concurrentRequests) {
      chunks.push(classes.slice(i, i + this.concurrentRequests));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(classItem => this.processClassSafely(classItem));
      await Promise.allSettled(promises);
      await this.sleep(500); // Increased delay to prevent database overload
    }
  }

  async processClassSafely(classItem) {
    try {
      const pricing = await this.findAuthenticPricing(classItem);
      if (pricing) {
        await this.updateClassPricing(classItem.id, pricing);
        this.pricesFound++;
        console.log(`💰 Found pricing for ${classItem.name}: ${pricing}`);
      }
      this.processed++;
    } catch (error) {
      this.processed++;
    }
  }

  async findAuthenticPricing(classItem) {
    const website = classItem.website;
    if (!website) return null;

    try {
      const baseUrl = new URL(website);
      const pricingUrls = [
        website,
        `${baseUrl.origin}/prices`,
        `${baseUrl.origin}/pricing`,
        `${baseUrl.origin}/book`,
        `${baseUrl.origin}/booking`,
        `${baseUrl.origin}/classes`
      ];

      for (const url of pricingUrls) {
        try {
          const response = await fetch(url, {
            timeout: 8000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          if (response.ok) {
            const html = await response.text();
            const pricing = this.extractPricingFromHTML(html, classItem);
            if (pricing) {
              return pricing;
            }
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  extractPricingFromHTML(html, classItem) {
    const text = html.replace(/<[^>]*>/g, ' ').toLowerCase();
    
    const sessionPatterns = [
      /(?:per (?:session|class|lesson)|session|class|lesson)[\s\w]*?£(\d+(?:\.\d{2})?)/gi,
      /£(\d+(?:\.\d{2})?)[\s\w]*?(?:per (?:session|class|lesson)|\/session|\/class)/gi,
      /(?:drop.?in|single (?:session|class))[\s\w]*?£(\d+(?:\.\d{2})?)/gi,
      /£(\d+(?:\.\d{2})?)[\s\w]*?(?:drop.?in|single)/gi
    ];

    if (classItem.category?.toLowerCase().includes('baby')) {
      sessionPatterns.push(
        /baby[\s\w]*?£(\d+(?:\.\d{2})?)/gi,
        /infant[\s\w]*?£(\d+(?:\.\d{2})?)/gi
      );
    }

    if (classItem.category?.toLowerCase().includes('toddler')) {
      sessionPatterns.push(
        /toddler[\s\w]*?£(\d+(?:\.\d{2})?)/gi
      );
    }

    const foundPrices = [];
    
    for (const pattern of sessionPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const price = parseFloat(match[1]);
        if (this.isValidSessionPrice(price, text, match.index)) {
          foundPrices.push(price);
        }
      }
    }

    if (foundPrices.length > 0) {
      const sortedPrices = foundPrices.sort((a, b) => a - b);
      const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
      return `£${medianPrice.toFixed(2)}`;
    }

    return null;
  }

  isValidSessionPrice(price, text, matchIndex) {
    if (price < 3 || price > 35) return false;

    const contextStart = Math.max(0, matchIndex - 100);
    const contextEnd = Math.min(text.length, matchIndex + 100);
    const context = text.substring(contextStart, contextEnd);

    const excludeTerms = [
      'membership', 'annual', 'yearly', 'monthly', 'term', 'package',
      'unlimited', 'month', 'year', 'weeks', 'block', 'course'
    ];

    for (const term of excludeTerms) {
      if (context.includes(term)) return false;
    }

    const sessionTerms = [
      'session', 'class', 'lesson', 'drop in', 'single', 'per visit'
    ];

    return sessionTerms.some(term => context.includes(term));
  }

  async updateClassPricing(classId, pricing) {
    const client = await this.pool.connect();
    try {
      await client.query(
        'UPDATE classes SET price = $1 WHERE id = $2',
        [pricing, classId]
      );
    } finally {
      client.release();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runFastPricingScraper() {
    console.log('🚀 Starting Fast Session Pricing Scraper...');
    console.log('⚡ Enhanced with parallel processing and optimized HTTP requests');

    for (let batch = 1; batch <= 8; batch++) {
      console.log(`\n📦 Processing batch ${batch}...`);
      
      const classes = await this.getClassesNeedingPricing();
      if (classes.length === 0) {
        console.log('✅ No more classes need pricing updates');
        break;
      }

      const startTime = Date.now();
      await this.processBatchConcurrently(classes);
      const endTime = Date.now();
      
      console.log(`⚡ Batch ${batch} completed in ${((endTime - startTime) / 1000).toFixed(1)}s`);
      console.log(`📊 Progress: ${this.processed} processed, ${this.pricesFound} prices found`);
      
      await this.sleep(300);
    }

    await this.showFinalResults();
  }

  async showFinalResults() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total_classes,
          COUNT(*) FILTER (WHERE price IS NOT NULL AND price != '' AND price != 'Contact for pricing') as has_pricing,
          ROUND(COUNT(*) FILTER (WHERE price IS NOT NULL AND price != '' AND price != 'Contact for pricing') * 100.0 / COUNT(*), 2) as pricing_coverage
        FROM classes WHERE is_active = true
      `);
      
      const stats = result.rows[0];
      console.log('\n🎯 FAST PRICING SCRAPER RESULTS:');
      console.log(`📊 Total active classes: ${stats.total_classes}`);
      console.log(`💰 Classes with pricing: ${stats.has_pricing}`);
      console.log(`📈 Pricing coverage: ${stats.pricing_coverage}%`);
      console.log(`⚡ This session: ${this.pricesFound} new prices found`);
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

async function runFastPricingScraper() {
  const scraper = new FastPricingScraper();
  try {
    await scraper.runFastPricingScraper();
  } catch (error) {
    console.error('❌ Error in fast pricing scraper:', error);
  } finally {
    await scraper.close();
  }
}

runFastPricingScraper();