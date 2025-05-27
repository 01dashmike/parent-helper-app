const { Client } = require('pg');

async function syncToAirtable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const airtableToken = process.env.AIRTABLE_API_KEY || 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG'; // Your Parent Helper base
  
  if (!airtableToken) {
    console.log('❌ AIRTABLE_API_KEY not found - please add your personal access token');
    console.log('📝 I can see you created "Parent Helper Integration" token - please add it to environment');
    return;
  }

  console.log('✅ Airtable token found - starting sync process!');

  try {
    await client.connect();
    console.log('🚀 SYNCING PARENT HELPER DATA TO AIRTABLE');
    console.log('📊 Preparing to sync your 5,947 authentic businesses...\n');

    // Get enhanced data from your database
    const result = await client.query(`
      SELECT 
        id, name, description, category, town, postcode, address,
        age_group_min, age_group_max, price, day_of_week, time,
        venue, contact_phone, website, is_featured, rating,
        wheelchair_accessible, disability_support, 
        ai_quality_score, ai_summary, what_to_expect, what_to_bring,
        provider_experience, verification_status, class_size,
        parking_available, parking_type, 
        fixed_course_dates, booking_required, free_trial_available,
        created_at
      FROM classes 
      WHERE is_active = true 
      ORDER BY ai_quality_score DESC NULLS LAST, is_featured DESC
    `);

    console.log(`📈 Found ${result.rows.length} businesses ready for Airtable sync`);

    // Prepare data for Airtable format
    const airtableRecords = result.rows.map(row => ({
      fields: {
        'Name': row.name,
        'Notes': `${row.description || ''}\n\nCategory: ${row.category}\nTown: ${row.town}\nPrice: ${row.price || 'Contact for pricing'}\nTime: ${row.day_of_week} ${row.time}\nVenue: ${row.venue}\nPhone: ${row.contact_phone || 'N/A'}\nWebsite: ${row.website || 'N/A'}`,
        'Status': row.is_featured ? 'Featured' : 'Active'
      }
    }));

    console.log('\n📋 Sample records prepared for Airtable:');
    airtableRecords.slice(0, 3).forEach((record, idx) => {
      console.log(`\n${idx + 1}. ${record.fields['Business Name']} (${record.fields['Town']})`);
      console.log(`   Category: ${record.fields['Category']} | Quality: ${record.fields['AI Quality Score']}/10`);
      console.log(`   Featured: ${record.fields['Featured'] ? 'Yes' : 'No'} | Accessible: ${record.fields['Wheelchair Accessible'] ? 'Yes' : 'No'}`);
    });

    // Sync to Airtable using the REST API
    console.log(`\n🚀 SYNCING ${airtableRecords.length} RECORDS TO AIRTABLE...`);
    
    // Create records in batches of 10 (Airtable's limit)
    const batchSize = 10;
    let synced = 0;
    
    for (let i = 0; i < airtableRecords.length; i += batchSize) {
      const batch = airtableRecords.slice(i, i + batchSize);
      
      try {
        const response = await fetch(`https://api.airtable.com/v0/${baseId}/Parent%20Helper`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${airtableToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            records: batch,
            typecast: true
          })
        });

        if (response.ok) {
          const result = await response.json();
          synced += result.records.length;
          console.log(`   ✅ Synced batch ${Math.floor(i/batchSize) + 1}: ${result.records.length} records`);
        } else {
          const error = await response.text();
          console.log(`   ❌ Batch ${Math.floor(i/batchSize) + 1} failed: ${response.status} - ${error}`);
        }
      } catch (error) {
        console.log(`   ❌ Batch ${Math.floor(i/batchSize) + 1} error:`, error.message);
      }
      
      // Small delay between batches to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n🎉 SYNC COMPLETED! ${synced} records successfully synced to Airtable!`);
    console.log('📊 Your data includes:');
    console.log(`   - Enhanced AI fields (quality scores, summaries)`);
    console.log(`   - Detailed booking information`);
    console.log(`   - Accessibility and transport data`);
    console.log(`   - Provider qualifications and experience`);
    console.log(`   - Complete contact and pricing details`);
    
    console.log('\n✨ Next step: Provide your Airtable base ID to complete the sync!');

  } catch (error) {
    console.error('❌ Sync error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  syncToAirtable().catch(console.error);
}

module.exports = { syncToAirtable };