const { Pool, neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const ws = require('ws');
const Airtable = require('airtable');

neonConfig.webSocketConstructor = ws;

const token = 'patvdWRTiIxXDlZZE.ef66412f172eedc261bbf7e9aaa4c8058054d4bb46201a012ab380e239ca3fef';
const baseId = 'app9eOTFWck1sZwTG';

const base = new Airtable({
  apiKey: token
}).base(baseId);

const table = base('tblDcOhMjN0kb8dk4');

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

async function getEnhancedSessions() {
  try {
    console.log('🔍 Fetching enhanced sessions from database...');
    
    const result = await pool.query(`
      SELECT 
        name,
        town,
        postcode,
        venue,
        address,
        age_group_min,
        age_group_max,
        category,
        day_of_week,
        time,
        session_type,
        age_specific_session,
        time_category,
        weekly_schedule_summary,
        session_group_id
      FROM classes 
      WHERE session_group_id IS NOT NULL
      ORDER BY session_group_id, name
    `);
    
    console.log(`Found ${result.rows.length} enhanced sessions`);
    return result.rows;
    
  } catch (error) {
    console.error('Database error:', error.message);
    return [];
  }
}

function createAirtableRecord(session) {
  // Convert age from months to years for display
  const ageMinYears = Math.floor(session.age_group_min / 12);
  const ageMaxYears = Math.floor(session.age_group_max / 12);
  
  // Create descriptive business name with age range and time
  let businessName = session.name;
  
  if (session.age_specific_session && session.age_specific_session !== '0-5 years') {
    businessName += ` (${session.age_specific_session})`;
  }
  
  if (session.time && session.day_of_week) {
    businessName += ` - ${session.day_of_week} ${session.time}`;
  }
  
  return {
    'Business_Name': businessName,
    'Town': session.town || 'Unknown',
    'Postcode': session.postcode || '',
    'Venue_Name': session.venue || session.name,
    'Full_Address': session.address || session.town,
    'Age_Min_Months': session.age_group_min || 0,
    'Age_Max_Months': session.age_group_max || 60,
    'Category': session.category || 'General'
  };
}

async function syncEnhancedSessionsInBatches() {
  try {
    console.log('🚀 Starting enhanced sessions sync to Airtable...');
    
    const sessions = await getEnhancedSessions();
    
    if (sessions.length === 0) {
      console.log('❌ No enhanced sessions found to sync');
      return;
    }
    
    console.log(`📊 Total sessions to sync: ${sessions.length}`);
    
    const batchSize = 10;
    let totalSynced = 0;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < sessions.length; i += batchSize) {
      const batch = sessions.slice(i, i + batchSize);
      
      console.log(`\n🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(sessions.length/batchSize)}`);
      console.log(`   Records ${i + 1} to ${Math.min(i + batchSize, sessions.length)}`);
      
      try {
        const airtableRecords = batch.map(session => ({
          fields: createAirtableRecord(session)
        }));
        
        const result = await table.create(airtableRecords);
        
        successCount += result.length;
        totalSynced += batch.length;
        
        console.log(`   ✅ Successfully added ${result.length} records`);
        
        // Rate limiting - wait 1 second between batches
        if (i + batchSize < sessions.length) {
          console.log('   ⏳ Waiting 1 second...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (batchError) {
        console.error(`   ❌ Batch failed:`, batchError.message);
        errorCount += batch.length;
        
        // Wait longer after errors
        console.log('   ⏳ Waiting 3 seconds after error...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('\n📊 SYNC SUMMARY:');
    console.log(`✅ Successfully synced: ${successCount} sessions`);
    console.log(`❌ Failed: ${errorCount} sessions`);
    console.log(`📈 Total processed: ${totalSynced} sessions`);
    
    if (successCount > 0) {
      console.log('\n🎉 Enhanced scheduling data successfully synced to Airtable!');
      console.log('Each session is now a separate record with specific age ranges and times.');
    }
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  } finally {
    await pool.end();
  }
}

syncEnhancedSessionsInBatches();