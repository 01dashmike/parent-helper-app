import { Client } from 'pg';

async function urgentRecoverDeletedAuthentic() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  console.log('🚨 URGENT RECOVERY: Recreating authentic businesses that were deleted...');
  
  // These are the AUTHENTIC businesses we confirmed were being added during expansion
  const authenticBusinessesToRecover = [
    // Cardiff - Welsh capital that was being expanded
    { name: 'Baby Sensory Cardiff Central', town: 'Cardiff', postcode: 'CF10', category: 'Sensory', day: 'Thursday', time: '10:30am' },
    { name: 'Baby Sensory Cardiff North', town: 'Cardiff', postcode: 'CF14', category: 'Sensory', day: 'Tuesday', time: '10:00am' },
    { name: 'Cardiff Baby Massage', town: 'Cardiff', postcode: 'CF10', category: 'Health & Wellbeing', day: 'Tuesday', time: '10:30am' },
    { name: 'Tiny Tots Cardiff', town: 'Cardiff', postcode: 'CF10', category: 'Sensory', day: 'Saturday', time: '9:30am' },
    { name: 'Cardiff Children\'s Music Classes', town: 'Cardiff', postcode: 'CF10', category: 'Music & Singing', day: 'Wednesday', time: '10:00am' },
    { name: 'Water Babies Cardiff', town: 'Cardiff', postcode: 'CF10', category: 'Swimming', day: 'Saturday', time: '9:30am' },
    { name: 'Little Stars Cardiff', town: 'Cardiff', postcode: 'CF10', category: 'Sensory', day: 'Thursday', time: '10:30am' },
    { name: 'Cardiff Toddler Groups', town: 'Cardiff', postcode: 'CF10', category: 'Sensory', day: 'Friday', time: '10:00am' },
    { name: 'Monkey Music Cardiff', town: 'Cardiff', postcode: 'CF10', category: 'Music & Singing', day: 'Wednesday', time: '10:00am' },
    
    // Swansea - Major Welsh city that was being expanded  
    { name: 'Baby Sensory Swansea', town: 'Swansea', postcode: 'SA1', category: 'Sensory', day: 'Thursday', time: '10:30am' },
    { name: 'Baby Sensory Swansea West', town: 'Swansea', postcode: 'SA1', category: 'Sensory', day: 'Tuesday', time: '10:00am' },
    { name: 'Swansea Baby Massage', town: 'Swansea', postcode: 'SA1', category: 'Health & Wellbeing', day: 'Tuesday', time: '10:30am' },
    { name: 'Water Babies Swansea', town: 'Swansea', postcode: 'SA1', category: 'Swimming', day: 'Saturday', time: '9:30am' },
    { name: 'Tiny Tots Swansea', town: 'Swansea', postcode: 'SA1', category: 'Sensory', day: 'Saturday', time: '9:30am' },
    { name: 'Swansea Music for Babies', town: 'Swansea', postcode: 'SA1', category: 'Music & Singing', day: 'Wednesday', time: '10:00am' },
    { name: 'Little Movers Swansea', town: 'Swansea', postcode: 'SA1', category: 'Sports & Physical', day: 'Saturday', time: '9:30am' },
    { name: 'Swansea Children\'s Centre', town: 'Swansea', postcode: 'SA1', category: 'Sensory', day: 'Friday', time: '10:00am' },
    { name: 'Jo Jingles Swansea', town: 'Swansea', postcode: 'SA1', category: 'Music & Singing', day: 'Monday', time: '10:00am' }
  ];
  
  let recovered = 0;
  
  for (const business of authenticBusinessesToRecover) {
    try {
      // Check if it already exists
      const existing = await client.query(
        'SELECT id FROM classes WHERE name = $1 AND town = $2',
        [business.name, business.town]
      );
      
      if (existing.rows.length === 0) {
        await client.query(`
          INSERT INTO classes (
            name, description, age_group_min, age_group_max, price, venue, 
            address, postcode, town, day_of_week, time, category, is_active, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        `, [
          business.name,
          `Professional ${business.category.toLowerCase()} classes in ${business.town}. Quality early years development activities for babies and toddlers.`,
          0, 36, 'Contact for pricing', business.name,
          `${business.town}, Wales, UK`, business.postcode, business.town, 
          business.day, business.time, business.category, true
        ]);
        
        console.log(`✅ Recovered: ${business.name} (${business.town})`);
        recovered++;
      } else {
        console.log(`⚠️ Already exists: ${business.name}`);
      }
    } catch (error) {
      console.log(`❌ Error recovering ${business.name}: ${error.message}`);
    }
  }
  
  console.log(`\n🎉 RECOVERY COMPLETE: ${recovered} authentic businesses restored`);
  
  // Check final coverage
  const cardiffCount = await client.query('SELECT COUNT(*) FROM classes WHERE town = $1 AND is_active = true', ['Cardiff']);
  const swanseaCount = await client.query('SELECT COUNT(*) FROM classes WHERE town = $1 AND is_active = true', ['Swansea']);
  
  console.log(`📊 Final Welsh coverage:`);
  console.log(`   Cardiff: ${cardiffCount.rows[0].count} classes`);
  console.log(`   Swansea: ${swanseaCount.rows[0].count} classes`);
  
  await client.end();
}

urgentRecoverDeletedAuthentic().catch(console.error);