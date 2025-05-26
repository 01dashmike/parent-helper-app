import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

class EnhancedGooglePlacesScraper {
  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.results = [];
    this.importedCount = 0;
  }

  // Enhanced search terms focusing on businesses and service providers
  getBusinessFocusedSearchTerms() {
    return [
      // Direct business searches
      'baby classes Bolton',
      'toddler classes Bolton', 
      'children\'s activities Bolton',
      'early years classes Bolton',
      'parent and baby Bolton',
      'mother and toddler Bolton',
      
      // Service provider searches
      'swimming instructors babies Bolton',
      'music teachers toddlers Bolton',
      'dance teachers children Bolton',
      'yoga instructors babies Bolton',
      'sensory play providers Bolton',
      
      // Popular franchise/brand searches
      'Water Babies Bolton',
      'Tumble Tots Bolton',
      'Monkey Music Bolton',
      'Jo Jingles Bolton',
      'Baby Sensory Bolton',
      'Little Kickers Bolton',
      'Toddler Sense Bolton',
      'Rugrats and Halfpints Bolton',
      
      // Activity-based business searches
      'children\'s swimming lessons Bolton',
      'baby massage Bolton',
      'baby signing Bolton',
      'toddler gym Bolton',
      'children\'s martial arts Bolton',
      'kids dance classes Bolton',
      'baby yoga Bolton',
      'toddler ballet Bolton',
      
      // Broader service categories
      'childcare services Bolton',
      'children\'s fitness Bolton',
      'early childhood development Bolton',
      'parenting support groups Bolton'
    ];
  }

  // Target locations with known coverage gaps
  getTargetLocations() {
    return [
      'Bolton, England',
      'Chester, England', 
      'Wigan, England',
      'Blackburn, England',
      'Warrington, England',
      'Stockport, England',
      'Oldham, England',
      'Rochdale, England',
      'Burnley, England',
      'Blackpool, England',
      'Preston, England',
      'Lancaster, England',
      'Carlisle, England',
      'Barrow-in-Furness, England',
      'Kendal, England',
      'Workington, England',
      'Whitehaven, England',
      'Penrith, England',
      'Crewe, England',
      'Macclesfield, England',
      'Congleton, England',
      'Northwich, England',
      'Winsford, England',
      'Ellesmere Port, England',
      'Runcorn, England',
      'Widnes, England',
      'St Helens, England',
      'Skelmersdale, England',
      'Ormskirk, England',
      'Chorley, England',
      'Leyland, England',
      'Bamber Bridge, England',
      'Penwortham, England',
      'Fulwood, England',
      'Longridge, England',
      'Clitheroe, England',
      'Nelson, England',
      'Colne, England',
      'Barnoldswick, England',
      'Padiham, England',
      'Rawtenstall, England',
      'Haslingden, England',
      'Bacup, England',
      'Ramsbottom, England',
      'Whitefield, England',
      'Radcliffe, England',
      'Prestwich, England',
      'Tottington, England',
      'Heywood, England',
      'Middleton, England',
      'Chadderton, England',
      'Shaw, England',
      'Lees, England',
      'Saddleworth, England',
      'Milnrow, England',
      'Littleborough, England',
      'Wardle, England',
      'Ashton-under-Lyne, England',
      'Dukinfield, England',
      'Hyde, England',
      'Stalybridge, England',
      'Glossop, England',
      'Hadfield, England',
      'Denton, England',
      'Droylsden, England',
      'Audenshaw, England',
      'Mossley, England'
    ];
  }

  async searchPlaces(query, location) {
    if (!this.apiKey) {
      console.log('Google Places API key not found. Skipping Google Places search.');
      return [];
    }

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' ' + location)}&key=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        console.log(`Found ${data.results.length} places for "${query} in ${location}"`);
        return data.results;
      } else {
        console.log(`No results for "${query} in ${location}": ${data.status}`);
        return [];
      }
    } catch (error) {
      console.error(`Error searching for "${query} in ${location}":`, error);
      return [];
    }
  }

  async processPlace(place, searchTerm) {
    const businessTypes = place.types || [];
    
    // Skip if it's clearly not a class provider
    const excludeTypes = ['hospital', 'pharmacy', 'doctor', 'dentist', 'bank', 'atm', 'gas_station', 'parking'];
    if (businessTypes.some(type => excludeTypes.includes(type))) {
      return null;
    }

    const address = place.formatted_address || '';
    const postcode = this.extractPostcode(address);
    const town = await this.extractTown(address, postcode);

    // Enhanced business name cleaning for better duplicate detection
    const cleanBusinessName = place.name
      .replace(/\s*-\s*Google.*$/i, '')
      .replace(/\s*\|\s*Facebook.*$/i, '')
      .replace(/\s*\(\s*closed\s*\).*$/i, '')
      .trim();

    return {
      name: cleanBusinessName,
      description: this.generateDescription(cleanBusinessName, searchTerm, place.types),
      venue: cleanBusinessName,
      address: address,
      postcode: postcode || '',
      town: town,
      additionalTowns: [],
      latitude: place.geometry?.location?.lat || null,
      longitude: place.geometry?.location?.lng || null,
      category: this.categorizeClass(searchTerm, cleanBusinessName, place.types),
      ageGroupMin: this.extractAgeRange(cleanBusinessName, searchTerm).min,
      ageGroupMax: this.extractAgeRange(cleanBusinessName, searchTerm).max,
      dayOfWeek: this.extractDayFromGoogleData(place) || 'Multiple',
      time: this.extractTimeFromGoogleData(place) || 'Various',
      price: this.determinePricing(place),
      isFeatured: this.isFeaturedBrand(cleanBusinessName),
      phone: place.formatted_phone_number || '',
      email: '',
      website: place.website || '',
      socialMedia: '',
      searchRadiusKm: 5,
      placeId: place.place_id
    };
  }

  extractPostcode(address) {
    // UK postcode regex
    const postcodeRegex = /[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}/gi;
    const match = address.match(postcodeRegex);
    return match ? match[0].toUpperCase() : null;
  }

  async extractTown(address, postcode) {
    // Use the same rigorous postcode-to-town mapping we established
    if (postcode) {
      try {
        const response = await fetch(`http://api.postcodes.io/postcodes/${postcode}`);
        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            const adminDistrict = data.result.admin_district;
            const adminWard = data.result.admin_ward;
            
            // Apply same geographic boundary logic as original data
            if (adminDistrict === 'Bolton') return 'Bolton';
            if (adminDistrict === 'Wigan') return 'Wigan';
            if (adminDistrict === 'Blackburn with Darwen') return 'Blackburn';
            if (adminDistrict === 'Warrington') return 'Warrington';
            if (adminDistrict === 'Stockport') return 'Stockport';
            if (adminDistrict === 'Oldham') return 'Oldham';
            if (adminDistrict === 'Rochdale') return 'Rochdale';
            if (adminDistrict === 'Chester') return 'Chester';
            if (adminDistrict === 'Burnley') return 'Burnley';
            if (adminDistrict === 'Blackpool') return 'Blackpool';
            if (adminDistrict === 'Preston') return 'Preston';
            
            // For Greater Manchester, use proper borough mapping
            if (adminDistrict === 'Manchester' && adminWard) {
              if (adminWard.includes('Bolton')) return 'Bolton';
              if (adminWard.includes('Wigan')) return 'Wigan';
              if (adminWard.includes('Oldham')) return 'Oldham';
              if (adminWard.includes('Rochdale')) return 'Rochdale';
              if (adminWard.includes('Stockport')) return 'Stockport';
              return 'Manchester';
            }
            
            return adminDistrict;
          }
        }
      } catch (error) {
        console.log(`Postcode lookup failed for ${postcode}, falling back to address parsing`);
      }
    }

    // Fallback to address parsing with same standards
    const addressParts = address.split(',').map(part => part.trim());
    
    const majorTowns = [
      'Bolton', 'Chester', 'Wigan', 'Blackburn', 'Warrington', 'Stockport', 
      'Oldham', 'Rochdale', 'Manchester', 'Liverpool', 'Birmingham', 'Leeds'
    ];

    for (const part of addressParts) {
      for (const town of majorTowns) {
        if (part.toLowerCase().includes(town.toLowerCase())) {
          return town;
        }
      }
    }

    return addressParts.find(part => 
      part.length > 2 && 
      !part.match(/^[A-Z0-9\s]+$/i) && 
      !part.toLowerCase().includes('uk')
    ) || 'Unknown';
  }

  categorizeClass(searchTerm, businessName, types) {
    const lower = (searchTerm + ' ' + businessName).toLowerCase();
    
    if (lower.includes('swim')) return 'Swimming';
    if (lower.includes('music') || lower.includes('sing')) return 'Music & Singing';
    if (lower.includes('dance') || lower.includes('ballet')) return 'Dance & Movement';
    if (lower.includes('sensory')) return 'Sensory Play';
    if (lower.includes('yoga') || lower.includes('massage')) return 'Baby Yoga & Massage';
    if (lower.includes('sign')) return 'Baby Signing';
    if (lower.includes('gym') || lower.includes('tumble') || lower.includes('kick')) return 'Physical Development';
    if (lower.includes('martial') || lower.includes('karate')) return 'Martial Arts';
    
    return 'General Classes';
  }

  extractAgeRange(businessName, searchTerm) {
    const text = (businessName + ' ' + searchTerm).toLowerCase();
    
    if (text.includes('baby') && !text.includes('toddler')) {
      return { min: 0, max: 12 }; // 0-12 months
    }
    if (text.includes('toddler') && !text.includes('baby')) {
      return { min: 12, max: 60 }; // 1-5 years
    }
    if (text.includes('pre-school') || text.includes('preschool')) {
      return { min: 36, max: 60 }; // 3-5 years
    }
    
    return { min: 0, max: 60 }; // 0-5 years (general)
  }

  determinePricing(place) {
    // Use price_level from Google Places if available
    if (place.price_level !== undefined) {
      const priceMap = {
        0: 'Free',
        1: '£5-£10 per session',
        2: '£10-£15 per session',
        3: '£15-£25 per session',
        4: '£25+ per session'
      };
      return priceMap[place.price_level] || 'Contact for pricing';
    }
    
    return 'Contact for pricing';
  }

  isFeaturedBrand(businessName) {
    const featuredBrands = [
      'water babies', 'tumble tots', 'monkey music', 'jo jingles', 
      'baby sensory', 'little kickers', 'toddler sense'
    ];
    return featuredBrands.some(brand => 
      businessName.toLowerCase().includes(brand)
    );
  }

  extractDayFromGoogleData(place) {
    // Extract day information from place name or opening hours if available
    const text = (place.name + ' ' + (place.vicinity || '')).toLowerCase();
    
    if (text.includes('monday')) return 'Monday';
    if (text.includes('tuesday')) return 'Tuesday';
    if (text.includes('wednesday')) return 'Wednesday';
    if (text.includes('thursday')) return 'Thursday';
    if (text.includes('friday')) return 'Friday';
    if (text.includes('saturday')) return 'Saturday';
    if (text.includes('sunday')) return 'Sunday';
    
    // Check opening hours if available
    if (place.opening_hours && place.opening_hours.weekday_text) {
      // This would contain specific day information
      return 'Multiple'; // Most businesses run multiple days
    }
    
    return null;
  }

  extractTimeFromGoogleData(place) {
    // Extract time information from place name or description
    const text = (place.name + ' ' + (place.vicinity || '')).toLowerCase();
    
    if (text.includes('morning') || text.includes('am')) return 'Morning';
    if (text.includes('afternoon') || text.includes('pm')) return 'Afternoon';
    if (text.includes('evening')) return 'Evening';
    if (text.match(/\d{1,2}:\d{2}/)) {
      // Contains specific time format
      const timeMatch = text.match(/(\d{1,2}:\d{2})/);
      return timeMatch ? timeMatch[1] : null;
    }
    
    return null;
  }

  generateDescription(businessName, searchTerm, types) {
    const category = this.categorizeClass(searchTerm, businessName, types);
    return `${businessName} offers ${category.toLowerCase()} for babies and toddlers. Professional instruction in a safe, fun environment for early childhood development.`;
  }

  async saveToDatabase(places) {
    let savedCount = 0;
    
    for (const place of places) {
      try {
        // Only prevent exact duplicates - allow same business with different schedules
        const existing = await sql`
          SELECT id FROM classes 
          WHERE LOWER(name) = LOWER(${place.name}) 
          AND postcode = ${place.postcode}
          AND day_of_week = ${place.dayOfWeek}
          AND time = ${place.time}
          AND category = ${place.category}
        `;
        
        if (existing.length > 0) {
          console.log(`Skipping duplicate: ${place.name} in ${place.postcode}`);
          continue;
        }

        await sql`
          INSERT INTO classes (
            name, description, venue, address, postcode, town, additional_towns,
            latitude, longitude, category, age_group_min, age_group_max,
            day_of_week, time, price, is_featured, contact_phone, contact_email,
            website, social_media, search_radius_km
          ) VALUES (
            ${place.name}, ${place.description}, ${place.venue}, ${place.address},
            ${place.postcode}, ${place.town}, ${place.additionalTowns},
            ${place.latitude}, ${place.longitude}, ${place.category},
            ${place.ageGroupMin}, ${place.ageGroupMax}, ${place.dayOfWeek},
            ${place.time}, ${place.price}, ${place.isFeatured},
            ${place.phone}, ${place.email}, ${place.website}, ${place.socialMedia},
            ${place.searchRadiusKm}
          )
        `;
        
        savedCount++;
        console.log(`✅ Saved: ${place.name} in ${place.town}`);
        
      } catch (error) {
        console.error(`Error saving ${place.name}:`, error.message);
      }
    }
    
    return savedCount;
  }

  async scrapeTargetedAreas() {
    console.log('Starting enhanced Google Places scraping for under-covered areas...');
    
    const locations = this.getTargetLocations();
    const searchTerms = this.getBusinessFocusedSearchTerms();
    
    for (const location of locations) {
      console.log(`\n🎯 Focusing on: ${location}`);
      
      for (const searchTerm of searchTerms) {
        if (searchTerm.includes(location.split(',')[0])) {
          // Location-specific search
          const places = await this.searchPlaces(searchTerm, '');
          const processedPlaces = [];
          
          for (const place of places) {
            const processed = await this.processPlace(place, searchTerm);
            if (processed) {
              processedPlaces.push(processed);
            }
          }
          
          if (processedPlaces.length > 0) {
            const saved = await this.saveToDatabase(processedPlaces);
            console.log(`💾 Saved ${saved} new businesses for "${searchTerm}"`);
            this.importedCount += saved;
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Check progress for this location
      const townName = location.split(',')[0];
      const count = await sql`SELECT COUNT(*) as count FROM classes WHERE town = ${townName}`;
      console.log(`📊 ${townName} now has ${count[0].count} total classes`);
    }
    
    console.log(`\n🎉 Enhanced scraping complete! Added ${this.importedCount} new businesses.`);
  }
}

async function runEnhancedScraper() {
  const scraper = new EnhancedGooglePlacesScraper();
  await scraper.scrapeTargetedAreas();
}

// Run the enhanced scraper
runEnhancedScraper().catch(console.error);