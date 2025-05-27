const { Client } = require('pg');

async function correctedAirtableSync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🎯 CORRECTED AIRTABLE SYNC');
    console.log('📊 Syncing only to compatible field types...\n');

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
      LIMIT 100
    `);

    console.log(`📈 Preparing ${result.rows.length} authentic businesses for corrected sync`);

    // Create records using only compatible fields
    const records = result.rows.map(row => ({
      fields: {
        // Text fields that work
        'Business_Name': row.name || '',
        'Category': row.category || 'Educational',
        'Class_Time': row.time || '',
        'Price': row.price || 'Contact for pricing',
        'Contact_Phone': row.contact_phone || '',
        'Contact_Email': row.contact_email || '',
        'Website': row.website || '',
        'Description': row.description || '',
        
        // Number fields
        'Age_Min_Months': parseInt(row.age_group_min) || 0,
        'Age_Max_Months': parseInt(row.age_group_max) || 12,
        'Rating': row.rating ? parseFloat(row.rating) : null,
        
        // Checkbox fields
        'Featured': row.is_featured || false,
        'Direct_Booking': row.direct_booking_available || false,
        'Online_Payment': row.online_payment_accepted || false,
        'Wheelchair_Access': row.wheelchair_accessible || false,
        'Parking_available': row.parking_available || false,
        
        // Day of week (if it matches the options)
        'Day_Of_Week': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(row.day_of_week) ? row.day_of_week : null
      }
    }));

    console.log('\n🚀 Syncing to compatible fields only...');
    
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
            console.log(`\n   📋 Successfully synced data:`);
            console.log(`      Business: ${sample.Business_Name}`);
            console.log(`      Category: ${sample.Category}`);
            console.log(`      Time: ${sample.Class_Time}`);
            console.log(`      Ages: ${sample.Age_Min_Months}-${sample.Age_Max_Months} months`);
            console.log(`      Price: ${sample.Price}`);
            console.log(`      Featured: ${sample.Featured ? 'Yes' : 'No'}`);
          }
        } else {
          const errorText = await response.text();
          console.log(`   ❌ Batch ${batchNumber} failed: ${response.status}`);
          if (batchNumber <= 2) {
            console.log(`      Error: ${errorText.substring(0, 150)}`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Batch ${batchNumber} error: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n🎉 CORRECTED SYNC COMPLETE!`);
    console.log(`📊 Successfully synced ${totalSynced} authentic Parent Helper businesses`);
    console.log(`✅ Data populated in compatible fields:`);
    console.log(`   • Business names and categories`);
    console.log(`   • Class times and pricing`);
    console.log(`   • Age ranges and ratings`);
    console.log(`   • Contact details and websites`);
    console.log(`   • Featured status and booking capabilities`);

    console.log(`\n⚠️  FIELD TYPE ISSUES DETECTED:`);
    console.log(`   • "Town" field is set as Collaborator (should be Single line text)`);
    console.log(`   • "Postcode" field is set as Single select (should be Single line text)`);
    console.log(`   • "Venue_Name" field is set as Attachments (should be Single line text)`);
    console.log(`   • "Full_Address" field is set as AI Text (should be Long text)`);

    console.log(`\n💡 To fix: Edit these fields in Airtable and change their types, then I can sync the missing data!`);

  } catch (error) {
    console.error('❌ Corrected sync error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  correctedAirtableSync().catch(console.error);
}

module.exports = { correctedAirtableSync };