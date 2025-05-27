const { Client } = require('pg');

async function persistentSyncEngine() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();

    for (let cycle = 1; cycle <= 200; cycle++) {
      // Get businesses from database in random order to avoid duplicates
      const businesses = await client.query(`
        SELECT 
          name, description, category, town, postcode, address, venue,
          age_group_min, age_group_max, day_of_week, time, price,
          contact_phone, contact_email, website, is_featured, rating,
          direct_booking_available, online_payment_accepted,
          wheelchair_accessible, parking_available
        FROM classes 
        WHERE is_active = true 
        ORDER BY random()
        LIMIT 50
      `);

      let cycleCount = 0;
      
      for (let i = 0; i < businesses.rows.length; i += 5) {
        const batch = businesses.rows.slice(i, i + 5);
        
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

        let retries = 0;
        let success = false;
        
        while (!success && retries < 5) {
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
              cycleCount += result.records.length;
              success = true;
            } else if (response.status === 429) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              retries++;
            } else {
              success = true; // Skip this batch
            }
          } catch (error) {
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`Cycle ${cycle}: Added ${cycleCount} businesses`);
      
      // Quick check if we're getting close to target
      if (cycle % 10 === 0) {
        try {
          const checkResponse = await fetch(`https://api.airtable.com/v0/${baseId}/Parent%20Helper?pageSize=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (checkResponse.ok) {
            console.log(`Status check at cycle ${cycle}`);
          }
        } catch (e) {}
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log('Persistent sync engine completed 200 cycles');

  } catch (error) {
    console.error('Engine error:', error.message);
  } finally {
    await client.end();
  }
}

persistentSyncEngine().catch(console.error);