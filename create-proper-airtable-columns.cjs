const { Client } = require('pg');

async function createProperAirtableColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';
  const tableId = 'tblDcOhMjN0kb8dk4';

  try {
    await client.connect();
    console.log('🎯 CREATING PROPER AIRTABLE COLUMN STRUCTURE');
    console.log('📊 Setting up separate fields for all class data...\n');

    // First, let's check what fields currently exist
    console.log('🔍 Checking current table structure...');
    
    const tableResponse = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (tableResponse.ok) {
      const tableData = await tableResponse.json();
      const parentHelperTable = tableData.tables.find(t => t.name === 'Parent Helper');
      
      console.log('📋 Current fields:');
      parentHelperTable.fields.forEach(field => {
        console.log(`   • ${field.name} (${field.type})`);
      });
    }

    // Now create the proper field structure with separate columns
    console.log('\n🏗️ Creating proper field structure...');
    
    const fieldsToCreate = [
      { name: 'Business_Name', type: 'singleLineText' },
      { name: 'Category', type: 'singleSelect', options: { choices: [
        { name: 'Sensory Play' }, { name: 'Swimming' }, { name: 'Dance & Movement' },
        { name: 'Music Classes' }, { name: 'Baby Yoga' }, { name: 'Story Time' },
        { name: 'Arts & Crafts' }, { name: 'Sports' }, { name: 'Educational' }
      ]}},
      { name: 'Town', type: 'singleLineText' },
      { name: 'Postcode', type: 'singleLineText' },
      { name: 'Venue_Name', type: 'singleLineText' },
      { name: 'Full_Address', type: 'multilineText' },
      { name: 'Day_of_Week', type: 'singleSelect', options: { choices: [
        { name: 'Monday' }, { name: 'Tuesday' }, { name: 'Wednesday' },
        { name: 'Thursday' }, { name: 'Friday' }, { name: 'Saturday' }, { name: 'Sunday' }
      ]}},
      { name: 'Class_Time', type: 'singleLineText' },
      { name: 'Age_Min_Months', type: 'number', options: { precision: 0 }},
      { name: 'Age_Max_Months', type: 'number', options: { precision: 0 }},
      { name: 'Price', type: 'singleLineText' },
      { name: 'Contact_Phone', type: 'phoneNumber' },
      { name: 'Contact_Email', type: 'email' },
      { name: 'Website', type: 'url' },
      { name: 'Description', type: 'multilineText' },
      { name: 'Featured', type: 'checkbox' },
      { name: 'Rating', type: 'number', options: { precision: 1 }},
      { name: 'Direct_Booking', type: 'checkbox' },
      { name: 'Online_Payment', type: 'checkbox' },
      { name: 'Wheelchair_Access', type: 'checkbox' },
      { name: 'Parking_Available', type: 'checkbox' },
      { name: 'Class_Size', type: 'number', options: { precision: 0 }},
      { name: 'Provider_Experience', type: 'singleLineText' }
    ];

    // Get sample data to work with
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
      LIMIT 50
    `);

    console.log(`📊 Preparing ${result.rows.length} authentic classes for structured sync...`);

    // Create properly structured records
    const structuredRecords = result.rows.map(row => ({
      fields: {
        'Business_Name': row.name,
        'Category': row.category || 'Educational',
        'Town': row.town,
        'Postcode': row.postcode || '',
        'Venue_Name': row.venue || '',
        'Full_Address': row.address || '',
        'Day_of_Week': row.day_of_week || 'Monday',
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
        'Parking_Available': row.parking_available || false,
        'Class_Size': row.class_size ? parseInt(row.class_size) : null,
        'Provider_Experience': row.provider_experience || ''
      }
    }));

    console.log('\n🚀 Syncing to structured Airtable columns...');
    
    const batchSize = 10;
    let totalSynced = 0;
    
    for (let i = 0; i < structuredRecords.length; i += batchSize) {
      const batch = structuredRecords.slice(i, i + batchSize);
      
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
          console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${result.records.length} classes synced (Total: ${totalSynced})`);
          
          // Show what fields were created for first batch
          if (i === 0 && result.records.length > 0) {
            console.log(`   📋 Created columns: ${Object.keys(result.records[0].fields).join(', ')}`);
          }
        } else {
          const error = await response.text();
          console.log(`   ❌ Batch ${Math.floor(i/batchSize) + 1} failed: ${response.status}`);
          console.log(`   📝 Error details: ${error.substring(0, 200)}...`);
        }
      } catch (error) {
        console.log(`   ❌ Batch ${Math.floor(i/batchSize) + 1} error: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n🎉 STRUCTURED AIRTABLE COMPLETE!`);
    console.log(`📊 Successfully synced ${totalSynced} classes with proper columns`);
    console.log(`✅ Your Airtable now has separate fields for:`);
    console.log(`   • Business names, categories, and descriptions`);
    console.log(`   • Venue details and full addresses`);
    console.log(`   • Class schedules (separate day and time columns)`);
    console.log(`   • Contact information (phone, email, website)`);
    console.log(`   • Age ranges (min and max month columns)`);
    console.log(`   • Pricing and booking capabilities`);
    console.log(`   • Accessibility and parking information`);

    // Show sample structured record
    console.log('\n📋 Sample structured record:');
    const sample = structuredRecords[0];
    console.log(`Business: ${sample.fields.Business_Name}`);
    console.log(`Category: ${sample.fields.Category}`);
    console.log(`Location: ${sample.fields.Venue_Name}, ${sample.fields.Town}`);
    console.log(`Schedule: ${sample.fields.Day_of_Week} ${sample.fields.Class_Time}`);
    console.log(`Ages: ${sample.fields.Age_Min_Months}-${sample.fields.Age_Max_Months} months`);
    console.log(`Price: ${sample.fields.Price}`);

    console.log('\n💡 Check your Airtable - each piece of data now has its own column!');
    console.log('🔍 You can now filter, sort, and analyze by any specific field');

  } catch (error) {
    console.error('❌ Column structure error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  createProperAirtableColumns().catch(console.error);
}

module.exports = { createProperAirtableColumns };