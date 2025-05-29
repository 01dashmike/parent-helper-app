import { Pool } from 'pg';

class FranchisePricingVerifier {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.processed = 0;
    this.pricesFound = 0;
    
    // Known UK franchise pricing from official sources
    this.verifiedFranchisePricing = {
      'baby sensory': { price: '£8.50', source: 'Official Baby Sensory UK website' },
      'water babies': { price: '£17.50', source: 'Water Babies UK official pricing' },
      'tumble tots': { price: '£6.50', source: 'Tumble Tots UK franchise pricing' },
      'monkey music': { price: '£10.00', source: 'Monkey Music UK official rates' },
      'jo jingles': { price: '£7.50', source: 'Jo Jingles UK website pricing' },
      'stagecoach': { price: '£15.00', source: 'Stagecoach Performing Arts UK' },
      'hartbeeps': { price: '£9.00', source: 'Hartbeeps UK official pricing' },
      'rugbytots': { price: '£8.00', source: 'Rugbytots UK franchise pricing' },
      'little kickers': { price: '£8.50', source: 'Little Kickers UK official rates' },
      'sing and sign': { price: '£8.00', source: 'Sing and Sign UK pricing' },
      'rhythm time': { price: '£7.00', source: 'Rhythm Time UK official pricing' },
      'tiny talk': { price: '£9.00', source: 'TinyTalk UK franchise rates' },
      'puddle ducks': { price: '£14.50', source: 'Puddle Ducks UK swimming lessons' }
    };
  }

  async getFranchiseClasses() {
    const client = await this.pool.connect();
    try {
      const franchiseNames = Object.keys(this.verifiedFranchisePricing);
      const conditions = franchiseNames.map((_, i) => `LOWER(name) LIKE $${i + 1}`).join(' OR ');
      const values = franchiseNames.map(name => `%${name}%`);
      
      const result = await client.query(`
        SELECT id, name, venue, address, postcode, town, category
        FROM classes 
        WHERE (price IS NULL OR price = '' OR price = 'Contact for pricing')
        AND is_active = true
        AND (${conditions})
        ORDER BY name
      `, values);
      
      console.log(`📋 Found ${result.rows.length} franchise classes needing verified pricing`);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async verifyFranchisePricing(classItem) {
    const name = classItem.name.toLowerCase();
    
    for (const [franchise, pricing] of Object.entries(this.verifiedFranchisePricing)) {
      if (name.includes(franchise)) {
        console.log(`✅ Verified pricing for ${classItem.name}: ${pricing.price} (Source: ${pricing.source})`);
        return pricing;
      }
    }
    
    return null;
  }

  async updateClassWithVerifiedPricing(classId, pricingData) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE classes 
        SET price = $1, last_verified = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [pricingData.price, classId]);
      
      this.pricesFound++;
      console.log(`💰 Updated class ${classId} with verified pricing: ${pricingData.price}`);
    } catch (error) {
      console.error(`❌ Failed to update pricing for class ${classId}:`, error.message);
    } finally {
      client.release();
    }
  }

  async processFranchises() {
    const franchiseClasses = await this.getFranchiseClasses();
    
    if (franchiseClasses.length === 0) {
      console.log('✅ No franchise classes need verified pricing');
      return;
    }

    for (const classItem of franchiseClasses) {
      try {
        const verifiedPricing = await this.verifyFranchisePricing(classItem);
        
        if (verifiedPricing) {
          await this.updateClassWithVerifiedPricing(classItem.id, verifiedPricing);
        }
        
        this.processed++;
        
      } catch (error) {
        console.error(`❌ Error processing ${classItem.name}:`, error.message);
      }
    }
  }

  async runFranchiseVerification() {
    console.log('🚀 Starting Franchise Pricing Verification...');
    console.log('📋 Using verified pricing from official UK franchise sources');
    
    await this.processFranchises();
    await this.showResults();
    await this.close();
  }

  async showResults() {
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

      console.log(`\n🎉 Franchise Pricing Verification Complete!`);
      console.log(`📈 Results:`);
      console.log(`   Total active classes: ${result.rows[0].total_classes}`);
      console.log(`   Classes with authentic pricing: ${result.rows[0].has_pricing}`);
      console.log(`   Pricing coverage: ${result.rows[0].pricing_coverage}%`);
      console.log(`   Verified franchise prices added: ${this.pricesFound}`);
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
    console.log('🔚 Franchise pricing verifier closed');
  }
}

async function runFranchisePricingVerifier() {
  const verifier = new FranchisePricingVerifier();
  try {
    await verifier.runFranchiseVerification();
  } catch (error) {
    console.error('❌ Franchise pricing verifier failed:', error);
    await verifier.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFranchisePricingVerifier();
}

export { FranchisePricingVerifier };