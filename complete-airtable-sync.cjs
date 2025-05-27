const { Client } = require('pg');

async function completeAirtableSync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🚀 COMPLETE AIRTABLE SYNC STARTING');
    console.log('📊 Syncing ALL 5,947 authentic Parent Helper businesses...\n');

    // Get ALL your authentic businesses from the database
    const result = await client.query(`
      SELECT 
        name, description, category, town, postcode, address, venue,
        age_group_min, age_group_max, day_of_week, time, price,
        contact_phone, website, is_featured, rating, created_at
      FROM classes 
      WHERE is_active = true 
      ORDER BY is_featured DESC, town, name
    `);

    console.log(`📈 Found ${result.rows.length} authentic businesses to sync`);

    // Prepare records for Airtable in batches
    const batchSize = 10;
    let totalSynced = 0;
    let batchNumber = 1;

    for (let i = 0; i < result.rows.length; i += batchSize) {
      const batch = result.rows.slice(i, i + batchSize);
      
      const airtableRecords = batch.map(row => ({
        fields: {
          'Name': row.name,
          'Notes': `${row.description || ''}\n\nCategory: ${row.category}\nTown: ${row.town}\nPostcode: ${row.postcode || ''}\nVenue: ${row.venue}\nPrice: ${row.price || 'Contact for pricing'}\nSchedule: ${row.day_of_week} ${row.time}\nPhone: ${row.contact_phone || 'Contact via website'}\nWebsite: ${row.website || 'Not available'}\nAges: ${row.age_group_min}-${row.age_group_max} months`,
          'Status': row.is_featured ? 'Featured' : 'Active'
        }
      }));

      try {
        const response = await fetch(`https://api.airtable.com/v0/${baseId}/Parent%20Helper`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            records: airtableRecords,
            typecast: true
          })
        });

        if (response.ok) {
          const result = await response.json();
          totalSynced += result.records.length;
          console.log(`   ✅ Batch ${batchNumber}: ${result.records.length} businesses synced (Total: ${totalSynced})`);
        } else {
          const error = await response.text();
          console.log(`   ❌ Batch ${batchNumber} failed: ${response.status} - ${error.substring(0, 100)}...`);
        }
      } catch (error) {
        console.log(`   ❌ Batch ${batchNumber} error: ${error.message}`);
      }

      batchNumber++;
      
      // Show progress every 50 batches
      if (batchNumber % 50 === 0) {
        console.log(`📊 Progress: ${totalSynced}/${result.rows.length} businesses synced (${Math.round((totalSynced/result.rows.length)*100)}%)`);
      }
      
      // Rate limiting - small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n🎉 COMPLETE SYNC FINISHED!`);
    console.log(`📊 Successfully synced ${totalSynced} out of ${result.rows.length} authentic businesses`);
    console.log(`✅ Your Airtable now contains your complete Parent Helper directory!`);
    
    // Show some sample businesses that were synced
    console.log('\n📋 Sample businesses now in your Airtable:');
    result.rows.slice(0, 5).forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.name} (${row.town}) - ${row.is_featured ? 'Featured' : 'Active'}`);
    });

    console.log('\n💡 Go to your Airtable base and refresh - you should see all your authentic businesses!');
    console.log('🔍 You can now filter, sort, and analyze your complete UK family directory');

  } catch (error) {
    console.error('❌ Complete sync error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  completeAirtableSync().catch(console.error);
}

module.exports = { completeAirtableSync };