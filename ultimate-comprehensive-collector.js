#!/usr/bin/env node

import { Client } from 'pg';

class UltimateComprehensiveCollector {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.processedVenues = new Set();
    this.batchSize = 300;
    this.concurrency = 30;
    this.emailsFound = 0;
    this.socialMediaFound = 0;
    this.ratingsFound = 0;
    this.phonesFound = 0;
    this.websitesFound = 0;
  }

  async initialize() {
    await this.client.connect();
    this.log('🚀 ULTIMATE Comprehensive Collector Starting...');
    this.log('⚡ Maximum authentic data extraction from all possible sources');
    this.log(`🔧 Settings: ${this.concurrency} concurrent, ${this.batchSize} batch size`);
  }

  log(message) {
    console.log(`${new Date().toISOString().slice(11, 19)} ${message}`);
  }

  async getVenuesForProcessing() {
    const query = `
      SELECT DISTINCT ON (name, venue, postcode)
        name, venue, postcode, town, latitude, longitude, website, phone, email
      FROM classes 
      WHERE is_active = true 
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND (
          (email IS NULL OR email = '' OR email LIKE '%@2x%' OR email LIKE '%.png') 
          OR social_media IS NULL 
          OR business_rating IS NULL 
          OR phone IS NULL OR phone = ''
          OR website IS NULL OR website = ''
        )
      ORDER BY name, venue, postcode, RANDOM()
      LIMIT ${this.batchSize}
    `;
    
    const result = await this.client.query(query);
    return result.rows;
  }

  async searchAllAuthenticSources(name, location, existingWebsite) {
    const searchPromises = [
      this.searchGoogleMaps(name, location),
      this.searchUKDirectories(name, location),
      this.searchBusinessWebsites(name, location, existingWebsite),
      this.searchSocialPlatforms(name, location),
      this.searchReviewSites(name, location),
      this.searchLocalListings(name, location)
    ];

    const results = await Promise.allSettled(searchPromises);
    
    const combinedData = {
      emails: new Set(),
      phones: new Set(),
      websites: new Set(),
      socialMedia: new Set(),
      ratings: [],
      sources: []
    };

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const data = result.value;
        if (data.email) combinedData.emails.add(data.email);
        if (data.phone) combinedData.phones.add(data.phone);
        if (data.website) combinedData.websites.add(data.website);
        if (data.socialMedia) data.socialMedia.forEach(sm => combinedData.socialMedia.add(sm));
        if (data.rating) combinedData.ratings.push(data.rating);
        if (data.source) combinedData.sources.push(data.source);
      }
    });

    return combinedData;
  }

  async searchGoogleMaps(name, location) {
    try {
      const searchQuery = `${name} ${location}`;
      const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&key=${this.apiKey}`;
      
      const searchResponse = await fetch(searchUrl, { timeout: 5000 });
      const searchData = await searchResponse.json();
      
      if (searchData.candidates && searchData.candidates.length > 0) {
        const placeId = searchData.candidates[0].place_id;
        
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,website,formatted_phone_number,reviews,rating,user_ratings_total,business_status,international_phone_number,url&key=${this.apiKey}`;
        
        const detailsResponse = await fetch(detailsUrl, { timeout: 5000 });
        const detailsData = await detailsResponse.json();
        
        const result = detailsData.result;
        if (result) {
          // Extract email from reviews
          let emailFromReviews = null;
          if (result.reviews) {
            for (const review of result.reviews.slice(0, 3)) {
              const emailMatch = (review.text || '').match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/);
              if (emailMatch && emailMatch[0].length < 50 && !emailMatch[0].includes('gmail.com')) {
                emailFromReviews = emailMatch[0];
                break;
              }
            }
          }

          return {
            email: emailFromReviews,
            phone: result.formatted_phone_number || result.international_phone_number,
            website: result.website,
            rating: result.rating,
            userRatingsTotal: result.user_ratings_total,
            source: 'google_maps'
          };
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async searchUKDirectories(name, location) {
    try {
      const directories = [
        `https://www.yell.com/search?keywords=${encodeURIComponent(name)}&location=${encodeURIComponent(location)}`,
        `https://www.scoot.co.uk/search?q=${encodeURIComponent(name)}&l=${encodeURIComponent(location)}`,
        `https://www.bing.com/search?q="${encodeURIComponent(name)}" ${encodeURIComponent(location)} contact phone email`,
        `https://www.google.com/search?q="${encodeURIComponent(name)}" ${encodeURIComponent(location)} site:*.co.uk contact`
      ];

      const searchPromises = directories.map(url => this.extractFromDirectoryPage(url));
      const results = await Promise.allSettled(searchPromises);
      
      const combinedData = { emails: [], phones: [], websites: [] };
      
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          if (result.value.email) combinedData.emails.push(result.value.email);
          if (result.value.phone) combinedData.phones.push(result.value.phone);
          if (result.value.website) combinedData.websites.push(result.value.website);
        }
      });

      return {
        email: combinedData.emails[0] || null,
        phone: combinedData.phones[0] || null,
        website: combinedData.websites[0] || null,
        source: 'uk_directories'
      };
    } catch (error) {
      return null;
    }
  }

  async extractFromDirectoryPage(url) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)',
          'Accept': 'text/html,application/xhtml+xml'
        },
        timeout: 6000
      });
      
      const html = await response.text();
      
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
          !email.includes('@google.') &&
          !email.includes('@bing.') &&
          email.length < 50
        ) : null,
        website: websites ? websites.find(w => !w.includes('google.') && !w.includes('bing.')) : null
      };
    } catch (error) {
      return null;
    }
  }

  async searchBusinessWebsites(name, location, existingWebsite) {
    try {
      const websites = [];
      if (existingWebsite) websites.push(existingWebsite);
      
      // Search for additional websites
      const searchUrl = `https://www.google.com/search?q="${encodeURIComponent(name)}" ${encodeURIComponent(location)} site:*.co.uk OR site:*.com`;
      const response = await fetch(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)' },
        timeout: 5000
      });
      
      const html = await response.text();
      const websiteMatches = html.match(/(https?:\/\/[^\s<>"']+\.(?:co\.uk|com)[^\s<>"']*)/gi);
      
      if (websiteMatches) {
        websiteMatches.slice(0, 3).forEach(url => {
          if (!url.includes('google.') && !url.includes('facebook.')) {
            websites.push(url);
          }
        });
      }

      // Extract data from all found websites
      const websitePromises = websites.slice(0, 3).map(url => this.extractFromBusinessWebsite(url));
      const results = await Promise.allSettled(websitePromises);
      
      const combinedData = { emails: [], phones: [], socialMedia: [] };
      
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          if (result.value.email) combinedData.emails.push(result.value.email);
          if (result.value.phone) combinedData.phones.push(result.value.phone);
          if (result.value.socialMedia) combinedData.socialMedia.push(...result.value.socialMedia);
        }
      });

      return {
        email: combinedData.emails[0] || null,
        phone: combinedData.phones[0] || null,
        socialMedia: combinedData.socialMedia,
        source: 'business_websites'
      };
    } catch (error) {
      return null;
    }
  }

  async extractFromBusinessWebsite(website) {
    try {
      const response = await fetch(website, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)',
          'Accept': 'text/html,application/xhtml+xml'
        },
        timeout: 8000
      });
      
      const html = await response.text();
      
      // Enhanced contact extraction
      const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
      const phoneRegex = /(?:tel:|phone:|contact:|call:)?\s*(\+44|0)[\d\s\(\)-]{9,15}/gi;
      
      const emails = html.match(emailRegex);
      const phones = html.match(phoneRegex);
      
      // Social media extraction
      const socialMedia = [];
      const facebookMatch = html.match(/facebook\.com\/[a-zA-Z0-9._-]+/);
      const instagramMatch = html.match(/instagram\.com\/[a-zA-Z0-9._-]+/);
      const twitterMatch = html.match(/twitter\.com\/[a-zA-Z0-9._-]+/);
      const linkedinMatch = html.match(/linkedin\.com\/[a-zA-Z0-9._-]+/);
      const youtubeMatch = html.match(/youtube\.com\/[a-zA-Z0-9._-]+/);
      
      if (facebookMatch) socialMedia.push(`Facebook: https://${facebookMatch[0]}`);
      if (instagramMatch) socialMedia.push(`Instagram: https://${instagramMatch[0]}`);
      if (twitterMatch) socialMedia.push(`Twitter: https://${twitterMatch[0]}`);
      if (linkedinMatch) socialMedia.push(`LinkedIn: https://${linkedinMatch[0]}`);
      if (youtubeMatch) socialMedia.push(`YouTube: https://${youtubeMatch[0]}`);
      
      const validEmail = emails ? emails.find(email => 
        !email.includes('noreply') && 
        !email.includes('privacy') && 
        !email.includes('legal') &&
        !email.includes('@2x') &&
        !email.includes('.png') &&
        !email.includes('example.com') &&
        email.length < 50 &&
        email.includes('@') &&
        email.includes('.')
      ) : null;
      
      return {
        email: validEmail,
        phone: phones ? phones[0].replace(/tel:|phone:|contact:|call:/gi, '').trim() : null,
        socialMedia: socialMedia
      };
    } catch (error) {
      return null;
    }
  }

  async searchSocialPlatforms(name, location) {
    try {
      const socialSearches = [
        `https://www.facebook.com/search/pages/?q=${encodeURIComponent(name + ' ' + location)}`,
        `https://www.google.com/search?q=site:facebook.com "${encodeURIComponent(name)}" ${encodeURIComponent(location)}`,
        `https://www.google.com/search?q=site:instagram.com "${encodeURIComponent(name)}"`,
        `https://www.google.com/search?q=site:twitter.com "${encodeURIComponent(name)}"`
      ];

      const results = await Promise.allSettled(
        socialSearches.map(url => this.extractSocialFromSearch(url))
      );

      const socialMedia = [];
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          socialMedia.push(...result.value);
        }
      });

      return socialMedia.length > 0 ? { socialMedia, source: 'social_platforms' } : null;
    } catch (error) {
      return null;
    }
  }

  async extractSocialFromSearch(url) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)' },
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

  async searchReviewSites(name, location) {
    try {
      const reviewSites = [
        `https://www.google.com/search?q=site:tripadvisor.co.uk "${encodeURIComponent(name)}" ${encodeURIComponent(location)}`,
        `https://www.google.com/search?q=site:trustpilot.com "${encodeURIComponent(name)}"`,
        `https://www.google.com/search?q="${encodeURIComponent(name)}" ${encodeURIComponent(location)} reviews contact`
      ];

      const results = await Promise.allSettled(
        reviewSites.map(url => this.extractFromReviewSearch(url))
      );

      let rating = null;
      let contact = null;

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          if (!rating && result.value.rating) rating = result.value.rating;
          if (!contact && result.value.contact) contact = result.value.contact;
        }
      });

      return rating || contact ? { rating, contact, source: 'review_sites' } : null;
    } catch (error) {
      return null;
    }
  }

  async extractFromReviewSearch(url) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)' },
        timeout: 5000
      });
      
      const html = await response.text();
      
      const ratingMatch = html.match(/(\d+\.?\d*)\s*(?:out of|\/)\s*5|(\d+\.?\d*)\s*stars?/i);
      const phoneMatch = html.match(/\b0\d{3}\s?\d{3}\s?\d{4}\b/);
      const emailMatch = html.match(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/);
      
      return {
        rating: ratingMatch ? parseFloat(ratingMatch[1] || ratingMatch[2]) : null,
        contact: phoneMatch ? phoneMatch[0] : (emailMatch ? emailMatch[0] : null)
      };
    } catch (error) {
      return null;
    }
  }

  async searchLocalListings(name, location) {
    try {
      const localSearches = [
        `https://www.google.com/search?q="${encodeURIComponent(name)}" ${encodeURIComponent(location)} opening hours phone`,
        `https://www.bing.com/search?q="${encodeURIComponent(name)}" ${encodeURIComponent(location)} address phone email`
      ];

      const results = await Promise.allSettled(
        localSearches.map(url => this.extractFromLocalSearch(url))
      );

      const localData = { phone: null, email: null, website: null };
      
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          if (!localData.phone && result.value.phone) localData.phone = result.value.phone;
          if (!localData.email && result.value.email) localData.email = result.value.email;
          if (!localData.website && result.value.website) localData.website = result.value.website;
        }
      });

      return Object.values(localData).some(v => v) ? { ...localData, source: 'local_listings' } : null;
    } catch (error) {
      return null;
    }
  }

  async extractFromLocalSearch(url) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)' },
        timeout: 5000
      });
      
      const html = await response.text();
      
      const phoneRegex = /\b0\d{3}\s?\d{3}\s?\d{4}\b/g;
      const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
      const websiteRegex = /(https?:\/\/[^\s<>"']+\.(?:co\.uk|com)[^\s<>"']*)/gi;
      
      const phones = html.match(phoneRegex);
      const emails = html.match(emailRegex);
      const websites = html.match(websiteRegex);
      
      return {
        phone: phones ? phones[0] : null,
        email: emails ? emails.find(e => e.length < 50 && !e.includes('google.')) : null,
        website: websites ? websites.find(w => !w.includes('google.') && !w.includes('bing.')) : null
      };
    } catch (error) {
      return null;
    }
  }

  async aggregateAllData(classItem, searchResults) {
    const finalData = {
      email: classItem.email && !classItem.email.includes('.png') && !classItem.email.includes('@2x') ? classItem.email : null,
      phone: classItem.phone || null,
      website: classItem.website || null,
      socialMedia: [],
      rating: null,
      userRatingsTotal: null
    };

    // Get best email
    const emails = Array.from(searchResults.emails);
    if (!finalData.email && emails.length > 0) {
      finalData.email = emails[0];
    }

    // Get best phone
    const phones = Array.from(searchResults.phones);
    if (!finalData.phone && phones.length > 0) {
      finalData.phone = phones[0];
    }

    // Get best website
    const websites = Array.from(searchResults.websites);
    if (!finalData.website && websites.length > 0) {
      finalData.website = websites[0];
    }

    // Get all social media
    finalData.socialMedia = Array.from(searchResults.socialMedia);

    // Get best rating
    if (searchResults.ratings.length > 0) {
      finalData.rating = searchResults.ratings[0];
    }

    return finalData;
  }

  async updateCompleteVenueData(classItem, enhancedData) {
    try {
      await this.client.query('ALTER TABLE classes ADD COLUMN IF NOT EXISTS social_media TEXT');
      await this.client.query('ALTER TABLE classes ADD COLUMN IF NOT EXISTS business_rating DECIMAL(3,1)');
      await this.client.query('ALTER TABLE classes ADD COLUMN IF NOT EXISTS user_ratings_total INTEGER');
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

    // Track improvements
    if (enhancedData.email && enhancedData.email !== classItem.email) this.emailsFound++;
    if (enhancedData.phone && enhancedData.phone !== classItem.phone) this.phonesFound++;
    if (enhancedData.website && enhancedData.website !== classItem.website) this.websitesFound++;
    if (enhancedData.socialMedia.length > 0) this.socialMediaFound++;
    if (enhancedData.rating) this.ratingsFound++;

    return true;
  }

  async processVenueUltimate(classItem) {
    try {
      const venueKey = `${classItem.venue || classItem.name}_${classItem.postcode}`;
      
      if (this.processedVenues.has(venueKey)) {
        return false;
      }

      const searchName = classItem.venue || classItem.name;
      const location = `${classItem.town}, ${classItem.postcode}`;
      
      const searchResults = await this.searchAllAuthenticSources(searchName, location, classItem.website);
      const enhancedData = await this.aggregateAllData(classItem, searchResults);
      await this.updateCompleteVenueData(classItem, enhancedData);
      
      this.processedVenues.add(venueKey);
      
      const improvements = [];
      if (enhancedData.email && enhancedData.email !== classItem.email) improvements.push('email');
      if (enhancedData.phone && enhancedData.phone !== classItem.phone) improvements.push('phone');
      if (enhancedData.website && enhancedData.website !== classItem.website) improvements.push('website');
      if (enhancedData.socialMedia.length > 0) improvements.push('social');
      if (enhancedData.rating) improvements.push('rating');
      
      if (improvements.length > 0) {
        this.log(`✅ ${classItem.venue || classItem.name} (${improvements.join(', ')})`);
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async processBatchUltimate() {
    try {
      const venues = await this.getVenuesForProcessing();
      
      if (venues.length === 0) {
        this.log('✅ All venues processed with comprehensive data');
        return false;
      }

      this.log(`📦 Processing ${venues.length} venues with ${this.concurrency} concurrent requests...`);
      
      // Reset counters
      this.emailsFound = 0;
      this.phonesFound = 0;
      this.websitesFound = 0;
      this.socialMediaFound = 0;
      this.ratingsFound = 0;
      
      // Process in chunks
      const chunks = [];
      for (let i = 0; i < venues.length; i += this.concurrency) {
        chunks.push(venues.slice(i, i + this.concurrency));
      }

      for (const chunk of chunks) {
        await Promise.all(chunk.map(venue => this.processVenueUltimate(venue)));
        await this.sleep(500);
      }

      this.log(`✅ Ultimate batch: +${this.emailsFound} emails, +${this.phonesFound} phones, +${this.websitesFound} websites, +${this.socialMediaFound} social, +${this.ratingsFound} ratings`);
      
      return true;

    } catch (error) {
      this.log(`❌ Ultimate batch error: ${error.message}`);
      return false;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async showComprehensiveProgress() {
    const result = await this.client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN email IS NOT NULL AND email != '' AND email NOT LIKE '%.png' AND email NOT LIKE '%@2x%' THEN 1 END) as with_email,
        COUNT(CASE WHEN social_media IS NOT NULL AND social_media != '' THEN 1 END) as with_social,
        COUNT(CASE WHEN business_rating IS NOT NULL THEN 1 END) as with_rating,
        COUNT(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 END) as with_phone,
        COUNT(CASE WHEN website IS NOT NULL AND website != '' THEN 1 END) as with_website
      FROM classes WHERE is_active = true
    `);
    
    const stats = result.rows[0];
    const emailPct = (stats.with_email/stats.total*100).toFixed(1);
    const socialPct = (stats.with_social/stats.total*100).toFixed(1);
    const phonePct = (stats.with_phone/stats.total*100).toFixed(1);
    
    this.log(`📊 COMPREHENSIVE: ${stats.with_email} emails (${emailPct}%), ${stats.with_social} social (${socialPct}%), ${stats.with_rating} ratings, ${stats.with_phone} phones (${phonePct}%), ${stats.with_website} websites`);
  }

  async runUltimateCollection() {
    let batchCount = 1;
    let continueBatching = true;

    this.log('🎯 ULTIMATE TARGET: Maximum authentic contact data from all sources');

    while (continueBatching && batchCount <= 20) {
      this.log(`🔄 ULTIMATE batch ${batchCount}...`);
      
      continueBatching = await this.processBatchUltimate();
      
      if (continueBatching) {
        await this.showComprehensiveProgress();
        batchCount++;
        await this.sleep(1000);
      }
    }

    await this.showComprehensiveProgress();
    this.log('🎉 ULTIMATE collection complete!');
  }

  async close() {
    await this.client.end();
  }
}

async function runUltimateComprehensiveCollector() {
  const collector = new UltimateComprehensiveCollector();
  
  try {
    await collector.initialize();
    await collector.runUltimateCollection();
  } catch (error) {
    console.error('Ultimate collector error:', error);
  } finally {
    await collector.close();
  }
}

runUltimateComprehensiveCollector();