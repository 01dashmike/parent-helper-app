import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

class GooglePlacesScraper {
  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.results = [];
    this.importedCount = 0;
  }

  // Enhanced search terms for authentic baby and toddler classes
  getSearchTerms() {
    return [
      // Core baby classes
      'baby classes',
      'baby sensory classes',
      'baby yoga classes',
      'baby massage classes',
      'baby swimming lessons',
      'baby signing classes',
      'baby music classes',
      'baby ballet classes',
      
      // Core toddler classes
      'toddler classes',
      'toddler swimming',
      'toddler dance classes',
      'toddler gym classes',
      'toddler music classes',
      'toddler sensory play',
      
      // Popular branded classes
      'water babies',
      'tumble tots',
      'monkey music',
      'jo jingles',
      'sing and sign',
      'toddler sense',
      'little kickers',
      'rugrats and halfpints',
      
      // Parent and child activities
      'mum and baby fitness',
      'postnatal exercise',
      'parent and toddler groups',
      'mother and baby groups',
      'stay and play sessions',
      
      // Venues and facilities
      'children activity centre',
      'soft play centre',
      'nursery classes',
      'children nursery',
      'play centre',
      'early years centre',
      
      // Specific activity types
      'children swimming lessons',
      'toddler football',
      'children martial arts',
      'kids drama classes',
      'children art classes',
      'messy play sessions'
    ];
  }

  // Complete England coverage - all major towns and cities
  getLocations() {
    return [
      // Greater London
      'London, England',
      'Croydon, England',
      'Barnet, England',
      'Ealing, England',
      'Bromley, England',
      'Enfield, England',
      'Brent, England',
      'Wandsworth, England',
      'Lambeth, England',
      'Hillingdon, England',
      
      // West Midlands
      'Birmingham, England',
      'Wolverhampton, England',
      'Coventry, England',
      'Dudley, England',
      'Walsall, England',
      'West Bromwich, England',
      'Solihull, England',
      'Sutton Coldfield, England',
      
      // Greater Manchester
      'Manchester, England',
      'Bolton, England',
      'Stockport, England',
      'Oldham, England',
      'Rochdale, England',
      'Salford, England',
      'Bury, England',
      'Wigan, England',
      'Tameside, England',
      
      // West Yorkshire
      'Leeds, England',
      'Bradford, England',
      'Huddersfield, England',
      'Wakefield, England',
      'Halifax, England',
      'Dewsbury, England',
      'Batley, England',
      
      // Merseyside
      'Liverpool, England',
      'Birkenhead, England',
      'St Helens, England',
      'Southport, England',
      'Bootle, England',
      
      // South Yorkshire
      'Sheffield, England',
      'Rotherham, England',
      'Barnsley, England',
      'Doncaster, England',
      
      // Tyne and Wear
      'Newcastle, England',
      'Sunderland, England',
      'Gateshead, England',
      'South Shields, England',
      'North Shields, England',
      
      // Bristol & Southwest
      'Bristol, England',
      'Plymouth, England',
      'Exeter, England',
      'Bournemouth, England',
      'Poole, England',
      'Swindon, England',
      'Gloucester, England',
      'Bath, England',
      'Taunton, England',
      'Truro, England',
      'Torquay, England',
      'Cheltenham, England',
      
      // Hampshire & Dorset
      'Southampton, England',
      'Portsmouth, England',
      'Winchester, England',
      'Basingstoke, England',
      'Eastleigh, England',
      'Fareham, England',
      'Andover, England',
      'Salisbury, England',
      'Dorchester, England',
      'Weymouth, England',
      
      // Kent & Sussex
      'Maidstone, England',
      'Canterbury, England',
      'Dartford, England',
      'Gravesend, England',
      'Tunbridge Wells, England',
      'Folkestone, England',
      'Dover, England',
      'Margate, England',
      'Brighton, England',
      'Hove, England',
      'Hastings, England',
      'Crawley, England',
      'Worthing, England',
      'Eastbourne, England',
      
      // Surrey & Berkshire
      'Guildford, England',
      'Woking, England',
      'Epsom, England',
      'Redhill, England',
      'Camberley, England',
      'Reading, England',
      'Slough, England',
      'Bracknell, England',
      'Maidenhead, England',
      'Windsor, England',
      
      // Essex & Hertfordshire
      'Southend, England',
      'Colchester, England',
      'Chelmsford, England',
      'Basildon, England',
      'Harlow, England',
      'Brentwood, England',
      'St Albans, England',
      'Hemel Hempstead, England',
      'Stevenage, England',
      'Watford, England',
      'Hatfield, England',
      
      // East Midlands
      'Leicester, England',
      'Nottingham, England',
      'Derby, England',
      'Northampton, England',
      'Peterborough, England',
      'Lincoln, England',
      'Mansfield, England',
      'Chesterfield, England',
      'Kettering, England',
      'Wellingborough, England',
      
      // West Midlands Counties
      'Stoke-on-Trent, England',
      'Telford, England',
      'Shrewsbury, England',
      'Worcester, England',
      'Kidderminster, England',
      'Redditch, England',
      'Hereford, England',
      'Stafford, England',
      'Burton upon Trent, England',
      
      // East of England
      'Cambridge, England',
      'Norwich, England',
      'Ipswich, England',
      'Luton, England',
      'Bedford, England',
      'King\'s Lynn, England',
      'Great Yarmouth, England',
      'Lowestoft, England',
      'Bury St Edmunds, England',
      
      // North West
      'Preston, England',
      'Blackpool, England',
      'Lancaster, England',
      'Burnley, England',
      'Blackburn, England',
      'Carlisle, England',
      'Barrow-in-Furness, England',
      'Kendal, England',
      
      // Yorkshire & Humber
      'Hull, England',
      'York, England',
      'Harrogate, England',
      'Scarborough, England',
      'Middlesbrough, England',
      'Grimsby, England',
      'Scunthorpe, England',
      
      // North East
      'Durham, England',
      'Darlington, England',
      'Hartlepool, England',
      'Stockton-on-Tees, England',
      'Redcar, England',
      
      // Market Towns & Villages - Cotswolds
      'Chipping Norton, England',
      'Stow-on-the-Wold, England',
      'Burford, England',
      'Cirencester, England',
      'Tetbury, England',
      'Moreton-in-Marsh, England',
      
      // Market Towns - Oxfordshire & Buckinghamshire
      'Henley-on-Thames, England',
      'Wallingford, England',
      'Thame, England',
      'Witney, England',
      'Banbury, England',
      'Bicester, England',
      'Buckingham, England',
      'Aylesbury, England',
      'High Wycombe, England',
      'Amersham, England',
      'Beaconsfield, England',
      'Marlow, England',
      
      // Market Towns - Surrey & West Sussex Villages
      'Dorking, England',
      'Farnham, England',
      'Godalming, England',
      'Haslemere, England',
      'Leatherhead, England',
      'Reigate, England',
      'Horsham, England',
      'Petworth, England',
      'Midhurst, England',
      'Arundel, England',
      'Chichester, England',
      
      // Hampshire Villages & Market Towns
      'Alton, England',
      'Petersfield, England',
      'Alresford, England',
      'Romsey, England',
      'Stockbridge, England',
      'Whitchurch, England',
      'Lymington, England',
      'New Milton, England',
      'Ringwood, England',
      'Fordingbridge, England',
      
      // Wiltshire & Somerset Villages
      'Marlborough, England',
      'Devizes, England',
      'Warminster, England',
      'Chippenham, England',
      'Corsham, England',
      'Bradford-on-Avon, England',
      'Frome, England',
      'Shepton Mallet, England',
      'Wells, England',
      'Glastonbury, England',
      'Bridgwater, England',
      'Burnham-on-Sea, England',
      
      // Devon & Cornwall Villages
      'Totnes, England',
      'Dartmouth, England',
      'Salcombe, England',
      'Tavistock, England',
      'Okehampton, England',
      'Barnstaple, England',
      'Bideford, England',
      'Ilfracombe, England',
      'Sidmouth, England',
      'Honiton, England',
      'Seaton, England',
      'Budleigh Salterton, England',
      'St Austell, England',
      'Falmouth, England',
      'Penzance, England',
      'St Ives, England',
      'Newquay, England',
      'Padstow, England',
      'Bodmin, England',
      'Liskeard, England',
      'Looe, England',
      
      // Lake District & Cumbria Villages
      'Ambleside, England',
      'Windermere, England',
      'Grasmere, England',
      'Keswick, England',
      'Cockermouth, England',
      'Penrith, England',
      'Appleby-in-Westmorland, England',
      
      // Yorkshire Dales & Villages
      'Harrogate, England',
      'Ripon, England',
      'Skipton, England',
      'Settle, England',
      'Leyburn, England',
      'Richmond, England',
      'Helmsley, England',
      'Pickering, England',
      'Malton, England',
      'Thirsk, England',
      'Northallerton, England',
      
      // Peak District & Derbyshire Villages
      'Bakewell, England',
      'Matlock, England',
      'Ashbourne, England',
      'Buxton, England',
      'Glossop, England',
      
      // East Anglia Villages & Market Towns
      'Ely, England',
      'Huntingdon, England',
      'St Neots, England',
      'Saffron Walden, England',
      'Haverhill, England',
      'Newmarket, England',
      'Sudbury, England',
      'Lavenham, England',
      'Aldeburgh, England',
      'Southwold, England',
      'Beccles, England',
      'Halesworth, England',
      'Diss, England',
      'Wymondham, England',
      'Fakenham, England',
      'Holt, England',
      'Cromer, England',
      'Sheringham, England',
      'Wells-next-the-Sea, England',
      'Burnham Market, England',
      
      // Lincolnshire Villages
      'Stamford, England',
      'Grantham, England',
      'Spalding, England',
      'Boston, England',
      'Skegness, England',
      'Louth, England',
      'Market Rasen, England',
      'Gainsborough, England',
      
      // Shropshire & Herefordshire Villages
      'Ludlow, England',
      'Church Stretton, England',
      'Much Wenlock, England',
      'Bridgnorth, England',
      'Market Drayton, England',
      'Oswestry, England',
      'Whitchurch, England',
      'Ross-on-Wye, England',
      'Ledbury, England',
      'Leominster, England',
      'Hay-on-Wye, England',
      
      // Staffordshire Villages
      'Lichfield, England',
      'Tamworth, England',
      'Rugeley, England',
      'Cannock, England',
      'Stone, England',
      'Uttoxeter, England',
      'Leek, England',
      
      // Northamptonshire Villages
      'Daventry, England',
      'Towcester, England',
      'Brackley, England',
      'Oundle, England',
      'Thrapston, England',
      'Rushden, England',
      'Wellingborough, England',
      'Corby, England'
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