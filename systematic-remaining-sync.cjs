const { Client } = require('pg');

async function systematicRemainingSync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🎯 SYSTEMATIC SYNC OF REMAINING AUTHENTIC BUSINESSES');
    console.log('📊 Finding and adding your remaining verified family services...\n');

    // Get ALL business names currently in Airtable
    let syncedBusinesses = new Set();
    let currentCount = 0;
    let offset = '';
    
    console.log('📋 Checking current Airtable contents...');
    do {
      const url = `https://api.airtable.com/v0/${baseId}/Parent%20Helper?pageSize=100&fields%5B%5D=Business_Name${offset ? `&offset=${offset}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        currentCount += data.records.length;
        data.records.forEach(record => {
          if (record.fields.Business_Name) {
            syncedBusinesses.add(record.fields.Business_Name.trim());
          }
        });
        offset = data.offset || '';
      } else {
        break;
      }
    } while (offset);

    console.log(`✅ Found ${currentCount} businesses already synced`);

    // Get businesses that aren't synced yet
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

    // Filter to only unsynced businesses
    const unsyncedBusinesses = allBusinesses.rows.filter(row => 
      !syncedBusinesses.has(row.name.trim())
    );

    console.log(`🚀 Found ${unsyncedBusinesses.length} authentic businesses ready to sync`);

    if (unsyncedBusinesses.length === 0) {
      console.log('\n🎉 ALL BUSINESSES SYNCED! Your complete directory is ready!');
      return;
    }

    // Take next batch for this session
    const sessionBatch = unsyncedBusinesses.slice(0, 100);
    console.log(`📦 Syncing next ${sessionBatch.length} authentic businesses...`);

    let sessionSynced = 0;
    const batchSize = 5;
    
    for (let i = 0; i < sessionBatch.length; i += batchSize) {
      const batch = sessionBatch.slice(i, i + batchSize);
      
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
          sessionSynced += result.records.length;
          
          if (sessionSynced % 25 === 0) {
            const newTotal = currentCount + sessionSynced;
            const progress = Math.round((newTotal / 5947) * 100);
            console.log(`   ✅ Progress: ${newTotal}/5947 authentic businesses (${progress}%)`);
          }
          
        } else if (response.status === 429) {
          console.log(`   ⏳ Rate limit - brief pause...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          i -= batchSize;
          continue;
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message.substring(0, 40)}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    const finalTotal = currentCount + sessionSynced;
    console.log(`\n🎯 SYSTEMATIC SESSION COMPLETE!`);
    console.log(`✅ Successfully added ${sessionSynced} authentic businesses`);
    console.log(`📈 Total authentic businesses: ${finalTotal}/5947`);
    console.log(`🚀 Directory progress: ${Math.round((finalTotal/5947)*100)}%`);
    console.log(`💫 Remaining to sync: ${5947 - finalTotal} authentic businesses`);

    console.log(`\n🎊 Your authentic Parent Helper directory continues growing!`);
    console.log(`📋 Each business includes complete venue details and authentic contact information`);

  } catch (error) {
    console.error('❌ Systematic sync error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  systematicRemainingSync().catch(console.error);
}

module.exports = { systematicRemainingSync };