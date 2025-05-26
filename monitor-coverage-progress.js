import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function monitorCoverageProgress() {
  console.log('📊 Coverage Progress Report - ' + new Date().toLocaleString());
  console.log('=' .repeat(60));
  
  // Overall platform stats
  const totalStats = await sql`
    SELECT 
      COUNT(*) as total_classes,
      COUNT(DISTINCT town) as covered_towns,
      COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_classes
    FROM classes WHERE is_active = true
  `;
  
  console.log(`🎯 PLATFORM OVERVIEW:`);
  console.log(`Total Active Classes: ${totalStats[0].total_classes.toLocaleString()}`);
  console.log(`Towns Covered: ${totalStats[0].covered_towns}`);
  console.log(`Featured Classes: ${totalStats[0].featured_classes}`);
  
  // Top performing areas
  const topAreas = await sql`
    SELECT town, COUNT(*) as class_count 
    FROM classes WHERE is_active = true 
    GROUP BY town 
    ORDER BY COUNT(*) DESC 
    LIMIT 10
  `;
  
  console.log(`\n🏆 TOP COVERAGE AREAS:`);
  topAreas.forEach((area, index) => {
    console.log(`${index + 1}. ${area.town}: ${area.class_count} classes`);
  });
  
  // Under-covered priority towns
  const underCovered = await sql`
    SELECT town, COUNT(*) as class_count 
    FROM classes WHERE is_active = true 
    AND town IN ('Oxford', 'Cambridge', 'Bath', 'Canterbury', 'Winchester', 'Salisbury', 'Chichester', 'Guildford', 'Tunbridge Wells', 'Cheltenham', 'Horsham', 'Bracknell', 'Maidenhead', 'Woking', 'Reigate')
    GROUP BY town 
    ORDER BY COUNT(*) ASC
  `;
  
  console.log(`\n⚠️  PRIORITY TOWNS STATUS:`);
  underCovered.forEach(town => {
    const status = town.class_count < 5 ? '🔴 NEEDS COVERAGE' : 
                   town.class_count < 10 ? '🟡 IMPROVING' : '🟢 GOOD COVERAGE';
    console.log(`${town.town}: ${town.class_count} classes ${status}`);
  });
  
  // Recent additions (last hour)
  const recentAdditions = await sql`
    SELECT COUNT(*) as recent_count 
    FROM classes 
    WHERE is_active = true 
    AND created_at > NOW() - INTERVAL '1 hour'
  `;
  
  console.log(`\n📈 RECENT ACTIVITY:`);
  console.log(`Classes added in last hour: ${recentAdditions[0].recent_count}`);
  
  // Session grouping progress
  const duplicateStats = await sql`
    SELECT COUNT(*) as potential_duplicates
    FROM (
      SELECT TRIM(REGEXP_REPLACE(name, ' - (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday).*$', '', 'i')) as base_name
      FROM classes WHERE is_active = true
      GROUP BY base_name, town
      HAVING COUNT(*) > 1
    ) as duplicates
  `;
  
  console.log(`\n🔄 SESSION GROUPING:`);
  console.log(`Businesses with multiple sessions: ${duplicateStats[0].potential_duplicates}`);
  
  console.log('\n' + '=' .repeat(60));
  console.log('Next update in 30 minutes...\n');
}

// Run monitoring
monitorCoverageProgress().catch(console.error);

// Set up periodic monitoring (every 30 minutes)
setInterval(() => {
  monitorCoverageProgress().catch(console.error);
}, 30 * 60 * 1000);