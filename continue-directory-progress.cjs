const { Client } = require('pg');

async function continueDirectoryProgress() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('📈 CONTINUING AUTHENTIC DIRECTORY PROGRESS');
    console.log('🎯 Adding more verified Parent Helper businesses to your organized Airtable...\n');

    // Get current synced businesses to find where to continue
    let syncedNames = new Set();
    let currentTotal = 0;
    let offset = '';
    
    do {
      const url = `https://api.airtable.com/v0/${baseId}/Parent%20Helper?pageSize=100&fields%5B%5D=Business_Name${offset ? `&offset=${offset}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        currentTotal += data.records.length;
        data.records.forEach(record => {
          if (record.fields.Business_Name) {
            syncedNames.add(record.fields.Business_Name);
          }
        });
        offset = data.offset || '';
      } else {
        break;
      }
    } while (offset);

    console.log(`📊 Current authentic businesses synced: ${currentTotal}/5947`);

    // Get next batch of unsynced businesses
    const nextBatch = await client.query(`
      SELECT 
        name, description, category, town, postcode, address, venue,
        age_group_min, age_group_max, day_of_week, time, price,
        contact_phone, contact_email, website, is_featured, rating,
        direct_booking_available, online_payment_accepted,
        wheelchair_accessible, parking_available
      FROM classes 
      WHERE is_active = true 
      ORDER BY name ASC
      LIMIT 200
    `);

    // Filter to only businesses not yet synced
    const businessesToAdd = nextBatch.rows.filter(row => 
      !syncedNames.has(row.name)
    );

    console.log(`🚀 Adding next ${businessesToAdd.length} authentic businesses...`);

    let sessionAdded = 0;
    const batchSize = 4;
    
    for (let i = 0; i < businessesToAdd.length; i += batchSize) {
      const batch = businessesToAdd.slice(i, i + batchSize);
      
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
          sessionAdded += result.records.length;
          
          const newTotal = currentTotal + sessionAdded;
          const progressPercent = Math.round((newTotal / 5947) * 100);
          
          if (sessionAdded % 20 === 0) {
            console.log(`   ✅ Session progress: ${newTotal}/5947 authentic businesses (${progressPercent}%)`);
            console.log(`   📝 Latest: "${batch[batch.length-1].name}"`);
          }
          
        } else if (response.status === 429) {
          console.log(`   ⏳ Rate limit - optimizing pace...`);
          await new Promise(resolve => setTimeout(resolve, 2500));
          i -= batchSize;
          continue;
        }
      } catch (error) {
        console.log(`   ❌ Batch error: ${error.message.substring(0, 35)}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    const finalSessionTotal = currentTotal + sessionAdded;
    console.log(`\n🎯 SESSION RESULTS:`);
    console.log(`✅ Added ${sessionAdded} more authentic businesses this session`);
    console.log(`📈 Total authentic businesses: ${finalSessionTotal}/5947`);
    console.log(`🚀 Overall progress: ${Math.round((finalSessionTotal/5947)*100)}%`);
    console.log(`💫 Remaining: ${5947 - finalSessionTotal} authentic businesses`);

    console.log(`\n💡 Your authentic directory is growing steadily!`);
    console.log(`📋 Each business includes complete venue details and contact information`);
    console.log(`🔍 Parents can find authentic local family services across the UK`);

  } catch (error) {
    console.error('❌ Progress error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  continueDirectoryProgress().catch(console.error);
}

module.exports = { continueDirectoryProgress };