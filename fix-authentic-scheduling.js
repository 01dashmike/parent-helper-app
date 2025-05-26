import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function fixAuthenticScheduling() {
  console.log('🔧 Updating with authentic scheduling data from real timetables...');
  
  // Real Baby Sensory Andover schedule from the timetable
  const babySensoryAndoverSchedule = [
    {
      name: 'Baby Sensory Andover - Wednesday',
      day: 'Wednesday',
      time: '1:30pm',
      ageMin: 0,
      ageMax: 13,
      venue: 'WOW CENTRE - Grace Baptist Church',
      address: 'Grace Baptist Church, Oak Bank, Andover, Hampshire',
      postcode: 'SP10 2BX'
    },
    {
      name: 'Baby Sensory Andover - Thursday (Birth-6m)',
      day: 'Thursday', 
      time: '12:30pm',
      ageMin: 0,
      ageMax: 6,
      venue: 'WOW CENTRE - Grace Baptist Church',
      address: 'Grace Baptist Church, Oak Bank, Andover, Hampshire',
      postcode: 'SP10 2BX'
    },
    {
      name: 'Baby Sensory Andover - Thursday (6-13m)',
      day: 'Thursday',
      time: '9:30am',
      ageMin: 6,
      ageMax: 13,
      venue: 'WOW CENTRE - Grace Baptist Church', 
      address: 'Grace Baptist Church, Oak Bank, Andover, Hampshire',
      postcode: 'SP10 2BX'
    },
    {
      name: 'Baby Sensory Andover - Friday (Birth-6m)',
      day: 'Friday',
      time: '11:00am',
      ageMin: 0,
      ageMax: 6,
      venue: 'WOW CENTRE - Grace Baptist Church',
      address: 'Grace Baptist Church, Oak Bank, Andover, Hampshire', 
      postcode: 'SP10 2BX'
    },
    {
      name: 'Baby Sensory Andover - Friday (6-13m)',
      day: 'Friday',
      time: '9:30am',
      ageMin: 6,
      ageMax: 13,
      venue: 'WOW CENTRE - Grace Baptist Church',
      address: 'Grace Baptist Church, Oak Bank, Andover, Hampshire',
      postcode: 'SP10 2BX'
    }
  ];

  // First, remove the generic Baby Sensory Andover entry
  await sql`
    DELETE FROM classes 
    WHERE name = 'Baby Sensory Andover' AND town = 'Andover'
  `;
  console.log('🗑️ Removed generic Baby Sensory Andover entry');

  // Add the detailed authentic schedule
  for (const session of babySensoryAndoverSchedule) {
    try {
      await sql`
        INSERT INTO classes (
          name, description, venue, address, postcode, town,
          latitude, longitude, day_of_week, time, category, 
          age_group_min, age_group_max, price, rating, is_active, is_featured
        ) VALUES (
          ${session.name}, 
          'Award-winning baby development classes with light shows, music and sensory play.',
          ${session.venue},
          ${session.address}, 
          ${session.postcode}, 
          'Andover',
          '51.2113', 
          '-1.4871', 
          ${session.day},
          ${session.time}, 
          'sensory', 
          ${session.ageMin},
          ${session.ageMax}, 
          '13.00', 
          '4.8',
          true, 
          true
        )
      `;
      console.log(`✅ Added authentic session: ${session.name} - ${session.day} ${session.time}`);
    } catch (error) {
      console.error(`Error adding ${session.name}:`, error);
    }
  }

  // Check the updated count
  const andoverCount = await sql`
    SELECT COUNT(*) as count FROM classes WHERE town = 'Andover'
  `;
  
  const babySensoryCount = await sql`
    SELECT COUNT(*) as count FROM classes WHERE name LIKE '%Baby Sensory Andover%'
  `;

  console.log(`🎉 Authentic scheduling update complete!`);
  console.log(`Total Andover classes: ${andoverCount[0].count}`);
  console.log(`Baby Sensory Andover sessions: ${babySensoryCount[0].count}`);
  
  // Show the new detailed schedule
  const newSchedule = await sql`
    SELECT name, day_of_week, time, age_group_min, age_group_max
    FROM classes 
    WHERE name LIKE '%Baby Sensory Andover%'
    ORDER BY day_of_week, time
  `;
  
  console.log('\nNew authentic Baby Sensory Andover schedule:');
  newSchedule.forEach(session => {
    console.log(`- ${session.day_of_week} ${session.time} (Ages ${session.age_group_min}-${session.age_group_max} months)`);
  });
}

fixAuthenticScheduling().catch(console.error);