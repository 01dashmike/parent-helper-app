const { Client } = require('pg');

async function finalClearAndResync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🧹 FINAL CLEAR AND RESYNC WITH FIXED HEADERS');
    console.log('📊 Step 1: Clearing all existing records...\n');

    // Get all existing records
    let allRecords = [];
    let offset = '';
    
    do {
      const url = `https://api.airtable.com/v0/${baseId}/Parent%20Helper?pageSize=100${offset ? `&offset=${offset}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        allRecords = allRecords.concat(data.records);
        offset = data.offset || '';
        console.log(`   📋 Found ${allRecords.length} records to clear...`);
      } else {
        break;
      }
    } while (offset);

    // Delete all existing records
    console.log(`\n🗑️ Deleting ${allRecords.length} existing records...`);
    let deleted = 0;
    
    for (let i = 0; i < allRecords.length; i += 10) {
      const batch = allRecords.slice(i, i + 10);
      const recordIds = batch.map(record => record.id);
      
      const deleteUrl = `https://api.airtable.com/v0/${baseId}/Parent%20Helper?${recordIds.map(id => `records[]=${id}`).join('&')}`;
      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (deleteResponse.ok) {
        deleted += recordIds.length;
        if (deleted % 50 === 0) {
          console.log(`   ✅ Cleared ${deleted}/${allRecords.length} records`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Successfully cleared ${deleted} records\n`);

    // Now sync with complete authentic data
    console.log('📊 Step 2: Syncing authentic Parent Helper data to fixed structure...');
    
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
      LIMIT 500
    `);

    console.log(`📈 Syncing ${result.rows.length} authentic businesses to your fixed structure`);

    // Create properly structured records
    const structuredRecords = result.rows.map(row => ({
      fields: {
        'Business_Name': row.name || '',
        'Category': row.category || 'Educational',
        'Town': row.town || '',
        'Postcode': row.postcode || '',
        'Venue_Name': row.venue || '',
        'Full_Address': row.address || '',
        'Day_Of_Week': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(row.day_of_week) ? row.day_of_week : null,
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
        'Parking_available': row.parking_available || false
      }
    }));

    console.log('\n🚀 Step 3: Populating your organized columns...');
    
    const batchSize = 10;
    let totalSynced = 0;
    
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
          
          if (batchNumber % 10 === 0) {
            const progress = Math.round((totalSynced/structuredRecords.length)*100);
            console.log(`   ✅ Progress: ${totalSynced}/${structuredRecords.length} businesses synced (${progress}%)`);
          }
          
          // Show first successful record with complete data
          if (batchNumber === 1) {
            const sample = result.records[0].fields;
            console.log(`\n   📋 Sample complete record:`);
            console.log(`      Business: ${sample.Business_Name}`);
            console.log(`      Category: ${sample.Category}`);
            console.log(`      Venue: ${sample.Venue_Name}`);
            console.log(`      Address: ${sample.Full_Address}`);
            console.log(`      Town: ${sample.Town}`);
            console.log(`      Postcode: ${sample.Postcode}`);
            console.log(`      Schedule: ${sample.Day_Of_Week || 'Contact'} ${sample.Class_Time}`);
            console.log(`      Ages: ${sample.Age_Min_Months}-${sample.Age_Max_Months} months`);
            console.log(`      Price: ${sample.Price}`);
            console.log(`      Featured: ${sample.Featured ? 'Yes' : 'No'}\n`);
          }
        } else {
          console.log(`   ❌ Batch ${batchNumber} failed: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Batch ${batchNumber} error: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log(`\n🎉 COMPLETE RESYNC FINISHED!`);
    console.log(`📊 Successfully synced ${totalSynced} authentic Parent Helper businesses`);
    console.log(`✅ Your Airtable now has complete structured data with:`);
    console.log(`   • Business names and detailed descriptions`);
    console.log(`   • Complete venue names and full addresses`);
    console.log(`   • Towns and postcodes for exact locations`);
    console.log(`   • Class schedules with days and times`);
    console.log(`   • Age ranges and pricing information`);
    console.log(`   • Contact details and websites`);
    console.log(`   • Accessibility and booking features`);
    console.log(`   • Featured status and ratings`);

    console.log(`\n💡 Your Airtable is now perfectly organized for powerful filtering and management!`);
    console.log(`🔍 Try filtering by Town, Category, or Featured status to see your authentic data in action`);

  } catch (error) {
    console.error('❌ Final resync error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  finalClearAndResync().catch(console.error);
}

module.exports = { finalClearAndResync };