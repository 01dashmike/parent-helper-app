#!/usr/bin/env node

import { Client } from 'pg';

class UltraAggressiveCollector {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.processedVenues = new Set();
    this.batchSize = 500;
    this.concurrency = 50;
    this.sessionsCompleted = 0;
    this.totalEmailsFound = 0;
    this.totalSocialFound = 0;
    this.totalRatingsFound = 0;
    this.totalPhonesFound = 0;
  }

  async initialize() {
    await this.client.connect();
    this.log('🚀 ULTRA AGGRESSIVE Collector Starting...');
    this.log('⚡ Maximum speed authentic data extraction');
    this.log(`🔧 Settings: ${this.concurrency} concurrent, ${this.batchSize} batch size`);
    this.log('🎯 TARGET: Dramatically increase authentic contact data');
  }

  log(message) {
    console.log(`${new Date().toISOString().slice(11, 19)} ${message}`);
  }

  async getAllPossibleVenues() {
    const query = `
      SELECT DISTINCT ON (name, venue, postcode)
        name, venue, postcode, town, latitude, longitude, website, phone, email
      FROM classes 
      WHERE is_active = true 
        AND (
          email IS NULL OR email = '' OR email LIKE '%@2x%' OR email LIKE '%.png'
          OR social_media IS NULL 
          OR business_rating IS NULL 
          OR phone IS NULL OR phone = ''
        )
      ORDER BY name, venue, postcode, RANDOM()
      LIMIT ${this.batchSize}
    `;
    
    const result = await this.client.query(query);
    return result.rows;
  }

  async searchBusinessDataFast(name, location, existingWebsite) {
    const searches = await Promise.allSettled([
      this.fastGoogleSearch(name, location),
      this.fastDirectorySearch(name, location),
      this.fastWebsiteExtraction(existingWebsite),
      this.fastSocialSearch(name, location)
    ]);

    const data = {
      email: null,
      phone: null,
      website: null,
      socialMedia: [],
      rating: null
    };

    searches.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        const found = result.value;
        if (!data.email && found.email) data.email = found.email;
        if (!data.phone && found.phone) data.phone = found.phone;
        if (!data.website && found.website) data.website = found.website;
        if (!data.rating && found.rating) data.rating = found.rating;
        if (found.socialMedia) data.socialMedia.push(...found.socialMedia);
      }
    });

    return data;
  }

  async fastGoogleSearch(name, location) {
    try {
      const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(name + ' ' + location)}&inputtype=textquery&fields=place_id&key=${this.apiKey}`;
      
      const searchResponse = await fetch(searchUrl, { timeout: 3000 });
      const searchData = await searchResponse.json();
      
      if (searchData.candidates && searchData.candidates.length > 0) {
        const placeId = searchData.candidates[0].place_id;
        
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=website,formatted_phone_number,rating,reviews&key=${this.apiKey}`;
        
        const detailsResponse = await fetch(detailsUrl, { timeout: 3000 });
        const detailsData = await detailsResponse.json();
        
        const result = detailsData.result;
        if (result) {
          // Extract email from reviews
          let emailFromReviews = null;
          if (result.reviews) {
            for (const review of result.reviews.slice(0, 2)) {
              const emailMatch = (review.text || '').match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/);
              if (emailMatch && emailMatch[0].length < 50 && !emailMatch[0].includes('gmail.com')) {
                emailFromReviews = emailMatch[0];
                break;
              }
            }
          }

          return {
            email: emailFromReviews,
            phone: result.formatted_phone_number,
            website: result.website,
            rating: result.rating
          };
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async fastDirectorySearch(name, location) {
    try {
      const searchUrl = `https://www.google.com/search?q="${encodeURIComponent(name)}" ${encodeURIComponent(location)} contact phone email site:*.co.uk`;
      
      const response = await fetch(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)' },
        timeout: 4000
      });
      
      const html = await response.text();
      
      const phoneRegex = /\b0\d{3}\s?\d{3}\s?\d{4}\b/g;
      const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
      const websiteRegex = /(https?:\/\/[^\s<>"']+\.co\.uk[^\s<>"']*)/gi;
      
      const phones = html.match(phoneRegex);
      const emails = html.match(emailRegex);
      const websites = html.match(websiteRegex);
      
      return {
        phone: phones ? phones[0] : null,
        email: emails ? emails.find(e => 
          e.length < 50 && 
          !e.includes('google.') && 
          !e.includes('noreply')
        ) : null,
        website: websites ? websites.find(w => !w.includes('google.')) : null
      };
    } catch (error) {
      return null;
    }
  }

  async fastWebsiteExtraction(website) {
    try {
      if (!website || website.includes('facebook.com')) return null;
      
      const response = await fetch(website, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)' },
        timeout: 5000
      });
      
      const html = await response.text();
      
      const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
      const phoneRegex = /\b0\d{3}\s?\d{3}\s?\d{4}\b/g;
      
      const emails = html.match(emailRegex);
      const phones = html.match(phoneRegex);
      
      // Fast social media extraction
      const socialMedia = [];
      if (html.includes('facebook.com/')) {
        const fbMatch = html.match(/facebook\.com\/[a-zA-Z0-9._-]+/);
        if (fbMatch) socialMedia.push(`Facebook: https://${fbMatch[0]}`);
      }
      if (html.includes('instagram.com/')) {
        const igMatch = html.match(/instagram\.com\/[a-zA-Z0-9._-]+/);
        if (igMatch) socialMedia.push(`Instagram: https://${igMatch[0]}`);
      }
      
      const validEmail = emails ? emails.find(email => 
        email.length < 50 &&
        !email.includes('noreply') &&
        !email.includes('.png') &&
        !email.includes('@2x') &&
        email.includes('@') &&
        email.includes('.')
      ) : null;
      
      return {
        email: validEmail,
        phone: phones ? phones[0] : null,
        socialMedia: socialMedia
      };
    } catch (error) {
      return null;
    }
  }

  async fastSocialSearch(name, location) {
    try {
      const searchUrl = `https://www.google.com/search?q="${encodeURIComponent(name)}" ${encodeURIComponent(location)} site:facebook.com OR site:instagram.com`;
      
      const response = await fetch(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)' },
        timeout: 4000
      });
      
      const html = await response.text();
      
      const socialMedia = [];
      const facebookMatch = html.match(/facebook\.com\/[a-zA-Z0-9._-]+/);
      const instagramMatch = html.match(/instagram\.com\/[a-zA-Z0-9._-]+/);
      
      if (facebookMatch) socialMedia.push(`Facebook: https://${facebookMatch[0]}`);
      if (instagramMatch) socialMedia.push(`Instagram: https://${instagramMatch[0]}`);
      
      return socialMedia.length > 0 ? { socialMedia } : null;
    } catch (error) {
      return null;
    }
  }

  async updateVenueDataUltraFast(classItem, data) {
    try {
      await this.client.query('ALTER TABLE classes ADD COLUMN IF NOT EXISTS social_media TEXT');
      await this.client.query('ALTER TABLE classes ADD COLUMN IF NOT EXISTS business_rating DECIMAL(3,1)');
    } catch (error) {
      // Columns exist
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
      data.email,
      data.phone,
      data.website,
      data.socialMedia.length > 0 ? data.socialMedia.join(' | ') : null,
      data.rating,
      classItem.venue || classItem.name,
      classItem.postcode
    ]);

    return true;
  }

  async processVenueUltraFast(classItem) {
    try {
      const venueKey = `${classItem.venue || classItem.name}_${classItem.postcode}`;
      
      if (this.processedVenues.has(venueKey)) {
        return { found: false };
      }

      const searchName = classItem.venue || classItem.name;
      const location = `${classItem.town}, ${classItem.postcode}`;
      
      const data = await this.searchBusinessDataFast(searchName, location, classItem.website);
      await this.updateVenueDataUltraFast(classItem, data);
      
      this.processedVenues.add(venueKey);
      
      const found = {
        email: data.email && data.email !== classItem.email,
        phone: data.phone && data.phone !== classItem.phone,
        website: data.website && data.website !== classItem.website,
        social: data.socialMedia.length > 0,
        rating: data.rating !== null,
        found: true
      };

      if (found.email) this.totalEmailsFound++;
      if (found.phone) this.totalPhonesFound++;
      if (found.social) this.totalSocialFound++;
      if (found.rating) this.totalRatingsFound++;
      
      return found;
    } catch (error) {
      return { found: false };
    }
  }

  async processBatchUltraAggressive() {
    try {
      const venues = await this.getAllPossibleVenues();
      
      if (venues.length === 0) {
        this.log('✅ All venues processed');
        return false;
      }

      this.log(`📦 Processing ${venues.length} venues with ${this.concurrency} concurrent requests...`);
      
      const batchStart = Date.now();
      let emailsThisBatch = 0;
      let socialThisBatch = 0;
      let ratingsThisBatch = 0;
      let phonesThisBatch = 0;
      
      // Process in ultra-fast chunks
      const chunks = [];
      for (let i = 0; i < venues.length; i += this.concurrency) {
        chunks.push(venues.slice(i, i + this.concurrency));
      }

      for (const chunk of chunks) {
        const results = await Promise.all(chunk.map(venue => this.processVenueUltraFast(venue)));
        
        results.forEach(result => {
          if (result.found) {
            if (result.email) emailsThisBatch++;
            if (result.phone) phonesThisBatch++;
            if (result.social) socialThisBatch++;
            if (result.rating) ratingsThisBatch++;
          }
        });

        // Minimal delay for rate limiting
        await this.sleep(200);
      }

      const duration = (Date.now() - batchStart) / 1000;
      this.sessionsCompleted++;
      
      this.log(`✅ Ultra batch ${this.sessionsCompleted}: +${emailsThisBatch} emails, +${phonesThisBatch} phones, +${socialThisBatch} social, +${ratingsThisBatch} ratings (${duration.toFixed(1)}s)`);
      
      return true;

    } catch (error) {
      this.log(`❌ Ultra batch error: ${error.message}`);
      return false;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async showUltraProgress() {
    const result = await this.client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN email IS NOT NULL AND email != '' AND email NOT LIKE '%.png' AND email NOT LIKE '%@2x%' THEN 1 END) as emails,
        COUNT(CASE WHEN social_media IS NOT NULL AND social_media != '' THEN 1 END) as social,
        COUNT(CASE WHEN business_rating IS NOT NULL THEN 1 END) as ratings,
        COUNT(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 END) as phones
      FROM classes WHERE is_active = true
    `);
    
    const stats = result.rows[0];
    const emailPct = (stats.emails/stats.total*100).toFixed(1);
    const socialPct = (stats.social/stats.total*100).toFixed(1);
    
    this.log(`📊 ULTRA PROGRESS: ${stats.emails} emails (${emailPct}%), ${stats.social} social (${socialPct}%), ${stats.ratings} ratings, ${stats.phones} phones`);
    this.log(`🎯 SESSION TOTALS: +${this.totalEmailsFound} emails, +${this.totalSocialFound} social, +${this.totalRatingsFound} ratings, +${this.totalPhonesFound} phones`);
  }

  async runUltraAggressiveCollection() {
    let batchCount = 1;
    let continueBatching = true;

    this.log('🎯 ULTRA AGGRESSIVE TARGET: Dramatically increase authentic contact data');

    while (continueBatching && batchCount <= 100) {
      this.log(`🔄 ULTRA AGGRESSIVE batch ${batchCount}...`);
      
      continueBatching = await this.processBatchUltraAggressive();
      
      if (continueBatching) {
        if (batchCount % 3 === 0) await this.showUltraProgress();
        batchCount++;
        await this.sleep(100);
      }
    }

    await this.showUltraProgress();
    this.log(`🎉 ULTRA AGGRESSIVE collection complete! ${this.sessionsCompleted} sessions processed`);
  }

  async close() {
    await this.client.end();
  }
}

async function runUltraAggressiveCollector() {
  const collector = new UltraAggressiveCollector();
  
  try {
    await collector.initialize();
    await collector.runUltraAggressiveCollection();
  } catch (error) {
    console.error('Ultra aggressive collector error:', error);
  } finally {
    await collector.close();
  }
}

runUltraAggressiveCollector();