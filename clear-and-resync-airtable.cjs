const { Client } = require('pg');

async function clearAndResyncAirtable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🧹 CLEARING AND RESYNCING AIRTABLE WITH STRUCTURED DATA');
    console.log('📊 Step 1: Clearing existing records...\n');

    // First, get all existing records to delete them
    let allRecords = [];
    let offset = '';
    
    do {
      const url = `https://api.airtable.com/v0/${baseId}/Parent%20Helper?pageSize=100${offset ? `&offset=${offset}` : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        allRecords = allRecords.concat(data.records);
        offset = data.offset || '';
        console.log(`   📋 Found ${allRecords.length} existing records so far...`);
      } else {
        console.log('❌ Error fetching records');
        break;
      }
    } while (offset);

    console.log(`\n🗑️ Deleting ${allRecords.length} existing records...`);
    
    // Delete in batches of 10
    const deleteSize = 10;
    let deleted = 0;
    
    for (let i = 0; i < allRecords.length; i += deleteSize) {
      const batch = allRecords.slice(i, i + deleteSize);
      const recordIds = batch.map(record => record.id);
      
      try {
        const deleteUrl = `https://api.airtable.com/v0/${baseId}/Parent%20Helper?${recordIds.map(id => `records[]=${id}`).join('&')}`;
        const deleteResponse = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (deleteResponse.ok) {
          deleted += recordIds.length;
          if (deleted % 50 === 0) {
            console.log(`   ✅ Deleted ${deleted}/${allRecords.length} records`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Delete batch error: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Cleared ${deleted} existing records\n`);

    // Now get fresh authentic data from your database
    console.log('📊 Step 2: Getting authentic Parent Helper data...');
    
    const result = await client.query(`
      SELECT 
        name, description, category, town, postcode, address, venue,
        age_group_min, age_group_max, day_of_week, time, price,
        contact_phone, contact_email, website, is_featured, rating,
        direct_booking_available, online_payment_accepted,
        wheelchair_accessible, parking_available
      FROM classes 
      WHERE is_active = true 
      ORDER BY is_featured DESC, town, name
    `);

    console.log(`📈 Found ${result.rows.length} authentic businesses to sync`);

    // Create properly structured records
    const structuredRecords = result.rows.map(row => ({
      fields: {
        'Business_Name': row.name || '',
        'Category': row.category || 'Educational',
        'Town': row.town || '',
        'Postcode': row.postcode || '',
        'Venue_Name': row.venue || '',
        'Full_Address': row.address || '',
        'Day_of_Week': row.day_of_week || '',
        'Class_Time': row.time || '',
        'Age_Min_Months': parseInt(row.age_group_min) || 0,
        'Age_Max_Months': parseInt(row.age_group_max) || 12,
        'Price': row.price || 'Contact for pricing',
        'Contact_Phone': row.contact_phone || '',
        'Contact_Email': row.contact_email || '',
        'Website': row.website || '',
        'Description': row.description || '',
        'Featured': row.is_featured || false,
        'Rating': row.rating ? parseFloat(row.rating) : null,
        'Direct_Booking': row.direct_booking_available || false,
        'Online_Payment': row.online_payment_accepted || false,
        'Wheelchair_Access': row.wheelchair_accessible || false,
        'Parking_Available': row.parking_available || false
      }
    }));

    console.log('\n🚀 Step 3: Syncing to your new structured columns...');
    
    const batchSize = 10;
    let totalSynced = 0;
    let successCount = 0;
    
    for (let i = 0; i < structuredRecords.length; i += batchSize) {
      const batch = structuredRecords.slice(i, i + batchSize);
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
          successCount++;
          
          if (batchNumber % 20 === 0) {
            const progress = Math.round((totalSynced/structuredRecords.length)*100);
            console.log(`   ✅ Progress: ${totalSynced}/${structuredRecords.length} businesses synced (${progress}%)`);
          }
          
          // Show first successful record
          if (batchNumber === 1) {
            const sample = result.records[0].fields;
            console.log(`\n   📋 Sample structured record:`);
            console.log(`      Business: ${sample.Business_Name}`);
            console.log(`      Category: ${sample.Category}`);
            console.log(`      Location: ${sample.Venue_Name}, ${sample.Town}`);
            console.log(`      Schedule: ${sample.Day_of_Week} ${sample.Class_Time}`);
            console.log(`      Ages: ${sample.Age_Min_Months}-${sample.Age_Max_Months} months`);
            console.log(`      Price: ${sample.Price}`);
            console.log(`      Featured: ${sample.Featured ? 'Yes' : 'No'}\n`);
          }
        } else {
          const error = await response.text();
          console.log(`   ❌ Batch ${batchNumber} failed: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Batch ${batchNumber} error: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log(`\n🎉 COMPLETE RESYNC FINISHED!`);
    console.log(`📊 Successfully synced ${totalSynced} authentic Parent Helper businesses`);
    console.log(`✅ Your Airtable now has clean, structured data with:`);
    console.log(`   • Separate columns for each piece of information`);
    console.log(`   • Proper categories and scheduling data`);
    console.log(`   • Contact details and accessibility information`);
    console.log(`   • Featured status and pricing`);

    console.log(`\n💡 Go to your Airtable now - you should see your complete directory properly organized!`);
    console.log(`🔍 Try filtering by Featured=true or Category="Swimming" to see the structured data in action`);

  } catch (error) {
    console.error('❌ Clear and resync error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  clearAndResyncAirtable().catch(console.error);
}

module.exports = { clearAndResyncAirtable };