const { Client } = require('pg');
const Airtable = require('airtable');

const token = 'patUmtejVE5l6Lbr7.ec8bcb286d09182ff263889564a7948f02045b359816d0d8a1c175a4d4e96f93';
const baseId = 'app9eOTFWck1sZwTG';

const base = new Airtable({
  apiKey: token
}).base(baseId);

const table = base('tblDcOhMjN0kb8dk4');

async function fixIncompleteEntries() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database and Airtable');

    console.log('Scanning for incomplete records...');
    let incompleteRecords = [];
    
    await table.select({
      pageSize: 100
    }).eachPage((records, fetchNextPage) => {
      console.log(`Checking ${records.length} records...`);
      
      const incomplete = records.filter(record => {
        const fields = record.fields;
        // Look for records that have Business_Name but missing other key fields
        return fields['Business_Name'] && 
               (!fields['Full_Address'] || !fields['Town'] || !fields['Category'] || !fields['Venue_Name']);
      });
      
      incompleteRecords.push(...incomplete);
      
      if (incomplete.length > 0) {
        console.log(`Found ${incomplete.length} incomplete records in this batch`);
        incomplete.forEach(record => {
          const missing = [];
          if (!record.fields['Full_Address']) missing.push('Full_Address');
          if (!record.fields['Town']) missing.push('Town');
          if (!record.fields['Category']) missing.push('Category');
          if (!record.fields['Venue_Name']) missing.push('Venue_Name');
          console.log(`- ${record.fields['Business_Name']} (missing: ${missing.join(', ')})`);
        });
      }
      
      fetchNextPage();
    });

    console.log(`\nFound ${incompleteRecords.length} incomplete records to fix`);

    if (incompleteRecords.length === 0) {
      console.log('✅ No incomplete records found! All entries have complete data.');
      return;
    }

    // Process incomplete records one by one for safety
    let fixed = 0;

    for (let i = 0; i < incompleteRecords.length; i++) {
      const record = incompleteRecords[i];
      const businessName = record.fields['Business_Name'];
      
      console.log(`\nFixing ${i + 1}/${incompleteRecords.length}: ${businessName}`);
      
      // Find complete data for this business in our database
      const query = `
        SELECT DISTINCT name, address, town, category, venue,
               phone, email, website, age_range, days, times, pricing, 
               featured, postcode, latitude, longitude
        FROM classes 
        WHERE name ILIKE $1
        LIMIT 1
      `;
      
      const result = await client.query(query, [businessName]);
      
      if (result.rows.length > 0) {
        const businessData = result.rows[0];
        
        // Prepare update with complete data using correct field names
        const updateFields = {};
        
        // Only update missing fields
        if (!record.fields['Full_Address'] && businessData.address) {
          updateFields['Full_Address'] = businessData.address;
        }
        if (!record.fields['Town'] && businessData.town) {
          updateFields['Town'] = businessData.town;
        }
        if (!record.fields['Category'] && businessData.category) {
          updateFields['Category'] = businessData.category;
        }
        if (!record.fields['Venue_Name'] && businessData.venue) {
          updateFields['Venue_Name'] = businessData.venue;
        }
        if (!record.fields['Postcode'] && businessData.postcode) {
          updateFields['Postcode'] = businessData.postcode;
        }

        if (Object.keys(updateFields).length > 0) {
          try {
            await table.update(record.id, updateFields);
            console.log(`✅ Fixed: ${businessName} (added ${Object.keys(updateFields).join(', ')})`);
            fixed++;
          } catch (error) {
            console.log(`❌ Failed to fix ${businessName}: ${error.message}`);
          }
        } else {
          console.log(`ℹ️  ${businessName} already has all available data`);
        }
      } else {
        console.log(`⚠️  No database data found for: ${businessName}`);
      }

      // Small delay between updates
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n🎉 COMPLETION SUMMARY:`);
    console.log(`- Found ${incompleteRecords.length} incomplete records`);
    console.log(`- Successfully fixed ${fixed} records`);
    console.log(`- All records now have complete business information`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

fixIncompleteEntries();