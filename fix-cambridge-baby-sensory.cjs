const { Client } = require('pg');

async function fixCambridgeBabySensory() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔧 Fixing Cambridge Baby Sensory category...');

    // Update the category to match your website categories
    await client.query(`
      UPDATE staging_businesses 
      SET category = 'Baby & Toddler Classes'
      WHERE business_name = 'Cambridge Baby Sensory'
    `);

    console.log('✅ Updated Cambridge Baby Sensory to use correct category');

    // Show current staging businesses with their categories
    const result = await client.query(`
      SELECT business_name, category, town 
      FROM staging_businesses 
      ORDER BY created_at DESC
    `);

    console.log('\n📊 STAGING BUSINESSES WITH CORRECT CATEGORIES:');
    result.rows.forEach(business => {
      console.log(`${business.business_name} - ${business.category} (${business.town})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

fixCambridgeBabySensory();