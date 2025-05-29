const Airtable = require('airtable');
const fs = require('fs');

const token = 'patvdWRTiIxXDlZZE.ef66412f172eedc261bbf7e9aaa4c8058054d4bb46201a012ab380e239ca3fef';
const baseId = 'app9eOTFWck1sZwTG';

const base = new Airtable({
  apiKey: token
}).base(baseId);

const table = base('tblDcOhMjN0kb8dk4');

async function backupAirtableData() {
  try {
    console.log('🔄 Creating backup of current Airtable data...');
    
    const allRecords = [];
    
    await table.select({
      pageSize: 100
    }).eachPage((records, fetchNextPage) => {
      records.forEach(record => {
        allRecords.push({
          id: record.id,
          fields: record.fields,
          createdTime: record._rawJson.createdTime
        });
      });
      
      console.log(`Backed up ${allRecords.length} records so far...`);
      fetchNextPage();
    });
    
    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `airtable_backup_${timestamp}.json`;
    
    // Save backup
    fs.writeFileSync(backupFileName, JSON.stringify(allRecords, null, 2));
    
    console.log(`✅ Backup completed: ${backupFileName}`);
    console.log(`📊 Total records backed up: ${allRecords.length}`);
    
    // Test backup integrity
    const testRestore = JSON.parse(fs.readFileSync(backupFileName, 'utf8'));
    if (testRestore.length === allRecords.length) {
      console.log('✅ Backup integrity verified');
      return backupFileName;
    } else {
      throw new Error('Backup integrity check failed');
    }
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    return null;
  }
}

backupAirtableData();