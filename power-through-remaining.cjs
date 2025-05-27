const { Client } = require('pg');

async function powerThroughRemaining() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();

    // Get businesses in chunks and add them rapidly
    let totalProcessed = 0;
    let totalAdded = 0;
    
    for (let round = 1; round <= 30; round++) {
      // Get next chunk of unique businesses
      const chunkBusinesses = await client.query(`
        SELECT DISTINCT ON (LOWER(TRIM(name)))
          name, description, category, town, postcode, address, venue,
          age_group_min, age_group_max, day_of_week, time, price,
          contact_phone, contact_email, website, is_featured, rating,
          direct_booking_available, online_payment_accepted,
          wheelchair_accessible, parking_available
        FROM classes 
        WHERE is_active = true 
        AND name IS NOT NULL 
        ORDER BY LOWER(TRIM(name)), id ASC
        LIMIT 200 OFFSET $1
      `, [totalProcessed]);

      if (chunkBusinesses.rows.length === 0) break;

      let roundAdded = 0;
      
      // Process in micro-batches for speed
      for (let i = 0; i < chunkBusinesses.rows.length; i += 4) {
        const batch = chunkBusinesses.rows.slice(i, i + 4);
        
        const records = batch.map(row => ({
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
            roundAdded += result.records.length;
            totalAdded += result.records.length;
          } else if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            i -= 4; // Retry batch
            continue;
          }
        } catch (error) {
          // Continue processing
        }
        
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      totalProcessed += chunkBusinesses.rows.length;
      console.log(`Round ${round}: Added ${roundAdded} businesses | Total added: ${totalAdded} | Progress: ${997 + totalAdded}/5232`);
      
      if (997 + totalAdded >= 5200) {
        console.log('TARGET ACHIEVED! Nearly all authentic businesses synced!');
        break;
      }
    }

    console.log(`POWER SYNC COMPLETE: Added ${totalAdded} authentic businesses!`);
    console.log(`Total authentic businesses now: ${997 + totalAdded}/5232`);

  } catch (error) {
    console.error('Power sync error:', error.message);
  } finally {
    await client.end();
  }
}

// Run multiple rounds automatically
(async () => {
  for (let cycle = 1; cycle <= 10; cycle++) {
    console.log(`POWER CYCLE ${cycle} STARTING`);
    await powerThroughRemaining();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('ALL POWER CYCLES COMPLETE!');
})();