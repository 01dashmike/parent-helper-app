const { Client } = require('pg');

async function syncFeaturedBusinessesFirst() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('⭐ STEP 1: SYNCING FEATURED BUSINESSES FIRST');
    console.log('🎯 Prioritizing your premium authentic businesses...\n');

    // Get featured businesses that haven't been synced yet
    const featuredResult = await client.query(`
      SELECT 
        name, description, category, town, postcode, address, venue,
        age_group_min, age_group_max, day_of_week, time, price,
        contact_phone, contact_email, website, is_featured, rating,
        direct_booking_available, online_payment_accepted,
        wheelchair_accessible, parking_available
      FROM classes 
      WHERE is_active = true 
      AND is_featured = true
      AND name > 'Southend Leisure & Tennis Centre'
      ORDER BY name ASC
    `);

    console.log(`🌟 Found ${featuredResult.rows.length} featured businesses to prioritize`);

    if (featuredResult.rows.length > 0) {
      const records = featuredResult.rows.map(row => ({
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
          'Featured': true,
          'Rating': row.rating ? parseFloat(row.rating) : null,
          'Direct_Booking': Boolean(row.direct_booking_available),
          'Online_Payment': Boolean(row.online_payment_accepted),
          'Wheelchair_Access': Boolean(row.wheelchair_accessible),
          'Parking_available': Boolean(row.parking_available)
        }
      }));

      console.log('🚀 Syncing featured businesses with optimized batching...');
      
      const batchSize = 3; // Very small batches for featured businesses
      let featuredSynced = 0;
      
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
            featuredSynced += result.records.length;
            console.log(`   ⭐ Featured: ${featuredSynced}/${records.length} premium businesses synced`);
          } else if (response.status === 429) {
            console.log(`   ⏳ Rate limit - waiting...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            i -= batchSize;
            continue;
          }
        } catch (error) {
          console.log(`   ❌ Featured batch error: ${error.message.substring(0, 30)}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      console.log(`✅ Featured businesses complete: ${featuredSynced} premium businesses added`);
    }

    console.log('\n📊 STEP 1 RESULTS:');
    console.log(`⭐ Featured businesses prioritized and synced`);
    console.log(`🎯 Your premium authentic businesses are now easily accessible in Airtable`);

  } catch (error) {
    console.error('❌ Featured sync error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  syncFeaturedBusinessesFirst().catch(console.error);
}

module.exports = { syncFeaturedBusinessesFirst };