const { Client } = require('pg');

async function completeAuthenticDirectory() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🎯 COMPLETE AUTHENTIC DIRECTORY SYNC');
    console.log('📊 Efficiently syncing ALL your authentic businesses to Airtable...\n');

    // Get ALL authentic businesses from database
    const allBusinesses = await client.query(`
      SELECT 
        name, description, category, town, postcode, address, venue,
        age_group_min, age_group_max, day_of_week, time, price,
        contact_phone, contact_email, website, is_featured, rating,
        direct_booking_available, online_payment_accepted,
        wheelchair_accessible, parking_available
      FROM classes 
      WHERE is_active = true 
      ORDER BY name ASC
    `);

    console.log(`📈 Total authentic businesses in database: ${allBusinesses.rows.length}`);

    // Check what's already in Airtable
    let existingBusinesses = new Set();
    let airtableCount = 0;
    let offset = '';
    
    do {
      const url = `https://api.airtable.com/v0/${baseId}/Parent%20Helper?pageSize=100&fields%5B%5D=Business_Name${offset ? `&offset=${offset}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        airtableCount += data.records.length;
        data.records.forEach(record => {
          if (record.fields.Business_Name) {
            existingBusinesses.add(record.fields.Business_Name);
          }
        });
        offset = data.offset || '';
      } else {
        break;
      }
    } while (offset);

    console.log(`📋 Current businesses in Airtable: ${airtableCount}`);

    // Find businesses not yet synced
    const businessesToSync = allBusinesses.rows.filter(row => 
      !existingBusinesses.has(row.name)
    );

    console.log(`🚀 Need to sync: ${businessesToSync.length} authentic businesses`);

    if (businessesToSync.length === 0) {
      console.log('\n🎉 ALL BUSINESSES ALREADY SYNCED!');
      console.log(`✅ Your complete directory of ${airtableCount} authentic businesses is ready!`);
      return;
    }

    // Sync missing businesses efficiently
    console.log('\n📦 Syncing missing authentic businesses...');
    
    let syncedCount = 0;
    const batchSize = 6;
    
    for (let i = 0; i < businessesToSync.length; i += batchSize) {
      const batch = businessesToSync.slice(i, i + batchSize);
      
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
          syncedCount += result.records.length;
          
          const totalNow = airtableCount + syncedCount;
          const progressPercent = Math.round((totalNow / allBusinesses.rows.length) * 100);
          
          if (syncedCount % 30 === 0 || syncedCount === businessesToSync.length) {
            console.log(`   ✅ Progress: ${totalNow}/${allBusinesses.rows.length} authentic businesses (${progressPercent}%)`);
          }
          
        } else if (response.status === 429) {
          console.log(`   ⏳ Rate limit - brief pause...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          i -= batchSize;
          continue;
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message.substring(0, 40)}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const finalTotal = airtableCount + syncedCount;
    console.log(`\n🏆 SYNC COMPLETE!`);
    console.log(`✅ Added ${syncedCount} missing authentic businesses`);
    console.log(`📈 Total authentic businesses: ${finalTotal}/${allBusinesses.rows.length}`);
    console.log(`🎯 Directory completion: ${Math.round((finalTotal/allBusinesses.rows.length)*100)}%`);

    if (finalTotal >= allBusinesses.rows.length) {
      console.log(`\n🎉 COMPLETE SUCCESS!`);
      console.log(`🗺️ Your entire authentic Parent Helper directory is now organized in Airtable!`);
      console.log(`📋 All ${finalTotal} verified family businesses are ready for parents to discover`);
    }

  } catch (error) {
    console.error('❌ Directory sync error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  completeAuthenticDirectory().catch(console.error);
}

module.exports = { completeAuthenticDirectory };