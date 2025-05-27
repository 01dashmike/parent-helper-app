const { Client } = require('pg');

async function steadyBuilder() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    
    // Just get a few businesses and add them - no complex logic
    const randomStart = Math.floor(Math.random() * 3000);
    const businesses = await client.query(`
      SELECT name, category, town, postcode, venue 
      FROM classes 
      WHERE is_active = true 
      LIMIT 3 OFFSET $1
    `, [randomStart]);

    console.log(`Adding ${businesses.rows.length} businesses`);

    if (businesses.rows.length > 0) {
      const records = businesses.rows.map(row => ({
        fields: {
          'Business_Name': row.name.trim(),
          'Category': row.category || 'Educational',
          'Town': row.town || '',
          'Postcode': row.postcode || '',
          'Venue_Name': row.venue || ''
        }
      }));

      const response = await fetch(`https://api.airtable.com/v0/${baseId}/Parent%20Helper`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records, typecast: true })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`SUCCESS: Added ${result.records.length} businesses`);
      } else {
        console.log(`Response: ${response.status}`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

steadyBuilder();