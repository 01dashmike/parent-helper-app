const { Client } = require('pg');

async function debugMissingData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔍 Checking database for incomplete business names...');

    const testNames = [
      'You Me Moments',
      'Moo Music Heswall and Neston', 
      'Baby Sensory Beverley',
      'diddi dance Bexley & Orpington kids dance classes'
    ];

    for (const businessName of testNames) {
      console.log(`\nSearching for: "${businessName}"`);
      
      // Try exact match
      let result = await client.query(
        'SELECT name, address, town FROM classes WHERE name ILIKE $1 LIMIT 3',
        [businessName]
      );
      
      if (result.rows.length > 0) {
        console.log('✅ Exact match found:', result.rows[0]);
      } else {
        // Try partial match
        result = await client.query(
          'SELECT name, address, town FROM classes WHERE name ILIKE $1 LIMIT 3',
          [`%${businessName.split(' ')[0]}%`]
        );
        
        if (result.rows.length > 0) {
          console.log('🔍 Partial matches found:');
          result.rows.forEach(row => console.log(`  - ${row.name}`));
        } else {
          console.log('❌ No matches found');
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

debugMissingData();