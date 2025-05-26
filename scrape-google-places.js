import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

class GooglePlacesScraper {
  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.results = [];
    this.importedCount = 0;
  }

  // Search terms for authentic baby and toddler classes
  getSearchTerms() {
    return [
      'baby classes',
      'toddler classes', 
      'baby swimming',
      'baby yoga',
      'baby massage',
      'baby sensory',
      'toddler swimming',
      'children music classes',
      'mum and baby fitness',
      'postnatal exercise',
      'baby signing',
      'toddler dance',
      'nursery rhyme time',
      'baby ballet',
      'toddler gym',
      'soft play',
      'children activities',
      'early years',
      'pre school activities',
      'mother and baby groups'
    ];
  }

  // Major England locations to ensure comprehensive coverage
  getLocations() {
    return [
      'London, England',
      'Birmingham, England', 
      'Manchester, England',
      'Liverpool, England',
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
      'York, England'
    ];
  }

  async searchPlaces(query, location) {
    const searchQuery = `${query} in ${location}`;
    console.log(`Searching: ${searchQuery}`);

    try {
      // Google Places Text Search
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

      const places = data.results || [];
      console.log(`Found ${places.length} places for "${searchQuery}"`);

      // Process each place to extract class information
      const processedPlaces = [];
      for (const place of places) {
        const processedPlace = await this.processPlace(place, query);
        if (processedPlace) {
          processedPlaces.push(processedPlace);
        }
      }

      return processedPlaces;
    } catch (error) {
      console.error(`Error searching for "${searchQuery}":`, error.message);
      return [];
    }
  }

  async processPlace(place, searchTerm) {
    try {
      // Extract postcode from formatted address
      const postcode = this.extractPostcode(place.formatted_address || '');
      
      if (!postcode) {
        console.log(`Skipping ${place.name} - no valid UK postcode found`);
        return null;
      }

      // Determine town from location
      const town = this.extractTown(place.formatted_address || '');
      
      // Categorize the class based on search term and place info
      const category = this.categorizeClass(searchTerm, place.name, place.types);
      
      // Extract age range from business name/type
      const ageRange = this.extractAgeRange(place.name, searchTerm);
      
      // Determine pricing
      const pricing = this.determinePricing(place);

      return {
        name: place.name,
        description: `${place.name} - ${searchTerm} in ${town}`,
        ageGroupMin: ageRange.min,
        ageGroupMax: ageRange.max,
        venue: place.name,
        address: place.formatted_address,
        postcode: postcode,
        town: town,
        latitude: place.geometry?.location?.lat?.toString() || null,
        longitude: place.geometry?.location?.lng?.toString() || null,
        dayOfWeek: 'Multiple',
        time: 'Various times',
        category: category,
        price: pricing,
        website: null,
        phone: null,
        rating: place.rating || null,
        reviewCount: place.user_ratings_total || 0,
        isActive: true,
        isFeatured: this.isFeaturedBrand(place.name)
      };
    } catch (error) {
      console.error(`Error processing place ${place.name}:`, error);
      return null;
    }
  }

  extractPostcode(address) {
    // UK postcode regex
    const postcodeRegex = /([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/i;
    const match = address.match(postcodeRegex);
    return match ? match[1].toUpperCase() : null;
  }

  extractTown(address) {
    // Extract town from address - usually after first comma
    const parts = address.split(',');
    if (parts.length >= 2) {
      return parts[1].trim();
    }
    return 'England';
  }

  categorizeClass(searchTerm, businessName, types) {
    const term = searchTerm.toLowerCase();
    const name = businessName.toLowerCase();
    
    if (term.includes('swimming') || name.includes('swim')) return 'swimming';
    if (term.includes('music') || name.includes('music')) return 'music';
    if (term.includes('yoga') || name.includes('yoga')) return 'yoga';
    if (term.includes('sensory') || name.includes('sensory')) return 'sensory';
    if (term.includes('massage') || name.includes('massage')) return 'massage';
    if (term.includes('signing') || name.includes('signing')) return 'signing';
    if (term.includes('dance') || name.includes('dance')) return 'dance';
    if (term.includes('fitness') || name.includes('fitness')) return 'fitness';
    if (term.includes('gym') || name.includes('gym')) return 'movement';
    if (term.includes('soft play') || name.includes('soft play')) return 'play';
    
    return 'general';
  }

  extractAgeRange(businessName, searchTerm) {
    const text = `${businessName} ${searchTerm}`.toLowerCase();
    
    if (text.includes('baby') && text.includes('toddler')) return { min: 0, max: 36 };
    if (text.includes('baby')) return { min: 0, max: 12 };
    if (text.includes('toddler')) return { min: 12, max: 36 };
    if (text.includes('pre-school') || text.includes('preschool')) return { min: 24, max: 60 };
    if (text.includes('children')) return { min: 12, max: 60 };
    
    return { min: 0, max: 24 }; // Default baby/toddler range
  }

  determinePricing(place) {
    // Check if it's likely free (libraries, community centers, etc.)
    const freeTypes = ['library', 'community_center', 'local_government_office'];
    const name = place.name.toLowerCase();
    
    if (place.types?.some(type => freeTypes.includes(type)) || 
        name.includes('library') || 
        name.includes('community') ||
        name.includes('free')) {
      return null; // Free
    }
    
    return 'Contact for pricing';
  }

  isFeaturedBrand(businessName) {
    const featuredBrands = [
      'baby sensory',
      'toddler sense', 
      'water babies',
      'baby swimming',
      'sing and sign',
      'tumble tots',
      'monkey music',
      'jo jingles'
    ];
    
    const name = businessName.toLowerCase();
    return featuredBrands.some(brand => name.includes(brand));
  }

  async saveToDatabase(places) {
    for (const place of places) {
      try {
        // Check if already exists
        const existing = await sql`
          SELECT id FROM classes 
          WHERE name = ${place.name} 
          AND postcode = ${place.postcode}
          LIMIT 1
        `;

        if (existing.length === 0) {
          await sql`
            INSERT INTO classes (
              name, description, age_group_min, age_group_max, venue, address, 
              postcode, town, latitude, longitude, day_of_week, time, category, 
              price, rating, review_count, is_active, is_featured
            ) VALUES (
              ${place.name}, ${place.description}, ${place.ageGroupMin}, 
              ${place.ageGroupMax}, ${place.venue}, ${place.address}, 
              ${place.postcode}, ${place.town}, ${place.latitude}, 
              ${place.longitude}, ${place.dayOfWeek}, ${place.time}, 
              ${place.category}, ${place.price}, ${place.rating}, 
              ${place.reviewCount}, ${place.isActive}, ${place.isFeatured}
            )
          `;
          this.importedCount++;
        }
      } catch (error) {
        console.error(`Error saving ${place.name}:`, error);
      }
    }
  }

  async scrapeAllClasses() {
    console.log('Starting Google Places comprehensive scraping...');
    
    const searchTerms = this.getSearchTerms();
    const locations = this.getLocations();
    
    let totalResults = 0;
    
    for (const term of searchTerms) {
      for (const location of locations) {
        try {
          const places = await this.searchPlaces(term, location);
          
          if (places.length > 0) {
            await this.saveToDatabase(places);
            totalResults += places.length;
            console.log(`Saved ${places.length} places for "${term}" in ${location}`);
          }
          
          // Add delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Error processing ${term} in ${location}:`, error);
        }
      }
    }
    
    console.log(`\n=== GOOGLE PLACES SCRAPING COMPLETE ===`);
    console.log(`Total places found: ${totalResults}`);
    console.log(`Successfully imported: ${this.importedCount}`);
    console.log(`Database restoration in progress...`);
  }
}

// Run the scraper
async function runGooglePlacesScraper() {
  const scraper = new GooglePlacesScraper();
  await scraper.scrapeAllClasses();
}

runGooglePlacesScraper().catch(console.error);