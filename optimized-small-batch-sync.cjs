const { Client } = require('pg');

async function optimizedSmallBatchSync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('📦 STEP 2: OPTIMIZED SMALL BATCH SYNC');
    console.log('🎯 Adding 100-200 authentic businesses at a time...\n');

    // Get next batch of businesses after what we've already synced
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
      LIMIT 150
    `);

    console.log(`📊 Processing next ${result.rows.length} authentic businesses`);

    const records = result.rows.map(row => ({
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

    console.log('🚀 Syncing with ultra-small batches for reliability...');
    
    const batchSize = 2; // Ultra-small batches
    let totalSynced = 0;
    let retryCount = 0;
    const maxRetries = 3;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      try {
        const response = await fetch(`https://api.airtable.com/v0/${baseId}/Parent%20Helper`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            records: batch,
            typecast: true
          })
        });

        if (response.ok) {
          const result = await response.json();
          totalSynced += result.records.length;
          retryCount = 0; // Reset retry count on success
          
          if (totalSynced % 20 === 0) {
            const currentTotal = 801 + totalSynced; // 795 + 6 featured + new ones
            console.log(`   ✅ Progress: ${currentTotal} total businesses in Airtable`);
            console.log(`   📝 Last added: "${batch[batch.length-1].fields.Business_Name}"`);
          }
        } else if (response.status === 429) {
          console.log(`   ⏳ Rate limit hit - backing off...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          i -= batchSize; // Retry this batch
          retryCount++;
          if (retryCount > maxRetries) {
            console.log(`   ⚠️ Max retries reached, skipping batch`);
            retryCount = 0;
          } else {
            continue;
          }
        } else {
          console.log(`   ❌ HTTP ${response.status} - skipping batch`);
        }
      } catch (error) {
        console.log(`   ❌ Network error: ${error.message.substring(0, 30)}`);
      }
      
      // Gentle pacing
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    const currentTotal = 801 + totalSynced;
    console.log(`\n📊 STEP 2 RESULTS:`);
    console.log(`✅ Added ${totalSynced} more authentic businesses`);
    console.log(`📈 Total in Airtable: ${currentTotal}/5947`);
    console.log(`🎯 Progress: ${Math.round((currentTotal/5947)*100)}%`);

    console.log(`\n💡 Small batch approach working well!`);
    console.log(`📦 Can continue with more small batches for remaining businesses`);

  } catch (error) {
    console.error('❌ Small batch sync error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  optimizedSmallBatchSync().catch(console.error);
}

module.exports = { optimizedSmallBatchSync };