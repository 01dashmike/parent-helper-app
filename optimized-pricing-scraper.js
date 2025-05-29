import { Pool } from 'pg';
import puppeteer from 'puppeteer';

class OptimizedPricingScraper {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 8, // Optimized connection pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    this.processed = 0;
    this.pricesFound = 0;
    this.batchSize = 40; // Increased batch size
    this.browser = null;
    this.concurrentTabs = 3; // Multiple browser tabs
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
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
        ORDER BY RANDOM() -- Randomize for better distribution
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
    for (let i = 0; i < classes.length; i += this.concurrentTabs) {
      chunks.push(classes.slice(i, i + this.concurrentTabs));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(classItem => this.processClassSafely(classItem));
      await Promise.allSettled(promises);
      await this.sleep(300); // Brief pause between chunks
    }
  }

  async processClassSafely(classItem) {
    let page = null;
    try {
      page = await this.browser.newPage();
      
      // Optimize page settings
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      const pricing = await this.findAuthenticPricing(classItem, page);
      if (pricing) {
        await this.updateClassPricing(classItem.id, pricing);
        this.pricesFound++;
        console.log(`💰 Found pricing for ${classItem.name}: ${pricing}`);
      }
      this.processed++;
    } catch (error) {
      console.log(`⚠️ Error processing ${classItem.name}: ${error.message}`);
      this.processed++;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async findAuthenticPricing(classItem, page) {
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
        `${baseUrl.origin}/classes`,
        `${baseUrl.origin}/timetable`
      ];

      for (const url of pricingUrls) {
        try {
          await page.goto(url, { 
            waitUntil: 'domcontentloaded', 
            timeout: 8000 
          });

          const pricing = await this.extractPricingFromPage(page, classItem);
          if (pricing) {
            return pricing;
          }
        } catch (error) {
          continue; // Try next URL
        }
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  async extractPricingFromPage(page, classItem) {
    try {
      const content = await page.content();
      return this.extractPricingFromHTML(content, classItem);
    } catch (error) {
      return null;
    }
  }

  extractPricingFromHTML(html, classItem) {
    const text = html.replace(/<[^>]*>/g, ' ').toLowerCase();
    
    // Enhanced patterns for session pricing
    const sessionPatterns = [
      /(?:per (?:session|class|lesson)|session|class|lesson)[\s\w]*?£(\d+(?:\.\d{2})?)/gi,
      /£(\d+(?:\.\d{2})?)[\s\w]*?(?:per (?:session|class|lesson)|\/session|\/class)/gi,
      /(?:drop.?in|single (?:session|class))[\s\w]*?£(\d+(?:\.\d{2})?)/gi,
      /£(\d+(?:\.\d{2})?)[\s\w]*?(?:drop.?in|single)/gi
    ];

    // Category-specific patterns
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
      // Return the most common price or median if multiple found
      const sortedPrices = foundPrices.sort((a, b) => a - b);
      const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
      return `£${medianPrice.toFixed(2)}`;
    }

    return null;
  }

  isValidSessionPrice(price, text, matchIndex) {
    // Valid session price range
    if (price < 3 || price > 35) return false;

    // Get context around the price
    const contextStart = Math.max(0, matchIndex - 100);
    const contextEnd = Math.min(text.length, matchIndex + 100);
    const context = text.substring(contextStart, contextEnd);

    // Exclude membership/package indicators
    const excludeTerms = [
      'membership', 'annual', 'yearly', 'monthly', 'term', 'package',
      'unlimited', 'month', 'year', 'weeks', 'block', 'course'
    ];

    for (const term of excludeTerms) {
      if (context.includes(term)) return false;
    }

    // Prefer explicit session terms
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

  async runOptimizedPricingScraper() {
    console.log('🚀 Starting Optimized Session Pricing Scraper...');
    console.log('⚡ Enhanced with parallel processing and optimized browser handling');

    await this.initialize();

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
      
      await this.sleep(500); // Brief pause between batches
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
      console.log('\n🎯 OPTIMIZED PRICING SCRAPER RESULTS:');
      console.log(`📊 Total active classes: ${stats.total_classes}`);
      console.log(`💰 Classes with pricing: ${stats.has_pricing}`);
      console.log(`📈 Pricing coverage: ${stats.pricing_coverage}%`);
      console.log(`⚡ This session: ${this.pricesFound} new prices found`);
    } finally {
      client.release();
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
    await this.pool.end();
  }
}

async function runOptimizedPricingScraper() {
  const scraper = new OptimizedPricingScraper();
  try {
    await scraper.runOptimizedPricingScraper();
  } catch (error) {
    console.error('❌ Error in optimized pricing scraper:', error);
  } finally {
    await scraper.close();
  }
}

runOptimizedPricingScraper();