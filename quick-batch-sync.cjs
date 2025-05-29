const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const Airtable = require('airtable');

neonConfig.webSocketConstructor = ws;

const token = 'patvdWRTiIxXDlZZE.ef66412f172eedc261bbf7e9aaa4c8058054d4bb46201a012ab380e239ca3fef';
const baseId = 'app9eOTFWck1sZwTG';

const base = new Airtable({
  apiKey: token
}).base(baseId);

const table = base('tblDcOhMjN0kb8dk4');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function quickBatchSync() {
  try {
    console.log('🚀 Starting quick batch sync (100 records)...');
    
    // Get next 100 sessions to sync
    const result = await pool.query(`
      SELECT 
        id, name, town, postcode, venue, address,
        age_group_min, age_group_max, category,
        day_of_week, time, age_specific_session
      FROM classes 
      WHERE session_group_id IS NOT NULL 
      ORDER BY id
      LIMIT 100
    `);
    
    if (result.rows.length === 0) {
      console.log('✅ No more sessions to sync');
      return;
    }
    
    console.log(`📊 Processing ${result.rows.length} sessions...`);
    
    // Process in batches of 10
    let successCount = 0;
    
    for (let i = 0; i < result.rows.length; i += 10) {
      const batch = result.rows.slice(i, i + 10);
      
      try {
        const airtableRecords = batch.map(session => {
          let businessName = session.name;
          if (session.age_specific_session && session.age_specific_session !== '0-5 years') {
            businessName += ` (${session.age_specific_session})`;
          }
          if (session.time && session.day_of_week) {
            businessName += ` - ${session.day_of_week} ${session.time}`;
          }
          
          return {
            fields: {
              'Business_Name': businessName,
              'Town': session.town || 'Unknown',
              'Postcode': session.postcode || '',
              'Venue_Name': session.venue || session.name,
              'Full_Address': session.address || session.town,
              'Age_Min_Months': session.age_group_min || 0,
              'Age_Max_Months': session.age_group_max || 60,
              'Category': session.category || 'General'
            }
          };
        });
        
        await table.create(airtableRecords);
        successCount += batch.length;
        
        console.log(`✅ Batch ${Math.floor(i/10) + 1}: Added ${batch.length} records (${successCount} total)`);
        
        // Wait 1 second between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Batch failed:`, error.message);
      }
    }
    
    console.log(`\n📊 Quick sync complete: ${successCount} records added`);
    
  } catch (error) {
    console.error('❌ Quick sync failed:', error.message);
  } finally {
    await pool.end();
  }
}

quickBatchSync();