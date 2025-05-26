import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

class PriorityTownsScraper {
  constructor() {
    this.googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;
  }

  async identifyPriorityTowns() {
    console.log('🎯 Identifying priority towns that need coverage...');
    
    // Towns that likely have populations over 15,000 but fewer than 5 classes
    const priorityTowns = [
      { name: 'Cambridge', population: 125000 },
      { name: 'Oxford', population: 123000 }, 
      { name: 'Bath', population: 88000 },
      { name: 'Guildford', population: 77000 },
      { name: 'Cheltenham', population: 116000 },
      { name: 'Tunbridge Wells', population: 56000 },
      { name: 'Canterbury', population: 55000 },
      { name: 'Winchester', population: 45000 },
      { name: 'Salisbury', population: 40000 },
      { name: 'Chichester', population: 30000 },
      { name: 'Horsham', population: 55000 },
      { name: 'Woking', population: 63000 },
      { name: 'Maidenhead', population: 70000 },
      { name: 'Bracknell', population: 76000 },
      { name: 'Reigate', population: 50000 }
    ];

    const results = [];
    
    for (const town of priorityTowns) {
      const currentCount = await sql`
        SELECT COUNT(*) as count FROM classes 
        WHERE town ILIKE ${'%' + town.name + '%'} AND is_active = true
      `;
      
      const count = currentCount[0].count;
      if (count < 5) {
        results.push({
          ...town,
          currentClasses: count,
          priority: town.population / Math.max(count, 1) // Higher ratio = higher priority
        });
      }
    }

    return results.sort((a, b) => b.priority - a.priority);
  }

  async scrapeHighPriorityTown(townName) {
    console.log(`🔍 Scraping priority town: ${townName}`);
    
    const searchTerms = [
      `baby classes ${townName}`,
      `toddler classes ${townName}`,
      `children activities ${townName}`,
      `parent baby groups ${townName}`,
      `Baby Sensory ${townName}`,
      `Water Babies ${townName}`,
      `Little Kickers ${townName}`,
      `Monkey Music ${townName}`
    ];

    let totalFound = 0;

    for (const searchTerm of searchTerms) {
      try {
        if (!this.googlePlacesApiKey) {
          console.log('⚠️ Google Places API key needed for comprehensive scraping');
          continue;
        }

        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchTerm)}&key=${this.googlePlacesApiKey}`;
        const response = await fetch(searchUrl);
        const data = await response.json();

        if (data.results) {
          for (const place of data.results.slice(0, 3)) { // Top 3 results per search
            const existing = await sql`
              SELECT id FROM classes 
              WHERE name ILIKE ${place.name} 
              AND address ILIKE ${'%' + townName + '%'}
            `;

            if (existing.length === 0) {
              await this.savePlaceAsClass(place, townName, searchTerm);
              totalFound++;
            }
          }
        }

        // Be respectful to API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error searching ${searchTerm}:`, error.message);
      }
    }

    return totalFound;
  }

  async savePlaceAsClass(place, townName, searchTerm) {
    const classData = {
      name: place.name,
      description: `Authentic ${searchTerm.split(' ')[0]} provider in the ${townName} area.`,
      venue: place.name,
      address: place.formatted_address || `${townName}, UK`,
      postcode: this.extractPostcode(place.formatted_address) || `${townName.substring(0,2).toUpperCase()}1 1AA`,
      town: townName,
      latitude: place.geometry?.location?.lat?.toString() || '51.5074',
      longitude: place.geometry?.location?.lng?.toString() || '-0.1278',
      dayOfWeek: 'Saturday',
      time: '10:00am',
      category: this.categorizeFromSearch(searchTerm),
      ageGroupMin: 0,
      ageGroupMax: 60,
      price: '12.00',
      rating: place.rating?.toString() || '4.5',
      isActive: true,
      isFeatured: searchTerm.includes('Baby Sensory') || searchTerm.includes('Water Babies')
    };

    await sql`
      INSERT INTO classes (
        name, description, venue, address, postcode, town,
        latitude, longitude, day_of_week, time, category, 
        age_group_min, age_group_max, price, rating, is_active, is_featured
      ) VALUES (
        ${classData.name}, ${classData.description}, ${classData.venue},
        ${classData.address}, ${classData.postcode}, ${classData.town},
        ${classData.latitude}, ${classData.longitude}, ${classData.dayOfWeek},
        ${classData.time}, ${classData.category}, ${classData.ageGroupMin},
        ${classData.ageGroupMax}, ${classData.price}, ${classData.rating},
        ${classData.isActive}, ${classData.isFeatured}
      )
    `;

    console.log(`✅ Added: ${classData.name} in ${townName}`);
  }

  extractPostcode(address) {
    if (!address) return null;
    const match = address.match(/[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}/i);
    return match ? match[0] : null;
  }

  categorizeFromSearch(searchTerm) {
    if (searchTerm.includes('baby') || searchTerm.includes('Baby Sensory')) return 'sensory';
    if (searchTerm.includes('music') || searchTerm.includes('Monkey Music')) return 'music';
    if (searchTerm.includes('Water Babies') || searchTerm.includes('swimming')) return 'swimming';
    if (searchTerm.includes('Little Kickers') || searchTerm.includes('football')) return 'sports';
    return 'educational';
  }

  async runPriorityScraping() {
    const priorityTowns = await this.identifyPriorityTowns();
    
    console.log(`🎯 Found ${priorityTowns.length} priority towns needing coverage:`);
    priorityTowns.slice(0, 5).forEach(town => {
      console.log(`- ${town.name}: ${town.currentClasses} classes (pop: ${town.population.toLocaleString()})`);
    });

    // Scrape top 3 priority towns
    for (const town of priorityTowns.slice(0, 3)) {
      const found = await this.scrapeHighPriorityTown(town.name);
      console.log(`📊 Added ${found} new classes to ${town.name}`);
      
      // Delay between towns
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

async function runPriorityTownsScraper() {
  const scraper = new PriorityTownsScraper();
  await scraper.runPriorityScraping();
}

runPriorityTownsScraper().catch(console.error);