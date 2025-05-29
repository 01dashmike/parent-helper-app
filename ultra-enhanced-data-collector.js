#!/usr/bin/env node

const { Client } = require('pg');

class UltraEnhancedDataCollector {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.processedVenues = new Set();
    this.batchSize = 50;
    this.concurrency = 8;
    this.emailsFound = 0;
    this.socialMediaFound = 0;
    this.ratingsFound = 0;
    this.contactsFound = 0;
  }

  async initialize() {
    await this.client.connect();
    this.log('🚀 Ultra Enhanced Data Collector Starting...');
    this.log('⚡ Multi-source authentic data extraction');
    this.log('🔍 Sources: Google Maps, Yelp, Facebook, Instagram, TripAdvisor, Business websites');
  }

  log(message) {
    console.log(`${new Date().toISOString().slice(11, 19)} ${message}`);
  }

  async getUniqueVenuesNeedingEnhancement() {
    const query = `
      SELECT DISTINCT 
        name, venue, postcode, town, latitude, longitude, website, phone, email
      FROM classes 
      WHERE is_active = true 
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND (
          social_media IS NULL 
          OR business_rating IS NULL 
          OR email IS NULL
          OR phone IS NULL
        )
      ORDER BY RANDOM()
      LIMIT ${this.batchSize}
    `;
    
    const result = await this.client.query(query);
    return result.rows;
  }

  async findMultipleBusinessProfiles(classItem) {
    const searchName = classItem.venue || classItem.name;
    const location = `${classItem.town}, ${classItem.postcode}`;
    
    // Search across multiple platforms
    const searches = await Promise.allSettled([
      this.searchGooglePlaces(searchName, location),
      this.searchYelp(searchName, location),
      this.searchFacebook(searchName, location),
      this.searchTripAdvisor(searchName, location),
      this.searchBusinessDirectories(searchName, location)
    ]);

    // Combine results from all successful searches
    const profiles = {};
    
    searches.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const source = ['google', 'yelp', 'facebook', 'tripadvisor', 'directories'][index];
        profiles[source] = result.value;
      }
    });

    return profiles;
  }

  async searchGooglePlaces(name, location) {
    try {
      const searchQuery = `${name} ${location}`;
      const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&key=${this.apiKey}`;
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (searchData.candidates && searchData.candidates.length > 0) {
        const placeId = searchData.candidates[0].place_id;
        
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,website,formatted_phone_number,reviews,rating,user_ratings_total,price_level,photos,opening_hours,business_status&key=${this.apiKey}`;
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();
        
        return detailsData.result || null;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async searchYelp(name, location) {
    try {
      // Simulate Yelp search using web scraping
      const yelpSearchUrl = `https://www.yelp.com/search?find_desc=${encodeURIComponent(name)}&find_loc=${encodeURIComponent(location)}`;
      
      const response = await fetch(yelpSearchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 8000
      });
      
      const html = await response.text();
      
      // Extract Yelp data
      const yelpData = this.extractYelpData(html, name);
      return yelpData;
      
    } catch (error) {
      return null;
    }
  }

  extractYelpData(html, businessName) {
    try {
      // Look for business information in Yelp HTML
      const phoneRegex = /\(\d{3}\)\s?\d{3}-\d{4}/g;
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const ratingRegex = /rating-(\d+)-(\d+)/g;
      
      const phones = html.match(phoneRegex);
      const emails = html.match(emailRegex);
      const ratings = html.match(ratingRegex);
      
      return {
        phone: phones ? phones[0] : null,
        email: emails ? emails.find(email => !email.includes('yelp.com')) : null,
        rating: ratings ? parseFloat(ratings[0].replace('rating-', '').replace('-', '.')) : null,
        source: 'yelp'
      };
    } catch (error) {
      return null;
    }
  }

  async searchFacebook(name, location) {
    try {
      // Search for Facebook business pages
      const searchUrl = `https://www.facebook.com/search/pages/?q=${encodeURIComponent(name + ' ' + location)}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 8000
      });
      
      const html = await response.text();
      
      // Extract Facebook business page data
      const facebookData = this.extractFacebookData(html, name);
      return facebookData;
      
    } catch (error) {
      return null;
    }
  }

  extractFacebookData(html, businessName) {
    try {
      // Look for Facebook page URLs and contact information
      const pageRegex = /facebook\.com\/([^\/\s"'<>]+)/g;
      const phoneRegex = /\+?[\d\s\(\)-]{10,}/g;
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      
      const pages = html.match(pageRegex);
      const phones = html.match(phoneRegex);
      const emails = html.match(emailRegex);
      
      return {
        facebookPage: pages ? `https://${pages[0]}` : null,
        phone: phones ? phones[0] : null,
        email: emails ? emails.find(email => !email.includes('facebook.com')) : null,
        source: 'facebook'
      };
    } catch (error) {
      return null;
    }
  }

  async searchTripAdvisor(name, location) {
    try {
      // Search TripAdvisor for business information
      const searchUrl = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(name + ' ' + location)}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 8000
      });
      
      const html = await response.text();
      
      // Extract TripAdvisor data
      const tripAdvisorData = this.extractTripAdvisorData(html, name);
      return tripAdvisorData;
      
    } catch (error) {
      return null;
    }
  }

  extractTripAdvisorData(html, businessName) {
    try {
      // Look for ratings, contact info, and reviews
      const ratingRegex = /"ratingValue":"(\d+\.?\d*)"/g;
      const phoneRegex = /tel:([+\d\s\(\)-]+)/g;
      const emailRegex = /mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/g;
      
      const ratings = html.match(ratingRegex);
      const phones = html.match(phoneRegex);
      const emails = html.match(emailRegex);
      
      return {
        rating: ratings ? parseFloat(ratings[0].match(/\d+\.?\d*/)[0]) : null,
        phone: phones ? phones[0].replace('tel:', '') : null,
        email: emails ? emails[0].replace('mailto:', '') : null,
        source: 'tripadvisor'
      };
    } catch (error) {
      return null;
    }
  }

  async searchBusinessDirectories(name, location) {
    try {
      // Search multiple UK business directories
      const directories = [
        `https://www.yell.com/search?keywords=${encodeURIComponent(name)}&location=${encodeURIComponent(location)}`,
        `https://www.bing.com/search?q="${encodeURIComponent(name)}" ${encodeURIComponent(location)} contact phone email`,
        `https://www.google.com/search?q="${encodeURIComponent(name)}" ${encodeURIComponent(location)} site:*.co.uk contact`
      ];

      const searchResults = await Promise.allSettled(
        directories.map(url => this.searchDirectory(url, name))
      );

      // Combine results from successful directory searches
      const combinedData = {};
      searchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          Object.assign(combinedData, result.value);
        }
      });

      return Object.keys(combinedData).length > 0 ? combinedData : null;
      
    } catch (error) {
      return null;
    }
  }

  async searchDirectory(url, businessName) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 10000
      });
      
      const html = await response.text();
      
      // Extract contact information from directory listings
      const phoneRegex = /(?:tel:|phone:|call:)?\s*(\+44|0)[\d\s\(\)-]{9,15}/gi;
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const websiteRegex = /(https?:\/\/[^\s<>"']+\.co\.uk[^\s<>"']*)/gi;
      
      const phones = html.match(phoneRegex);
      const emails = html.match(emailRegex);
      const websites = html.match(websiteRegex);
      
      return {
        phone: phones ? phones[0].replace(/tel:|phone:|call:/gi, '').trim() : null,
        email: emails ? emails.find(email => 
          !email.includes('noreply') && 
          !email.includes('privacy') && 
          !email.includes('legal')
        ) : null,
        website: websites ? websites[0] : null,
        source: 'directory'
      };
    } catch (error) {
      return null;
    }
  }

  async extractWebsiteContactInfo(website) {
    try {
      if (!website) return { email: null, phone: null, socialMedia: [] };
      
      const response = await fetch(website, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ParentHelper/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 10000
      });
      
      const html = await response.text();
      
      // Enhanced contact extraction
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const phoneRegex = /(?:tel:|phone:|call:)?\s*(\+44|0)[\d\s\(\)-]{9,15}/gi;
      const facebookRegex = /facebook\.com\/[a-zA-Z0-9._-]+/g;
      const instagramRegex = /instagram\.com\/[a-zA-Z0-9._-]+/g;
      const twitterRegex = /twitter\.com\/[a-zA-Z0-9._-]+/g;
      
      const emails = html.match(emailRegex);
      const phones = html.match(phoneRegex);
      const facebook = html.match(facebookRegex);
      const instagram = html.match(instagramRegex);
      const twitter = html.match(twitterRegex);
      
      const socialMedia = [];
      if (facebook) socialMedia.push(`Facebook: https://${facebook[0]}`);
      if (instagram) socialMedia.push(`Instagram: https://${instagram[0]}`);
      if (twitter) socialMedia.push(`Twitter: https://${twitter[0]}`);
      
      return {
        email: emails ? emails.find(email => 
          !email.includes('noreply') && 
          !email.includes('privacy') && 
          !email.includes('legal') &&
          !email.includes('test@')
        ) : null,
        phone: phones ? phones[0].replace(/tel:|phone:|call:/gi, '').trim() : null,
        socialMedia: socialMedia
      };
    } catch (error) {
      return { email: null, phone: null, socialMedia: [] };
    }
  }

  async aggregateBusinessData(classItem, profiles) {
    // Combine data from all sources to get the most complete picture
    const aggregated = {
      email: null,
      phone: null,
      website: null,
      socialMedia: [],
      rating: null,
      reviews: null,
      additionalInfo: null
    };

    // Priority order: Google Places > Website > Yelp > Facebook > Directories > TripAdvisor
    const sources = ['google', 'website', 'yelp', 'facebook', 'directories', 'tripadvisor'];
    
    for (const source of sources) {
      const data = profiles[source];
      if (!data) continue;
      
      // Take first non-null value for each field
      if (!aggregated.email && data.email) aggregated.email = data.email;
      if (!aggregated.phone && data.formatted_phone_number) aggregated.phone = data.formatted_phone_number;
      if (!aggregated.phone && data.phone) aggregated.phone = data.phone;
      if (!aggregated.website && data.website) aggregated.website = data.website;
      if (!aggregated.rating && data.rating) aggregated.rating = data.rating;
      
      // Collect social media from all sources
      if (data.facebookPage) aggregated.socialMedia.push(`Facebook: ${data.facebookPage}`);
      if (data.socialMedia && Array.isArray(data.socialMedia)) {
        aggregated.socialMedia.push(...data.socialMedia);
      }
    }

    // Get additional website data if we have a website but missing contact info
    if (aggregated.website && (!aggregated.email || !aggregated.phone)) {
      const websiteData = await this.extractWebsiteContactInfo(aggregated.website);
      if (!aggregated.email && websiteData.email) aggregated.email = websiteData.email;
      if (!aggregated.phone && websiteData.phone) aggregated.phone = websiteData.phone;
      if (websiteData.socialMedia.length > 0) {
        aggregated.socialMedia.push(...websiteData.socialMedia);
      }
    }

    return aggregated;
  }

  async updateVenueWithEnhancedData(classItem, enhancedData) {
    // Add new columns if they don't exist
    try {
      await this.client.query('ALTER TABLE classes ADD COLUMN IF NOT EXISTS social_media TEXT');
      await this.client.query('ALTER TABLE classes ADD COLUMN IF NOT EXISTS business_rating DECIMAL(3,1)');
      await this.client.query('ALTER TABLE classes ADD COLUMN IF NOT EXISTS additional_info TEXT');
    } catch (error) {
      // Columns might already exist
    }

    const query = `
      UPDATE classes 
      SET 
        email = COALESCE($1, email),
        phone = COALESCE($2, phone),
        website = COALESCE($3, website),
        social_media = COALESCE($4, social_media),
        business_rating = COALESCE($5, business_rating),
        additional_info = COALESCE($6, additional_info)
      WHERE (venue = $7 OR name = $7) 
        AND postcode = $8 
        AND is_active = true
    `;

    const result = await this.client.query(query, [
      enhancedData.email,
      enhancedData.phone,
      enhancedData.website,
      enhancedData.socialMedia.length > 0 ? enhancedData.socialMedia.join(' | ') : null,
      enhancedData.rating,
      enhancedData.additionalInfo,
      classItem.venue || classItem.name,
      classItem.postcode
    ]);

    // Track what we found
    if (enhancedData.email) this.emailsFound++;
    if (enhancedData.socialMedia.length > 0) this.socialMediaFound++;
    if (enhancedData.rating) this.ratingsFound++;
    if (enhancedData.phone || enhancedData.email) this.contactsFound++;

    return result.rowCount;
  }

  async processBatchConcurrently() {
    try {
      const venues = await this.getUniqueVenuesNeedingEnhancement();
      
      if (venues.length === 0) {
        this.log('✅ All venues have been enhanced with available data');
        return false;
      }

      this.log(`📦 Processing batch of ${venues.length} unique venues...`);
      
      // Process venues in smaller concurrent groups
      const chunks = [];
      for (let i = 0; i < venues.length; i += this.concurrency) {
        chunks.push(venues.slice(i, i + this.concurrency));
      }

      for (const chunk of chunks) {
        await Promise.all(chunk.map(venue => this.enhanceVenueData(venue)));
        await this.sleep(1000); // Rate limiting
      }

      this.log(`✅ Batch complete. Found ${this.emailsFound} emails, ${this.socialMediaFound} social profiles, ${this.ratingsFound} ratings`);
      return true;

    } catch (error) {
      this.log(`❌ Error in batch processing: ${error.message}`);
      return false;
    }
  }

  async enhanceVenueData(classItem) {
    try {
      const venueKey = `${classItem.venue || classItem.name}_${classItem.postcode}`;
      
      if (this.processedVenues.has(venueKey)) {
        return false;
      }

      // Search across multiple platforms
      const profiles = await this.findMultipleBusinessProfiles(classItem);
      
      // Aggregate the best data from all sources
      const enhancedData = await this.aggregateBusinessData(classItem, profiles);
      
      // Update database with enhanced data
      await this.updateVenueWithEnhancedData(classItem, enhancedData);
      
      this.processedVenues.add(venueKey);
      
      const foundItems = [];
      if (enhancedData.email) foundItems.push('email');
      if (enhancedData.socialMedia.length > 0) foundItems.push('social');
      if (enhancedData.rating) foundItems.push('rating');
      
      const foundText = foundItems.length > 0 ? ` (${foundItems.join(', ')})` : '';
      this.log(`✅ Enhanced: ${classItem.venue || classItem.name}${foundText}`);
      
      return true;

    } catch (error) {
      this.log(`❌ Error enhancing ${classItem.name}: ${error.message}`);
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
        COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as with_email,
        COUNT(CASE WHEN social_media IS NOT NULL AND social_media != '' THEN 1 END) as with_social,
        COUNT(CASE WHEN business_rating IS NOT NULL THEN 1 END) as with_rating,
        COUNT(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 END) as with_phone
      FROM classes WHERE is_active = true
    `);
    
    const stats = result.rows[0];
    this.log(`📊 Progress: ${stats.with_email} emails (${(stats.with_email/stats.total*100).toFixed(1)}%), ${stats.with_social} social media, ${stats.with_rating} ratings, ${stats.with_phone} phones`);
  }

  async runUltraEnhancedCollection() {
    let batchCount = 1;
    let continueBatching = true;

    while (continueBatching && batchCount <= 20) {
      this.log(`🔄 Processing batch ${batchCount}...`);
      
      continueBatching = await this.processBatchConcurrently();
      
      if (continueBatching) {
        await this.showProgress();
        batchCount++;
        await this.sleep(2000);
      }
    }

    await this.showProgress();
    this.log(`🎉 Ultra enhanced collection complete! Found ${this.emailsFound} emails, ${this.socialMediaFound} social profiles, ${this.contactsFound} contacts total`);
  }

  async close() {
    await this.client.end();
  }
}

async function runUltraEnhancedDataCollector() {
  const collector = new UltraEnhancedDataCollector();
  
  try {
    await collector.initialize();
    await collector.runUltraEnhancedCollection();
  } catch (error) {
    console.error('Ultra enhanced collector error:', error);
  } finally {
    await collector.close();
  }
}

if (require.main === module) {
  runUltraEnhancedDataCollector();
}