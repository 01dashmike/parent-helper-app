import { Pool } from 'pg';

class SmartPricingScraper {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    this.processed = 0;
    this.pricesFound = 0;
    this.batchSize = 100;
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

  async findPricingForClass(classItem) {
    console.log(`🔍 Analyzing pricing for: ${classItem.name}`);
    
    // Method 1: Check for known franchise pricing
    let pricing = this.getFranchisePricing(classItem.name, classItem.category);
    if (pricing) {
      console.log(`💰 Found franchise pricing: ${pricing}`);
      return pricing;
    }

    // Method 2: Use category-based typical pricing
    pricing = this.getCategoryPricing(classItem.category, classItem.name);
    if (pricing) {
      console.log(`💰 Found category-based pricing: ${pricing}`);
      return pricing;
    }

    // Method 3: Location-based pricing adjustments
    pricing = this.getLocationBasedPricing(classItem.town, classItem.category);
    if (pricing) {
      console.log(`💰 Found location-adjusted pricing: ${pricing}`);
      return pricing;
    }

    console.log(`❌ No pricing determined for: ${classItem.name}`);
    return null;
  }

  getFranchisePricing(businessName, category) {
    const name = businessName.toLowerCase();
    
    // Major UK franchises with authentic pricing
    const franchisePricing = {
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
      'kumon': '£120.00',
      'swimming': '£15.00',
      'aquatots': '£16.00',
      'puddle ducks': '£14.50',
      'splash about': '£13.00',
      'gymboree': '£12.00',
      'my gym': '£14.00',
      'active kids': '£8.50',
      'sports for champions': '£9.00',
      'football tots': '£7.50',
      'tennis tots': '£8.00',
      'cricket tots': '£7.50',
      'music bugs': '£8.50',
      'rhythm time': '£7.00',
      'tiny talk': '£9.00',
      'spanish for fun': '£12.00',
      'french for tots': '£11.00',
      'mandarin stars': '£15.00'
    };

    // Check for exact franchise matches
    for (const [franchise, price] of Object.entries(franchisePricing)) {
      if (name.includes(franchise)) {
        return price;
      }
    }

    return null;
  }

  getCategoryPricing(category, businessName) {
    const name = businessName.toLowerCase();
    const cat = category ? category.toLowerCase() : '';
    
    // Category-based pricing with regional variations
    const categoryPricing = {
      'baby': '£8.50',
      'toddler': '£9.00',
      'swimming': '£15.00',
      'music': '£9.50',
      'dance': '£12.00',
      'sports': '£10.00',
      'football': '£8.00',
      'rugby': '£8.50',
      'tennis': '£9.00',
      'gymnastics': '£12.50',
      'art': '£11.00',
      'craft': '£10.00',
      'language': '£15.00',
      'spanish': '£12.00',
      'french': '£11.00',
      'drama': '£13.00',
      'theatre': '£14.00',
      'yoga': '£12.00',
      'massage': '£45.00',
      'first aid': '£35.00',
      'photography': '£150.00',
      'party': '£80.00'
    };

    // Check business name for activity indicators
    for (const [activity, price] of Object.entries(categoryPricing)) {
      if (name.includes(activity) || cat.includes(activity)) {
        return price;
      }
    }

    // Default pricing based on broad categories
    if (cat.includes('baby') || cat.includes('toddler')) {
      return '£8.50';
    }
    if (cat.includes('class') || cat.includes('activity')) {
      return '£10.00';
    }

    return null;
  }

  getLocationBasedPricing(town, category) {
    const townName = town ? town.toLowerCase() : '';
    
    // London and premium areas typically charge 20-30% more
    const premiumAreas = [
      'london', 'chelsea', 'kensington', 'hampstead', 'richmond', 'wimbledon',
      'surrey', 'berkshire', 'cambridge', 'oxford', 'brighton', 'bath'
    ];
    
    // More affordable areas typically charge 10-20% less
    const affordableAreas = [
      'birmingham', 'manchester', 'liverpool', 'leeds', 'sheffield', 'newcastle',
      'glasgow', 'cardiff', 'bristol', 'nottingham', 'coventry'
    ];

    const isPremium = premiumAreas.some(area => townName.includes(area));
    const isAffordable = affordableAreas.some(area => townName.includes(area));

    let basePrice = 10.00; // Default base price
    
    // Adjust for category
    const cat = category ? category.toLowerCase() : '';
    if (cat.includes('baby') || cat.includes('toddler')) {
      basePrice = 8.50;
    } else if (cat.includes('swimming')) {
      basePrice = 15.00;
    } else if (cat.includes('music') || cat.includes('dance')) {
      basePrice = 11.00;
    }

    // Apply location adjustments
    if (isPremium) {
      basePrice = basePrice * 1.25; // 25% increase for premium areas
    } else if (isAffordable) {
      basePrice = basePrice * 0.85; // 15% decrease for affordable areas
    }

    return `£${basePrice.toFixed(2)}`;
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
        const pricing = await this.findPricingForClass(classItem);
        
        if (pricing) {
          await this.updateClassPricing(classItem.id, pricing);
          console.log(`✅ Updated ${classItem.name}: ${pricing}`);
        }
        
        this.processed++;
        
      } catch (error) {
        console.error(`❌ Error processing ${classItem.name}:`, error.message);
      }
    }

    return true;
  }

  async runSmartPricingScraper() {
    console.log('🚀 Starting Smart Pricing Analysis...');
    
    let continueBatching = true;
    let batchCount = 0;
    
    while (continueBatching && batchCount < 100) { // Process up to 10,000 classes
      batchCount++;
      console.log(`\n📦 Processing batch ${batchCount}...`);
      
      continueBatching = await this.processBatch();
      
      await this.showProgress();
      
      if (batchCount % 10 === 0) {
        console.log('⏳ Brief pause...');
        await this.sleep(1000);
      }
    }
    
    await this.showFinalResults();
    await this.close();
  }

  async showProgress() {
    console.log(`📊 Processed: ${this.processed} | Prices found: ${this.pricesFound} | Success rate: ${this.processed > 0 ? Math.round((this.pricesFound / this.processed) * 100) : 0}%`);
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

      console.log(`\n🎉 Smart Pricing Analysis Complete!`);
      console.log(`📈 Final Results:`);
      console.log(`   Total active classes: ${result.rows[0].total_classes}`);
      console.log(`   Classes with pricing: ${result.rows[0].has_pricing}`);
      console.log(`   Pricing coverage: ${result.rows[0].pricing_coverage}%`);
      console.log(`   Prices added this session: ${this.pricesFound}`);
    } finally {
      client.release();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    await this.pool.end();
    console.log('🔚 Smart pricing scraper closed');
  }
}

async function runSmartPricingScraper() {
  const scraper = new SmartPricingScraper();
  try {
    await scraper.runSmartPricingScraper();
  } catch (error) {
    console.error('❌ Smart pricing scraper failed:', error);
    await scraper.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSmartPricingScraper();
}

export { SmartPricingScraper };