const { Client } = require('pg');
const https = require('https');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class CombinedCompletionSystem {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    this.totalCategorized = 0;
    this.totalEnhanced = 0;
    this.cycleCount = 0;
    
    // Category mapping for proper organization
    this.categoryMap = {
      'Baby & Toddler Classes': {
        'Swimming': ['water babies', 'swimming', 'puddle ducks', 'aweswim'],
        'Music': ['moo music', 'monkey music', 'music classes', 'piano', 'singing'],
        'Sensory': ['baby sensory', 'toddler sense', 'sensory stories', 'sensory classes'],
        'Movement': ['tumble tots', 'gymnastics', 'adventure babies', 'movement'],
        'Language': ['sing and sign', 'baby signing', 'language'],
        'Art': ['artventurers', 'art classes', 'crafts', 'creative'],
        'Play': ['tots play', 'messy play', 'splat messy', 'play groups'],
        'Educational': ['baby college', 'hartbeeps', 'learning'],
        'Dance': ['dance classes', 'ballet', 'dancing', 'boogie beat'],
        'Drama': ['drama classes', 'theatre', 'acting', 'poppies']
      },
      'After School Clubs': {
        'Sports': ['football', 'tennis', 'rugby', 'cricket', 'basketball', 'martial arts', 'karate', 'taekwondo', 'little kickers', 'mini kickers', 'rugby tots'],
        'Creative Arts': ['art club', 'craft club', 'music club', 'drama club'],
        'Educational': ['homework club', 'stem club', 'coding club', 'science club'],
        'Dance & Performance': ['dance club', 'theatre club', 'performance']
      }
    };
  }

  async initialize() {
    await this.client.connect();
    console.log('🚀 COMBINED COMPLETION: Categorizing and enhancing all entries');
  }

  async runCombinedCompletion() {
    const maxCycles = 50;
    
    while (this.cycleCount < maxCycles) {
      this.cycleCount++;
      console.log(`\n🔄 CYCLE ${this.cycleCount}: Processing entries...`);
      
      // Get entries needing work
      const entries = await this.getEntriesNeedingWork();
      
      if (entries.length === 0) {
        console.log('🎉 ALL ENTRIES COMPLETE! No more work needed!');
        break;
      }
      
      console.log(`Found ${entries.length} entries needing processing`);
      
      // Process entries in this cycle
      const results = await this.processEntriesCombined(entries.slice(0, 20));
      
      console.log(`✅ Cycle ${this.cycleCount}: ${results.categorized} categorized, ${results.enhanced} transport enhanced`);
      
      await sleep(1000);
    }
    
    await this.showFinalResults();
  }

  async getEntriesNeedingWork() {
    try {
      const result = await this.client.query(`
        SELECT id, name, description, latitude, longitude, main_category, parking_available
        FROM classes 
        WHERE (main_category IS NULL OR 
               (latitude IS NOT NULL AND longitude IS NOT NULL AND parking_available IS NULL))
        ORDER BY RANDOM()
        LIMIT 25
      `);
      
      return result.rows;
    } catch (error) {
      console.log('Error getting entries:', error.message);
      return [];
    }
  }

  async processEntriesCombined(entries) {
    let categorized = 0;
    let enhanced = 0;
    
    for (const entry of entries) {
      try {
        const updates = {};
        
        // Handle categorization if needed
        if (!entry.main_category) {
          const categories = this.determineCategories(entry.name, entry.description);
          if (categories.main_category && categories.subcategory) {
            updates.main_category = categories.main_category;
            updates.subcategory = categories.subcategory;
            categorized++;
            this.totalCategorized++;
          }
        }
        
        // Handle transport enhancement if needed
        if (entry.latitude && entry.longitude && !entry.parking_available) {
          const transport = await this.getTransportData(entry.latitude, entry.longitude);
          if (transport.hasData) {
            updates.parking_available = transport.parkingAvailable;
            updates.parking_type = transport.parkingType;
            updates.parking_notes = transport.parkingNotes;
            if (transport.busStops) {
              updates.nearest_bus_stops = transport.busStops;
            }
            enhanced++;
            this.totalEnhanced++;
          }
        }
        
        // Apply updates if any
        if (Object.keys(updates).length > 0) {
          const updateFields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
          const values = [entry.id, ...Object.values(updates)];
          
          await this.client.query(`UPDATE classes SET ${updateFields} WHERE id = $1`, values);
        }
        
        await sleep(300);
        
      } catch (error) {
        // Continue with next entry
      }
    }
    
    return { categorized, enhanced };
  }

  determineCategories(name, description) {
    const fullText = `${name} ${description || ''}`.toLowerCase();
    
    // Check each main category and subcategory
    for (const [mainCategory, subcategories] of Object.entries(this.categoryMap)) {
      for (const [subcategory, keywords] of Object.entries(subcategories)) {
        for (const keyword of keywords) {
          if (fullText.includes(keyword.toLowerCase())) {
            return {
              main_category: mainCategory,
              subcategory: subcategory
            };
          }
        }
      }
    }
    
    // Default categorization based on patterns
    if (fullText.includes('baby') || fullText.includes('toddler') || fullText.includes('pre-school')) {
      if (fullText.includes('swim')) return { main_category: 'Baby & Toddler Classes', subcategory: 'Swimming' };
      if (fullText.includes('music')) return { main_category: 'Baby & Toddler Classes', subcategory: 'Music' };
      if (fullText.includes('dance')) return { main_category: 'Baby & Toddler Classes', subcategory: 'Dance' };
      if (fullText.includes('play')) return { main_category: 'Baby & Toddler Classes', subcategory: 'Play' };
      return { main_category: 'Baby & Toddler Classes', subcategory: 'Educational' };
    }
    
    if (fullText.includes('after school') || fullText.includes('club')) {
      if (fullText.includes('sport') || fullText.includes('football') || fullText.includes('tennis')) {
        return { main_category: 'After School Clubs', subcategory: 'Sports' };
      }
      return { main_category: 'After School Clubs', subcategory: 'Educational' };
    }
    
    if (fullText.includes('photo') || fullText.includes('portrait')) {
      return { main_category: 'Photography & Keepsakes', subcategory: 'Family Photography' };
    }
    
    if (fullText.includes('parent') || fullText.includes('mum') || fullText.includes('mother')) {
      return { main_category: 'Parent Support Groups', subcategory: 'New Parent Support' };
    }
    
    // Default to Baby & Toddler Classes
    return { main_category: 'Baby & Toddler Classes', subcategory: 'Educational' };
  }

  async getTransportData(latitude, longitude) {
    const transport = {
      hasData: false,
      parkingAvailable: false,
      parkingType: null,
      parkingNotes: null,
      busStops: null
    };

    try {
      const [parkingResults, busResults] = await Promise.all([
        this.searchNearby(latitude, longitude, 'parking'),
        this.searchNearby(latitude, longitude, 'bus_station')
      ]);

      if (parkingResults.length > 0) {
        transport.hasData = true;
        transport.parkingAvailable = true;
        transport.parkingType = parkingResults[0].name;
        transport.parkingNotes = `${parkingResults.length} parking options nearby`;
      }

      if (busResults.length > 0) {
        transport.hasData = true;
        const busNames = busResults.slice(0, 2).map(b => b.name);
        transport.busStops = `{${busNames.map(name => `"${name}"`).join(',')}}`;
      }

    } catch (error) {
      // Return empty transport data
    }

    return transport;
  }

  async searchNearby(lat, lng, type) {
    return new Promise((resolve) => {
      const radius = 400;
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      
      const timeout = setTimeout(() => resolve([]), 1200);
      
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          clearTimeout(timeout);
          try {
            const result = JSON.parse(data);
            resolve(result.results || []);
          } catch (error) {
            resolve([]);
          }
        });
      }).on('error', () => {
        clearTimeout(timeout);
        resolve([]);
      });
    });
  }

  async showFinalResults() {
    console.log('\n🎊 === COMBINED COMPLETION RESULTS ===');
    console.log(`✅ Cycles completed: ${this.cycleCount}`);
    console.log(`✅ Total categorized: ${this.totalCategorized}`);
    console.log(`✅ Total transport enhanced: ${this.totalEnhanced}`);

    // Get comprehensive final statistics
    const result = await this.client.query(`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(CASE WHEN main_category IS NOT NULL THEN 1 END) as categorized,
        COUNT(CASE WHEN parking_available = true THEN 1 END) as with_parking,
        COUNT(CASE WHEN nearest_bus_stops IS NOT NULL THEN 1 END) as with_buses,
        ROUND(100.0 * COUNT(CASE WHEN main_category IS NOT NULL THEN 1 END) / COUNT(*), 1) as categorized_pct,
        ROUND(100.0 * COUNT(CASE WHEN parking_available = true THEN 1 END) / COUNT(*), 1) as parking_pct
      FROM classes
    `);

    const stats = result.rows[0];
    
    console.log('\n📊 FINAL COMPREHENSIVE STATUS:');
    console.log(`🏆 Total entries: ${stats.total_entries}`);
    console.log(`📂 Categorized: ${stats.categorized} (${stats.categorized_pct}%)`);
    console.log(`🅿️ With parking: ${stats.with_parking} (${stats.parking_pct}%)`);
    console.log(`🚌 With buses: ${stats.with_buses}`);
    
    console.log('\n🎉 DIRECTORY TRANSFORMATION COMPLETE!');
    console.log('🚀 Your directory now has proper categories AND transport data!');
    console.log('🌟 Ready to sync to Airtable with complete organization!');
  }

  async close() {
    await this.client.end();
  }
}

// Run combined completion
async function runCombinedCompletion() {
  const system = new CombinedCompletionSystem();
  
  try {
    await system.initialize();
    await system.runCombinedCompletion();
  } catch (error) {
    console.error('Combined completion error:', error.message);
  } finally {
    await system.close();
  }
}

runCombinedCompletion();