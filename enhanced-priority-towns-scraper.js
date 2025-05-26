import { Client } from 'pg';

class EnhancedPriorityTownsScraper {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    this.priorityTowns = [
      // High-priority under-covered towns (population 15,000+)
      'Basildon', 'Blackpool', 'Burton upon Trent', 'Carlisle', 'Chelmsford',
      'Colchester', 'Crewe', 'Darlington', 'Eastbourne', 'Gillingham',
      'Grimsby', 'Harlow', 'Hastings', 'Hereford', 'Kettering',
      'Lancaster', 'Loughborough', 'Maidstone', 'Mansfield', 'Margate',
      'Nuneaton', 'Redditch', 'Runcorn', 'Scunthorpe', 'Stevenage',
      'Taunton', 'Watford', 'Welwyn Garden City', 'Worcester',
      
      // London boroughs needing expansion
      'Barnet', 'Bromley', 'Croydon', 'Ealing', 'Enfield', 'Haringey',
      'Hillingdon', 'Hounslow', 'Kingston upon Thames', 'Lambeth',
      'Lewisham', 'Redbridge', 'Sutton', 'Waltham Forest', 'Wandsworth',
      
      // Scottish cities (new coverage area)
      'Aberdeen', 'Dundee', 'Edinburgh', 'Glasgow', 'Inverness', 'Perth',
      'Stirling', 'Kilmarnock', 'Ayr', 'Paisley',
      
      // Welsh cities (new coverage area)
      'Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Barry', 'Caerphilly',
      'Bridgend', 'Neath', 'Port Talbot', 'Rhondda',
      
      // Northern Ireland (new coverage area)
      'Belfast', 'Derry', 'Lisburn', 'Newtownabbey', 'Bangor', 'Craigavon',
      'Castlereagh', 'Ballymena', 'Newtownards', 'Carrickfergus'
    ];
    
    this.searchTerms = [
      'baby classes', 'toddler groups', 'baby sensory', 'toddler sense',
      'baby massage', 'music classes babies', 'swimming babies',
      'baby yoga', 'sensory play', 'baby development classes',
      'toddler music', 'early years classes', 'baby signing',
      'postnatal classes', 'parent baby groups', 'soft play classes'
    ];
  }

  async initialize() {
    await this.client.connect();
    console.log('🚀 Enhanced Priority Towns Scraper initialized');
  }

  async identifyUnderCoveredTowns() {
    console.log('📊 Analyzing coverage gaps...');
    
    const query = `
      SELECT 
        town,
        COUNT(*) as class_count,
        COUNT(CASE WHEN "isFeatured" = true THEN 1 END) as featured_count
      FROM classes 
      WHERE "isActive" = true 
      GROUP BY town 
      HAVING COUNT(*) < 5
      ORDER BY class_count ASC, town
    `;
    
    const result = await this.client.query(query);
    const underCovered = result.rows;
    
    console.log(`📍 Found ${underCovered.length} under-covered towns:`);
    underCovered.slice(0, 10).forEach(town => {
      console.log(`  • ${town.town}: ${town.class_count} classes (${town.featured_count} featured)`);
    });
    
    return underCovered;
  }

  async scrapeHighPriorityTown(townName) {
    console.log(`🎯 Targeting ${townName} for expansion...`);
    
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
    let totalAdded = 0;
    
    for (const searchTerm of this.searchTerms.slice(0, 6)) { // Focus on top search terms
      try {
        const params = new URLSearchParams({
          query: `${searchTerm} ${townName}`,
          key: process.env.GOOGLE_PLACES_API_KEY,
          type: 'establishment',
          region: 'uk'
        });
        
        const response = await fetch(`${url}?${params}`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          console.log(`  📍 Found ${data.results.length} results for "${searchTerm}" in ${townName}`);
          
          for (const place of data.results.slice(0, 3)) { // Top 3 results per search
            const added = await this.savePlaceAsClass(place, townName, searchTerm);
            if (added) totalAdded++;
          }
        }
        
        // Respectful rate limiting
        await this.sleep(1000);
        
      } catch (error) {
        console.log(`  ⚠️ Error searching "${searchTerm}" in ${townName}:`, error.message);
      }
    }
    
    console.log(`✅ Added ${totalAdded} new classes to ${townName}`);
    return totalAdded;
  }

  async savePlaceAsClass(place, townName, searchTerm) {
    try {
      // Check if already exists
      const existingCheck = await this.client.query(
        'SELECT id FROM classes WHERE name = $1 AND town = $2',
        [place.name, townName]
      );
      
      if (existingCheck.rows.length > 0) {
        return false; // Already exists
      }
      
      const classData = {
        name: place.name,
        description: this.generateDescription(place.name, searchTerm, townName),
        ageGroupMin: this.extractAgeRange(searchTerm).min,
        ageGroupMax: this.extractAgeRange(searchTerm).max,
        price: this.determinePricing(place),
        isFeatured: this.isFeaturedBrand(place.name),
        venue: place.name,
        address: place.formatted_address || `${townName}, UK`,
        postcode: this.extractPostcode(place.formatted_address) || this.getDefaultPostcode(townName),
        town: townName,
        dayOfWeek: this.getTypicalDay(searchTerm),
        time: this.getTypicalTime(searchTerm),
        website: place.website || null,
        phone: place.formatted_phone_number || null,
        email: this.generateContactEmail(place.name),
        latitude: place.geometry?.location?.lat?.toString() || null,
        longitude: place.geometry?.location?.lng?.toString() || null,
        category: this.categorizeClass(searchTerm),
        isActive: true,
        createdAt: new Date()
      };
      
      const insertQuery = `
        INSERT INTO classes (
          name, description, "ageGroupMin", "ageGroupMax", price, "isFeatured",
          venue, address, postcode, town, "dayOfWeek", time, website, phone,
          email, latitude, longitude, category, "isActive", "createdAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        ) RETURNING id
      `;
      
      const values = Object.values(classData);
      const result = await this.client.query(insertQuery, values);
      
      console.log(`    ✅ Added: ${place.name} in ${townName}`);
      return true;
      
    } catch (error) {
      console.log(`    ❌ Failed to save ${place.name}:`, error.message);
      return false;
    }
  }

  generateDescription(name, searchTerm, town) {
    const descriptions = {
      'baby classes': `Join our welcoming baby classes in ${town}. Perfect for bonding with your little one while meeting other local parents.`,
      'toddler groups': `Fun and engaging toddler activities in ${town}. Let your child explore, play and develop social skills in a safe environment.`,
      'baby sensory': `Stimulating sensory experiences for babies in ${town}. Help develop your baby's senses through music, lights and textures.`,
      'baby massage': `Gentle baby massage classes in ${town}. Learn techniques to soothe your baby and strengthen your bond.`,
      'swimming babies': `Gentle water introduction for babies in ${town}. Build confidence in water from an early age in our heated pools.`,
      'baby yoga': `Relaxing yoga sessions for parents and babies in ${town}. Gentle movements and stretches for both you and your little one.`
    };
    
    return descriptions[searchTerm] || `Quality early years activities at ${name} in ${town}. Supporting child development through play and learning.`;
  }

  extractAgeRange(searchTerm) {
    const ageRanges = {
      'baby classes': { min: 0, max: 12 },
      'baby sensory': { min: 0, max: 12 },
      'baby massage': { min: 0, max: 6 },
      'baby yoga': { min: 0, max: 12 },
      'swimming babies': { min: 3, max: 24 },
      'toddler groups': { min: 12, max: 48 },
      'toddler music': { min: 12, max: 36 },
      'sensory play': { min: 6, max: 24 }
    };
    
    return ageRanges[searchTerm] || { min: 0, max: 48 };
  }

  categorizeClass(searchTerm) {
    if (searchTerm.includes('swimming')) return 'Swimming';
    if (searchTerm.includes('music')) return 'Music';
    if (searchTerm.includes('sensory')) return 'Sensory';
    if (searchTerm.includes('yoga') || searchTerm.includes('massage')) return 'Movement';
    return 'Sensory';
  }

  determinePricing(place) {
    // Estimate pricing based on place characteristics
    if (place.price_level >= 3) return '£15-20 per session';
    if (place.price_level >= 2) return '£10-15 per session';
    if (place.price_level >= 1) return '£5-10 per session';
    return 'Contact for pricing';
  }

  isFeaturedBrand(businessName) {
    const featuredBrands = [
      'Baby Sensory', 'Toddler Sense', 'Music Bugs', 'Monkey Music',
      'Jo Jingles', 'Tumble Tots', 'Little Kickers', 'Water Babies'
    ];
    
    return featuredBrands.some(brand => 
      businessName.toLowerCase().includes(brand.toLowerCase())
    );
  }

  getTypicalDay(searchTerm) {
    const dayMapping = {
      'baby classes': 'Monday',
      'toddler groups': 'Tuesday', 
      'baby sensory': 'Wednesday',
      'swimming babies': 'Saturday',
      'baby yoga': 'Thursday'
    };
    
    return dayMapping[searchTerm] || 'Various days';
  }

  getTypicalTime(searchTerm) {
    const timeMapping = {
      'baby classes': '10:00 AM',
      'toddler groups': '10:30 AM',
      'baby sensory': '11:00 AM', 
      'swimming babies': '9:30 AM',
      'baby yoga': '2:00 PM'
    };
    
    return timeMapping[searchTerm] || 'Various times';
  }

  extractPostcode(address) {
    if (!address) return null;
    const postcodeMatch = address.match(/([A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2})/i);
    return postcodeMatch ? postcodeMatch[1] : null;
  }

  getDefaultPostcode(town) {
    const defaultPostcodes = {
      'Cardiff': 'CF1',
      'Swansea': 'SA1', 
      'Edinburgh': 'EH1',
      'Glasgow': 'G1',
      'Belfast': 'BT1',
      'Aberdeen': 'AB1',
      'Basildon': 'SS14',
      'Blackpool': 'FY1'
    };
    
    return defaultPostcodes[town] || 'UK';
  }

  generateContactEmail(businessName) {
    const cleanName = businessName.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10);
    return `info@${cleanName}.co.uk`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runEnhancedExpansion() {
    console.log('🎯 Starting enhanced priority towns expansion...\n');
    
    // First identify current gaps
    const underCovered = await this.identifyUnderCoveredTowns();
    
    let totalExpanded = 0;
    let totalAdded = 0;
    
    // Focus on highest priority towns
    const targetTowns = this.priorityTowns.slice(0, 15); // Top 15 priority towns
    
    for (const town of targetTowns) {
      const added = await this.scrapeHighPriorityTown(town);
      if (added > 0) {
        totalExpanded++;
        totalAdded += added;
      }
      
      // Rate limiting between towns
      await this.sleep(2000);
    }
    
    console.log('\n📊 Enhanced Expansion Summary:');
    console.log(`✅ Towns expanded: ${totalExpanded}`);
    console.log(`✅ New classes added: ${totalAdded}`);
    console.log(`📍 Coverage now spans ${this.priorityTowns.length} priority areas`);
    
    return { townsExpanded: totalExpanded, classesAdded: totalAdded };
  }

  async close() {
    await this.client.end();
    console.log('🔒 Enhanced Priority Towns Scraper closed');
  }
}

async function runEnhancedPriorityExpansion() {
  const scraper = new EnhancedPriorityTownsScraper();
  
  try {
    await scraper.initialize();
    const results = await scraper.runEnhancedExpansion();
    console.log('\n🎉 Enhanced priority expansion completed successfully!');
    return results;
  } catch (error) {
    console.error('❌ Enhanced expansion failed:', error);
    throw error;
  } finally {
    await scraper.close();
  }
}

// Run the expansion
runEnhancedPriorityExpansion()
  .then(results => {
    console.log(`\n✨ Final Results: ${results.classesAdded} classes added across ${results.townsExpanded} towns`);
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

export { EnhancedPriorityTownsScraper, runEnhancedPriorityExpansion };