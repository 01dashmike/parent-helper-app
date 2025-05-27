const { Client } = require('pg');

async function efficientSteadySync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    
    const randomStart = Math.floor(Math.random() * 4000);
    const businesses = await client.query(`
      SELECT name, category, town, postcode, venue, address,
             age_group_min, age_group_max, day_of_week, time, price,
             contact_phone, contact_email, website, is_featured
      FROM classes 
      WHERE is_active = true 
      LIMIT 6 OFFSET $1
    `, [randomStart]);

    console.log(`Adding ${businesses.rows.length} authentic businesses with full details`);

    if (businesses.rows.length > 0) {
      const records = businesses.rows.map(row => ({
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
          'Contact_Phone': row.contact_phone || '',
          'Contact_Email': row.contact_email || '',
          'Website': row.website || '',
          'Featured': Boolean(row.is_featured)
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
        console.log(`SUCCESS: Added ${result.records.length} complete business profiles`);
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

efficientSteadySync();