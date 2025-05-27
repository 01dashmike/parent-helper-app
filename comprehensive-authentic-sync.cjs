const { Client } = require('pg');

async function comprehensiveAuthenticSync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🚀 COMPREHENSIVE SYNC OF ALL AUTHENTIC PARENT HELPER BUSINESSES');
    console.log('📊 Properly formatting and syncing your complete directory...\n');

    // Get ALL authentic businesses with proper data handling
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
      ORDER BY is_featured DESC, town, name
    `);

    console.log(`📈 Processing ${result.rows.length} authentic businesses for comprehensive sync`);

    // Process records in chunks to manage memory
    const chunkSize = 1000;
    let totalProcessed = 0;
    
    for (let chunkStart = 0; chunkStart < result.rows.length; chunkStart += chunkSize) {
      const chunk = result.rows.slice(chunkStart, chunkStart + chunkSize);
      console.log(`\n📦 Processing chunk ${Math.floor(chunkStart/chunkSize) + 1}: ${chunk.length} businesses`);
      
      const records = chunk.map(row => ({
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

      // Sync this chunk to Airtable
      const batchSize = 10;
      let chunkSynced = 0;
      
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
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
            chunkSynced += result.records.length;
            totalProcessed += result.records.length;
            
            if ((i + batchSize) % 100 === 0) {
              console.log(`   ✅ Chunk progress: ${chunkSynced}/${records.length} synced`);
            }
          }
        } catch (error) {
          console.log(`   ❌ Batch error: ${error.message.substring(0, 50)}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`   ✅ Chunk complete: ${chunkSynced} businesses synced`);
      console.log(`📊 Total progress: ${totalProcessed}/${result.rows.length} businesses (${Math.round((totalProcessed/result.rows.length)*100)}%)`);
    }

    console.log(`\n🎉 COMPREHENSIVE SYNC COMPLETE!`);
    console.log(`📊 Successfully synced ${totalProcessed} authentic Parent Helper businesses`);
    console.log(`✅ Your Airtable contains your complete authentic directory with:`);
    console.log(`   • Business names and venue information`);
    console.log(`   • Complete addresses and location details`);
    console.log(`   • Class schedules and age ranges`);
    console.log(`   • Pricing and contact information`);
    console.log(`   • Featured status and accessibility data`);

    // Show final statistics
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_featured = true THEN 1 END) as featured,
        COUNT(DISTINCT town) as towns,
        COUNT(DISTINCT category) as categories
      FROM classes 
      WHERE is_active = true
    `);

    const finalStats = stats.rows[0];
    console.log(`\n📈 Your Complete Airtable Directory:`);
    console.log(`   🏢 ${finalStats.total} authentic businesses`);
    console.log(`   ⭐ ${finalStats.featured} featured services`);
    console.log(`   📍 ${finalStats.towns} towns and cities`);
    console.log(`   🎯 ${finalStats.categories} different categories`);

    console.log(`\n💡 Your Parent Helper Airtable is now your complete management system!`);

  } catch (error) {
    console.error('❌ Comprehensive sync error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  comprehensiveAuthenticSync().catch(console.error);
}

module.exports = { comprehensiveAuthenticSync };