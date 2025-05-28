const { Client } = require('pg');

async function createStagingDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔧 Creating staging database to match Airtable structure...');

    // Create the new staging table with exact Airtable column structure
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS staging_businesses (
        id SERIAL PRIMARY KEY,
        business_name TEXT NOT NULL,
        full_address TEXT,
        venue_name TEXT,
        postcode TEXT,
        town TEXT,
        category TEXT,
        age_groups TEXT,
        pricing TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        featured BOOLEAN DEFAULT FALSE,
        description TEXT,
        day_of_week TEXT,
        time_slot TEXT,
        latitude NUMERIC(10,8),
        longitude NUMERIC(10,8),
        contact_method TEXT,
        special_needs_support BOOLEAN DEFAULT FALSE,
        outdoor_activities BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(createTableQuery);
    console.log('✅ Created staging_businesses table');

    // Create indexes for efficient querying
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_staging_business_name ON staging_businesses(business_name);',
      'CREATE INDEX IF NOT EXISTS idx_staging_postcode ON staging_businesses(postcode);',
      'CREATE INDEX IF NOT EXISTS idx_staging_town ON staging_businesses(town);',
      'CREATE INDEX IF NOT EXISTS idx_staging_category ON staging_businesses(category);',
      'CREATE INDEX IF NOT EXISTS idx_staging_featured ON staging_businesses(featured);'
    ];

    for (const indexQuery of indexes) {
      await client.query(indexQuery);
    }
    console.log('✅ Created database indexes for performance');

    // Check the table structure
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'staging_businesses' 
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 STAGING DATABASE STRUCTURE:');
    console.log('Column Name              | Data Type    | Nullable');
    console.log('-------------------------|--------------|----------');
    tableInfo.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(24)} | ${row.data_type.padEnd(12)} | ${row.is_nullable}`);
    });

    console.log('\n🎯 STAGING DATABASE READY!');
    console.log('✅ Matches Airtable column structure');
    console.log('✅ Optimized with indexes for fast queries');
    console.log('✅ Ready for new scraping data');
    console.log('✅ Separate from your original classes table');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

createStagingDatabase();