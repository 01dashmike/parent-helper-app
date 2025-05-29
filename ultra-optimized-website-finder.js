import { Pool } from 'pg';
import fetch from 'node-fetch';

class UltraOptimizedWebsiteFinder {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // Increased pool size
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 5000,
    });
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.processed = 0;
    this.websitesFound = 0;
    this.batchSize = 100; // Larger batches
    this.concurrentRequests = 10; // More parallel processing
    this.apiCallsPerSecond = 15; // Rate limiting
    this.lastApiCall = 0;
  }

  async getBusinessesWithoutWebsites() {
    const client = await this.pool.connect();
    try {
      // Optimized query with indexed columns
      const result = await client.query(`
        SELECT id, name, venue, address, postcode, town, category, contact_email
        FROM classes 
        WHERE (website IS NULL OR website = '' OR TRIM(website) = '')
        AND is_active = true
        AND contact_email IS NOT NULL -- Prioritize those with emails
        ORDER BY 
          CASE WHEN contact_email IS NOT NULL THEN 0 ELSE 1 END,
          RANDOM()
        LIMIT $1
      `, [this.batchSize]);
      
      return result.rows;
    } finally {
      client.release();
    }
  }

  async rateLimitedApiCall(url) {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;
    const minInterval = 1000 / this.apiCallsPerSecond;
    
    if (timeSinceLastCall < minInterval) {
      await this.sleep(minInterval - timeSinceLastCall);
    }
    
    this.lastApiCall = Date.now();
    return fetch(url);
  }

  async processBatchOptimized(businesses) {
    // Split into email-derivable and API-required
    const emailBased = businesses.filter(b => b.contact_email && this.isDerivedWebsite(b.contact_email));
    const apiRequired = businesses.filter(b => !emailBased.includes(b));

    // Process email-based websites instantly (no API calls)
    const emailPromises = emailBased.map(business => this.processEmailWebsite(business));
    await Promise.allSettled(emailPromises);

    // Process API-required with rate limiting
    const chunks = [];
    for (let i = 0; i < apiRequired.length; i += this.concurrentRequests) {
      chunks.push(apiRequired.slice(i, i + this.concurrentRequests));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(business => this.processApiWebsite(business));
      await Promise.allSettled(promises);
      await this.sleep(100); // Minimal delay between chunks
    }
  }

  async processEmailWebsite(business) {
    try {
      const website = this.deriveWebsiteFromEmail(business.contact_email);
      if (website && await this.validateWebsite(website)) {
        await this.updateBusinessWebsite(business.id, website);
        this.websitesFound++;
        console.log(`📧 ${business.name}: ${website}`);
      }
      this.processed++;
    } catch (error) {
      this.processed++;
    }
  }

  async processApiWebsite(business) {
    try {
      const website = await this.findWebsiteViaApi(business);
      if (website) {
        await this.updateBusinessWebsite(business.id, website);
        this.websitesFound++;
        console.log(`🔍 ${business.name}: ${website}`);
      }
      this.processed++;
    } catch (error) {
      this.processed++;
    }
  }

  isDerivedWebsite(email) {
    if (!email || !email.includes('@')) return false;
    const domain = email.split('@')[1];
    return !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'].includes(domain);
  }

  deriveWebsiteFromEmail(email) {
    if (!this.isDerivedWebsite(email)) return null;
    const domain = email.split('@')[1];
    return `https://www.${domain}`;
  }

  async validateWebsite(url) {
    try {
      const response = await fetch(url, { 
        method: 'HEAD', 
        timeout: 3000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)' }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async findWebsiteViaApi(business) {
    // Optimized single API call with best query
    const query = `"${business.name}" ${business.postcode}`;
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${this.apiKey}`;
    
    try {
      const response = await this.rateLimitedApiCall(url);
      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        return await this.getWebsiteFromPlaceId(data.candidates[0].place_id);
      }
    } catch (error) {
      // Silent fail for individual API calls
    }
    
    return null;
  }

  async getWebsiteFromPlaceId(placeId) {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=website&key=${this.apiKey}`;
    
    try {
      const response = await this.rateLimitedApiCall(url);
      const data = await response.json();
      
      if (data.result && data.result.website) {
        return this.cleanWebsiteUrl(data.result.website);
      }
    } catch (error) {
      // Silent fail
    }
    
    return null;
  }

  cleanWebsiteUrl(url) {
    if (!url) return null;
    url = url.trim();
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    return url;
  }

  async updateBusinessWebsite(id, website) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE classes 
        SET website = $1, last_verified = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [website, id]);
    } finally {
      client.release();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runOptimizedFinder() {
    console.log('🚀 Ultra-Optimized Website Finder Starting...');
    console.log('⚡ Enhanced with smart email detection and optimized API usage');
    
    let batch = 1;
    while (true) {
      console.log(`\n📦 Processing batch ${batch}...`);
      
      const businesses = await this.getBusinessesWithoutWebsites();
      if (businesses.length === 0) {
        console.log('✅ All businesses processed!');
        break;
      }
      
      await this.processBatchOptimized(businesses);
      
      console.log(`📊 Batch ${batch}: ${this.websitesFound}/${this.processed} websites found`);
      batch++;
      
      if (batch > 100) { // Safety limit
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
          COUNT(*) FILTER (WHERE website IS NOT NULL AND website != '') as with_websites
        FROM classes WHERE is_active = true
      `);
      
      const { total, with_websites } = result.rows[0];
      const percentage = ((with_websites / total) * 100).toFixed(1);
      
      console.log(`\n🎉 Ultra-Optimized Website Finder Complete!`);
      console.log(`📊 Website Coverage: ${with_websites}/${total} (${percentage}%)`);
      console.log(`✅ Found ${this.websitesFound} new websites in this run`);
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

async function runUltraOptimizedWebsiteFinder() {
  const finder = new UltraOptimizedWebsiteFinder();
  try {
    await finder.runOptimizedFinder();
  } catch (error) {
    console.error('❌ Ultra-optimized finder failed:', error);
  } finally {
    await finder.close();
  }
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  runUltraOptimizedWebsiteFinder();
}

export { runUltraOptimizedWebsiteFinder };