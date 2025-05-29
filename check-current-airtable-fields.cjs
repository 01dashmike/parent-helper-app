const Airtable = require('airtable');

const token = 'patvdWRTiIxXDlZZE.ef66412f172eedc261bbf7e9aaa4c8058054d4bb46201a012ab380e239ca3fef';
const baseId = 'app9eOTFWck1sZwTG';

const base = new Airtable({
  apiKey: token
}).base(baseId);

const table = base('tblDcOhMjN0kb8dk4');

async function checkCurrentAirtableFields() {
  try {
    console.log('🔍 Checking current Airtable field structure...');
    console.log('Base ID:', baseId);
    console.log('Table ID:', 'tblDcOhMjN0kb8dk4');

    // Try without specifying a view first
    const records = await table.select({
      maxRecords: 5
    }).firstPage();

    if (records.length > 0) {
      const fieldNames = Object.keys(records[0].fields);
      console.log('\n📊 CURRENT AIRTABLE FIELD NAMES:');
      fieldNames.forEach((name, index) => {
        console.log(`${index + 1}. "${name}"`);
      });
      
      console.log('\n🎯 SCHEDULING-RELATED FIELDS:');
      const schedulingFields = fieldNames.filter(name => 
        name.toLowerCase().includes('schedule') ||
        name.toLowerCase().includes('time') ||
        name.toLowerCase().includes('session') ||
        name.toLowerCase().includes('day') ||
        name.toLowerCase().includes('week') ||
        name.toLowerCase().includes('age')
      );
      
      if (schedulingFields.length > 0) {
        schedulingFields.forEach((name, index) => {
          console.log(`${index + 1}. "${name}"`);
        });
      } else {
        console.log('No obvious scheduling fields found');
      }
      
      console.log('\nSample record data:');
      console.log(JSON.stringify(records[0].fields, null, 2));
    } else {
      console.log('No records found in the table');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkCurrentAirtableFields();