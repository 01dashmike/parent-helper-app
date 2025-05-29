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

async function fastMiniSync() {
  try {
    // Get next 30 sessions only
    const result = await pool.query(`
      SELECT 
        id, name, town, postcode, venue, address,
        age_group_min, age_group_max, category,
        day_of_week, time, age_specific_session
      FROM classes 
      WHERE session_group_id IS NOT NULL 
      ORDER BY id
      LIMIT 30
    `);
    
    if (result.rows.length === 0) {
      console.log('Complete');
      return;
    }
    
    // Process in 3 batches of 10
    let added = 0;
    
    for (let i = 0; i < result.rows.length; i += 10) {
      const batch = result.rows.slice(i, i + 10);
      
      try {
        const records = batch.map(s => ({
          fields: {
            'Business_Name': s.name + (s.age_specific_session && s.age_specific_session !== '0-5 years' ? ` (${s.age_specific_session})` : '') + (s.time && s.day_of_week ? ` - ${s.day_of_week} ${s.time}` : ''),
            'Town': s.town || 'Unknown',
            'Postcode': s.postcode || '',
            'Venue_Name': s.venue || s.name,
            'Full_Address': s.address || s.town,
            'Age_Min_Months': s.age_group_min || 0,
            'Age_Max_Months': s.age_group_max || 60,
            'Category': s.category || 'General'
          }
        }));
        
        await table.create(records);
        added += batch.length;
        
      } catch (error) {
        console.error('Batch error');
      }
    }
    
    console.log(`Added ${added} records`);
    
  } catch (error) {
    console.error('Sync error');
  } finally {
    await pool.end();
  }
}

fastMiniSync();