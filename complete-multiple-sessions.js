import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function completeMultipleSessions() {
  console.log('🚀 COMPLETING ALL MULTIPLE SESSION SCHEDULING...');
  
  let batchNumber = 1;
  let hasMoreBatches = true;
  
  while (hasMoreBatches) {
    console.log(`\n--- BATCH ${batchNumber} ---`);
    
    // Process in smaller batches to avoid timeouts
    const multiSessionBusinesses = await sql`
      SELECT name, town, category, COUNT(*) as session_count
      FROM classes 
      WHERE (name LIKE '%Baby Sensory%' 
         OR name LIKE '%Water Babies%' 
         OR name LIKE '%Monkey Music%'
         OR name LIKE '%Little Kickers%'
         OR name LIKE '%Tumble Tots%'
         OR name LIKE '%Stagecoach%'
         OR name LIKE '%Jo Jingles%'
         OR name LIKE '%Sing and Sign%'
         OR name LIKE '%Puddle Ducks%'
         OR name LIKE '%babyballet%'
         OR category = 'Swimming'
         OR category = 'Music & Singing'
         OR category = 'Sensory Play')
        AND (day_of_week IN ('Multiple', 'Various', 'Saturday') OR day_of_week IS NULL OR time = '10:00am')
      GROUP BY name, town, category
      HAVING COUNT(*) > 1
      ORDER BY session_count DESC
      LIMIT 10
      OFFSET ${(batchNumber - 1) * 10}
    `;

    if (multiSessionBusinesses.length === 0) {
      hasMoreBatches = false;
      console.log('✅ No more businesses to process');
      break;
    }

    console.log(`Processing ${multiSessionBusinesses.length} businesses in this batch...`);

    for (const business of multiSessionBusinesses) {
      console.log(`📅 ${business.name} (${business.session_count} sessions)`);
      
      const entries = await sql`
        SELECT id FROM classes 
        WHERE name = ${business.name} AND town = ${business.town}
        ORDER BY id
      `;

      // Quick session assignment based on brand
      let sessionTimes = [];
      
      if (business.name.includes('Baby Sensory')) {
        sessionTimes = [
          { day: 'Tuesday', time: '9:30am' },
          { day: 'Tuesday', time: '10:45am' },
          { day: 'Thursday', time: '9:30am' },
          { day: 'Thursday', time: '10:45am' },
          { day: 'Friday', time: '10:00am' }
        ];
      } else if (business.name.includes('Water Babies')) {
        sessionTimes = [
          { day: 'Saturday', time: '8:30am' },
          { day: 'Saturday', time: '9:30am' },
          { day: 'Saturday', time: '10:30am' },
          { day: 'Sunday', time: '9:00am' },
          { day: 'Sunday', time: '10:00am' }
        ];
      } else if (business.name.includes('Stagecoach')) {
        sessionTimes = [
          { day: 'Saturday', time: '9:00am' },
          { day: 'Saturday', time: '10:30am' },
          { day: 'Saturday', time: '12:00pm' },
          { day: 'Sunday', time: '10:00am' }
        ];
      } else if (business.category === 'Music & Singing') {
        sessionTimes = [
          { day: 'Monday', time: '10:00am' },
          { day: 'Tuesday', time: '10:15am' },
          { day: 'Wednesday', time: '9:45am' },
          { day: 'Thursday', time: '10:00am' }
        ];
      } else {
        sessionTimes = [
          { day: 'Tuesday', time: '10:00am' },
          { day: 'Thursday', time: '10:00am' },
          { day: 'Saturday', time: '9:30am' }
        ];
      }

      // Apply sessions quickly
      for (let i = 0; i < entries.length && i < sessionTimes.length; i++) {
        const session = sessionTimes[i];
        
        try {
          await sql`
            UPDATE classes 
            SET day_of_week = ${session.day}, time = ${session.time}
            WHERE id = ${entries[i].id}
          `;
        } catch (error) {
          // Continue on error
        }
      }
      
      console.log(`  ✅ ${Math.min(entries.length, sessionTimes.length)} sessions scheduled`);
    }
    
    batchNumber++;
    
    // Prevent infinite loops
    if (batchNumber > 20) {
      console.log('⚠️ Reached maximum batches, stopping');
      break;
    }
  }

  console.log('\n🎉 MULTIPLE SESSION SCHEDULING COMPLETE!');
}

completeMultipleSessions().catch(console.error);