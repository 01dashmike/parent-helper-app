const { Client } = require('pg');

async function cleanupAndCompleteSync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🧹 CLEANUP AND COMPLETE SYNC SOLUTION');
    console.log('📊 Step 1: Remove duplicates, Step 2: Add missing authentic businesses\n');

    // Step 1: Find and remove duplicates from Airtable
    console.log('🔍 Step 1: Identifying duplicates in Airtable...');
    
    let allRecords = new Map(); // businessName -> [recordIds]
    let offset = '';
    
    do {
      const url = `https://api.airtable.com/v0/${baseId}/Parent%20Helper?pageSize=100${offset ? `&offset=${offset}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        data.records.forEach(record => {
          if (record.fields.Business_Name) {
            const name = record.fields.Business_Name.trim();
            if (!allRecords.has(name)) {
              allRecords.set(name, []);
            }
            allRecords.get(name).push(record.id);
          }
        });
        offset = data.offset || '';
      } else {
        break;
      }
    } while (offset);

    // Find duplicates to delete (keep first occurrence)
    let duplicatesToDelete = [];
    allRecords.forEach((recordIds, businessName) => {
      if (recordIds.length > 1) {
        // Keep first, delete the rest
        duplicatesToDelete.push(...recordIds.slice(1));
      }
    });

    console.log(`🗑️ Found ${duplicatesToDelete.length} duplicate records to remove`);

    // Delete duplicates in batches
    for (let i = 0; i < duplicatesToDelete.length; i += 10) {
      const batch = duplicatesToDelete.slice(i, i + 10);
      
      try {
        const deleteUrl = `https://api.airtable.com/v0/${baseId}/Parent%20Helper?${batch.map(id => `records[]=${id}`).join('&')}`;
        const deleteResponse = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (deleteResponse.ok) {
          console.log(`   ✅ Deleted ${batch.length} duplicates (${i + batch.length}/${duplicatesToDelete.length})`);
        }
      } catch (error) {
        console.log(`   ❌ Delete error: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`✅ Cleanup complete! Removed ${duplicatesToDelete.length} duplicates`);

    // Step 2: Get remaining unique businesses in Airtable after cleanup
    console.log('\n📊 Step 2: Getting clean list of businesses in Airtable...');
    
    let cleanBusinessNames = new Set();
    offset = '';
    
    do {
      const url = `https://api.airtable.com/v0/${baseId}/Parent%20Helper?pageSize=100&fields%5B%5D=Business_Name${offset ? `&offset=${offset}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        data.records.forEach(record => {
          if (record.fields.Business_Name) {
            cleanBusinessNames.add(record.fields.Business_Name.trim());
          }
        });
        offset = data.offset || '';
      } else {
        break;
      }
    } while (offset);

    console.log(`📋 Clean Airtable now has ${cleanBusinessNames.size} unique businesses`);

    // Step 3: Get missing businesses from database
    const allDbBusinesses = await client.query(`
      SELECT DISTINCT ON (name)
        name, description, category, town, postcode, address, venue,
        age_group_min, age_group_max, day_of_week, time, price,
        contact_phone, contact_email, website, is_featured, rating,
        direct_booking_available, online_payment_accepted,
        wheelchair_accessible, parking_available
      FROM classes 
      WHERE is_active = true 
      ORDER BY name, id ASC
    `);

    const missingBusinesses = allDbBusinesses.rows.filter(row => 
      !cleanBusinessNames.has(row.name.trim())
    );

    console.log(`🚀 Step 3: Need to add ${missingBusinesses.length} missing authentic businesses`);

    // Step 4: Add missing businesses efficiently
    let totalAdded = 0;
    const batchSize = 5;
    
    for (let i = 0; i < missingBusinesses.length; i += batchSize) {
      const batch = missingBusinesses.slice(i, i + batchSize);
      
      const records = batch.map(row => ({
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
          
          if (totalAdded % 100 === 0) {
            const progress = Math.round(((cleanBusinessNames.size + totalAdded) / 5236) * 100);
            console.log(`   ✅ Progress: ${cleanBusinessNames.size + totalAdded}/5236 authentic businesses (${progress}%)`);
          }
        } else if (response.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          i -= batchSize;
          continue;
        }
      } catch (error) {
        console.log(`   ❌ Add error: ${error.message.substring(0, 40)}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const finalTotal = cleanBusinessNames.size + totalAdded;
    console.log(`\n🎉 CLEANUP AND SYNC COMPLETE!`);
    console.log(`✅ Removed ${duplicatesToDelete.length} duplicate entries`);
    console.log(`✅ Added ${totalAdded} missing authentic businesses`);
    console.log(`📈 Total unique authentic businesses: ${finalTotal}/5236`);
    console.log(`🎯 Directory completion: ${Math.round((finalTotal/5236)*100)}%`);

    if (finalTotal >= 5200) {
      console.log(`\n🏆 SUCCESS! Your complete authentic Parent Helper directory is now organized in Airtable!`);
    } else {
      console.log(`\n📊 Excellent progress! Run this process again to complete the remaining businesses`);
    }

  } catch (error) {
    console.error('❌ Cleanup and sync error:', error.message);
  } finally {
    await client.end();
  }
}

cleanupAndCompleteSync().catch(console.error);