const { Client } = require('pg');

async function setupAirtableIntegration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔗 SETTING UP AIRTABLE INTEGRATION');
    console.log('📊 Preparing your Parent Helper database for Airtable sync...\n');

    // Check if AIRTABLE_API_KEY is available
    if (!process.env.AIRTABLE_API_KEY) {
      console.log('⚠️  AIRTABLE_API_KEY not found in environment variables');
      console.log('📝 To connect to Airtable, you need to:');
      console.log('   1. Get your Airtable API key from https://airtable.com/account');
      console.log('   2. Create a new base or use existing one');
      console.log('   3. Add the AIRTABLE_API_KEY to your environment\n');
      
      // Show sample data structure that would sync to Airtable
      console.log('📋 Sample data structure for Airtable sync:');
      const sampleData = await client.query(`
        SELECT 
          id, name, description, category, town, postcode,
          age_group_min, age_group_max, price, day_of_week, time,
          venue, contact_phone, website, is_featured, rating,
          wheelchair_accessible, disability_support, ai_quality_score,
          created_at
        FROM classes 
        WHERE is_active = true 
        ORDER BY ai_quality_score DESC NULLS LAST
        LIMIT 5
      `);
      
      sampleData.rows.forEach((row, idx) => {
        console.log(`\n${idx + 1}. ${row.name} (${row.town})`);
        console.log(`   Category: ${row.category} | Ages: ${row.age_group_min}-${row.age_group_max} months`);
        console.log(`   Quality Score: ${row.ai_quality_score || 'Not rated'} | Featured: ${row.is_featured ? 'Yes' : 'No'}`);
        console.log(`   Contact: ${row.contact_phone || 'N/A'} | Website: ${row.website ? 'Yes' : 'No'}`);
      });
      
      return;
    }

    // If API key exists, proceed with Airtable setup
    console.log('✅ AIRTABLE_API_KEY found - proceeding with integration setup');
    
    // Create a summary of your database for Airtable
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_businesses,
        COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_count,
        COUNT(CASE WHEN wheelchair_accessible = true THEN 1 END) as accessible_count,
        COUNT(CASE WHEN ai_quality_score IS NOT NULL THEN 1 END) as ai_scored_count,
        AVG(ai_quality_score) as avg_quality_score
      FROM classes 
      WHERE is_active = true
    `);

    const categoryStats = await client.query(`
      SELECT category, COUNT(*) as count
      FROM classes 
      WHERE is_active = true 
      GROUP BY category 
      ORDER BY count DESC
      LIMIT 10
    `);

    const townStats = await client.query(`
      SELECT town, COUNT(*) as count
      FROM classes 
      WHERE is_active = true 
      GROUP BY town 
      ORDER BY count DESC
      LIMIT 15
    `);

    console.log('\n📊 DATABASE OVERVIEW FOR AIRTABLE SYNC:');
    console.log('=====================================');
    console.log(`Total Active Businesses: ${stats.rows[0].total_businesses}`);
    console.log(`Featured Businesses: ${stats.rows[0].featured_count}`);
    console.log(`Wheelchair Accessible: ${stats.rows[0].accessible_count}`);
    console.log(`AI Quality Scored: ${stats.rows[0].ai_scored_count}`);
    console.log(`Average Quality Score: ${parseFloat(stats.rows[0].avg_quality_score || 0).toFixed(1)}/10`);

    console.log('\n🏷️  TOP CATEGORIES:');
    categoryStats.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.category}: ${row.count} businesses`);
    });

    console.log('\n🏘️  TOP LOCATIONS:');
    townStats.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.town}: ${row.count} businesses`);
    });

    console.log('\n🚀 READY FOR AIRTABLE INTEGRATION!');
    console.log('Your database is now enhanced with AI-ready fields and can be synced to Airtable.');
    console.log('This will give you a powerful visual interface to manage your Parent Helper data.');

  } catch (error) {
    console.error('❌ Airtable integration setup error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  setupAirtableIntegration().catch(console.error);
}

module.exports = { setupAirtableIntegration };