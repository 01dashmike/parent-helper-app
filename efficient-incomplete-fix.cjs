const { Client } = require('pg');
const Airtable = require('airtable');

const token = 'patUmtejVE5l6Lbr7.ec8bcb286d09182ff263889564a7948f02045b359816d0d8a1c175a4d4e96f93';
const baseId = 'app9eOTFWck1sZwTG';

const base = new Airtable({
  apiKey: token
}).base(baseId);

const table = base('tblDcOhMjN0kb8dk4');

async function efficientIncompleteFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔍 Finding incomplete records to fix...');

    // Get just the first 10 incomplete records to fix efficiently
    const records = await table.select({
      maxRecords: 10,
      filterByFormula: "AND({Business_Name} != '', {Full_Address} = '')"
    }).firstPage();

    console.log(`Processing ${records.length} incomplete records`);

    let fixed = 0;

    for (const record of records) {
      const businessName = record.fields['Business_Name'];
      console.log(`Fixing: ${businessName}`);
      
      const query = `
        SELECT address, venue, postcode, town, category
        FROM classes 
        WHERE name ILIKE $1 AND address IS NOT NULL
        LIMIT 1
      `;
      
      const result = await client.query(query, [businessName]);
      
      if (result.rows.length > 0) {
        const data = result.rows[0];
        
        const updateFields = {};
        if (data.address) updateFields['Full_Address'] = data.address;
        if (data.venue && !record.fields['Venue_Name']) updateFields['Venue_Name'] = data.venue;
        if (data.postcode && !record.fields['Postcode']) updateFields['Postcode'] = data.postcode;
        if (data.town && !record.fields['Town']) updateFields['Town'] = data.town;
        if (data.category && !record.fields['Category']) updateFields['Category'] = data.category;

        if (Object.keys(updateFields).length > 0) {
          await table.update(record.id, updateFields);
          console.log(`✅ Fixed: ${businessName}`);
          fixed++;
        }
      } else {
        console.log(`⚠️  No data found for: ${businessName}`);
      }

      // Small delay between updates
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n🎉 Fixed ${fixed} records in this batch!`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

efficientIncompleteFix();