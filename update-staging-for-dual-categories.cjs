const { Client } = require('pg');

async function updateStagingForDualCategories() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔧 Adding activity type column for dual categorization...');

    // Add activity_type column to staging database
    await client.query(`
      ALTER TABLE staging_businesses 
      ADD COLUMN IF NOT EXISTS activity_type TEXT
    `);

    console.log('✅ Added activity_type column');

    // Update existing businesses with proper categorization
    await client.query(`
      UPDATE staging_businesses 
      SET 
        category = CASE 
          WHEN business_name ILIKE '%photo%' OR business_name ILIKE '%keepsake%' OR business_name ILIKE '%scan%' THEN 'Family Services'
          WHEN business_name ILIKE '%after school%' OR business_name ILIKE '%school age%' THEN 'After School Clubs'  
          WHEN business_name ILIKE '%weekend%' OR business_name ILIKE '%family fun%' THEN 'Weekend Activities'
          ELSE 'Baby & Toddler Classes'
        END,
        activity_type = CASE 
          WHEN business_name ILIKE '%swim%' OR business_name ILIKE '%water%' THEN 'SWIMMING'
          WHEN business_name ILIKE '%music%' OR business_name ILIKE '%sing%' THEN 'MUSIC'
          WHEN business_name ILIKE '%sensory%' THEN 'SENSORY'
          WHEN business_name ILIKE '%dance%' OR business_name ILIKE '%yoga%' OR business_name ILIKE '%gym%' THEN 'MOVEMENT'
          WHEN business_name ILIKE '%sign%' OR business_name ILIKE '%language%' THEN 'LANGUAGE'
          WHEN business_name ILIKE '%art%' OR business_name ILIKE '%craft%' THEN 'ART'
          ELSE 'SENSORY'
        END
    `);

    console.log('✅ Updated all businesses with dual categorization');

    // Show the updated structure
    const result = await client.query(`
      SELECT business_name, category, activity_type, town 
      FROM staging_businesses 
      ORDER BY created_at DESC
    `);

    console.log('\n📊 BUSINESSES WITH DUAL CATEGORIZATION:');
    result.rows.forEach(business => {
      console.log(`${business.business_name}`);
      console.log(`  Main: ${business.category}`);
      console.log(`  Type: ${business.activity_type}`);
      console.log(`  Location: ${business.town}\n`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

updateStagingForDualCategories();