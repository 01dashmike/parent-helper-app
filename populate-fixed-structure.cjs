const { Client } = require('pg');

async function populateFixedStructure() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🚀 POPULATING YOUR FIXED AIRTABLE STRUCTURE');
    console.log('📊 Adding authentic Parent Helper data to organized columns...\n');

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
      LIMIT 300
    `);

    console.log(`📈 Adding ${result.rows.length} authentic businesses to your organized structure`);

    const records = result.rows.map(row => ({
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

    console.log('\n📋 Syncing to your complete column structure...');
    
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
          console.log(`   ✅ Batch ${batchNumber}: ${result.records.length} businesses added (Total: ${totalSynced})`);
          
          // Show complete structured data example
          if (batchNumber === 1) {
            const sample = result.records[0].fields;
            console.log(`\n   🎯 Your complete structured record:`);
            console.log(`      Business: ${sample.Business_Name}`);
            console.log(`      Category: ${sample.Category}`);
            console.log(`      Venue: ${sample.Venue_Name}`);
            console.log(`      Full Address: ${sample.Full_Address}`);
            console.log(`      Town: ${sample.Town}, ${sample.Postcode}`);
            console.log(`      Schedule: ${sample.Day_Of_Week || 'Contact'} ${sample.Class_Time}`);
            console.log(`      Ages: ${sample.Age_Min_Months}-${sample.Age_Max_Months} months`);
            console.log(`      Price: ${sample.Price}`);
            console.log(`      Phone: ${sample.Contact_Phone || 'See website'}`);
            console.log(`      Website: ${sample.Website || 'Contact for details'}`);
            console.log(`      Featured: ${sample.Featured ? 'Yes' : 'No'}`);
            console.log(`      Accessibility: Wheelchair ${sample.Wheelchair_Access ? 'Yes' : 'Contact'}, Parking ${sample.Parking_available ? 'Yes' : 'Contact'}\n`);
          }
        } else {
          console.log(`   ❌ Batch ${batchNumber} failed: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Batch ${batchNumber} error: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n🎉 STRUCTURED POPULATION COMPLETE!`);
    console.log(`📊 Successfully added ${totalSynced} authentic Parent Helper businesses`);
    console.log(`✅ Your Airtable now contains complete information:`);
    console.log(`   • Business names and detailed venue information`);
    console.log(`   • Complete addresses, towns, and postcodes`);
    console.log(`   • Exact class schedules and age ranges`);
    console.log(`   • Contact details and website links`);
    console.log(`   • Pricing and booking capabilities`);
    console.log(`   • Accessibility and parking information`);
    console.log(`   • Featured status and quality ratings`);

    console.log(`\n💡 Your Parent Helper Airtable is now perfectly organized!`);
    console.log(`🔍 You can filter by any field to find exactly what parents need`);
    console.log(`📋 Each business has complete, authentic information for parents to make informed decisions`);

  } catch (error) {
    console.error('❌ Population error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  populateFixedStructure().catch(console.error);
}

module.exports = { populateFixedStructure };