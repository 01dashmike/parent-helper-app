import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

class CommunitySourcesScraper {
  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.importedCount = 0;
  }

  // Community venues that often host family activities
  getCommunityVenueTypes() {
    return [
      'library',
      'community center',
      'village hall',
      'church hall',
      'leisure centre',
      'sports centre',
      'children centre',
      'family centre',
      'community centre',
      'civic centre',
      'town hall',
      'parish hall'
    ];
  }

  // Major England locations for community venue search
  getTargetLocations() {
    return [
      'London, England',
      'Birmingham, England',
      'Manchester, England',
      'Liverpool, England',
      'Leeds, England',
      'Sheffield, England',
      'Bristol, England',
      'Leicester, England',
      'Coventry, England',
      'Nottingham, England',
      'Newcastle, England',
      'Brighton, England',
      'Southampton, England',
      'Portsmouth, England',
      'Reading, England',
      'Cambridge, England',
      'Oxford, England',
      'Winchester, England',
      'Bath, England',
      'Canterbury, England',
      'York, England',
      'Exeter, England',
      'Bournemouth, England',
      'Swindon, England',
      'Gloucester, England',
      'Guildford, England',
      'Basingstoke, England',
      'Andover, England'
    ];
  }

  async searchCommunityVenues(venueType, location) {
    const searchQuery = `${venueType} in ${location}`;
    console.log(`Searching for community venues: ${searchQuery}`);

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${this.apiKey}&region=uk&language=en`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.warn(`API returned status: ${data.status}`);
        return [];
      }

      const venues = data.results || [];
      console.log(`Found ${venues.length} ${venueType}s in ${location}`);

      // Process each venue to create potential class listings
      const processedVenues = [];
      for (const venue of venues) {
        const processedVenue = await this.processCommunityVenue(venue, venueType);
        if (processedVenue) {
          processedVenues.push(processedVenue);
        }
      }

      return processedVenues;
    } catch (error) {
      console.error(`Error searching for "${searchQuery}":`, error.message);
      return [];
    }
  }

  async processCommunityVenue(venue, venueType) {
    try {
      // Extract postcode from formatted address
      const postcode = this.extractPostcode(venue.formatted_address || '');
      
      if (!postcode) {
        console.log(`Skipping ${venue.name} - no valid UK postcode found`);
        return null;
      }

      // Determine town from location
      const town = this.extractTown(venue.formatted_address || '');
      
      // Create family activity listing for this venue
      const activityName = this.generateActivityName(venue.name, venueType);
      const description = this.generateDescription(venue.name, venueType, town);

      return {
        name: activityName,
        description,
        ageGroupMin: 0,
        ageGroupMax: 60, // Family activities for all ages
        venue: venue.name,
        address: venue.formatted_address,
        postcode: postcode,
        town: town,
        latitude: venue.geometry?.location?.lat?.toString() || null,
        longitude: venue.geometry?.location?.lng?.toString() || null,
        dayOfWeek: 'Contact for schedule',
        time: 'Various times',
        category: this.categorizeByVenueType(venueType),
        price: null, // Community venues often offer free activities
        website: null,
        phone: null,
        rating: venue.rating || null,
        reviewCount: venue.user_ratings_total || 0,
        isActive: true,
        isFeatured: false
      };
    } catch (error) {
      console.error(`Error processing venue ${venue.name}:`, error);
      return null;
    }
  }

  generateActivityName(venueName, venueType) {
    const activityTypes = {
      'library': 'Family Story Time & Activities',
      'community center': 'Parent & Toddler Groups',
      'community centre': 'Parent & Toddler Groups',
      'village hall': 'Village Family Activities',
      'church hall': 'Community Baby & Toddler Group',
      'leisure centre': 'Family Swim & Play Sessions',
      'sports centre': 'Children & Family Activities',
      'children centre': 'Baby & Toddler Development',
      'family centre': 'Family Support & Activities'
    };

    const defaultActivity = activityTypes[venueType.toLowerCase()] || 'Family Activities';
    return `${defaultActivity} at ${venueName}`;
  }

  generateDescription(venueName, venueType, town) {
    const descriptions = {
      'library': `Family story time, baby rhyme sessions and toddler activities at ${venueName} in ${town}. Contact directly for current schedule and registration.`,
      'community center': `Parent and toddler groups, baby activities and family sessions at ${venueName}. A welcoming community space for families in ${town}.`,
      'community centre': `Parent and toddler groups, baby activities and family sessions at ${venueName}. A welcoming community space for families in ${town}.`,
      'village hall': `Village-based family activities and community groups at ${venueName}. Contact venue for current baby and toddler sessions in ${town}.`,
      'church hall': `Community baby and toddler groups at ${venueName}. Welcoming space for families of all backgrounds in ${town}.`,
      'leisure centre': `Family swimming sessions, soft play and children's activities at ${venueName} in ${town}. Contact for family-friendly schedules.`,
      'sports centre': `Children's sports activities and family sessions at ${venueName}. Active play opportunities for babies and toddlers in ${town}.`,
      'children centre': `Dedicated baby and toddler development activities at ${venueName}. Professional family support services in ${town}.`,
      'family centre': `Comprehensive family support and activities at ${venueName}. Baby groups, parenting support and community connections in ${town}.`
    };

    return descriptions[venueType.toLowerCase()] || `Family activities and community groups at ${venueName} in ${town}. Contact venue for current baby and toddler sessions.`;
  }

  categorizeByVenueType(venueType) {
    const categories = {
      'library': 'educational',
      'community center': 'general',
      'community centre': 'general',
      'village hall': 'general',
      'church hall': 'general',
      'leisure centre': 'swimming',
      'sports centre': 'movement',
      'children centre': 'development',
      'family centre': 'support'
    };

    return categories[venueType.toLowerCase()] || 'general';
  }

  extractPostcode(address) {
    const postcodeRegex = /([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/i;
    const match = address.match(postcodeRegex);
    return match ? match[1].toUpperCase() : null;
  }

  extractTown(address) {
    const parts = address.split(',');
    if (parts.length >= 2) {
      return parts[1].trim();
    }
    return 'England';
  }

  async saveToDatabase(venues) {
    for (const venue of venues) {
      try {
        // Check if similar venue activity already exists
        const existing = await sql`
          SELECT id FROM classes 
          WHERE venue = ${venue.venue} 
          AND postcode = ${venue.postcode}
          LIMIT 1
        `;

        if (existing.length === 0) {
          await sql`
            INSERT INTO classes (
              name, description, age_group_min, age_group_max, venue, address, 
              postcode, town, latitude, longitude, day_of_week, time, category, 
              price, rating, review_count, is_active, is_featured
            ) VALUES (
              ${venue.name}, ${venue.description}, ${venue.ageGroupMin}, 
              ${venue.ageGroupMax}, ${venue.venue}, ${venue.address}, 
              ${venue.postcode}, ${venue.town}, ${venue.latitude}, 
              ${venue.longitude}, ${venue.dayOfWeek}, ${venue.time}, 
              ${venue.category}, ${venue.price}, ${venue.rating}, 
              ${venue.reviewCount}, ${venue.isActive}, ${venue.isFeatured}
            )
          `;
          this.importedCount++;
        }
      } catch (error) {
        console.error(`Error saving ${venue.name}:`, error);
      }
    }
  }

  async scrapeAllCommunityVenues() {
    console.log('Starting community venues scraping for family activities...');
    
    const venueTypes = this.getCommunityVenueTypes();
    const locations = this.getTargetLocations();
    
    let totalResults = 0;
    
    for (const venueType of venueTypes) {
      for (const location of locations) {
        try {
          const venues = await this.searchCommunityVenues(venueType, location);
          
          if (venues.length > 0) {
            await this.saveToDatabase(venues);
            totalResults += venues.length;
            console.log(`Saved ${venues.length} community activities for ${venueType} in ${location}`);
          }
          
          // Respectful delay to avoid overwhelming API
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (error) {
          console.error(`Error processing ${venueType} in ${location}:`, error);
        }
      }
    }
    
    console.log(`\n=== COMMUNITY VENUES SCRAPING COMPLETE ===`);
    console.log(`Total venues found: ${totalResults}`);
    console.log(`Successfully imported: ${this.importedCount}`);
    console.log(`Community family activities added to database`);
  }
}

// Run the community venues scraper
async function runCommunityVenuesScraper() {
  const scraper = new CommunitySourcesScraper();
  await scraper.scrapeAllCommunityVenues();
}

runCommunityVenuesScraper().catch(console.error);