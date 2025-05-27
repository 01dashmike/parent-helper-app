const { Client } = require('pg');

async function checkAndSyncFields() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🔍 CHECKING YOUR AIRTABLE FIELD STRUCTURE');
    console.log('📊 Let me see what fields you actually created...\n');

    // Check what fields exist in your table
    const tableResponse = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    let availableFields = [];
    if (tableResponse.ok) {
      const tableData = await tableResponse.json();
      const parentHelperTable = tableData.tables.find(t => t.name === 'Parent Helper');
      
      console.log('📋 Fields currently in your Airtable table:');
      parentHelperTable.fields.forEach((field, idx) => {
        console.log(`   ${idx + 1}. "${field.name}" (${field.type})`);
        availableFields.push(field.name);
      });
    }

    // Now let's sync using only the fields that actually exist
    console.log('\n🎯 Syncing data using your existing fields...');

    const result = await client.query(`
      SELECT 
        name, description, category, town, postcode, address, venue,
        age_group_min, age_group_max, day_of_week, time, price,
        contact_phone, contact_email, website, is_featured, rating
      FROM classes 
      WHERE is_active = true 
      ORDER BY is_featured DESC, town, name
      LIMIT 50
    `);

    console.log(`📈 Preparing ${result.rows.length} authentic businesses for sync`);

    // Create records using only available fields
    const records = result.rows.map(row => {
      const record = { fields: {} };
      
      // Map to actual field names that exist
      if (availableFields.includes('Name')) {
        record.fields['Name'] = row.name;
      }
      if (availableFields.includes('Business_Name')) {
        record.fields['Business_Name'] = row.name;
      }
      if (availableFields.includes('Category')) {
        record.fields['Category'] = row.category || 'Educational';
      }
      if (availableFields.includes('Town')) {
        record.fields['Town'] = row.town;
      }
      if (availableFields.includes('Venue_Name')) {
        record.fields['Venue_Name'] = row.venue || '';
      }
      if (availableFields.includes('Day_of_Week')) {
        record.fields['Day_of_Week'] = row.day_of_week || '';
      }
      if (availableFields.includes('Class_Time')) {
        record.fields['Class_Time'] = row.time || '';
      }
      if (availableFields.includes('Price')) {
        record.fields['Price'] = row.price || 'Contact for pricing';
      }
      if (availableFields.includes('Featured')) {
        record.fields['Featured'] = row.is_featured || false;
      }
      if (availableFields.includes('Status')) {
        record.fields['Status'] = row.is_featured ? 'Featured' : 'Active';
      }
      if (availableFields.includes('Description')) {
        record.fields['Description'] = row.description || '';
      }
      if (availableFields.includes('Notes')) {
        record.fields['Notes'] = `${row.description || ''}\n\nVenue: ${row.venue}\nTown: ${row.town}\nSchedule: ${row.day_of_week} ${row.time}\nPrice: ${row.price || 'Contact for pricing'}`;
      }
      
      return record;
    });

    console.log('\n🚀 Syncing to your available fields...');
    
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
          console.log(`   ✅ Batch ${batchNumber}: ${result.records.length} businesses synced (Total: ${totalSynced})`);
          
          if (batchNumber === 1) {
            const sample = result.records[0].fields;
            console.log(`\n   📋 Sample synced record:`);
            Object.keys(sample).forEach(key => {
              console.log(`      ${key}: ${sample[key]}`);
            });
          }
        } else {
          const errorText = await response.text();
          console.log(`   ❌ Batch ${batchNumber} failed: ${response.status} - ${errorText.substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`   ❌ Batch ${batchNumber} error: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n🎉 FIELD-MATCHED SYNC COMPLETE!`);
    console.log(`📊 Successfully synced ${totalSynced} authentic businesses`);
    console.log(`✅ Data populated using your existing field structure`);
    console.log(`\n💡 Check your Airtable now to see your authentic Parent Helper data!`);

  } catch (error) {
    console.error('❌ Field check and sync error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  checkAndSyncFields().catch(console.error);
}

module.exports = { checkAndSyncFields };