#!/usr/bin/env node

import { Client } from 'pg';

class TurboParallelDataCollector {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.processedVenues = new Set();
    this.batchSize = 100;
    this.concurrency = 15;
    this.requestsPerSecond = 50;
    this.emailsFound = 0;
    this.socialMediaFound = 0;
    this.ratingsFound = 0;
    this.contactsFound = 0;
  }

  async initialize() {
    await this.client.connect();
    this.log('🚀 Turbo Parallel Data Collector Starting...');
    this.log('⚡ Maximum speed authentic data extraction');
    this.log(`🔧 Settings: ${this.concurrency} concurrent, ${this.batchSize} batch size, ${this.requestsPerSecond} req/sec`);
  }

  log(message) {
    console.log(`${new Date().toISOString().slice(11, 19)} ${message}`);
  }

  async getHighPriorityVenues() {
    const query = `
      SELECT DISTINCT ON (name, venue, postcode)
        name, venue, postcode, town, latitude, longitude, website, phone, email
      FROM classes 
      WHERE is_active = true 
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND (
          (email IS NULL OR email = '' OR email LIKE '%.png' OR email LIKE '%.jpg') 
          OR social_media IS NULL 
          OR business_rating IS NULL 
          OR phone IS NULL
        )
      ORDER BY name, venue, postcode, 
        CASE 
          WHEN email IS NULL THEN 0
          WHEN social_media IS NULL THEN 1
          WHEN business_rating IS NULL THEN 2
          ELSE 3
        END
      LIMIT ${this.batchSize}
    `;
    
    const result = await this.client.query(query);
    return result.rows;
  }

  async searchGooglePlacesOptimized(name, location) {
    try {
      const searchQuery = `${name} ${location}`;
      const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&key=${this.apiKey}`;
      
      const searchResponse = await fetch(searchUrl, { timeout: 5000 });
      const searchData = await searchResponse.json();
      
      if (searchData.candidates && searchData.candidates.length > 0) {
        const placeId = searchData.candidates[0].place_id;
        
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,website,formatted_phone_number,reviews,rating,user_ratings_total,price_level,business_status&key=${this.apiKey}`;
        
        const detailsResponse = await fetch(detailsUrl, { timeout: 5000 });
        const detailsData = await detailsResponse.json();
        
        const result = detailsData.result;
        if (result) {
          return {
            email: null,
            phone: result.formatted_phone_number || null,
            website: result.website || null,
            rating: result.rating || null,
            reviews: result.reviews || [],
            source: 'google'
          };
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async extractWebsiteDataFast(website) {
    try {
      if (!website || website.includes('facebook.com') || website.includes('instagram.com')) return null;
      
      const response = await fetch(website, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)',
          'Accept': 'text/html,application/xhtml+xml'
        },
        timeout: 6000
      });
      
      const html = await response.text();
      
      // Fast email extraction
      const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
      const emails = html.match(emailRegex);
      
      // Fast social media extraction
      const socialMedia = [];
      const facebookMatch = html.match(/facebook\.com\/[a-zA-Z0-9._-]+/);
      const instagramMatch = html.match(/instagram\.com\/[a-zA-Z0-9._-]+/);
      const twitterMatch = html.match(/twitter\.com\/[a-zA-Z0-9._-]+/);
      
      if (facebookMatch) socialMedia.push(`Facebook: https://${facebookMatch[0]}`);
      if (instagramMatch) socialMedia.push(`Instagram: https://${instagramMatch[0]}`);
      if (twitterMatch) socialMedia.push(`Twitter: https://${twitterMatch[0]}`);
      
      const validEmail = emails ? emails.find(email => 
        !email.includes('noreply') && 
        !email.includes('privacy') && 
        !email.includes('legal') &&
        !email.includes('test@') &&
        !email.includes('.png') &&
        !email.includes('.jpg') &&
        email.length < 50
      ) : null;
      
      return {
        email: validEmail,
        socialMedia: socialMedia,
        source: 'website'
      };
    } catch (error) {
      return null;
    }
  }

  async extractFromReviews(reviews) {
    if (!reviews || reviews.length === 0) return null;
    
    for (const review of reviews.slice(0, 3)) {
      const text = review.text || '';
      
      // Look for contact mentions in reviews
      const emailMatch = text.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/);
      if (emailMatch && emailMatch[0].length < 50 && !emailMatch[0].includes('gmail.com')) {
        return { email: emailMatch[0], source: 'reviews' };
      }
      
      // Look for booking information
      if (text.toLowerCase().includes('book') || text.toLowerCase().includes('contact')) {
        const phoneMatch = text.match(/\b0\d{3}\s?\d{3}\s?\d{4}\b/);
        if (phoneMatch) {
          return { phone: phoneMatch[0], source: 'reviews' };
        }
      }
    }
    
    return null;
  }

  async searchBusinessDirectoriesFast(name, location) {
    try {
      // Quick search on Yell.com for UK businesses
      const yellUrl = `https://www.yell.com/search?keywords=${encodeURIComponent(name)}&location=${encodeURIComponent(location)}`;
      
      const response = await fetch(yellUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)'
        },
        timeout: 5000
      });
      
      const html = await response.text();
      
      // Extract contact info from Yell listing
      const phoneMatch = html.match(/\b0\d{3}\s?\d{3}\s?\d{4}\b/);
      const emailMatch = html.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/);
      
      return {
        phone: phoneMatch ? phoneMatch[0] : null,
        email: emailMatch && emailMatch[0].length < 50 ? emailMatch[0] : null,
        source: 'directory'
      };
    } catch (error) {
      return null;
    }
  }

  async gatherCompleteBusinessData(classItem) {
    const searchName = classItem.venue || classItem.name;
    const location = `${classItem.town}, ${classItem.postcode}`;
    
    // Run all searches in parallel for maximum speed
    const [googleData, websiteData, directoryData] = await Promise.allSettled([
      this.searchGooglePlacesOptimized(searchName, location),
      classItem.website ? this.extractWebsiteDataFast(classItem.website) : null,
      this.searchBusinessDirectoriesFast(searchName, location)
    ]);

    // Aggregate the best data from all sources
    const aggregated = {
      email: classItem.email && !classItem.email.includes('.png') ? classItem.email : null,
      phone: classItem.phone || null,
      website: classItem.website || null,
      socialMedia: [],
      rating: null,
      additionalInfo: null
    };

    // Process Google data
    if (googleData.status === 'fulfilled' && googleData.value) {
      const google = googleData.value;
      if (!aggregated.email && google.email) aggregated.email = google.email;
      if (!aggregated.phone && google.phone) aggregated.phone = google.phone;
      if (!aggregated.website && google.website) aggregated.website = google.website;
      if (!aggregated.rating && google.rating) aggregated.rating = google.rating;
      
      // Extract from reviews
      if (google.reviews) {
        const reviewData = await this.extractFromReviews(google.reviews);
        if (reviewData) {
          if (!aggregated.email && reviewData.email) aggregated.email = reviewData.email;
          if (!aggregated.phone && reviewData.phone) aggregated.phone = reviewData.phone;
        }
      }
    }

    // Process website data
    if (websiteData.status === 'fulfilled' && websiteData.value) {
      const website = websiteData.value;
      if (!aggregated.email && website.email) aggregated.email = website.email;
      if (website.socialMedia) aggregated.socialMedia.push(...website.socialMedia);
    }

    // Process directory data
    if (directoryData.status === 'fulfilled' && directoryData.value) {
      const directory = directoryData.value;
      if (!aggregated.email && directory.email) aggregated.email = directory.email;
      if (!aggregated.phone && directory.phone) aggregated.phone = directory.phone;
    }

    // If we have a website but no email yet, try extracting from it
    if (aggregated.website && !aggregated.email && aggregated.website !== classItem.website) {
      const websiteData = await this.extractWebsiteDataFast(aggregated.website);
      if (websiteData && websiteData.email) {
        aggregated.email = websiteData.email;
      }
      if (websiteData && websiteData.socialMedia) {
        aggregated.socialMedia.push(...websiteData.socialMedia);
      }
    }

    return aggregated;
  }

  async updateVenueDataOptimized(classItem, enhancedData) {
    try {
      // Ensure columns exist
      await this.client.query('ALTER TABLE classes ADD COLUMN IF NOT EXISTS social_media TEXT');
      await this.client.query('ALTER TABLE classes ADD COLUMN IF NOT EXISTS business_rating DECIMAL(3,1)');
      await this.client.query('ALTER TABLE classes ADD COLUMN IF NOT EXISTS additional_info TEXT');
    } catch (error) {
      // Columns already exist
    }

    const query = `
      UPDATE classes 
      SET 
        email = COALESCE($1, email),
        phone = COALESCE($2, phone),
        website = COALESCE($3, website),
        social_media = COALESCE($4, social_media),
        business_rating = COALESCE($5, business_rating)
      WHERE (venue = $6 OR name = $6) 
        AND postcode = $7 
        AND is_active = true
    `;

    await this.client.query(query, [
      enhancedData.email,
      enhancedData.phone,
      enhancedData.website,
      enhancedData.socialMedia.length > 0 ? enhancedData.socialMedia.join(' | ') : null,
      enhancedData.rating,
      classItem.venue || classItem.name,
      classItem.postcode
    ]);

    // Track findings
    if (enhancedData.email && enhancedData.email !== classItem.email) this.emailsFound++;
    if (enhancedData.socialMedia.length > 0) this.socialMediaFound++;
    if (enhancedData.rating) this.ratingsFound++;
    if (enhancedData.phone || enhancedData.email) this.contactsFound++;

    return true;
  }

  async processVenueHighSpeed(classItem) {
    try {
      const venueKey = `${classItem.venue || classItem.name}_${classItem.postcode}`;
      
      if (this.processedVenues.has(venueKey)) {
        return false;
      }

      const enhancedData = await this.gatherCompleteBusinessData(classItem);
      await this.updateVenueDataOptimized(classItem, enhancedData);
      
      this.processedVenues.add(venueKey);
      
      const foundItems = [];
      if (enhancedData.email && enhancedData.email !== classItem.email) foundItems.push('email');
      if (enhancedData.socialMedia.length > 0) foundItems.push('social');
      if (enhancedData.rating) foundItems.push('rating');
      
      const foundText = foundItems.length > 0 ? ` (${foundItems.join(', ')})` : '';
      this.log(`✅ ${classItem.venue || classItem.name}${foundText}`);
      
      return true;
    } catch (error) {
      this.log(`❌ Error: ${classItem.name}: ${error.message}`);
      return false;
    }
  }

  async processBatchTurbo() {
    try {
      const venues = await this.getHighPriorityVenues();
      
      if (venues.length === 0) {
        this.log('✅ All high-priority venues processed');
        return false;
      }

      this.log(`📦 Processing ${venues.length} venues with ${this.concurrency} concurrent requests...`);
      
      // Split into chunks for concurrent processing
      const chunks = [];
      for (let i = 0; i < venues.length; i += this.concurrency) {
        chunks.push(venues.slice(i, i + this.concurrency));
      }

      for (const chunk of chunks) {
        await Promise.all(chunk.map(venue => this.processVenueHighSpeed(venue)));
        // Rate limiting
        await this.sleep(1000 / (this.requestsPerSecond / this.concurrency));
      }

      this.log(`✅ Batch complete: +${this.emailsFound} emails, +${this.socialMediaFound} social, +${this.ratingsFound} ratings`);
      
      // Reset counters for next batch
      this.emailsFound = 0;
      this.socialMediaFound = 0;
      this.ratingsFound = 0;
      this.contactsFound = 0;
      
      return true;

    } catch (error) {
      this.log(`❌ Batch error: ${error.message}`);
      return false;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async showProgress() {
    const result = await this.client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN email IS NOT NULL AND email != '' AND email NOT LIKE '%.png' AND email NOT LIKE '%.jpg' THEN 1 END) as with_email,
        COUNT(CASE WHEN social_media IS NOT NULL AND social_media != '' THEN 1 END) as with_social,
        COUNT(CASE WHEN business_rating IS NOT NULL THEN 1 END) as with_rating,
        COUNT(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 END) as with_phone
      FROM classes WHERE is_active = true
    `);
    
    const stats = result.rows[0];
    const emailPct = (stats.with_email/stats.total*100).toFixed(1);
    const socialPct = (stats.with_social/stats.total*100).toFixed(1);
    this.log(`📊 Current: ${stats.with_email} emails (${emailPct}%), ${stats.with_social} social (${socialPct}%), ${stats.with_rating} ratings, ${stats.with_phone} phones`);
  }

  async runTurboCollection() {
    let batchCount = 1;
    let continueBatching = true;

    while (continueBatching && batchCount <= 30) {
      this.log(`🔄 Turbo batch ${batchCount}...`);
      
      continueBatching = await this.processBatchTurbo();
      
      if (continueBatching) {
        if (batchCount % 3 === 0) await this.showProgress();
        batchCount++;
        await this.sleep(500);
      }
    }

    await this.showProgress();
    this.log('🎉 Turbo collection complete!');
  }

  async close() {
    await this.client.end();
  }
}

async function runTurboParallelDataCollector() {
  const collector = new TurboParallelDataCollector();
  
  try {
    await collector.initialize();
    await collector.runTurboCollection();
  } catch (error) {
    console.error('Turbo collector error:', error);
  } finally {
    await collector.close();
  }
}

runTurboParallelDataCollector();