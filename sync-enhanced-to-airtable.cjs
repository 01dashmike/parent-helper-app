const { Client } = require('pg');
const Airtable = require('airtable');

const token = 'patUmtejVE5l6Lbr7.ec8bcb286d09182ff263889564a7948f02045b359816d0d8a1c175a4d4e96f93';
const baseId = 'app9eOTFWck1sZwTG';

const base = new Airtable({
  apiKey: token
}).base(baseId);

const table = base('tblDcOhMjN0kb8dk4');

async function syncEnhancedToAirtable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔍 Finding businesses with complete data to sync...');

    // First, get incomplete Airtable records
    const incompleteRecords = [];
    
    await table.select({
      maxRecords: 20,
      filterByFormula: "AND({Business_Name} != '', {Full_Address} = '')"
    }).eachPage((records, fetchNextPage) => {
      incompleteRecords.push(...records);
      fetchNextPage();
    });

    console.log(`Found ${incompleteRecords.length} incomplete Airtable records to fix`);

    let synced = 0;

    for (const record of incompleteRecords) {
      const businessName = record.fields['Business_Name'];
      
      // Look for this business in our database with complete address data
      const result = await client.query(`
        SELECT name, address, venue, postcode, age_group_min, age_group_max, price, contact_phone, contact_email, website
        FROM classes 
        WHERE name ILIKE $1 AND address IS NOT NULL AND address != '' AND address != 'Unknown'
        LIMIT 1
      `, [businessName]);
      
      if (result.rows.length > 0) {
        const data = result.rows[0];
        console.log(`Found complete data for: ${businessName}`);
        
        const updateFields = {};
        if (data.address) updateFields['Full_Address'] = data.address;
        if (data.venue) updateFields['Venue_Name'] = data.venue;
        if (data.postcode) updateFields['Postcode'] = data.postcode;
        if (data.age_group_min && data.age_group_max) {
          updateFields['Age_Groups'] = `${data.age_group_min}-${data.age_group_max} months`;
        }
        if (data.price) updateFields['Pricing'] = data.price;
        if (data.contact_phone) updateFields['Phone'] = data.contact_phone;
        if (data.contact_email) updateFields['Email'] = data.contact_email;
        if (data.website) updateFields['Website'] = data.website;

        if (Object.keys(updateFields).length > 0) {
          await table.update(record.id, updateFields);
          console.log(`✅ Synced complete data: ${businessName}`);
          synced++;
        }
      } else {
        console.log(`⚠️  Still incomplete: ${businessName}`);
      }

      // Small delay between updates
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n🎉 Successfully synced ${synced} businesses with complete data to Airtable!`);
    
    // Show remaining incomplete count
    const remainingIncomplete = incompleteRecords.length - synced;
    console.log(`📊 Progress: ${synced} completed, ${remainingIncomplete} still need address data`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

syncEnhancedToAirtable();