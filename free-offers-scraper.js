import { Pool } from 'pg';

class FreeOffersScraper {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 8,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.offersFound = 0;
    this.processed = 0;
  }

  async initialize() {
    // Create table for free offers if it doesn't exist
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS free_offers (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          offer_type VARCHAR(100),
          company_name VARCHAR(255),
          website VARCHAR(500),
          claim_url VARCHAR(500),
          requirements TEXT,
          age_group VARCHAR(100),
          expiry_date DATE,
          is_verified BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Free offers table ready');
    } finally {
      client.release();
    }
  }

  async searchFreeParentingOffers() {
    console.log('🔍 Searching for authentic free parenting offers...');
    
    // Target legitimate UK parenting and baby brands
    const targetBrands = [
      'Pampers UK',
      'Huggies UK', 
      'Aptamil UK',
      'Cow & Gate',
      'SMA Baby',
      'Mothercare',
      'Boots Baby',
      'ASDA Baby',
      'Tesco Baby',
      'Sainsburys Baby',
      'Emma\'s Diary',
      'Bounty',
      'Baby Centre UK',
      'Mumsnet',
      'NCT',
      'Johnson\'s Baby UK',
      'Tommee Tippee',
      'MAM Baby',
      'Philips Avent UK'
    ];

    for (const brand of targetBrands) {
      await this.searchBrandOffers(brand);
      await this.sleep(1000); // Respectful delay
    }
  }

  async searchBrandOffers(brandName) {
    try {
      console.log(`🏢 Checking ${brandName} for free offers...`);
      
      // Find brand website via Google Places
      const placeId = await this.findBrandPlaceId(brandName);
      if (!placeId) {
        console.log(`❌ Could not find place ID for ${brandName}`);
        return;
      }

      const placeDetails = await this.getPlaceDetails(placeId);
      if (!placeDetails || !placeDetails.website) {
        console.log(`❌ No website found for ${brandName}`);
        return;
      }

      // Search for offers on their website
      await this.scrapeBrandWebsiteOffers(brandName, placeDetails.website);
      this.processed++;
      
    } catch (error) {
      console.log(`⚠️ Error processing ${brandName}: ${error.message}`);
      this.processed++;
    }
  }

  async findBrandPlaceId(brandName) {
    try {
      const query = `${brandName} baby products UK`;
      const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].place_id;
      }
    } catch (error) {
      console.log(`⚠️ Places API error for ${brandName}: ${error.message}`);
    }
    return null;
  }

  async getPlaceDetails(placeId) {
    try {
      const fields = 'name,website';
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();
      return data.result || null;
    } catch (error) {
      return null;
    }
  }

  async scrapeBrandWebsiteOffers(brandName, website) {
    try {
      const baseUrl = new URL(website);
      
      // Common offer page patterns for UK baby brands
      const offerUrls = [
        website,
        `${baseUrl.origin}/offers`,
        `${baseUrl.origin}/free-samples`,
        `${baseUrl.origin}/samples`,
        `${baseUrl.origin}/freebies`,
        `${baseUrl.origin}/promotions`,
        `${baseUrl.origin}/baby-club`,
        `${baseUrl.origin}/rewards`,
        `${baseUrl.origin}/sign-up`,
        `${baseUrl.origin}/register`
      ];

      for (const url of offerUrls) {
        try {
          const response = await fetch(url, {
            timeout: 8000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          if (response.ok) {
            const html = await response.text();
            const offers = this.extractOffersFromHTML(html, brandName, url);
            
            for (const offer of offers) {
              await this.saveOffer(offer);
            }
          }
        } catch (error) {
          continue; // Try next URL
        }
      }
    } catch (error) {
      console.log(`⚠️ Website scraping error for ${brandName}: ${error.message}`);
    }
  }

  extractOffersFromHTML(html, brandName, sourceUrl) {
    const text = html.toLowerCase();
    const offers = [];

    // Look for free offer patterns
    const freePatterns = [
      /free.*?(sample|napp|diaper|formula|baby|gift)/gi,
      /complimentary.*?(sample|napp|diaper|formula|baby|gift)/gi,
      /trial.*?(pack|size|sample)/gi,
      /starter.*?(pack|kit|sample)/gi,
      /welcome.*?(pack|kit|gift|box)/gi,
      /baby.*?(club|box|pack).*?free/gi,
      /sign.*?up.*?(free|sample|gift)/gi
    ];

    // Common offer types for parents
    const offerTypes = [
      { keywords: ['napp', 'diaper'], type: 'Free Nappies' },
      { keywords: ['formula', 'milk'], type: 'Free Baby Formula' },
      { keywords: ['sample', 'trial'], type: 'Free Samples' },
      { keywords: ['baby club', 'rewards'], type: 'Baby Club Benefits' },
      { keywords: ['weaning', 'food'], type: 'Free Weaning Samples' },
      { keywords: ['pregnancy', 'maternity'], type: 'Pregnancy Freebies' },
      { keywords: ['baby box', 'welcome pack'], type: 'Baby Welcome Pack' }
    ];

    for (const pattern of freePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const matchText = match[0];
        
        // Determine offer type
        let offerType = 'Free Baby Products';
        for (const type of offerTypes) {
          if (type.keywords.some(keyword => matchText.includes(keyword))) {
            offerType = type.type;
            break;
          }
        }

        // Extract surrounding context for description
        const contextStart = Math.max(0, match.index - 200);
        const contextEnd = Math.min(text.length, match.index + 200);
        const context = html.substring(contextStart, contextEnd)
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (this.isValidOffer(matchText, context)) {
          offers.push({
            title: this.generateOfferTitle(matchText, brandName),
            description: this.cleanDescription(context),
            offer_type: offerType,
            company_name: brandName,
            website: sourceUrl,
            claim_url: sourceUrl,
            requirements: this.extractRequirements(context),
            age_group: this.extractAgeGroup(context),
            is_verified: false // Will need manual verification
          });
        }
      }
    }

    return offers.slice(0, 3); // Limit to 3 offers per brand to avoid duplicates
  }

  isValidOffer(matchText, context) {
    // Exclude common false positives
    const excludeTerms = [
      'delivery', 'shipping', 'returns', 'warranty', 'support',
      'contact', 'terms', 'conditions', 'privacy', 'cookies'
    ];

    return !excludeTerms.some(term => context.toLowerCase().includes(term)) &&
           matchText.length > 5 && 
           context.length > 20;
  }

  generateOfferTitle(matchText, brandName) {
    const cleanMatch = matchText.replace(/[^a-zA-Z\s]/g, ' ').trim();
    return `${brandName} - ${cleanMatch.charAt(0).toUpperCase() + cleanMatch.slice(1)}`;
  }

  cleanDescription(context) {
    return context
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s£.,!?-]/g, '')
      .trim()
      .substring(0, 300);
  }

  extractRequirements(context) {
    const requirementTerms = ['sign up', 'register', 'subscribe', 'email', 'details'];
    const foundRequirements = requirementTerms.filter(term => 
      context.toLowerCase().includes(term)
    );
    
    return foundRequirements.length > 0 ? 
      `May require: ${foundRequirements.join(', ')}` : 
      'Requirements may apply';
  }

  extractAgeGroup(context) {
    if (context.includes('pregnancy') || context.includes('expecting')) {
      return 'Pregnancy';
    } else if (context.includes('newborn') || context.includes('0-6 months')) {
      return 'Newborn (0-6 months)';
    } else if (context.includes('baby') || context.includes('infant')) {
      return 'Baby (0-12 months)';
    } else if (context.includes('toddler')) {
      return 'Toddler (1-3 years)';
    }
    return 'All ages';
  }

  async saveOffer(offer) {
    const client = await this.pool.connect();
    try {
      // Check if similar offer already exists
      const existingCheck = await client.query(
        'SELECT id FROM free_offers WHERE company_name = $1 AND offer_type = $2 AND is_active = true',
        [offer.company_name, offer.offer_type]
      );

      if (existingCheck.rows.length === 0) {
        await client.query(`
          INSERT INTO free_offers (
            title, description, offer_type, company_name, website, 
            claim_url, requirements, age_group, is_verified, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          offer.title,
          offer.description,
          offer.offer_type,
          offer.company_name,
          offer.website,
          offer.claim_url,
          offer.requirements,
          offer.age_group,
          offer.is_verified,
          true
        ]);

        this.offersFound++;
        console.log(`💝 Found offer: ${offer.title}`);
      }
    } finally {
      client.release();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runFreeOffersScraper() {
    console.log('🚀 Starting Free Parenting Offers Scraper...');
    console.log('🎯 Searching for authentic free offers from legitimate UK baby brands');

    await this.initialize();
    await this.searchFreeParentingOffers();
    await this.showResults();
  }

  async showResults() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total_offers,
          COUNT(DISTINCT company_name) as unique_brands,
          COUNT(DISTINCT offer_type) as offer_types
        FROM free_offers WHERE is_active = true
      `);
      
      const stats = result.rows[0];
      console.log('\n🎯 FREE OFFERS SCRAPER RESULTS:');
      console.log(`💝 Total offers found: ${stats.total_offers}`);
      console.log(`🏢 Unique brands: ${stats.unique_brands}`);
      console.log(`📦 Offer types: ${stats.offer_types}`);
      console.log(`⚡ This session: ${this.offersFound} new offers discovered`);
      
      // Show sample offers
      const sampleOffers = await client.query(`
        SELECT title, company_name, offer_type 
        FROM free_offers 
        WHERE is_active = true 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      if (sampleOffers.rows.length > 0) {
        console.log('\n📋 Recent offers found:');
        sampleOffers.rows.forEach(offer => {
          console.log(`   💝 ${offer.company_name}: ${offer.offer_type}`);
        });
      }
      
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

async function runFreeOffersScraper() {
  const scraper = new FreeOffersScraper();
  try {
    await scraper.runFreeOffersScraper();
  } catch (error) {
    console.error('❌ Error in free offers scraper:', error);
  } finally {
    await scraper.close();
  }
}

runFreeOffersScraper();