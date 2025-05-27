const { Client } = require('pg');

async function fastMissingBusinessesSync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🚀 FAST SYNC OF MISSING AUTHENTIC BUSINESSES');
    console.log('📊 Adding the 4,238 missing businesses efficiently...\n');

    // Get current businesses in Airtable after cleanup
    let existingBusinesses = new Set();
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
            existingBusinesses.add(record.fields.Business_Name.trim().toLowerCase());
          }
        });
        offset = data.offset || '';
      } else {
        break;
      }
    } while (offset);

    console.log(`📋 Airtable currently has ${existingBusinesses.size} unique businesses`);

    // Get missing businesses from database
    const missingBusinesses = await client.query(`
      SELECT DISTINCT ON (name)
        name, description, category, town, postcode, address, venue,
        age_group_min, age_group_max, day_of_week, time, price,
        contact_phone, contact_email, website, is_featured, rating,
        direct_booking_available, online_payment_accepted,
        wheelchair_accessible, parking_available
      FROM classes 
      WHERE is_active = true 
      AND LOWER(TRIM(name)) NOT IN (${Array.from(existingBusinesses).map((_, i) => `$${i + 1}`).join(',')})
      ORDER BY name, id ASC
    `, Array.from(existingBusinesses));

    console.log(`🎯 Found ${missingBusinesses.rows.length} missing authentic businesses to add`);

    let totalAdded = 0;
    const batchSize = 8;
    
    for (let i = 0; i < missingBusinesses.rows.length; i += batchSize) {
      const batch = missingBusinesses.rows.slice(i, i + batchSize);
      
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

      let success = false;
      let attempts = 0;
      
      while (!success && attempts < 3) {
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
            success = true;
            
            if (totalAdded % 200 === 0) {
              const newTotal = existingBusinesses.size + totalAdded;
              const progress = Math.round((newTotal / 5236) * 100);
              console.log(`   ✅ Major progress: ${newTotal}/5236 authentic businesses (${progress}%)`);
            }
          } else if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            attempts++;
          } else {
            success = true;
          }
        } catch (error) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const finalTotal = existingBusinesses.size + totalAdded;
    console.log(`\n🎉 FAST SYNC COMPLETE!`);
    console.log(`✅ Added ${totalAdded} missing authentic businesses`);
    console.log(`📈 Total authentic businesses: ${finalTotal}/5236`);
    console.log(`🎯 Directory completion: ${Math.round((finalTotal/5236)*100)}%`);

  } catch (error) {
    console.error('❌ Fast sync error:', error.message);
  } finally {
    await client.end();
  }
}

fastMissingBusinessesSync().catch(console.error);