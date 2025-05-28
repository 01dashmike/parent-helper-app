const { Client } = require('pg');

async function alignAllCategories() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🎯 Aligning all categories to match your website...');

    // Update all categories to match your website exactly
    await client.query(`
      UPDATE staging_businesses 
      SET category = CASE 
        WHEN business_name ILIKE '%photo%' OR business_name ILIKE '%keepsake%' OR business_name ILIKE '%scan%' THEN 'Family Services'
        WHEN business_name ILIKE '%after school%' OR business_name ILIKE '%school age%' THEN 'After School Clubs'  
        WHEN business_name ILIKE '%weekend%' OR business_name ILIKE '%family fun%' THEN 'Weekend Activities'
        ELSE 'Baby & Toddler Classes'
      END
    `);

    console.log('✅ Updated all categories to match your website structure');

    // Show updated businesses
    const result = await client.query(`
      SELECT business_name, category, town 
      FROM staging_businesses 
      ORDER BY created_at DESC
    `);

    console.log('\n📊 ALL BUSINESSES NOW USE YOUR WEBSITE CATEGORIES:');
    result.rows.forEach(business => {
      console.log(`${business.business_name} - ${business.category} (${business.town})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

alignAllCategories();