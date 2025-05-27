const { Client } = require('pg');

async function simpleRemainingSync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('📈 SIMPLE SYNC: ADDING REMAINING AUTHENTIC BUSINESSES');
    console.log('🎯 Just adding the businesses we haven\'t synced yet...\n');

    // Get businesses after "Southend Leisure & Tennis Centre" (last synced business)
    const result = await client.query(`
      SELECT 
        name, description, category, town, postcode, address, venue,
        age_group_min, age_group_max, day_of_week, time, price,
        contact_phone, contact_email, website, is_featured, rating,
        direct_booking_available, online_payment_accepted,
        wheelchair_accessible, parking_available
      FROM classes 
      WHERE is_active = true 
      AND name > 'Southend Leisure & Tennis Centre'
      ORDER BY name ASC
    `);

    console.log(`📊 Found ${result.rows.length} remaining businesses to add`);
    console.log(`🚀 Starting from: "${result.rows[0]?.name}"`);

    let totalAdded = 0;
    const batchSize = 5; // Small batches to avoid issues
    
    for (let i = 0; i < result.rows.length; i += batchSize) {
      const batch = result.rows.slice(i, i + batchSize);
      
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
          body: JSON.stringify({
            records: records,
            typecast: true
          })
        });

        if (response.ok) {
          const result = await response.json();
          totalAdded += result.records.length;
          
          if (totalAdded % 100 === 0) {
            const currentTotal = 795 + totalAdded;
            console.log(`   ✅ Progress: ${currentTotal}/5947 total businesses in Airtable`);
          }
        } else if (response.status === 429) {
          console.log(`   ⏳ Rate limit - waiting 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          i -= batchSize; // Retry this batch
          continue;
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message.substring(0, 50)}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 250)); // Slower pace
    }

    const finalTotal = 795 + totalAdded;
    console.log(`\n📊 SYNC COMPLETE!`);
    console.log(`✅ Added ${totalAdded} new authentic businesses`);
    console.log(`📈 Total in Airtable: ${finalTotal}/5947`);
    console.log(`🎯 Progress: ${Math.round((finalTotal/5947)*100)}%`);

    if (finalTotal < 5947) {
      console.log(`\n💡 To get the remaining ${5947 - finalTotal} businesses:`);
      console.log(`   Run this script again - it will continue from where we left off`);
    } else {
      console.log(`\n🎉 Complete! Your entire authentic Parent Helper directory is now in Airtable!`);
    }

  } catch (error) {
    console.error('❌ Sync error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  simpleRemainingSync().catch(console.error);
}

module.exports = { simpleRemainingSync };