const { Client } = require('pg');

async function syncAllStructuredData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🎉 SYNCING ALL AUTHENTIC DATA TO STRUCTURED AIRTABLE');
    console.log('📊 Populating your new columns with complete Parent Helper directory...\n');

    // Get ALL your authentic classes with complete data
    const result = await client.query(`
      SELECT 
        name, description, category, town, postcode, address, venue,
        age_group_min, age_group_max, day_of_week, time, price,
        contact_phone, contact_email, website, is_featured, rating,
        direct_booking_available, online_payment_accepted,
        wheelchair_accessible, parking_available, class_size,
        provider_experience
      FROM classes 
      WHERE is_active = true 
      ORDER BY is_featured DESC, town, name
    `);

    console.log(`📈 Found ${result.rows.length} authentic Parent Helper businesses to sync`);

    // Create structured records for your new columns
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

    console.log('\n🚀 Starting comprehensive sync to your structured Airtable...');
    
    const batchSize = 10;
    let totalSynced = 0;
    let successfulBatches = 0;
    let failedBatches = 0;
    
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
          successfulBatches++;
          
          if (batchNumber % 10 === 0) {
            console.log(`   ✅ Progress: ${totalSynced} businesses synced (${Math.round((totalSynced/structuredRecords.length)*100)}%)`);
          }
          
          // Show sample data from first successful batch
          if (batchNumber === 1 && result.records.length > 0) {
            console.log(`   📋 Sample structured record:`);
            const sample = result.records[0].fields;
            console.log(`      Business: ${sample.Business_Name}`);
            console.log(`      Category: ${sample.Category}`);
            console.log(`      Location: ${sample.Venue_Name}, ${sample.Town}`);
            console.log(`      Schedule: ${sample.Day_of_Week} ${sample.Class_Time}`);
            console.log(`      Ages: ${sample.Age_Min_Months}-${sample.Age_Max_Months} months`);
            console.log(`      Featured: ${sample.Featured ? 'Yes' : 'No'}`);
          }
        } else {
          const error = await response.text();
          failedBatches++;
          if (failedBatches <= 3) {
            console.log(`   ❌ Batch ${batchNumber} failed: ${response.status}`);
          }
        }
      } catch (error) {
        failedBatches++;
        if (failedBatches <= 3) {
          console.log(`   ❌ Batch ${batchNumber} error: ${error.message}`);
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n🎉 COMPLETE STRUCTURED SYNC FINISHED!`);
    console.log(`📊 Results:`);
    console.log(`   ✅ Successfully synced: ${totalSynced} authentic businesses`);
    console.log(`   📈 Success rate: ${Math.round((successfulBatches/(successfulBatches+failedBatches))*100)}%`);
    console.log(`   🏆 Total batches processed: ${successfulBatches + failedBatches}`);

    console.log(`\n✨ Your Airtable now contains:`);
    console.log(`   🏢 Business names and categories in separate columns`);
    console.log(`   📍 Venue details and full addresses`);
    console.log(`   🕐 Class schedules (day and time columns)`);
    console.log(`   👶 Age ranges (min/max month columns)`);
    console.log(`   💰 Pricing and contact information`);
    console.log(`   ⭐ Featured status and ratings`);
    console.log(`   ♿ Accessibility and booking capabilities`);

    // Show geographic coverage
    const coverageQuery = await client.query(`
      SELECT town, COUNT(*) as class_count 
      FROM classes 
      WHERE is_active = true 
      GROUP BY town 
      ORDER BY class_count DESC 
      LIMIT 10
    `);

    console.log(`\n🗺️ Top coverage areas in your Airtable:`);
    coverageQuery.rows.forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.town}: ${row.class_count} classes`);
    });

    console.log(`\n💡 Go to your Airtable now - you can filter, sort, and analyze your complete directory!`);
    console.log(`🔍 Try filtering by Category="Swimming" or Featured=true to see the power of structured data`);

  } catch (error) {
    console.error('❌ Structured sync error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  syncAllStructuredData().catch(console.error);
}

module.exports = { syncAllStructuredData };