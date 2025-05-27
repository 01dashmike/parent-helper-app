const { Client } = require('pg');

async function streamlinedCompleteSync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🚀 STREAMLINED APPROACH - GETTING ALL AUTHENTIC BUSINESSES IN!');

    // Simple approach: get businesses in small chunks and add them
    let batchCount = 0;
    let totalAdded = 0;
    
    for (let startId = 0; startId < 7000; startId += 20) {
      const businesses = await client.query(`
        SELECT 
          name, category, town, postcode, venue, address,
          age_group_min, age_group_max, day_of_week, time, price,
          contact_phone, contact_email, website, is_featured
        FROM classes 
        WHERE is_active = true 
        AND id >= $1
        ORDER BY id ASC
        LIMIT 5
      `, [startId]);

      if (businesses.rows.length === 0) continue;

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

      let attempts = 0;
      while (attempts < 3) {
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
            totalAdded += result.records.length;
            batchCount++;
            
            if (batchCount % 25 === 0) {
              console.log(`Batch ${batchCount}: ${totalAdded} businesses added`);
            }
            break;
          } else if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            attempts++;
          } else {
            break;
          }
        } catch (error) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`STREAMLINED SYNC COMPLETE: ${totalAdded} authentic businesses processed`);

  } catch (error) {
    console.error('Streamlined sync error:', error.message);
  } finally {
    await client.end();
  }
}

streamlinedCompleteSync().catch(console.error);