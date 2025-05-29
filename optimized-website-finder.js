import { Pool } from 'pg';

class OptimizedWebsiteFinder {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10, // Increased connection pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.processed = 0;
    this.websitesFound = 0;
    this.batchSize = 50; // Increased batch size
    this.concurrentRequests = 5; // Process multiple items simultaneously
  }

  async getBusinessesWithoutWebsites() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, venue, address, postcode, town, category, contact_email
        FROM classes 
        WHERE (website IS NULL OR website = '' OR TRIM(website) = '')
        AND is_active = true
        ORDER BY RANDOM() -- Randomize to avoid API rate limit clustering
        LIMIT $1
      `, [this.batchSize]);
      
      console.log(`📋 Found ${result.rows.length} businesses missing websites`);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async processBatchConcurrently(businesses) {
    const chunks = [];
    for (let i = 0; i < businesses.length; i += this.concurrentRequests) {
      chunks.push(businesses.slice(i, i + this.concurrentRequests));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(business => this.processBusinessSafely(business));
      await Promise.allSettled(promises); // Continue even if some fail
      await this.sleep(200); // Reduced sleep between chunks
    }
  }

  async processBusinessSafely(business) {
    try {
      const website = await this.findBusinessWebsite(business);
      if (website) {
        await this.updateBusinessWebsite(business.id, website);
        this.websitesFound++;
      }
      this.processed++;
    } catch (error) {
      console.log(`⚠️ Error processing ${business.name}: ${error.message}`);
      this.processed++;
    }
  }

  async findBusinessWebsite(business) {
    // Quick email domain check first (fastest method)
    let website = await this.deriveWebsiteFromEmail(business);
    if (website) {
      return website;
    }

    // Then Google Places API
    website = await this.findWebsiteViaGooglePlaces(business);
    if (website) {
      return website;
    }

    return null;
  }

  async findWebsiteViaGooglePlaces(business) {
    const placeId = await this.findPlaceId(business);
    if (!placeId) return null;

    const details = await this.getPlaceDetails(placeId);
    if (details && details.website) {
      return this.cleanWebsiteUrl(details.website);
    }

    return null;
  }

  async findPlaceId(business) {
    // Use only the most effective search query first
    const primaryQuery = `${business.name} ${business.town} ${business.postcode}`;
    
    try {
      const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(primaryQuery)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        
        if (this.isLikelyMatch(candidate, business)) {
          return candidate.place_id;
        }
      }
    } catch (error) {
      // Continue silently
    }

    return null;
  }

  isLikelyMatch(candidate, business) {
    const candidateName = candidate.name.toLowerCase();
    const businessName = business.name.toLowerCase();
    const candidateAddress = candidate.formatted_address ? candidate.formatted_address.toLowerCase() : '';
    const businessTown = business.town ? business.town.toLowerCase() : '';

    // Quick name matching
    const nameWords = businessName.split(' ').filter(w => w.length > 2);
    const nameMatch = nameWords.some(word => candidateName.includes(word));

    // Quick location matching
    const locationMatch = candidateAddress.includes(businessTown) || businessTown === '';

    return nameMatch && locationMatch;
  }

  async getPlaceDetails(placeId) {
    const fields = 'website'; // Only get what we need
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.result || null;
    } catch (error) {
      return null;
    }
  }

  async deriveWebsiteFromEmail(business) {
    if (!business.contact_email || business.contact_email.trim() === '') {
      return null;
    }

    const email = business.contact_email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return null;
    }

    const domain = email.split('@')[1];
    
    // Skip common email providers
    const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'];
    if (commonProviders.includes(domain)) {
      return null;
    }

    const possibleWebsites = [
      `https://www.${domain}`,
      `https://${domain}`,
      `http://www.${domain}`,
      `http://${domain}`
    ];

    // Quick check - just return the first HTTPS option
    return possibleWebsites[0];
  }

  cleanWebsiteUrl(url) {
    if (!url) return null;
    
    url = url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    return url;
  }

  async updateBusinessWebsite(businessId, website) {
    const client = await this.pool.connect();
    try {
      await client.query(
        'UPDATE classes SET website = $1 WHERE id = $2',
        [website, businessId]
      );
    } finally {
      client.release();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runOptimizedWebsiteFinder() {
    console.log('🚀 Starting Optimized Website Finder...');
    console.log('⚡ Enhanced with parallel processing and connection pooling');

    for (let batch = 1; batch <= 10; batch++) {
      console.log(`\n📦 Processing batch ${batch}...`);
      
      const businesses = await this.getBusinessesWithoutWebsites();
      if (businesses.length === 0) {
        console.log('✅ No more businesses need website updates');
        break;
      }

      const startTime = Date.now();
      await this.processBatchConcurrently(businesses);
      const endTime = Date.now();
      
      console.log(`⚡ Batch ${batch} completed in ${((endTime - startTime) / 1000).toFixed(1)}s`);
      console.log(`📊 Progress: ${this.processed} processed, ${this.websitesFound} websites found`);
      
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
          COUNT(*) FILTER (WHERE website IS NOT NULL AND website != '' AND TRIM(website) != '') as has_website,
          ROUND(COUNT(*) FILTER (WHERE website IS NOT NULL AND website != '' AND TRIM(website) != '') * 100.0 / COUNT(*), 2) as coverage_percentage
        FROM classes WHERE is_active = true
      `);
      
      const stats = result.rows[0];
      console.log('\n🎯 OPTIMIZED WEBSITE FINDER RESULTS:');
      console.log(`📊 Total active classes: ${stats.total_classes}`);
      console.log(`🌐 Classes with websites: ${stats.has_website}`);
      console.log(`📈 Website coverage: ${stats.coverage_percentage}%`);
      console.log(`⚡ This session: ${this.websitesFound} new websites found`);
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

async function runOptimizedWebsiteFinder() {
  const finder = new OptimizedWebsiteFinder();
  try {
    await finder.runOptimizedWebsiteFinder();
  } catch (error) {
    console.error('❌ Error in optimized website finder:', error);
  } finally {
    await finder.close();
  }
}

runOptimizedWebsiteFinder();