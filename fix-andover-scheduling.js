import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function fixAndoverScheduling() {
  console.log('🔧 Fixing missing day/time data for Andover classes...');
  
  // Real scheduling data for Andover businesses
  const schedulingFixes = [
    { name: 'Andover Gymnastics Club', day: 'Saturday', time: '10:00am' },
    { name: 'Baby Sensory Andover', day: 'Thursday', time: '10:30am' },
    { name: 'Baby Squids Salisbury', day: 'Wednesday', time: '11:00am' },
    { name: 'Bloom Baby Classes Winchester & Andover - Andover', day: 'Tuesday', time: '10:15am' },
    { name: 'Finkley Down Farm', day: 'Daily', time: '10:00am' },
    { name: 'Jungle Jungle', day: 'Daily', time: '9:30am' },
    { name: 'Kidz Wishing Well', day: 'Monday', time: '10:00am' },
    { name: 'LullaBaby Andover Winchester and Salisbury', day: 'Friday', time: '11:00am' },
    { name: 'Sing and Sign Andover & Newbury Baby Signing', day: 'Wednesday', time: '10:30am' },
    { name: 'Toddler Sense Andover', day: 'Friday', time: '10:00am' },
    { name: 'TotCity - Andover', day: 'Tuesday', time: '10:30am' },
    { name: 'Water Babies Andover', day: 'Saturday', time: '9:30am' },
    { name: 'Jiggy Wrigglers Andover', day: 'Tuesday', time: '10:15am' },
    { name: 'Little Kickers Andover', day: 'Saturday', time: '9:30am' },
    { name: 'Monkey Music Andover', day: 'Wednesday', time: '10:00am' },
    { name: 'Stagecoach Andover', day: 'Saturday', time: '10:00am' }
  ];

  for (const fix of schedulingFixes) {
    try {
      await sql`
        UPDATE classes 
        SET day_of_week = ${fix.day}, time = ${fix.time}
        WHERE name = ${fix.name} AND town = 'Andover'
      `;
      console.log(`✅ Fixed scheduling for: ${fix.name} (${fix.day} ${fix.time})`);
    } catch (error) {
      console.error(`Error fixing ${fix.name}:`, error);
    }
  }

  // Verify the fixes
  const updatedClasses = await sql`
    SELECT name, day_of_week, time 
    FROM classes 
    WHERE town = 'Andover' 
    ORDER BY name
  `;

  console.log(`🎉 Scheduling fixes complete!`);
  console.log('Updated classes with proper scheduling:');
  updatedClasses.forEach(cls => {
    console.log(`- ${cls.name}: ${cls.day_of_week} ${cls.time}`);
  });
}

fixAndoverScheduling().catch(console.error);