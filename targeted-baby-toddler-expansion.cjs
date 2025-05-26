const { Client } = require('pg');

// Targeted expansion specifically for authentic baby and toddler classes only
async function targetedBabyToddlerExpansion() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🎯 TARGETED BABY & TODDLER CLASSES EXPANSION');
    console.log('📋 Focus: Only structured classes for babies (0-12m) and toddlers (1-5y)\n');

    // Check current coverage for underserved towns
    const underservedTowns = [
      'Wolverhampton', 'Blackburn', 'Chester', 'Warrington', 
      'Hastings', 'Stoke-on-Trent', 'Walsall'
    ];

    console.log('📊 CURRENT COVERAGE CHECK:');
    const currentCoverage = {};
    for (const town of underservedTowns) {
      const result = await client.query(
        'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
        [town]
      );
      const count = parseInt(result.rows[0].count);
      currentCoverage[town] = count;
      const status = count >= 8 ? '✅' : '🎯';
      console.log(`   ${status} ${town}: ${count} classes (target: 8+)`);
    }

    // Specific search terms for authentic baby/toddler classes only
    const classSearchTerms = [
      'Baby Sensory classes',
      'Toddler Sense classes', 
      'baby massage classes',
      'toddler music classes',
      'baby yoga classes',
      'toddler swimming lessons',
      'baby signing classes',
      'Monkey Music classes',
      'Jo Jingles classes',
      'Tumble Tots classes'
    ];

    console.log('\n🔍 SEARCHING FOR AUTHENTIC BABY/TODDLER CLASSES...');
    console.log('Note: This requires Google Places API access for authentic results');
    
    // Since we need authentic data, we should ask for API access
    console.log('\n⚠️  To add authentic baby and toddler classes, we need:');
    console.log('   🔑 Google Places API key for real business data');
    console.log('   📍 This ensures we only add genuine, verified classes');
    console.log('   ✅ No mock or placeholder data will be used');
    
    console.log('\n📋 TARGET IMPROVEMENTS NEEDED:');
    underservedTowns.forEach(town => {
      const current = currentCoverage[town];
      const needed = Math.max(0, 8 - current);
      if (needed > 0) {
        console.log(`   🎯 ${town}: Add ${needed} more authentic baby/toddler classes`);
      }
    });

    console.log('\n🎯 EXPANSION STRATEGY:');
    console.log('   ✅ Target known brands: Baby Sensory, Toddler Sense, Monkey Music');
    console.log('   ✅ Focus on structured classes: massage, music, sensory, swimming');
    console.log('   ✅ Avoid general venues: nurseries, soft play, cafes');
    console.log('   ✅ Verify class authenticity before adding');

  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await client.end();
  }
}

// Example of what authentic expansion would look like with proper API access
function showExpansionExample() {
  console.log('\n📝 EXAMPLE AUTHENTIC CLASSES TO TARGET:');
  console.log('   🎵 Baby Sensory Wolverhampton - Structured sensory development');
  console.log('   🎶 Monkey Music Chester - Musical development for toddlers');  
  console.log('   🏊 Water Babies Blackburn - Swimming lessons for babies');
  console.log('   ✋ Baby Signing Warrington - Communication development');
  console.log('   🧘 Baby Yoga Hastings - Bonding and gentle movement');
  console.log('   🎪 Jo Jingles Stoke-on-Trent - Music and movement classes');
  console.log('   🤸 Tumble Tots Walsall - Physical development for toddlers');
}

if (require.main === module) {
  targetedBabyToddlerExpansion()
    .then(() => showExpansionExample())
    .catch(console.error);
}

module.exports = { targetedBabyToddlerExpansion };