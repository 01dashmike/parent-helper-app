async function checkCurrentAirtableStatus() {
  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    console.log('🔍 CHECKING CURRENT AIRTABLE STATUS');
    console.log('📊 Seeing what\'s actually in your table right now...\n');

    // Check current record count
    let totalRecords = 0;
    let offset = '';
    let lastBusinessName = '';
    
    do {
      const url = `https://api.airtable.com/v0/${baseId}/Parent%20Helper?pageSize=100${offset ? `&offset=${offset}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        totalRecords += data.records.length;
        offset = data.offset || '';
        
        if (data.records.length > 0) {
          lastBusinessName = data.records[data.records.length - 1].fields.Business_Name || 'Unknown';
        }
        
        console.log(`   📋 Found ${totalRecords} records so far...`);
      } else {
        console.log(`❌ Error checking records: ${response.status}`);
        break;
      }
    } while (offset);

    console.log(`\n📊 CURRENT STATUS:`);
    console.log(`   Total records in Airtable: ${totalRecords}`);
    console.log(`   Last business synced: "${lastBusinessName}"`);

    // Check if sync is stuck or slow
    if (totalRecords < 1000) {
      console.log(`\n⚠️  SYNC APPEARS SLOW OR STUCK`);
      console.log(`   Expected: Nearly 6,000 authentic businesses`);
      console.log(`   Current: ${totalRecords} records`);
      console.log(`   This suggests the sync process may need optimization`);
    } else if (totalRecords < 3000) {
      console.log(`\n⏳ SYNC IN PROGRESS`);
      console.log(`   About ${Math.round((totalRecords/6000)*100)}% complete`);
      console.log(`   Continuing to populate your authentic directory`);
    } else {
      console.log(`\n✅ SUBSTANTIAL PROGRESS`);
      console.log(`   ${Math.round((totalRecords/6000)*100)}% of your authentic directory synced`);
    }

    // Identify potential issues
    console.log(`\n🔧 POTENTIAL SYNC OPTIMIZATIONS:`);
    console.log(`   • Rate limiting: Airtable has API limits that may slow large syncs`);
    console.log(`   • Batch processing: Large datasets need careful handling`);
    console.log(`   • Network timeouts: Long-running syncs can timeout`);

    console.log(`\n💡 RECOMMENDATIONS:`);
    if (totalRecords < 1000) {
      console.log(`   1. The sync may have stopped - restart with optimized batching`);
      console.log(`   2. Use smaller batch sizes to avoid timeouts`);
      console.log(`   3. Add better error handling and retry logic`);
    } else {
      console.log(`   1. Current sync is working but could be faster`);
      console.log(`   2. Consider resuming from where it left off`);
      console.log(`   3. Monitor progress and optimize batch sizes`);
    }

    return totalRecords;

  } catch (error) {
    console.error('❌ Status check error:', error.message);
    return 0;
  }
}

if (require.main === module) {
  checkCurrentAirtableStatus().catch(console.error);
}

module.exports = { checkCurrentAirtableStatus };