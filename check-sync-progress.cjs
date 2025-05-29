const Airtable = require('airtable');

const token = 'patvdWRTiIxXDlZZE.ef66412f172eedc261bbf7e9aaa4c8058054d4bb46201a012ab380e239ca3fef';
const baseId = 'app9eOTFWck1sZwTG';

const base = new Airtable({
  apiKey: token
}).base(baseId);

const table = base('tblDcOhMjN0kb8dk4');

async function checkSyncProgress() {
  try {
    console.log('🔍 Checking current record count in Airtable...');
    
    let totalCount = 0;
    
    await table.select({
      pageSize: 100
    }).eachPage((records, fetchNextPage) => {
      totalCount += records.length;
      fetchNextPage();
    });
    
    console.log(`📊 Current total records: ${totalCount}`);
    console.log(`📈 Previous backup had: 6,122 records`);
    console.log(`➕ New records added: ${totalCount - 6122}`);
    
    if (totalCount > 6122) {
      console.log('✅ Sync made progress - some enhanced sessions were added');
    } else {
      console.log('❌ No new records detected');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSyncProgress();