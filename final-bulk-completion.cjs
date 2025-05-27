const { Client } = require('pg');

async function finalBulkCompletion() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();

    // Get all businesses in chunks and add them
    let offset = 0;
    const limit = 100;
    let totalProcessed = 0;

    while (totalProcessed < 6000) {
      const businesses = await client.query(`
        SELECT 
          name, description, category, town, postcode, address, venue,
          age_group_min, age_group_max, day_of_week, time, price,
          contact_phone, contact_email, website, is_featured, rating,
          direct_booking_available, online_payment_accepted,
          wheelchair_accessible, parking_available
        FROM classes 
        WHERE is_active = true 
        ORDER BY id ASC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      if (businesses.rows.length === 0) break;

      let chunkAdded = 0;
      
      for (let i = 0; i < businesses.rows.length; i += 10) {
        const batch = businesses.rows.slice(i, i + 10);
        
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
              chunkAdded += result.records.length;
              break;
            } else if (response.status === 429) {
              await new Promise(resolve => setTimeout(resolve, 3000));
              attempts++;
            } else {
              break;
            }
          } catch (error) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      totalProcessed += businesses.rows.length;
      offset += limit;
      
      console.log(`Processed ${totalProcessed} businesses, added ${chunkAdded} this chunk`);
    }

    console.log('Bulk completion finished');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

// Run multiple instances
Promise.all([
  finalBulkCompletion(),
  new Promise(resolve => setTimeout(() => finalBulkCompletion().then(resolve), 5000)),
  new Promise(resolve => setTimeout(() => finalBulkCompletion().then(resolve), 10000))
]).then(() => {
  console.log('All sync processes completed');
}).catch(console.error);