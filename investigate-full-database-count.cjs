const { Client } = require('pg');

async function investigateFullDatabaseCount() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔍 INVESTIGATING YOUR COMPLETE DATABASE COUNT');
    console.log('📊 Finding out why we\'re not seeing close to 6,000 records...\n');

    // Check total records in classes table
    const totalCount = await client.query('SELECT COUNT(*) FROM classes');
    console.log(`📈 Total records in classes table: ${totalCount.rows[0].count}`);

    // Check active records
    const activeCount = await client.query('SELECT COUNT(*) FROM classes WHERE is_active = true');
    console.log(`✅ Active records: ${activeCount.rows[0].count}`);

    // Check records with names
    const namedCount = await client.query('SELECT COUNT(*) FROM classes WHERE is_active = true AND name IS NOT NULL');
    console.log(`📝 Active records with names: ${namedCount.rows[0].count}`);

    // Check for empty or null names
    const emptyNames = await client.query(`
      SELECT COUNT(*) FROM classes 
      WHERE is_active = true AND (name IS NULL OR name = '' OR name = 'null')
    `);
    console.log(`❌ Active records with empty/null names: ${emptyNames.rows[0].count}`);

    // Check breakdown by status
    const statusBreakdown = await client.query(`
      SELECT 
        is_active,
        COUNT(*) as count
      FROM classes 
      GROUP BY is_active
    `);
    console.log('\n📊 Breakdown by active status:');
    statusBreakdown.rows.forEach(row => {
      console.log(`   ${row.is_active ? 'Active' : 'Inactive'}: ${row.count} records`);
    });

    // Check if there are records without names
    const sampleNoNames = await client.query(`
      SELECT id, name, town, venue 
      FROM classes 
      WHERE is_active = true AND (name IS NULL OR name = '' OR name = 'null')
      LIMIT 5
    `);
    
    if (sampleNoNames.rows.length > 0) {
      console.log('\n📋 Sample records missing names:');
      sampleNoNames.rows.forEach(row => {
        console.log(`   ID ${row.id}: name="${row.name}", town="${row.town}", venue="${row.venue}"`);
      });
    }

    // Get all records without name filter to see true count
    const allActiveRecords = await client.query(`
      SELECT COUNT(*) FROM classes WHERE is_active = true
    `);
    console.log(`\n🎯 TOTAL ACTIVE AUTHENTIC BUSINESSES: ${allActiveRecords.rows[0].count}`);

    // Check if we should include records with empty names but valid venue/town data
    const validDataCount = await client.query(`
      SELECT COUNT(*) FROM classes 
      WHERE is_active = true 
      AND (name IS NOT NULL OR venue IS NOT NULL OR town IS NOT NULL)
    `);
    console.log(`📍 Records with any identifying information: ${validDataCount.rows[0].count}`);

    // Show sample of what we're potentially missing
    const sampleMissing = await client.query(`
      SELECT name, venue, town, category 
      FROM classes 
      WHERE is_active = true 
      AND (name IS NULL OR name = '' OR name = 'null')
      AND (venue IS NOT NULL OR town IS NOT NULL)
      LIMIT 10
    `);

    if (sampleMissing.rows.length > 0) {
      console.log('\n💡 Potentially recoverable records (no name but have venue/town):');
      sampleMissing.rows.forEach((row, idx) => {
        console.log(`   ${idx + 1}. Venue: "${row.venue}", Town: "${row.town}", Category: "${row.category}"`);
      });
    }

    console.log(`\n🔧 RECOMMENDATION:`);
    if (allActiveRecords.rows[0].count > namedCount.rows[0].count) {
      const difference = allActiveRecords.rows[0].count - namedCount.rows[0].count;
      console.log(`   • You have ${difference} more active businesses without proper names`);
      console.log(`   • Consider including records with venue names when business name is missing`);
      console.log(`   • This could bring your total much closer to 6,000 authentic businesses`);
    }

  } catch (error) {
    console.error('❌ Investigation error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  investigateFullDatabaseCount().catch(console.error);
}

module.exports = { investigateFullDatabaseCount };