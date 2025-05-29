import { Pool } from 'pg';

class MissingWebsiteFinder {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.processed = 0;
    this.websitesFound = 0;
    this.batchSize = 30;
  }

  async getBusinessesWithoutWebsites() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, venue, address, postcode, town, category, contact_email
        FROM classes 
        WHERE (website IS NULL OR website = '' OR TRIM(website) = '')
        AND is_active = true
        ORDER BY name
        LIMIT $1
      `, [this.batchSize]);
      
      console.log(`📋 Found ${result.rows.length} businesses missing websites`);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async findBusinessWebsite(business) {
    console.log(`🔍 Searching website for: ${business.name}`);
    
    // Method 1: Google Places API
    let website = await this.findWebsiteViaGooglePlaces(business);
    if (website) {
      console.log(`🌐 Found website via Google Places: ${website}`);
      return website;
    }

    // Method 2: Derive from email domain
    website = await this.deriveWebsiteFromEmail(business);
    if (website) {
      console.log(`📧 Derived website from email: ${website}`);
      return website;
    }

    console.log(`❌ No website found for: ${business.name}`);
    return null;
  }

  async findWebsiteViaGooglePlaces(business) {
    if (!this.apiKey) {
      return null;
    }

    try {
      // Search for the business
      const placeId = await this.findPlaceId(business);
      if (!placeId) {
        return null;
      }

      // Get place details including website
      const placeDetails = await this.getPlaceDetails(placeId);
      if (placeDetails && placeDetails.website) {
        return this.cleanWebsiteUrl(placeDetails.website);
      }

    } catch (error) {
      console.log(`⚠️ Google Places error for ${business.name}: ${error.message}`);
    }

    return null;
  }

  async findPlaceId(business) {
    const searchQueries = [
      `${business.name} ${business.address} ${business.postcode}`,
      `${business.name} ${business.town} ${business.postcode}`,
      `${business.name} ${business.town}`,
      business.name
    ];

    for (const query of searchQueries) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${this.apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.candidates && data.candidates.length > 0) {
          const candidate = data.candidates[0];
          
          // Verify this looks like the right business
          if (this.isLikelyMatch(candidate, business)) {
            return candidate.place_id;
          }
        }
      } catch (error) {
        continue;
      }
      
      await this.sleep(500); // Rate limiting
    }

    return null;
  }

  isLikelyMatch(candidate, business) {
    const candidateName = candidate.name.toLowerCase();
    const businessName = business.name.toLowerCase();
    const candidateAddress = candidate.formatted_address ? candidate.formatted_address.toLowerCase() : '';
    const businessTown = business.town ? business.town.toLowerCase() : '';
    const businessPostcode = business.postcode ? business.postcode.toLowerCase() : '';

    // Check name similarity
    const nameWords = businessName.split(' ').filter(w => w.length > 2);
    const nameMatch = nameWords.some(word => candidateName.includes(word));

    // Check location similarity
    const locationMatch = candidateAddress.includes(businessTown) || 
                         candidateAddress.includes(businessPostcode) ||
                         businessTown === '' || businessPostcode === '';

    return nameMatch && locationMatch;
  }

  async getPlaceDetails(placeId) {
    const fields = 'name,website,formatted_phone_number';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.result) {
        return data.result;
      }
    } catch (error) {
      console.log(`⚠️ Place details failed: ${error.message}`);
    }

    return null;
  }

  async deriveWebsiteFromEmail(business) {
    if (!business.contact_email || business.contact_email.trim() === '') {
      return null;
    }

    try {
      const email = business.contact_email.trim().toLowerCase();
      const domain = email.split('@')[1];
      
      if (!domain || domain.includes('gmail') || domain.includes('yahoo') || 
          domain.includes('hotmail') || domain.includes('outlook')) {
        return null; // Skip generic email providers
      }

      // Test if the domain has a website
      const testUrls = [
        `https://www.${domain}`,
        `https://${domain}`,
        `http://www.${domain}`,
        `http://${domain}`
      ];

      for (const testUrl of testUrls) {
        try {
          const response = await fetch(testUrl, {
            method: 'HEAD',
            timeout: 5000,
            redirect: 'follow'
          });

          if (response.ok) {
            return this.cleanWebsiteUrl(testUrl);
          }
        } catch (error) {
          continue;
        }
      }

    } catch (error) {
      // Continue to next method
    }

    return null;
  }

  cleanWebsiteUrl(url) {
    if (!url) return null;
    
    // Clean up the URL
    let cleanUrl = url.trim();
    
    // Remove common tracking parameters
    cleanUrl = cleanUrl.split('?')[0];
    
    // Ensure it starts with http
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    // Remove trailing slash
    cleanUrl = cleanUrl.replace(/\/$/, '');
    
    return cleanUrl;
  }

  async updateBusinessWebsite(businessId, website) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE classes 
        SET website = $1
        WHERE id = $2
      `, [website, businessId]);
      
      this.websitesFound++;
      console.log(`✅ Updated ${businessId} with website: ${website}`);
    } catch (error) {
      console.error(`❌ Failed to update website for business ${businessId}:`, error.message);
    } finally {
      client.release();
    }
  }

  async processBatch() {
    const businesses = await this.getBusinessesWithoutWebsites();
    
    if (businesses.length === 0) {
      console.log('✅ No more businesses need website searches');
      return false;
    }

    for (const business of businesses) {
      try {
        const website = await this.findBusinessWebsite(business);
        
        if (website) {
          await this.updateBusinessWebsite(business.id, website);
        }
        
        this.processed++;
        
        // Rate limiting for API calls
        await this.sleep(1500);
        
      } catch (error) {
        console.error(`❌ Error processing ${business.name}:`, error.message);
      }
    }

    return true;
  }

  async runMissingWebsiteFinder() {
    console.log('🚀 Starting Missing Website Finder...');
    console.log('🔍 Finding websites for businesses using Google Places API and email domains');
    
    let continueBatching = true;
    let batchCount = 0;
    
    while (continueBatching && batchCount < 10) {
      batchCount++;
      console.log(`\n📦 Processing batch ${batchCount}...`);
      
      continueBatching = await this.processBatch();
      
      await this.showProgress();
      
      if (continueBatching) {
        console.log('⏳ Brief pause between batches...');
        await this.sleep(3000);
      }
    }
    
    await this.showFinalResults();
    await this.close();
  }

  async showProgress() {
    console.log(`📊 Processed: ${this.processed} | Websites found: ${this.websitesFound} | Success rate: ${this.processed > 0 ? Math.round((this.websitesFound / this.processed) * 100) : 0}%`);
  }

  async showFinalResults() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total_classes,
          COUNT(*) FILTER (WHERE website IS NOT NULL AND website != '' AND TRIM(website) != '') as has_website,
          ROUND(COUNT(*) FILTER (WHERE website IS NOT NULL AND website != '' AND TRIM(website) != '') * 100.0 / COUNT(*), 2) as website_coverage
        FROM classes 
        WHERE is_active = true
      `);

      console.log(`\n🎉 Missing Website Finder Complete!`);
      console.log(`📈 Results:`);
      console.log(`   Total active classes: ${result.rows[0].total_classes}`);
      console.log(`   Classes with websites: ${result.rows[0].has_website}`);
      console.log(`   Website coverage: ${result.rows[0].website_coverage}%`);
      console.log(`   Websites found this session: ${this.websitesFound}`);
    } finally {
      client.release();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    await this.pool.end();
    console.log('🔚 Missing website finder closed');
  }
}

async function runMissingWebsiteFinder() {
  const finder = new MissingWebsiteFinder();
  try {
    await finder.runMissingWebsiteFinder();
  } catch (error) {
    console.error('❌ Missing website finder failed:', error);
    await finder.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMissingWebsiteFinder();
}

export { MissingWebsiteFinder };