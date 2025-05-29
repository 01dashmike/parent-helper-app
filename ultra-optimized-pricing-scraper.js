import { Pool } from 'pg';
import fetch from 'node-fetch';

class UltraOptimizedPricingScraper {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 15,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    this.processed = 0;
    this.pricingFound = 0;
    this.batchSize = 50;
    this.concurrentRequests = 8;
    this.requestTimeout = 8000;
  }

  async getClassesNeedingPricing() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, venue, website, town, postcode, category
        FROM classes 
        WHERE website IS NOT NULL 
        AND website != '' 
        AND (price IS NULL OR price = '')
        AND is_active = true
        AND website NOT LIKE '%facebook.com%'
        AND website NOT LIKE '%instagram.com%'
        ORDER BY 
          CASE WHEN website LIKE '%.co.uk%' THEN 0 ELSE 1 END,
          RANDOM()
        LIMIT $1
      `, [this.batchSize]);
      
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
      await this.sleep(500); // Respectful delay between chunks
    }
  }

  async processClassSafely(classItem) {
    try {
      const pricing = await this.extractAuthenticPricing(classItem);
      if (pricing) {
        await this.updateClassPricing(classItem.id, pricing);
        this.pricingFound++;
        console.log(`💰 ${classItem.name}: ${pricing}`);
      }
      this.processed++;
    } catch (error) {
      this.processed++;
    }
  }

  async extractAuthenticPricing(classItem) {
    try {
      const response = await fetch(classItem.website, {
        timeout: this.requestTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
        }
      });

      if (!response.ok) return null;

      const html = await response.text();
      return this.extractPricingFromHTML(html, classItem);
    } catch (error) {
      return null;
    }
  }

  extractPricingFromHTML(html, classItem) {
    const cleanHtml = html.toLowerCase();
    
    // Enhanced price pattern matching for UK businesses
    const pricePatterns = [
      /(?:£|gbp)\s*(\d{1,3}(?:\.\d{2})?)\s*(?:per\s+(?:session|class|lesson|week))?/gi,
      /(\d{1,3}(?:\.\d{2})?)\s*(?:£|gbp|pounds?)\s*(?:per\s+(?:session|class|lesson|week))?/gi,
      /(?:price|cost|fee)[\s:]*(?:£|gbp)\s*(\d{1,3}(?:\.\d{2})?)/gi,
      /(?:from|starts?\s+at|only)\s*(?:£|gbp)\s*(\d{1,3}(?:\.\d{2})?)/gi
    ];

    const prices = [];
    
    for (const pattern of pricePatterns) {
      let match;
      while ((match = pattern.exec(cleanHtml)) !== null) {
        const price = parseFloat(match[1]);
        if (this.isReasonableSessionPrice(price, classItem)) {
          prices.push(price);
        }
      }
    }

    if (prices.length === 0) return null;

    // Return most common price or median if multiple found
    const sortedPrices = prices.sort((a, b) => a - b);
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
    
    return `£${medianPrice.toFixed(2)}`;
  }

  isReasonableSessionPrice(price, classItem) {
    // Realistic price ranges for different activity types
    const categoryRanges = {
      'baby & toddler classes': [3, 30],
      'swimming': [5, 40],
      'dance & movement': [4, 25],
      'music & singing': [4, 25],
      'sports & fitness': [5, 35],
      'educational': [5, 30],
      'default': [3, 50]
    };

    const category = classItem.category ? classItem.category.toLowerCase() : 'default';
    const range = categoryRanges[category] || categoryRanges['default'];
    
    return price >= range[0] && price <= range[1];
  }

  async updateClassPricing(classId, pricing) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE classes 
        SET price = $1, last_verified = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [pricing, classId]);
    } finally {
      client.release();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runOptimizedPricingScraper() {
    console.log('🚀 Ultra-Optimized Pricing Scraper Starting...');
    console.log('💰 Extracting authentic pricing from individual business websites');
    
    let batch = 1;
    while (true) {
      console.log(`\n📦 Processing batch ${batch}...`);
      
      const classes = await this.getClassesNeedingPricing();
      if (classes.length === 0) {
        console.log('✅ All classes with websites processed!');
        break;
      }
      
      await this.processBatchConcurrently(classes);
      
      console.log(`📊 Batch ${batch}: ${this.pricingFound}/${this.processed} authentic prices found`);
      batch++;
      
      if (batch > 50) { // Safety limit
        console.log('🛑 Reached batch limit');
        break;
      }
    }
    
    await this.showResults();
  }

  async showResults() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE price IS NOT NULL AND price != '') as with_pricing
        FROM classes WHERE is_active = true
      `);
      
      const { total, with_pricing } = result.rows[0];
      const percentage = ((with_pricing / total) * 100).toFixed(1);
      
      console.log(`\n🎉 Ultra-Optimized Pricing Scraper Complete!`);
      console.log(`💰 Authentic Pricing Coverage: ${with_pricing}/${total} (${percentage}%)`);
      console.log(`✅ Found ${this.pricingFound} authentic prices in this run`);
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

async function runUltraOptimizedPricingScraper() {
  const scraper = new UltraOptimizedPricingScraper();
  try {
    await scraper.runOptimizedPricingScraper();
  } catch (error) {
    console.error('❌ Ultra-optimized pricing scraper failed:', error);
  } finally {
    await scraper.close();
  }
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  runUltraOptimizedPricingScraper();
}

export { runUltraOptimizedPricingScraper };