const { Client } = require('pg');

async function relentlessSync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();

    let sessionAdded = 0;
    
    // Get authentic businesses in batches and just add them
    for (let offset = 0; offset < 6000; offset += 50) {
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
        LIMIT 10 OFFSET $1
      `, [offset]);

      if (businesses.rows.length === 0) break;

      const records = businesses.rows.map(row => ({
        fields: {
          'Business_Name': row.name.trim(),
          'Category': (row.category || 'Educational').trim(),
          'Town': (row.town || '').trim(),
          'Postcode': (row.postcode || '').trim(),
          'Venue_Name': (row.venue || '').trim(),
          'Full_Address': (row.address || '').trim(),
          'Day_Of_Week': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(row.day_of_week) ? row.day_of_week : null,
          'Class_Time': (row.time || '').trim(),
          'Age_Min_Months': parseInt(row.age_group_min) || 0,
          'Age_Max_Months': parseInt(row.age_group_max) || 12,
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
          sessionAdded += result.records.length;
          
          if (sessionAdded % 100 === 0) {
            console.log(`Added ${sessionAdded} authentic businesses this session`);
          }
        } else if (response.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          offset -= 50; // Retry
          continue;
        }
      } catch (error) {
        // Keep going
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`Session complete: Added ${sessionAdded} authentic businesses`);

  } catch (error) {
    console.error('Sync error:', error.message);
  } finally {
    await client.end();
  }
}

// Just keep adding businesses relentlessly
(async () => {
  for (let i = 0; i < 20; i++) {
    console.log(`Relentless round ${i + 1}`);
    await relentlessSync();
    await new Promise(resolve => setTimeout(resolve, 500));
  }
})();