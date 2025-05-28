const Airtable = require('airtable');

const token = 'patUmtejVE5l6Lbr7.ec8bcb286d09182ff263889564a7948f02045b359816d0d8a1c175a4d4e96f93';
const baseId = 'app9eOTFWck1sZwTG';

const base = new Airtable({
  apiKey: token
}).base(baseId);

const table = base('tblDcOhMjN0kb8dk4');

async function checkFieldNames() {
  try {
    console.log('Checking Airtable field names...');
    
    const records = await table.select({
      maxRecords: 3
    }).firstPage();
    
    if (records.length > 0) {
      console.log('✅ Found records! Field names are:');
      console.log(Object.keys(records[0].fields));
      
      // Show sample of first record
      console.log('\nSample record data:');
      const fields = records[0].fields;
      Object.keys(fields).forEach(key => {
        console.log(`${key}: ${fields[key]}`);
      });
    } else {
      console.log('No records found in table');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkFieldNames();