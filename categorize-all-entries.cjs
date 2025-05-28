const { Client } = require('pg');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class CategorizeAllEntries {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    this.totalCategorized = 0;
    
    // Define your website category structure
    this.categoryMap = {
      // Baby & Toddler Classes
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
      
      // After School Clubs
      'After School Clubs': {
        'Sports': ['football', 'tennis', 'rugby', 'cricket', 'basketball', 'martial arts', 'karate', 'taekwondo', 'little kickers', 'mini kickers', 'rugby tots'],
        'Creative Arts': ['art club', 'craft club', 'music club', 'drama club'],
        'Educational': ['homework club', 'stem club', 'coding club', 'science club'],
        'Dance & Performance': ['dance club', 'theatre club', 'performance'],
        'Outdoor Activities': ['forest school', 'outdoor club', 'nature club']
      },
      
      // Photography & Keepsakes
      'Photography & Keepsakes': {
        'Newborn Photography': ['newborn photo', 'baby photography'],
        'Family Photography': ['family photo', 'portrait'],
        'Milestone Photography': ['milestone photo', 'cake smash'],
        'Keepsake Services': ['hand prints', 'foot prints', 'keepsakes']
      },
      
      // Parent Support Groups
      'Parent Support Groups': {
        'New Parent Support': ['new parent', 'first time parent', 'parent support'],
        'Breastfeeding Support': ['breastfeeding', 'feeding support'],
        'Postnatal Support': ['postnatal', 'post natal', 'mother support'],
        'Mental Health': ['parent wellbeing', 'mental health', 'counselling'],
        'Special Needs Support': ['special needs', 'additional needs', 'sen support']
      },
      
      // Weekend Activities
      'Weekend Activities': {
        'Family Fun': ['family activities', 'weekend fun'],
        'Sports': ['weekend sports', 'family sports'],
        'Creative': ['weekend crafts', 'family art'],
        'Outdoor': ['family walks', 'outdoor adventures']
      }
    };
  }

  async initialize() {
    await this.client.connect();
    console.log('🚀 CATEGORIZING ALL ENTRIES: Setting up proper category structure');
  }

  async categorizeAllEntries() {
    console.log('\n🎯 STARTING COMPREHENSIVE CATEGORIZATION');
    
    // Get all entries that need categorization
    const result = await this.client.query(`
      SELECT id, name, description
      FROM classes 
      WHERE main_category IS NULL
      ORDER BY id
    `);

    console.log(`Found ${result.rows.length} entries needing categorization`);
    
    let processed = 0;
    const batchSize = 50;

    // Process in batches for efficiency
    for (let i = 0; i < result.rows.length; i += batchSize) {
      const batch = result.rows.slice(i, i + batchSize);
      
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.length} entries`);
      
      for (const entry of batch) {
        const categories = this.determineCategories(entry.name, entry.description);
        
        if (categories.main_category && categories.subcategory) {
          await this.client.query(`
            UPDATE classes 
            SET main_category = $2, subcategory = $3
            WHERE id = $1
          `, [entry.id, categories.main_category, categories.subcategory]);
          
          this.totalCategorized++;
          processed++;
          
          if (processed % 10 === 0) {
            console.log(`✅ Categorized ${processed} entries...`);
          }
        }
      }
      
      await sleep(500); // Brief pause between batches
    }
    
    await this.showCategorizationResults();
  }

  determineCategories(name, description) {
    const fullText = `${name} ${description || ''}`.toLowerCase();
    
    // Check each main category and subcategory
    for (const [mainCategory, subcategories] of Object.entries(this.categoryMap)) {
      for (const [subcategory, keywords] of Object.entries(subcategories)) {
        
        // Check if any keywords match
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
    
    // Default categorization based on common patterns
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
    
    // Default to Baby & Toddler Classes if no clear match
    return { main_category: 'Baby & Toddler Classes', subcategory: 'Educational' };
  }

  async showCategorizationResults() {
    console.log('\n🎊 === CATEGORIZATION COMPLETE ===');
    console.log(`✅ Total entries categorized: ${this.totalCategorized}`);
    
    // Show breakdown by main category
    const categoryBreakdown = await this.client.query(`
      SELECT 
        main_category, 
        COUNT(*) as entry_count,
        STRING_AGG(DISTINCT subcategory, ', ') as subcategories
      FROM classes 
      WHERE main_category IS NOT NULL
      GROUP BY main_category
      ORDER BY entry_count DESC
    `);

    console.log('\n📊 CATEGORY BREAKDOWN:');
    console.log('Main Category                | Entries | Subcategories');
    console.log('-----------------------------|---------|----------------------------------------');
    
    categoryBreakdown.rows.forEach(row => {
      console.log(`${row.main_category.padEnd(28)} | ${String(row.entry_count).padStart(7)} | ${row.subcategories}`);
    });

    // Show subcategory details
    const subcategoryBreakdown = await this.client.query(`
      SELECT 
        main_category,
        subcategory, 
        COUNT(*) as entry_count
      FROM classes 
      WHERE main_category IS NOT NULL AND subcategory IS NOT NULL
      GROUP BY main_category, subcategory
      ORDER BY main_category, entry_count DESC
    `);

    console.log('\n📋 DETAILED SUBCATEGORY BREAKDOWN:');
    let currentMainCategory = '';
    
    subcategoryBreakdown.rows.forEach(row => {
      if (row.main_category !== currentMainCategory) {
        console.log(`\n🎯 ${row.main_category.toUpperCase()}:`);
        currentMainCategory = row.main_category;
      }
      console.log(`   ${row.subcategory}: ${row.entry_count} entries`);
    });

    console.log('\n🎉 CATEGORIZATION SUCCESS!');
    console.log('✅ Your directory now has proper category structure');
    console.log('✅ Users can easily browse by main category and subcategory');
    console.log('✅ Perfect organization for Baby & Toddler Classes, After School Clubs, Photography & Keepsakes, and Parent Support Groups');
  }

  async close() {
    await this.client.end();
  }
}

// Run the categorization
async function runCategorization() {
  const categorizer = new CategorizeAllEntries();
  
  try {
    await categorizer.initialize();
    await categorizer.categorizeAllEntries();
  } catch (error) {
    console.error('Categorization error:', error.message);
  } finally {
    await categorizer.close();
  }
}

runCategorization();