const { Client } = require('pg');

async function testSingleRecordSync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🔍 TESTING SINGLE RECORD TO CHECK COLUMN POPULATION');
    console.log('📊 Checking data formatting and field mapping...\n');

    // Get one sample record to test with
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
      AND town IS NOT NULL
      ORDER BY is_featured DESC
      LIMIT 1
    `);

    const row = result.rows[0];
    console.log('📋 Raw data from database:');
    console.log(`   Name: "${row.name}"`);
    console.log(`   Category: "${row.category}"`);
    console.log(`   Town: "${row.town}"`);
    console.log(`   Postcode: "${row.postcode}"`);
    console.log(`   Venue: "${row.venue}"`);
    console.log(`   Address: "${row.address}"`);
    console.log(`   Day: "${row.day_of_week}"`);
    console.log(`   Time: "${row.time}"`);
    console.log(`   Age Min: ${row.age_group_min}`);
    console.log(`   Age Max: ${row.age_group_max}`);
    console.log(`   Price: "${row.price}"`);
    console.log(`   Phone: "${row.contact_phone}"`);
    console.log(`   Email: "${row.contact_email}"`);
    console.log(`   Website: "${row.website}"`);
    console.log(`   Featured: ${row.is_featured}`);

    // Clean and format the data properly
    const cleanRecord = {
      fields: {
        'Business_Name': (row.name || '').trim(),
        'Category': (row.category || 'Educational').trim(),
        'Town': (row.town || '').trim(),
        'Postcode': (row.postcode || '').trim(),
        'Venue_Name': (row.venue || '').trim(),
        'Full_Address': (row.address || '').trim(),
        'Day_Of_Week': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(row.day_of_week) ? row.day_of_week : '',
        'Class_Time': (row.time || '').trim(),
        'Age_Min_Months': row.age_group_min ? parseInt(row.age_group_min) : 0,
        'Age_Max_Months': row.age_group_max ? parseInt(row.age_group_max) : 12,
        'Price': (row.price || 'Contact for pricing').trim(),
        'Contact_Phone': (row.contact_phone || '').trim(),
        'Contact_Email': (row.contact_email || '').trim(),
        'Website': (row.website || '').trim(),
        'Description': (row.description || '').trim(),
        'Featured': Boolean(row.is_featured),
        'Rating': row.rating ? parseFloat(row.rating) : null,
        'Direct_Booking': Boolean(row.direct_booking_available),
        'Online_Payment': Boolean(row.online_payment_accepted),
        'Wheelchair_Access': Boolean(row.wheelchair_accessible),
        'Parking_available': Boolean(row.parking_available)
      }
    };

    console.log('\n📤 Formatted record to send to Airtable:');
    Object.keys(cleanRecord.fields).forEach(key => {
      const value = cleanRecord.fields[key];
      console.log(`   ${key}: "${value}" (${typeof value})`);
    });

    // Test sync single record
    console.log('\n🚀 Testing sync to Airtable...');
    
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/Parent%20Helper`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [cleanRecord],
        typecast: true
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Successfully synced test record!');
      console.log('\n📋 What was actually saved in Airtable:');
      const savedFields = result.records[0].fields;
      Object.keys(savedFields).forEach(key => {
        console.log(`   ${key}: "${savedFields[key]}"`);
      });

      // Check if all fields populated
      const expectedFields = Object.keys(cleanRecord.fields);
      const actualFields = Object.keys(savedFields);
      const missingFields = expectedFields.filter(field => !actualFields.includes(field));
      
      if (missingFields.length > 0) {
        console.log('\n⚠️  Fields that didn\'t populate:');
        missingFields.forEach(field => console.log(`   • ${field}`));
      } else {
        console.log('\n✅ All fields populated successfully!');
      }
    } else {
      const error = await response.text();
      console.log(`❌ Sync failed: ${response.status}`);
      console.log(`Error details: ${error}`);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  testSingleRecordSync().catch(console.error);
}

module.exports = { testSingleRecordSync };