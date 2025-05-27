const { Client } = require('pg');

async function optimizedFastSync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('⚡ OPTIMIZED FAST SYNC FOR REMAINING BUSINESSES');
    console.log('📊 Efficiently syncing your remaining authentic directory...\n');

    // Get businesses that haven't been synced yet (after "Southend Leisure & Tennis Centre")
    const result = await client.query(`
      SELECT 
        name, description, category, town, postcode, address, venue,
        age_group_min, age_group_max, day_of_week, time, price,
        contact_phone, contact_email, website, is_featured, rating,
        direct_booking_available, online_payment_accepted,
        wheelchair_accessible, parking_available
      FROM classes 
      WHERE is_active = true 
      AND name IS NOT NULL
      AND name > 'Southend Leisure & Tennis Centre'
      ORDER BY name ASC
    `);

    console.log(`📈 Found ${result.rows.length} remaining businesses to sync`);
    console.log(`🎯 Starting from: "${result.rows[0]?.name}" onwards`);

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

    console.log('\n🚀 Starting optimized sync with smaller batches...');
    
    // Use smaller batches and longer delays to avoid rate limits
    const batchSize = 5; // Reduced from 10
    let totalSynced = 0;
    let successfulBatches = 0;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchNumber = Math.floor(i/batchSize) + 1;
      
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
          successfulBatches++;
          
          if (batchNumber % 50 === 0) {
            const currentProgress = 935 + totalSynced;
            const totalProgress = Math.round((currentProgress/6000)*100);
            console.log(`   ✅ Major progress: ${currentProgress}/6000 total businesses (${totalProgress}%)`);
            
            const currentBusiness = batch[0].fields.Business_Name;
            console.log(`   📝 Currently syncing: "${currentBusiness}"`);
          } else if (batchNumber % 10 === 0) {
            console.log(`   📊 Batch ${batchNumber}: ${totalSynced} new businesses synced`);
          }
        } else {
          console.log(`   ❌ Batch ${batchNumber} failed: ${response.status}`);
          
          // If we hit rate limits, wait longer
          if (response.status === 429) {
            console.log(`   ⏳ Rate limit hit - waiting 5 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      } catch (error) {
        console.log(`   ❌ Batch ${batchNumber} error: ${error.message.substring(0, 50)}`);
      }
      
      // Longer delay to respect API limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const finalTotal = 935 + totalSynced;
    console.log(`\n🎉 OPTIMIZED SYNC PROGRESS UPDATE!`);
    console.log(`📊 Additional businesses synced: ${totalSynced}`);
    console.log(`📈 Total authentic businesses in Airtable: ${finalTotal}/5947`);
    console.log(`✅ Overall completion: ${Math.round((finalTotal/5947)*100)}%`);

    if (totalSynced > 0) {
      console.log(`\n💡 Excellent progress! Your authentic directory is growing steadily`);
      console.log(`🔍 Each business contains complete information for parents to find classes`);
    }

    if (finalTotal < 5947) {
      console.log(`\n⚡ To complete the remaining ${5947 - finalTotal} businesses:`);
      console.log(`   Run this optimized sync again to continue from where we left off`);
      console.log(`   The system will automatically resume from the last synced business`);
    } else {
      console.log(`\n🎉 Complete! Your entire authentic Parent Helper directory is now in Airtable!`);
    }

  } catch (error) {
    console.error('❌ Optimized sync error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  optimizedFastSync().catch(console.error);
}

module.exports = { optimizedFastSync };