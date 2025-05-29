#!/usr/bin/env node

import { Client } from 'pg';

class MegaParallelContactCollector {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.processedVenues = new Set();
    this.batchSize = 200;
    this.concurrency = 25;
    this.requestsPerSecond = 80;
    this.emailsFound = 0;
    this.socialMediaFound = 0;
    this.ratingsFound = 0;
    this.contactsFound = 0;
    this.sessionsCompleted = 0;
  }

  async initialize() {
    await this.client.connect();
    this.log('🚀 MEGA Parallel Contact Collector Starting...');
    this.log('⚡ Ultra high-speed authentic data extraction');
    this.log(`🔧 Settings: ${this.concurrency} concurrent, ${this.batchSize} batch size, ${this.requestsPerSecond} req/sec`);
  }

  log(message) {
    console.log(`${new Date().toISOString().slice(11, 19)} ${message}`);
  }

  async getAllVenuesNeedingData() {
    const query = `
      SELECT DISTINCT ON (name, venue, postcode)
        name, venue, postcode, town, latitude, longitude, website, phone, email
      FROM classes 
      WHERE is_active = true 
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND (
          (email IS NULL OR email = '' OR email LIKE '%.png' OR email LIKE '%.jpg' OR email LIKE '%@2x%') 
          OR social_media IS NULL 
          OR business_rating IS NULL 
          OR phone IS NULL OR phone = ''
          OR website IS NULL OR website = ''
        )
      ORDER BY name, venue, postcode, 
        CASE 
          WHEN email IS NULL OR email = '' THEN 0
          WHEN social_media IS NULL THEN 1
          WHEN business_rating IS NULL THEN 2
          WHEN phone IS NULL THEN 3
          ELSE 4
        END
      LIMIT ${this.batchSize}
    `;
    
    const result = await this.client.query(query);
    return result.rows;
  }

  async searchMultiplePlatforms(name, location) {
    const searches = await Promise.allSettled([
      this.searchGooglePlacesComplete(name, location),
      this.searchBusinessDirectories(name, location),
      this.searchSocialMedia(name, location)
    ]);

    const results = {};
    searches.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const source = ['google', 'directories', 'social'][index];
        results[source] = result.value;
      }
    });

    return results;
  }

  async searchGooglePlacesComplete(name, location) {
    try {
      const searchQuery = `${name} ${location}`;
      const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&key=${this.apiKey}`;
      
      const searchResponse = await fetch(searchUrl, { timeout: 4000 });
      const searchData = await searchResponse.json();
      
      if (searchData.candidates && searchData.candidates.length > 0) {
        const placeId = searchData.candidates[0].place_id;
        
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,website,formatted_phone_number,reviews,rating,user_ratings_total,price_level,business_status,international_phone_number&key=${this.apiKey}`;
        
        const detailsResponse = await fetch(detailsUrl, { timeout: 4000 });
        const detailsData = await detailsResponse.json();
        
        const result = detailsData.result;
        if (result) {
          return {
            email: null,
            phone: result.formatted_phone_number || result.international_phone_number || null,
            website: result.website || null,
            rating: result.rating || null,
            userRatingsTotal: result.user_ratings_total || null,
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

  async searchBusinessDirectories(name, location) {
    try {
      const searches = [
        `https://www.yell.com/search?keywords=${encodeURIComponent(name)}&location=${encodeURIComponent(location)}`,
        `https://www.bing.com/search?q="${encodeURIComponent(name)}" ${encodeURIComponent(location)} phone email contact`,
        `https://www.google.com/search?q="${encodeURIComponent(name)}" ${encodeURIComponent(location)} contact details phone email`
      ];

      const searchPromises = searches.map(url => this.extractFromSearchPage(url, name));
      const results = await Promise.allSettled(searchPromises);
      
      const combinedData = {
        email: null,
        phone: null,
        website: null,
        source: 'directories'
      };

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          if (!combinedData.email && result.value.email) combinedData.email = result.value.email;
          if (!combinedData.phone && result.value.phone) combinedData.phone = result.value.phone;
          if (!combinedData.website && result.value.website) combinedData.website = result.value.website;
        }
      });

      return Object.values(combinedData).some(v => v) ? combinedData : null;
    } catch (error) {
      return null;
    }
  }

  async extractFromSearchPage(url, businessName) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)',
          'Accept': 'text/html,application/xhtml+xml'
        },
        timeout: 5000
      });
      
      const html = await response.text();
      
      // Extract contact information
      const phoneRegex = /(?:tel:|phone:|call:)?\s*(\+44|0)[\d\s\(\)-]{9,15}/gi;
      const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
      const websiteRegex = /(https?:\/\/[^\s<>"']+\.(?:co\.uk|com|org|net)[^\s<>"']*)/gi;
      
      const phones = html.match(phoneRegex);
      const emails = html.match(emailRegex);
      const websites = html.match(websiteRegex);
      
      return {
        phone: phones ? phones[0].replace(/tel:|phone:|call:/gi, '').trim() : null,
        email: emails ? emails.find(email => 
          !email.includes('noreply') && 
          !email.includes('privacy') && 
          !email.includes('legal') &&
          !email.includes('@google.') &&
          !email.includes('@bing.') &&
          !email.includes('@yell.') &&
          email.length < 50
        ) : null,
        website: websites ? websites[0] : null
      };
    } catch (error) {
      return null;
    }
  }

  async searchSocialMedia(name, location) {
    try {
      const socialSearches = [
        `https://www.facebook.com/search/pages/?q=${encodeURIComponent(name + ' ' + location)}`,
        `https://www.instagram.com/explore/tags/${encodeURIComponent(name.replace(/\s+/g, ''))}/`,
        `https://www.google.com/search?q=site:facebook.com "${encodeURIComponent(name)}" ${encodeURIComponent(location)}`
      ];

      const results = await Promise.allSettled(
        socialSearches.map(url => this.extractSocialMediaInfo(url, name))
      );

      const socialMedia = [];
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          socialMedia.push(...result.value);
        }
      });

      return socialMedia.length > 0 ? { socialMedia, source: 'social' } : null;
    } catch (error) {
      return null;
    }
  }

  async extractSocialMediaInfo(url, businessName) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)',
          'Accept': 'text/html,application/xhtml+xml'
        },
        timeout: 5000
      });
      
      const html = await response.text();
      
      const socialMedia = [];
      const facebookRegex = /facebook\.com\/[a-zA-Z0-9._-]+/g;
      const instagramRegex = /instagram\.com\/[a-zA-Z0-9._-]+/g;
      const twitterRegex = /twitter\.com\/[a-zA-Z0-9._-]+/g;
      
      const facebook = html.match(facebookRegex);
      const instagram = html.match(instagramRegex);
      const twitter = html.match(twitterRegex);
      
      if (facebook) socialMedia.push(`Facebook: https://${facebook[0]}`);
      if (instagram) socialMedia.push(`Instagram: https://${instagram[0]}`);
      if (twitter) socialMedia.push(`Twitter: https://${twitter[0]}`);
      
      return socialMedia;
    } catch (error) {
      return [];
    }
  }

  async extractWebsiteDataComplete(website) {
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
      
      // Enhanced email extraction
      const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
      const emails = html.match(emailRegex);
      
      // Enhanced phone extraction
      const phoneRegex = /(?:tel:|phone:|call:|contact:)?\s*(\+44|0)[\d\s\(\)-]{9,15}/gi;
      const phones = html.match(phoneRegex);
      
      // Enhanced social media extraction
      const socialMedia = [];
      const facebookMatch = html.match(/facebook\.com\/[a-zA-Z0-9._-]+/);
      const instagramMatch = html.match(/instagram\.com\/[a-zA-Z0-9._-]+/);
      const twitterMatch = html.match(/twitter\.com\/[a-zA-Z0-9._-]+/);
      const linkedinMatch = html.match(/linkedin\.com\/[a-zA-Z0-9._-]+/);
      
      if (facebookMatch) socialMedia.push(`Facebook: https://${facebookMatch[0]}`);
      if (instagramMatch) socialMedia.push(`Instagram: https://${instagramMatch[0]}`);
      if (twitterMatch) socialMedia.push(`Twitter: https://${twitterMatch[0]}`);
      if (linkedinMatch) socialMedia.push(`LinkedIn: https://${linkedinMatch[0]}`);
      
      const validEmail = emails ? emails.find(email => 
        !email.includes('noreply') && 
        !email.includes('privacy') && 
        !email.includes('legal') &&
        !email.includes('test@') &&
        !email.includes('.png') &&
        !email.includes('.jpg') &&
        !email.includes('@2x') &&
        !email.includes('example.com') &&
        email.length < 50 &&
        email.includes('@') &&
        email.includes('.')
      ) : null;
      
      return {
        email: validEmail,
        phone: phones ? phones[0].replace(/tel:|phone:|call:|contact:/gi, '').trim() : null,
        socialMedia: socialMedia,
        source: 'website'
      };
    } catch (error) {
      return null;
    }
  }

  async extractFromReviewsComplete(reviews) {
    if (!reviews || reviews.length === 0) return null;
    
    for (const review of reviews.slice(0, 5)) {
      const text = review.text || '';
      
      // Look for contact information in reviews
      const emailMatch = text.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/);
      if (emailMatch && emailMatch[0].length < 50 && !emailMatch[0].includes('gmail.com') && !emailMatch[0].includes('hotmail.com')) {
        return { email: emailMatch[0], source: 'reviews' };
      }
      
      // Look for booking information and phone numbers
      if (text.toLowerCase().includes('book') || text.toLowerCase().includes('contact') || text.toLowerCase().includes('call')) {
        const phoneMatch = text.match(/\b0\d{3}\s?\d{3}\s?\d{4}\b/);
        if (phoneMatch) {
          return { phone: phoneMatch[0], source: 'reviews' };
        }
      }
    }
    
    return null;
  }

  async aggregateCompleteBusinessData(classItem, platformResults) {
    // Start with existing data
    const aggregated = {
      email: classItem.email && !classItem.email.includes('.png') && !classItem.email.includes('@2x') ? classItem.email : null,
      phone: classItem.phone || null,
      website: classItem.website || null,
      socialMedia: [],
      rating: null,
      userRatingsTotal: null,
      additionalInfo: null
    };

    // Process Google data first (highest priority)
    if (platformResults.google) {
      const google = platformResults.google;
      if (!aggregated.phone && google.phone) aggregated.phone = google.phone;
      if (!aggregated.website && google.website) aggregated.website = google.website;
      if (!aggregated.rating && google.rating) aggregated.rating = google.rating;
      if (google.userRatingsTotal) aggregated.userRatingsTotal = google.userRatingsTotal;
      
      // Extract from reviews
      if (google.reviews) {
        const reviewData = await this.extractFromReviewsComplete(google.reviews);
        if (reviewData) {
          if (!aggregated.email && reviewData.email) aggregated.email = reviewData.email;
          if (!aggregated.phone && reviewData.phone) aggregated.phone = reviewData.phone;
        }
      }
    }

    // Process directories data
    if (platformResults.directories) {
      const dir = platformResults.directories;
      if (!aggregated.email && dir.email) aggregated.email = dir.email;
      if (!aggregated.phone && dir.phone) aggregated.phone = dir.phone;
      if (!aggregated.website && dir.website) aggregated.website = dir.website;
    }

    // Process social media data
    if (platformResults.social && platformResults.social.socialMedia) {
      aggregated.socialMedia.push(...platformResults.social.socialMedia);
    }

    // Extract from website if we have one
    if (aggregated.website && (!aggregated.email || aggregated.socialMedia.length === 0)) {
      const websiteData = await this.extractWebsiteDataComplete(aggregated.website);
      if (websiteData) {
        if (!aggregated.email && websiteData.email) aggregated.email = websiteData.email;
        if (!aggregated.phone && websiteData.phone) aggregated.phone = websiteData.phone;
        if (websiteData.socialMedia) aggregated.socialMedia.push(...websiteData.socialMedia);
      }
    }

    // If we have Google website but no current website, try extracting from it
    if (platformResults.google && platformResults.google.website && !classItem.website) {
      const websiteData = await this.extractWebsiteDataComplete(platformResults.google.website);
      if (websiteData) {
        if (!aggregated.email && websiteData.email) aggregated.email = websiteData.email;
        if (!aggregated.phone && websiteData.phone) aggregated.phone = websiteData.phone;
        if (websiteData.socialMedia) aggregated.socialMedia.push(...websiteData.socialMedia);
      }
    }

    return aggregated;
  }

  async updateVenueDataMega(classItem, enhancedData) {
    try {
      // Ensure columns exist
      await this.client.query('ALTER TABLE classes ADD COLUMN IF NOT EXISTS social_media TEXT');
      await this.client.query('ALTER TABLE classes ADD COLUMN IF NOT EXISTS business_rating DECIMAL(3,1)');
      await this.client.query('ALTER TABLE classes ADD COLUMN IF NOT EXISTS user_ratings_total INTEGER');
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
        business_rating = COALESCE($5, business_rating),
        user_ratings_total = COALESCE($6, user_ratings_total)
      WHERE (venue = $7 OR name = $7) 
        AND postcode = $8 
        AND is_active = true
    `;

    await this.client.query(query, [
      enhancedData.email,
      enhancedData.phone,
      enhancedData.website,
      enhancedData.socialMedia.length > 0 ? enhancedData.socialMedia.join(' | ') : null,
      enhancedData.rating,
      enhancedData.userRatingsTotal,
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

  async processVenueMegaSpeed(classItem) {
    try {
      const venueKey = `${classItem.venue || classItem.name}_${classItem.postcode}`;
      
      if (this.processedVenues.has(venueKey)) {
        return false;
      }

      const searchName = classItem.venue || classItem.name;
      const location = `${classItem.town}, ${classItem.postcode}`;
      
      const platformResults = await this.searchMultiplePlatforms(searchName, location);
      const enhancedData = await this.aggregateCompleteBusinessData(classItem, platformResults);
      await this.updateVenueDataMega(classItem, enhancedData);
      
      this.processedVenues.add(venueKey);
      
      const foundItems = [];
      if (enhancedData.email && enhancedData.email !== classItem.email) foundItems.push('email');
      if (enhancedData.socialMedia.length > 0) foundItems.push('social');
      if (enhancedData.rating) foundItems.push('rating');
      if (enhancedData.phone && enhancedData.phone !== classItem.phone) foundItems.push('phone');
      
      const foundText = foundItems.length > 0 ? ` (${foundItems.join(', ')})` : '';
      if (foundItems.length > 0) {
        this.log(`✅ ${classItem.venue || classItem.name}${foundText}`);
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async processBatchMega() {
    try {
      const venues = await this.getAllVenuesNeedingData();
      
      if (venues.length === 0) {
        this.log('✅ All venues processed with available data');
        return false;
      }

      this.log(`📦 Processing ${venues.length} venues with ${this.concurrency} concurrent requests...`);
      
      // Reset counters
      this.emailsFound = 0;
      this.socialMediaFound = 0;
      this.ratingsFound = 0;
      this.contactsFound = 0;
      
      // Split into chunks for mega concurrent processing
      const chunks = [];
      for (let i = 0; i < venues.length; i += this.concurrency) {
        chunks.push(venues.slice(i, i + this.concurrency));
      }

      for (const chunk of chunks) {
        await Promise.all(chunk.map(venue => this.processVenueMegaSpeed(venue)));
        // Minimal rate limiting for maximum speed
        await this.sleep(800 / (this.requestsPerSecond / this.concurrency));
      }

      this.log(`✅ Mega batch complete: +${this.emailsFound} emails, +${this.socialMediaFound} social, +${this.ratingsFound} ratings, +${this.contactsFound} contacts`);
      this.sessionsCompleted++;
      
      return true;

    } catch (error) {
      this.log(`❌ Mega batch error: ${error.message}`);
      return false;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async showProgressDetailed() {
    const result = await this.client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN email IS NOT NULL AND email != '' AND email NOT LIKE '%.png' AND email NOT LIKE '%.jpg' AND email NOT LIKE '%@2x%' THEN 1 END) as with_email,
        COUNT(CASE WHEN social_media IS NOT NULL AND social_media != '' THEN 1 END) as with_social,
        COUNT(CASE WHEN business_rating IS NOT NULL THEN 1 END) as with_rating,
        COUNT(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 END) as with_phone,
        COUNT(CASE WHEN website IS NOT NULL AND website != '' THEN 1 END) as with_website
      FROM classes WHERE is_active = true
    `);
    
    const stats = result.rows[0];
    const emailPct = (stats.with_email/stats.total*100).toFixed(1);
    const socialPct = (stats.with_social/stats.total*100).toFixed(1);
    const ratingPct = (stats.with_rating/stats.total*100).toFixed(1);
    
    this.log(`📊 Progress: ${stats.with_email} emails (${emailPct}%), ${stats.with_social} social (${socialPct}%), ${stats.with_rating} ratings (${ratingPct}%), ${stats.with_phone} phones, ${stats.with_website} websites`);
  }

  async runMegaCollection() {
    let batchCount = 1;
    let continueBatching = true;

    this.log('🎯 Target: Maximize authentic contact data collection');

    while (continueBatching && batchCount <= 50) {
      this.log(`🔄 MEGA batch ${batchCount}...`);
      
      continueBatching = await this.processBatchMega();
      
      if (continueBatching) {
        if (batchCount % 2 === 0) await this.showProgressDetailed();
        batchCount++;
        await this.sleep(300);
      }
    }

    await this.showProgressDetailed();
    this.log(`🎉 MEGA collection complete! Processed ${this.sessionsCompleted} sessions`);
  }

  async close() {
    await this.client.end();
  }
}

async function runMegaParallelContactCollector() {
  const collector = new MegaParallelContactCollector();
  
  try {
    await collector.initialize();
    await collector.runMegaCollection();
  } catch (error) {
    console.error('Mega collector error:', error);
  } finally {
    await collector.close();
  }
}

runMegaParallelContactCollector();