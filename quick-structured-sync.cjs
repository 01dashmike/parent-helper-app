const { Client } = require('pg');

async function quickStructuredSync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🚀 POPULATING YOUR STRUCTURED AIRTABLE COLUMNS');
    console.log('📊 Adding authentic Parent Helper businesses to new structure...\n');

    // Get a good sample of your authentic data
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
      LIMIT 200
    `);

    console.log(`📈 Adding ${result.rows.length} authentic businesses to your structured columns`);

    const structuredRecords = result.rows.map(row => ({
      fields: {
        'Business_Name': row.name,
        'Category': row.category || 'Educational',
        'Town': row.town,
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

    console.log('\n📋 Syncing to your new columns...');
    
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
          console.log(`   ✅ Batch ${batchNumber}: ${result.records.length} businesses added (Total: ${totalSynced})`);
          
          // Show first successful record structure
          if (batchNumber === 1) {
            const sample = result.records[0].fields;
            console.log(`\n   🎯 Your structured data looks like:`);
            console.log(`      Business: ${sample.Business_Name}`);
            console.log(`      Category: ${sample.Category}`);
            console.log(`      Venue: ${sample.Venue_Name}`);
            console.log(`      Town: ${sample.Town}`);
            console.log(`      Schedule: ${sample.Day_of_Week} ${sample.Class_Time}`);
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
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n🎉 STRUCTURED SYNC COMPLETE!`);
    console.log(`📊 Added ${totalSynced} authentic businesses to your organized columns`);
    console.log(`✅ Your Airtable now has proper structure with separate fields for:`);
    console.log(`   • Business names and categories`);
    console.log(`   • Venue details and addresses`);
    console.log(`   • Class schedules and times`);
    console.log(`   • Contact information`);
    console.log(`   • Age ranges and pricing`);
    console.log(`   • Accessibility features`);

    console.log(`\n💡 Check your Airtable now - each column contains specific data you can filter and sort!`);

  } catch (error) {
    console.error('❌ Quick sync error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  quickStructuredSync().catch(console.error);
}

module.exports = { quickStructuredSync };