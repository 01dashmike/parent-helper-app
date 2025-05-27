const { Client } = require('pg');

async function completeAllBusinesses() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();

    // Get ALL businesses from database with proper ordering
    const allDbBusinesses = await client.query(`
      SELECT 
        name, description, category, town, postcode, address, venue,
        age_group_min, age_group_max, day_of_week, time, price,
        contact_phone, contact_email, website, is_featured, rating,
        direct_booking_available, online_payment_accepted,
        wheelchair_accessible, parking_available
      FROM classes 
      WHERE is_active = true 
      AND name IS NOT NULL
      ORDER BY id ASC
    `);

    console.log(`Database has ${allDbBusinesses.rows.length} authentic businesses`);

    // Get all businesses currently in Airtable
    let airtableBusinesses = new Map();
    let totalAirtable = 0;
    let offset = '';
    
    do {
      const url = `https://api.airtable.com/v0/${baseId}/Parent%20Helper?pageSize=100${offset ? `&offset=${offset}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        data.records.forEach(record => {
          if (record.fields.Business_Name) {
            airtableBusinesses.set(record.fields.Business_Name.trim().toLowerCase(), record.id);
          }
        });
        totalAirtable += data.records.length;
        offset = data.offset || '';
      } else {
        break;
      }
    } while (offset);

    console.log(`Airtable currently has ${totalAirtable} businesses`);

    // Find businesses not in Airtable
    const missingBusinesses = allDbBusinesses.rows.filter(row => 
      !airtableBusinesses.has(row.name.trim().toLowerCase())
    );

    console.log(`Need to add ${missingBusinesses.length} missing businesses`);

    if (missingBusinesses.length === 0) {
      console.log('All businesses are already synced!');
      return;
    }

    // Sync missing businesses in chunks
    let totalAdded = 0;
    const chunkSize = 200;
    
    for (let chunk = 0; chunk < missingBusinesses.length; chunk += chunkSize) {
      const chunkBusinesses = missingBusinesses.slice(chunk, chunk + chunkSize);
      console.log(`Processing chunk ${Math.floor(chunk/chunkSize) + 1}: ${chunkBusinesses.length} businesses`);
      
      let chunkAdded = 0;
      
      for (let i = 0; i < chunkBusinesses.length; i += 3) {
        const batch = chunkBusinesses.slice(i, i + 3);
        
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
            chunkAdded += result.records.length;
            totalAdded += result.records.length;
          } else if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            i -= 3;
            continue;
          }
        } catch (error) {
          // Continue processing
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      console.log(`Chunk complete: added ${chunkAdded} businesses. Total added: ${totalAdded}`);
      
      // Brief pause between chunks
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const finalTotal = totalAirtable + totalAdded;
    console.log(`SYNC COMPLETE: ${finalTotal}/${allDbBusinesses.rows.length} authentic businesses in Airtable`);

    if (finalTotal >= allDbBusinesses.rows.length) {
      console.log('SUCCESS: All authentic businesses are now in Airtable!');
    } else {
      console.log(`Remaining: ${allDbBusinesses.rows.length - finalTotal} businesses to sync`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

// Run the complete sync
completeAllBusinesses().catch(console.error);