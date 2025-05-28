const Airtable = require('airtable');

const token = 'patUmtejVE5l6Lbr7.ec8bcb286d09182ff263889564a7948f02045b359816d0d8a1c175a4d4e96f93';
const baseId = 'app9eOTFWck1sZwTG';

const base = new Airtable({
  apiKey: token
}).base(baseId);

const table = base('tblDcOhMjN0kb8dk4');

async function checkAirtableFields() {
  try {
    console.log('🔍 Checking actual Airtable field names...');

    const records = await table.select({
      maxRecords: 1
    }).firstPage();

    if (records.length > 0) {
      const fieldNames = Object.keys(records[0].fields);
      console.log('\n📊 ACTUAL AIRTABLE FIELD NAMES:');
      fieldNames.forEach((name, index) => {
        console.log(`${index + 1}. ${name}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAirtableFields();