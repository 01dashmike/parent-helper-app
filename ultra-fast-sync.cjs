const { Client } = require('pg');

async function ultraFastSync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();

    let round = 1;
    while (round <= 100) {
      // Get current Airtable count
      const countResponse = await fetch(`https://api.airtable.com/v0/${baseId}/Parent%20Helper?pageSize=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let currentCount = 0;
      if (countResponse.ok) {
        const countData = await countResponse.json();
        // Estimate total by getting a few pages
        let estimated = 0;
        let offset = '';
        for (let page = 0; page < 20; page++) {
          const pageUrl = `https://api.airtable.com/v0/${baseId}/Parent%20Helper?pageSize=100${offset ? `&offset=${offset}` : ''}`;
          const pageResponse = await fetch(pageUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (pageResponse.ok) {
            const pageData = await pageResponse.json();
            estimated += pageData.records.length;
            offset = pageData.offset || '';
            if (!offset) break;
          } else break;
        }
        currentCount = estimated;
      }

      console.log(`Round ${round}: Current Airtable has ~${currentCount} businesses`);

      if (currentCount >= 5900) {
        console.log('TARGET ACHIEVED: Nearly all businesses synced!');
        break;
      }

      // Get next batch from database
      const batchResult = await client.query(`
        SELECT 
          name, description, category, town, postcode, address, venue,
          age_group_min, age_group_max, day_of_week, time, price,
          contact_phone, contact_email, website, is_featured, rating,
          direct_booking_available, online_payment_accepted,
          wheelchair_accessible, parking_available
        FROM classes 
        WHERE is_active = true 
        ORDER BY random()
        LIMIT 100
      `);

      let roundAdded = 0;
      
      for (let i = 0; i < batchResult.rows.length; i += 8) {
        const batch = batchResult.rows.slice(i, i + 8);
        
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
            roundAdded += result.records.length;
          } else if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            i -= 8;
            continue;
          }
        } catch (error) {
          // Continue
        }
        
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      console.log(`Round ${round} complete: Added ${roundAdded} businesses`);
      round++;
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('SYNC PROCESS COMPLETE');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

ultraFastSync().catch(console.error);