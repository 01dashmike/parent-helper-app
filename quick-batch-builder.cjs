const { Client } = require('pg');

async function quickBatchBuilder() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    
    // Quick focused sync - just 50 businesses at a time
    const randomOffset = Math.floor(Math.random() * 3000);
    const businesses = await client.query(`
      SELECT 
        name, category, town, postcode, venue, address,
        age_group_min, age_group_max, day_of_week, time, price,
        is_featured
      FROM classes 
      WHERE is_active = true 
      ORDER BY id ASC
      LIMIT 50 OFFSET $1
    `, [randomOffset]);

    console.log(`Quick sync: ${businesses.rows.length} businesses`);

    let added = 0;
    
    for (let i = 0; i < businesses.rows.length; i += 3) {
      const batch = businesses.rows.slice(i, i + 3);
      
      const records = batch.map(row => ({
        fields: {
          'Business_Name': row.name.trim(),
          'Category': row.category || 'Educational',
          'Town': row.town || '',
          'Postcode': row.postcode || '',
          'Venue_Name': row.venue || '',
          'Full_Address': row.address || '',
          'Day_Of_Week': row.day_of_week || null,
          'Class_Time': row.time || '',
          'Age_Min_Months': parseInt(row.age_group_min) || 0,
          'Age_Max_Months': parseInt(row.age_group_max) || 12,
          'Price': row.price || 'Contact for pricing',
          'Featured': Boolean(row.is_featured)
        }
      }));

      try {
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
          added += result.records.length;
        } else if (response.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          i -= 3;
          continue;
        }
      } catch (error) {
        // Continue
      }
      
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    console.log(`Quick batch complete: Added ${added} authentic businesses`);

  } catch (error) {
    console.error('Quick batch error:', error.message);
  } finally {
    await client.end();
  }
}

quickBatchBuilder().catch(console.error);