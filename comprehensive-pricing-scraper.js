import { Pool } from 'pg';
import puppeteer from 'puppeteer';

class ComprehensivePricingScraper {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    this.browser = null;
    this.processed = 0;
    this.pricesFound = 0;
    this.batchSize = 50;
  }

  async initialize() {
    console.log('🚀 Starting Comprehensive Pricing Scraper...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    console.log('✅ Browser initialized');
  }

  async getClassesNeedingPricing() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, website, contact_email, venue, address, postcode, town, category
        FROM classes 
        WHERE (price IS NULL OR price = '' OR price = 'Contact for pricing' OR LOWER(price) LIKE '%call%' OR LOWER(price) LIKE '%contact%')
        AND is_active = true
        ORDER BY id
        LIMIT $1
      `, [this.batchSize]);
      
      console.log(`📋 Found ${result.rows.length} classes needing pricing information`);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async scrapePricingForClass(classItem) {
    console.log(`🔍 Searching pricing for: ${classItem.name}`);
    
    let pricing = null;
    
    // Method 1: Check company website if available
    if (classItem.website && classItem.website.trim() !== '') {
      pricing = await this.scrapeWebsitePricing(classItem.website, classItem.name);
      if (pricing) {
        console.log(`💰 Found pricing on website: ${pricing}`);
        return pricing;
      }
    }

    // Method 2: Google search for pricing
    pricing = await this.searchGoogleForPricing(classItem);
    if (pricing) {
      console.log(`💰 Found pricing via Google: ${pricing}`);
      return pricing;
    }

    // Method 3: Check Google Maps business listing
    pricing = await this.scrapeGoogleMapsPricing(classItem);
    if (pricing) {
      console.log(`💰 Found pricing on Google Maps: ${pricing}`);
      return pricing;
    }

    // Method 4: Search franchise/brand standard pricing
    pricing = await this.getFranchisePricing(classItem.name, classItem.category);
    if (pricing) {
      console.log(`💰 Found franchise pricing: ${pricing}`);
      return pricing;
    }

    console.log(`❌ No pricing found for: ${classItem.name}`);
    return null;
  }

  async scrapeWebsitePricing(website, businessName) {
    try {
      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Clean up website URL
      let url = website.trim();
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      
      // Look for pricing information
      const pricing = await page.evaluate(() => {
        const pricePatterns = [
          /£(\d+(?:\.\d{2})?)/g,
          /\$(\d+(?:\.\d{2})?)/g,
          /(\d+(?:\.\d{2})?)(?:\s*(?:pounds?|gbp|£))/gi,
          /price[s]?[:\s]*£?(\d+(?:\.\d{2})?)/gi,
          /cost[s]?[:\s]*£?(\d+(?:\.\d{2})?)/gi,
          /fee[s]?[:\s]*£?(\d+(?:\.\d{2})?)/gi
        ];

        const text = document.body.innerText.toLowerCase();
        
        // Look for pricing sections
        const pricingSections = [
          'price', 'pricing', 'cost', 'fee', 'rates', 'charges', 'membership'
        ];
        
        for (const section of pricingSections) {
          if (text.includes(section)) {
            for (const pattern of pricePatterns) {
              const matches = text.match(pattern);
              if (matches && matches.length > 0) {
                // Return the first reasonable price found
                const price = matches[0];
                const numericValue = price.match(/\d+(?:\.\d{2})?/);
                if (numericValue && parseFloat(numericValue[0]) > 1 && parseFloat(numericValue[0]) < 200) {
                  return `£${numericValue[0]}`;
                }
              }
            }
          }
        }
        
        return null;
      });

      await page.close();
      return pricing;
    } catch (error) {
      console.log(`⚠️ Website scraping failed: ${error.message}`);
      return null;
    }
  }

  async searchGoogleForPricing(classItem) {
    try {
      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const searchQuery = `"${classItem.name}" price cost fee ${classItem.town} ${classItem.category}`;
      const encodedQuery = encodeURIComponent(searchQuery);
      
      await page.goto(`https://www.google.com/search?q=${encodedQuery}`, { 
        waitUntil: 'networkidle2', 
        timeout: 10000 
      });

      const pricing = await page.evaluate(() => {
        const pricePatterns = [
          /£(\d+(?:\.\d{2})?)/g,
          /(\d+(?:\.\d{2})?)(?:\s*(?:pounds?|gbp|£))/gi
        ];

        const searchResults = document.querySelectorAll('.g, .rc');
        
        for (const result of searchResults) {
          const text = result.innerText;
          for (const pattern of pricePatterns) {
            const matches = text.match(pattern);
            if (matches) {
              const numericValue = matches[0].match(/\d+(?:\.\d{2})?/);
              if (numericValue && parseFloat(numericValue[0]) > 1 && parseFloat(numericValue[0]) < 200) {
                return `£${numericValue[0]}`;
              }
            }
          }
        }
        
        return null;
      });

      await page.close();
      return pricing;
    } catch (error) {
      console.log(`⚠️ Google search failed: ${error.message}`);
      return null;
    }
  }

  async scrapeGoogleMapsPricing(classItem) {
    try {
      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const searchQuery = `${classItem.name} ${classItem.address} ${classItem.postcode}`;
      const encodedQuery = encodeURIComponent(searchQuery);
      
      await page.goto(`https://www.google.com/maps/search/${encodedQuery}`, { 
        waitUntil: 'networkidle2', 
        timeout: 10000 
      });

      // Wait for results to load
      await page.waitForTimeout(3000);

      const pricing = await page.evaluate(() => {
        // Look for pricing in business description or reviews
        const priceElements = document.querySelectorAll('[data-value], .fontBodyMedium, .fontBodySmall');
        
        for (const element of priceElements) {
          const text = element.innerText || element.textContent;
          if (text && (text.includes('£') || text.includes('price') || text.includes('cost'))) {
            const priceMatch = text.match(/£(\d+(?:\.\d{2})?)/);
            if (priceMatch) {
              const price = parseFloat(priceMatch[1]);
              if (price > 1 && price < 200) {
                return `£${priceMatch[1]}`;
              }
            }
          }
        }
        
        return null;
      });

      await page.close();
      return pricing;
    } catch (error) {
      console.log(`⚠️ Google Maps scraping failed: ${error.message}`);
      return null;
    }
  }

  async getFranchisePricing(businessName, category) {
    // Standard pricing for known franchises and common activities
    const franchisePricing = {
      // Major franchises
      'baby sensory': '£8.50',
      'monkey music': '£10.00',
      'water babies': '£17.50',
      'tumble tots': '£6.50',
      'jo jingles': '£7.50',
      'sing and sign': '£8.00',
      'mini first aid': '£35.00',
      'hartbeeps': '£9.00',
      'baby massage': '£45.00',
      'baby yoga': '£12.00',
      'rugbytots': '£8.00',
      'little kickers': '£8.50',
      'stagecoach': '£15.00',
      'kumon': '£120.00'
    };

    // Category-based typical pricing
    const categoryPricing = {
      'baby classes': '£8.50',
      'toddler classes': '£9.00',
      'swimming': '£15.00',
      'music classes': '£9.50',
      'dance classes': '£12.00',
      'sports classes': '£10.00',
      'art classes': '£11.00',
      'language classes': '£15.00',
      'drama classes': '£13.00',
      'gymnastics': '£12.50'
    };

    const name = businessName.toLowerCase();
    
    // Check for franchise matches
    for (const [franchise, price] of Object.entries(franchisePricing)) {
      if (name.includes(franchise)) {
        return price;
      }
    }

    // Check for category matches
    const cat = category ? category.toLowerCase() : '';
    for (const [catType, price] of Object.entries(categoryPricing)) {
      if (cat.includes(catType.split(' ')[0])) {
        return price;
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
      console.log('✅ No more classes need pricing information');
      return false;
    }

    for (const classItem of classesToProcess) {
      try {
        const pricing = await this.scrapePricingForClass(classItem);
        
        if (pricing) {
          await this.updateClassPricing(classItem.id, pricing);
          console.log(`✅ Updated ${classItem.name}: ${pricing}`);
        }
        
        this.processed++;
        
        // Rate limiting
        await this.sleep(2000);
        
      } catch (error) {
        console.error(`❌ Error processing ${classItem.name}:`, error.message);
      }
    }

    return true;
  }

  async runPricingScraper() {
    await this.initialize();
    
    console.log('🎯 Starting comprehensive pricing scraping...');
    
    let continueBatching = true;
    let batchCount = 0;
    
    while (continueBatching && batchCount < 20) { // Limit to 20 batches initially
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
    console.log(`\n📊 Progress Update:`);
    console.log(`   Processed: ${this.processed} classes`);
    console.log(`   Prices found: ${this.pricesFound}`);
    console.log(`   Success rate: ${this.processed > 0 ? Math.round((this.pricesFound / this.processed) * 100) : 0}%`);
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

      console.log(`\n🎉 Pricing Scraper Complete!`);
      console.log(`📈 Final Results:`);
      console.log(`   Total active classes: ${result.rows[0].total_classes}`);
      console.log(`   Classes with pricing: ${result.rows[0].has_pricing}`);
      console.log(`   Pricing coverage: ${result.rows[0].pricing_coverage}%`);
      console.log(`   Prices found this session: ${this.pricesFound}`);
    } finally {
      client.release();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
    await this.pool.end();
    console.log('🔚 Pricing scraper closed');
  }
}

async function runComprehensivePricingScraper() {
  const scraper = new ComprehensivePricingScraper();
  try {
    await scraper.runPricingScraper();
  } catch (error) {
    console.error('❌ Pricing scraper failed:', error);
    await scraper.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensivePricingScraper();
}

export { ComprehensivePricingScraper };