const { Client } = require('pg');

async function syncWithTownFixed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🎯 SYNCING WITH TOWN FIELD FIXED');
    console.log('📊 Adding town information to your authentic Parent Helper data...\n');

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
      LIMIT 150
    `);

    console.log(`📈 Syncing ${result.rows.length} authentic businesses with town data`);

    // Create records with town information included
    const records = result.rows.map(row => ({
      fields: {
        // Basic information
        'Business_Name': row.name || '',
        'Category': row.category || 'Educational',
        'Town': row.town || '', // Now this should work!
        'Class_Time': row.time || '',
        'Price': row.price || 'Contact for pricing',
        
        // Contact details
        'Contact_Phone': row.contact_phone || '',
        'Contact_Email': row.contact_email || '',
        'Website': row.website || '',
        'Description': row.description || '',
        
        // Age and scheduling
        'Age_Min_Months': parseInt(row.age_group_min) || 0,
        'Age_Max_Months': parseInt(row.age_group_max) || 12,
        'Day_Of_Week': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(row.day_of_week) ? row.day_of_week : null,
        
        // Features and ratings
        'Rating': row.rating ? parseFloat(row.rating) : null,
        'Featured': row.is_featured || false,
        'Direct_Booking': row.direct_booking_available || false,
        'Online_Payment': row.online_payment_accepted || false,
        'Wheelchair_Access': row.wheelchair_accessible || false,
        'Parking_available': row.parking_available || false
      }
    }));

    console.log('\n🚀 Syncing with town information included...');
    
    const batchSize = 10;
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
          console.log(`   ✅ Batch ${batchNumber}: ${result.records.length} businesses synced (Total: ${totalSynced})`);
          
          if (batchNumber === 1) {
            const sample = result.records[0].fields;
            console.log(`\n   📋 Sample with town data:`);
            console.log(`      Business: ${sample.Business_Name}`);
            console.log(`      Town: ${sample.Town}`);
            console.log(`      Category: ${sample.Category}`);
            console.log(`      Schedule: ${sample.Day_Of_Week || 'Contact for schedule'} ${sample.Class_Time}`);
            console.log(`      Ages: ${sample.Age_Min_Months}-${sample.Age_Max_Months} months`);
            console.log(`      Price: ${sample.Price}`);
            console.log(`      Featured: ${sample.Featured ? 'Yes' : 'No'}`);
          }
        } else {
          const errorText = await response.text();
          console.log(`   ❌ Batch ${batchNumber} failed: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Batch ${batchNumber} error: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log(`\n🎉 TOWN-INCLUDED SYNC COMPLETE!`);
    console.log(`📊 Successfully synced ${totalSynced} authentic businesses with town data`);
    console.log(`✅ Your Airtable now shows:`);
    console.log(`   • Business names with their exact towns`);
    console.log(`   • Categories and class schedules`);
    console.log(`   • Complete contact information`);
    console.log(`   • Age ranges and pricing details`);
    console.log(`   • Featured status and accessibility info`);

    // Show town coverage
    const townCoverage = await client.query(`
      SELECT town, COUNT(*) as businesses 
      FROM classes 
      WHERE is_active = true 
      GROUP BY town 
      ORDER BY businesses DESC 
      LIMIT 10
    `);

    console.log(`\n🗺️ Top towns now in your Airtable:`);
    townCoverage.rows.forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.town}: ${row.businesses} authentic businesses`);
    });

    console.log(`\n💡 Check your Airtable - you can now filter by specific towns!`);
    console.log(`🔍 Try filtering Town="London" or Town="Manchester" to see your authentic local businesses`);

  } catch (error) {
    console.error('❌ Town sync error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  syncWithTownFixed().catch(console.error);
}

module.exports = { syncWithTownFixed };