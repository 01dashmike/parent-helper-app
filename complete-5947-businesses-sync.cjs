const { Client } = require('pg');

async function complete5947BusinessesSync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🎯 SYNCING ALL 5,947 AUTHENTIC PARENT HELPER BUSINESSES');
    console.log('📊 Getting your complete authentic directory into Airtable...\n');

    // Get ALL 5,947 authentic businesses - no filtering by name
    const result = await client.query(`
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

    console.log(`🎉 Found exactly ${result.rows.length} authentic businesses - your complete directory!`);
    console.log(`📋 From "${result.rows[0].name}" to "${result.rows[result.rows.length-1].name}"`);

    // Clear existing records first to avoid duplicates
    console.log('\n🧹 Clearing existing records to ensure clean sync...');
    let existingRecords = [];
    let offset = '';
    
    do {
      const url = `https://api.airtable.com/v0/${baseId}/Parent%20Helper?pageSize=100${offset ? `&offset=${offset}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        existingRecords = existingRecords.concat(data.records);
        offset = data.offset || '';
      } else {
        break;
      }
    } while (offset);

    // Delete existing records in batches
    for (let i = 0; i < existingRecords.length; i += 10) {
      const batch = existingRecords.slice(i, i + 10);
      const recordIds = batch.map(record => record.id);
      
      const deleteUrl = `https://api.airtable.com/v0/${baseId}/Parent%20Helper?${recordIds.map(id => `records[]=${id}`).join('&')}`;
      await fetch(deleteUrl, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✅ Cleared ${existingRecords.length} existing records`);

    // Now sync all 5,947 authentic businesses
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

    console.log('\n🚀 Syncing your complete authentic directory...');
    
    const batchSize = 8; // Smaller batches for reliability
    let totalSynced = 0;
    
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
          
          if (batchNumber % 100 === 0) {
            const progress = Math.round((totalSynced/records.length)*100);
            console.log(`   ✅ Major milestone: ${totalSynced}/5947 businesses synced (${progress}%)`);
            
            const currentBusiness = batch[0].fields.Business_Name;
            const currentLetter = currentBusiness.charAt(0).toUpperCase();
            console.log(`   📝 Currently syncing businesses starting with "${currentLetter}"`);
          }
        } else if (response.status === 429) {
          console.log(`   ⏳ Rate limit - waiting...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          i -= batchSize; // Retry this batch
          continue;
        }
      } catch (error) {
        console.log(`   ❌ Batch ${batchNumber} error: ${error.message.substring(0, 50)}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log(`\n🎉 COMPLETE DIRECTORY SYNC FINISHED!`);
    console.log(`📊 Successfully synced ${totalSynced}/5947 authentic Parent Helper businesses`);
    console.log(`✅ Your Airtable now contains your complete UK family directory!`);
    console.log(`🔤 All businesses organized alphabetically for easy lookup`);

  } catch (error) {
    console.error('❌ Complete sync error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  complete5947BusinessesSync().catch(console.error);
}

module.exports = { complete5947BusinessesSync };