const { Client } = require('pg');

async function alphabeticalSortedSync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🔤 SYNCING PARENT HELPER BUSINESSES IN ALPHABETICAL ORDER');
    console.log('📊 Organizing your authentic directory for easy company lookup...\n');

    // Get ALL businesses sorted alphabetically by name
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
      ORDER BY name ASC
    `);

    console.log(`📈 Syncing ${result.rows.length} authentic businesses in alphabetical order`);
    console.log(`🎯 From "${result.rows[0].name}" to "${result.rows[result.rows.length-1].name}"`);

    // Show some examples of the alphabetical ordering
    console.log('\n📋 Sample alphabetical ordering:');
    result.rows.slice(0, 10).forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.name} (${row.town})`);
    });

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

    console.log('\n🚀 Syncing alphabetically organized businesses...');
    
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
          
          if (batchNumber % 50 === 0) {
            const progress = Math.round((totalSynced/records.length)*100);
            console.log(`   ✅ Progress: ${totalSynced}/${records.length} businesses synced (${progress}%)`);
            
            // Show what letters we're currently syncing
            const currentBatch = batch[0].fields.Business_Name;
            const currentLetter = currentBatch.charAt(0).toUpperCase();
            console.log(`   📝 Currently syncing businesses starting with "${currentLetter}"`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Batch ${batchNumber} error: ${error.message.substring(0, 50)}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n🎉 ALPHABETICAL SYNC COMPLETE!`);
    console.log(`📊 Successfully synced ${totalSynced} businesses in alphabetical order`);
    console.log(`✅ Your Airtable is now organized for easy company lookup!`);

    // Show letter distribution
    const letterStats = await client.query(`
      SELECT 
        UPPER(LEFT(name, 1)) as letter,
        COUNT(*) as count
      FROM classes 
      WHERE is_active = true 
      AND name IS NOT NULL
      GROUP BY UPPER(LEFT(name, 1))
      ORDER BY letter
    `);

    console.log(`\n🔤 Alphabetical distribution in your directory:`);
    letterStats.rows.forEach(row => {
      console.log(`   ${row.letter}: ${row.count} businesses`);
    });

    console.log(`\n💡 Finding companies is now easy!`);
    console.log(`🔍 Your businesses are organized A-Z - just scroll to find any company quickly`);
    console.log(`📋 You can also use Airtable's search or filter features for instant lookup`);

  } catch (error) {
    console.error('❌ Alphabetical sync error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  alphabeticalSortedSync().catch(console.error);
}

module.exports = { alphabeticalSortedSync };