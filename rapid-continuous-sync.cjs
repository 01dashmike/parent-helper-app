const { Client } = require('pg');

async function rapidContinuousSync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();

    while (true) {
      // Get synced businesses
      let syncedNames = new Set();
      let offset = '';
      
      do {
        const url = `https://api.airtable.com/v0/${baseId}/Parent%20Helper?pageSize=100&fields%5B%5D=Business_Name${offset ? `&offset=${offset}` : ''}`;
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          data.records.forEach(record => {
            if (record.fields.Business_Name) {
              syncedNames.add(record.fields.Business_Name.trim());
            }
          });
          offset = data.offset || '';
        } else {
          break;
        }
      } while (offset);

      // Get next batch of unsynced businesses
      const nextBatch = await client.query(`
        SELECT 
          name, description, category, town, postcode, address, venue,
          age_group_min, age_group_max, day_of_week, time, price,
          contact_phone, contact_email, website, is_featured, rating,
          direct_booking_available, online_payment_accepted,
          wheelchair_accessible, parking_available
        FROM classes 
        WHERE is_active = true 
        ORDER BY name ASC
        LIMIT 500
      `);

      const unsyncedBatch = nextBatch.rows.filter(row => 
        !syncedNames.has(row.name.trim())
      );

      if (unsyncedBatch.length === 0) {
        console.log(`COMPLETE: All ${syncedNames.size} businesses synced`);
        break;
      }

      console.log(`Syncing ${unsyncedBatch.length} businesses. Current total: ${syncedNames.size}`);

      let batchSynced = 0;
      
      for (let i = 0; i < unsyncedBatch.length; i += 5) {
        const batch = unsyncedBatch.slice(i, i + 5);
        
        const records = batch.map(row => ({
          fields: {
            'Business_Name': (row.name || '').trim(),
            'Category': (row.category || 'Educational').trim(),
            'Town': (row.town || '').trim(),
            'Postcode': (row.postcode || '').trim(),
            'Venue_Name': (row.venue || '').trim(),
            'Full_Address': (row.address || '').trim(),
            'Day_Of_Week': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(row.day_of_week) ? row.day_of_week : null,
            'Class_Time': (row.time || '').trim(),
            'Age_Min_Months': row.age_group_min ? parseInt(row.age_group_min) : 0,
            'Age_Max_Months': row.age_group_max ? parseInt(row.age_group_max) : 12,
            'Price': (row.price || 'Contact for pricing').trim(),
            'Contact_Phone': row.contact_phone && row.contact_phone !== 'null' ? row.contact_phone.trim() : '',
            'Contact_Email': row.contact_email && row.contact_email !== 'null' ? row.contact_email.trim() : '',
            'Website': row.website && row.website !== 'null' ? row.website.trim() : '',
            'Description': (row.description || '').trim(),
            'Featured': Boolean(row.is_featured),
            'Rating': row.rating ? parseFloat(row.rating) : null,
            'Direct_Booking': Boolean(row.direct_booking_available),
            'Online_Payment': Boolean(row.online_payment_accepted),
            'Wheelchair_Access': Boolean(row.wheelchair_accessible),
            'Parking_available': Boolean(row.parking_available)
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
            batchSynced += result.records.length;
          } else if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            i -= 5;
            continue;
          }
        } catch (error) {
          // Continue despite errors
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`Added ${batchSynced} this round. Total now: ${syncedNames.size + batchSynced}`);
      
      if (syncedNames.size + batchSynced >= 5947) {
        console.log('TARGET REACHED: All businesses synced!');
        break;
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

rapidContinuousSync().catch(console.error);