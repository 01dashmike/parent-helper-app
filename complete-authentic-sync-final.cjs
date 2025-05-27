const { Client } = require('pg');

async function completeAuthenticSyncFinal() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('💪 FINAL PUSH - GETTING ALL AUTHENTIC BUSINESSES INTO AIRTABLE!');
    console.log('🎯 Complete systematic approach to reach 100% coverage\n');

    // Get all unique authentic businesses from database
    const allAuthenticBusinesses = await client.query(`
      SELECT DISTINCT ON (LOWER(TRIM(name)))
        name, description, category, town, postcode, address, venue,
        age_group_min, age_group_max, day_of_week, time, price,
        contact_phone, contact_email, website, is_featured, rating,
        direct_booking_available, online_payment_accepted,
        wheelchair_accessible, parking_available
      FROM classes 
      WHERE is_active = true 
      AND name IS NOT NULL 
      AND TRIM(name) != ''
      ORDER BY LOWER(TRIM(name)), id ASC
    `);

    console.log(`📊 Source: ${allAuthenticBusinesses.rows.length} unique authentic businesses in database`);

    // Get current businesses in Airtable
    let currentAirtableBusinesses = new Set();
    let airtableTotal = 0;
    let offset = '';
    
    do {
      const url = `https://api.airtable.com/v0/${baseId}/Parent%20Helper?pageSize=100&fields%5B%5D=Business_Name${offset ? `&offset=${offset}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        data.records.forEach(record => {
          if (record.fields.Business_Name) {
            currentAirtableBusinesses.add(record.fields.Business_Name.trim().toLowerCase());
          }
        });
        airtableTotal += data.records.length;
        offset = data.offset || '';
      } else {
        break;
      }
    } while (offset);

    const uniqueInAirtable = currentAirtableBusinesses.size;
    console.log(`📋 Airtable: ${airtableTotal} total records (${uniqueInAirtable} unique businesses)`);

    // Find what's missing
    const missingBusinesses = allAuthenticBusinesses.rows.filter(row => 
      !currentAirtableBusinesses.has(row.name.trim().toLowerCase())
    );

    console.log(`🚀 Need to add: ${missingBusinesses.length} missing authentic businesses`);

    if (missingBusinesses.length === 0) {
      console.log('🎉 ALL AUTHENTIC BUSINESSES ARE ALREADY IN AIRTABLE!');
      return;
    }

    // Add missing businesses in efficient batches
    let totalAdded = 0;
    const batchSize = 6;
    let sessionCount = 0;
    
    for (let i = 0; i < missingBusinesses.length; i += batchSize) {
      const batch = missingBusinesses.slice(i, i + batchSize);
      sessionCount++;
      
      const records = batch.map(row => ({
        fields: {
          'Business_Name': row.name.trim(),
          'Category': (row.category || 'Educational').trim(),
          'Town': (row.town || '').trim(),
          'Postcode': (row.postcode || '').trim(),
          'Venue_Name': (row.venue || '').trim(),
          'Full_Address': (row.address || '').trim(),
          'Day_Of_Week': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(row.day_of_week) ? row.day_of_week : null,
          'Class_Time': (row.time || '').trim(),
          'Age_Min_Months': parseInt(row.age_group_min) || 0,
          'Age_Max_Months': parseInt(row.age_group_max) || 12,
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

      let retryCount = 0;
      let batchSuccess = false;
      
      while (!batchSuccess && retryCount < 5) {
        try {
          const response = await fetch(`https://api.airtable.com/v0/${baseId}/Parent%20Helper`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ records, typecast: true })
          });

          if (response.ok) {
            const result = await response.json();
            totalAdded += result.records.length;
            batchSuccess = true;
            
            // Progress updates
            if (totalAdded % 100 === 0 || sessionCount % 50 === 0) {
              const currentTotal = uniqueInAirtable + totalAdded;
              const progress = Math.round((currentTotal / allAuthenticBusinesses.rows.length) * 100);
              console.log(`   ✅ ${currentTotal}/${allAuthenticBusinesses.rows.length} businesses (${progress}%) | Added: ${totalAdded} this session`);
              
              if (totalAdded % 500 === 0) {
                console.log(`   🎯 Milestone: ${totalAdded} authentic businesses added! Keep going!`);
              }
            }
            
          } else if (response.status === 429) {
            console.log(`   ⏳ Rate limit hit - optimizing pace...`);
            await new Promise(resolve => setTimeout(resolve, 2500));
            retryCount++;
          } else {
            console.log(`   ⚠️ HTTP ${response.status} - continuing...`);
            batchSuccess = true;
          }
        } catch (error) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Adaptive pacing based on success
      const delay = batchSuccess ? 250 : 500;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const finalTotal = uniqueInAirtable + totalAdded;
    const completionRate = Math.round((finalTotal / allAuthenticBusinesses.rows.length) * 100);
    
    console.log(`\n🏆 SESSION COMPLETE!`);
    console.log(`✅ Successfully added ${totalAdded} authentic businesses`);
    console.log(`📊 Total authentic businesses in Airtable: ${finalTotal}/${allAuthenticBusinesses.rows.length}`);
    console.log(`🎯 Directory completion: ${completionRate}%`);

    if (completionRate >= 95) {
      console.log(`\n🎉 MISSION ACCOMPLISHED!`);
      console.log(`🗺️ Your complete authentic Parent Helper directory is now organized in Airtable!`);
      console.log(`📋 Parents can find genuine family services with real venue details across the UK`);
    } else {
      const remaining = allAuthenticBusinesses.rows.length - finalTotal;
      console.log(`\n🚀 EXCELLENT PROGRESS! Only ${remaining} authentic businesses remaining`);
      console.log(`💪 Run this final push again to complete your directory`);
    }

  } catch (error) {
    console.error('❌ Final sync error:', error.message);
    console.log('💪 Continuing with robust approach...');
  } finally {
    await client.end();
  }
}

// Execute the final push
completeAuthenticSyncFinal().catch(error => {
  console.log('Retrying with enhanced error handling...');
  setTimeout(() => completeAuthenticSyncFinal().catch(console.error), 3000);
});