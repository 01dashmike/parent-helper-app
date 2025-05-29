const { Pool, neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const ws = require('ws');
const Airtable = require('airtable');
const fs = require('fs');

neonConfig.webSocketConstructor = ws;

const token = 'patvdWRTiIxXDlZZE.ef66412f172eedc261bbf7e9aaa4c8058054d4bb46201a012ab380e239ca3fef';
const baseId = 'app9eOTFWck1sZwTG';

const base = new Airtable({
  apiKey: token
}).base(baseId);

const table = base('tblDcOhMjN0kb8dk4');

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const progressFile = 'sync-progress.json';

function saveProgress(processedCount, lastId) {
  const progress = {
    processedCount,
    lastId,
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
}

function loadProgress() {
  try {
    if (fs.existsSync(progressFile)) {
      return JSON.parse(fs.readFileSync(progressFile, 'utf8'));
    }
  } catch (error) {
    console.log('No previous progress found, starting fresh');
  }
  return { processedCount: 0, lastId: 0 };
}

async function getEnhancedSessions(startFromId = 0) {
  try {
    console.log(`🔍 Fetching enhanced sessions from database (starting from ID ${startFromId})...`);
    
    const result = await pool.query(`
      SELECT 
        id,
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
      AND id > $1
      ORDER BY id
    `, [startFromId]);
    
    console.log(`Found ${result.rows.length} enhanced sessions to process`);
    return result.rows;
    
  } catch (error) {
    console.error('Database error:', error.message);
    return [];
  }
}

function createAirtableRecord(session) {
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

async function resumeSync() {
  try {
    console.log('🚀 Resuming enhanced sessions sync to Airtable...');
    
    const progress = loadProgress();
    console.log(`📊 Previous progress: ${progress.processedCount} sessions processed`);
    
    const sessions = await getEnhancedSessions(progress.lastId);
    
    if (sessions.length === 0) {
      console.log('✅ All sessions have been synced!');
      return;
    }
    
    console.log(`📊 Remaining sessions to sync: ${sessions.length}`);
    
    const batchSize = 10;
    let processedCount = progress.processedCount;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < sessions.length; i += batchSize) {
      const batch = sessions.slice(i, i + batchSize);
      const batchNumber = Math.floor(i/batchSize) + 1;
      
      console.log(`\n🔄 Processing batch ${batchNumber} (${batch.length} records)`);
      console.log(`   Session IDs: ${batch[0].id} to ${batch[batch.length-1].id}`);
      
      try {
        const airtableRecords = batch.map(session => ({
          fields: createAirtableRecord(session)
        }));
        
        const result = await table.create(airtableRecords);
        
        successCount += result.length;
        processedCount += batch.length;
        
        // Save progress after each successful batch
        const lastId = batch[batch.length - 1].id;
        saveProgress(processedCount, lastId);
        
        console.log(`   ✅ Successfully added ${result.length} records`);
        console.log(`   📈 Total processed: ${processedCount}`);
        
        // Rate limiting - wait between batches
        if (i + batchSize < sessions.length) {
          console.log('   ⏳ Waiting 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (batchError) {
        console.error(`   ❌ Batch failed:`, batchError.message);
        errorCount += batch.length;
        
        // Wait longer after errors and continue
        console.log('   ⏳ Waiting 5 seconds after error...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log('\n📊 SYNC SUMMARY:');
    console.log(`✅ Successfully synced: ${successCount} sessions`);
    console.log(`❌ Failed: ${errorCount} sessions`);
    console.log(`📈 Total processed this run: ${sessions.length}`);
    console.log(`📈 Grand total processed: ${processedCount}`);
    
    if (successCount > 0) {
      console.log('\n🎉 Enhanced scheduling data synced to Airtable!');
    }
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  } finally {
    await pool.end();
  }
}

resumeSync();