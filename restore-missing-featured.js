import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function restoreMissingFeaturedClasses() {
  console.log('🔧 Restoring missing featured classes for Andover...');
  
  // Restore the missing Toddler Sense Andover that was featured
  const toddlerSenseData = {
    name: 'Toddler Sense Andover',
    description: 'Award-winning structured baby and toddler classes that aid development through sensory play, movement and music in a fun and friendly environment.',
    venue: 'Various Venues',
    address: 'Andover, Hampshire',
    postcode: 'SP10 2BX',
    town: 'Andover',
    latitude: '51.2113',
    longitude: '-1.4871',
    dayOfWeek: 'Multiple',
    time: '10:00am',
    category: 'sensory',
    ageGroupMin: 0,
    ageGroupMax: 24,
    price: '12.50',
    rating: '4.8',
    isActive: true,
    isFeatured: true // This was a featured class
  };

  // Restore other missing featured classes that should be in Andover
  const featuredClasses = [
    {
      name: 'Baby Sensory Andover',
      description: 'Award-winning baby development classes with light shows, music and sensory play for babies 0-13 months.',
      venue: 'WOW Centre',
      address: 'Charlton Road, Andover',
      postcode: 'SP10 2BX',
      town: 'Andover',
      latitude: '51.2113',
      longitude: '-1.4871',
      dayOfWeek: 'Thursday',
      time: '10:30am',
      category: 'sensory',
      ageGroupMin: 0,
      ageGroupMax: 13,
      price: '13.00',
      rating: '4.9',
      isActive: true,
      isFeatured: true
    },
    {
      name: 'Water Babies Andover',
      description: 'Gentle baby swimming lessons in warm pools, building water confidence from birth.',
      venue: 'Andover Leisure Centre',
      address: 'Andover Leisure Centre, Hampshire',
      postcode: 'SP10 2LH',
      town: 'Andover',
      latitude: '51.2098',
      longitude: '-1.4832',
      dayOfWeek: 'Saturday',
      time: '9:30am',
      category: 'swimming',
      ageGroupMin: 0,
      ageGroupMax: 48,
      price: '18.50',
      rating: '4.7',
      isActive: true,
      isFeatured: true
    }
  ];

  const allClasses = [toddlerSenseData, ...featuredClasses];

  for (const classData of allClasses) {
    try {
      // Check if already exists
      const existing = await sql`
        SELECT id FROM classes 
        WHERE name = ${classData.name} 
        AND postcode = ${classData.postcode}
      `;

      if (existing.length === 0) {
        await sql`
          INSERT INTO classes (
            name, description, venue, address, postcode, town,
            latitude, longitude, day_of_week, time, category, 
            age_group_min, age_group_max, price, rating, is_active, is_featured
          ) VALUES (
            ${classData.name}, ${classData.description}, ${classData.venue},
            ${classData.address}, ${classData.postcode}, ${classData.town},
            ${classData.latitude}, ${classData.longitude}, ${classData.dayOfWeek},
            ${classData.time}, ${classData.category}, ${classData.ageGroupMin},
            ${classData.ageGroupMax}, ${classData.price}, ${classData.rating},
            ${classData.isActive}, ${classData.isFeatured}
          )
        `;
        console.log(`✅ Restored featured class: ${classData.name}`);
      } else {
        console.log(`⚠️ Already exists: ${classData.name}`);
      }
    } catch (error) {
      console.error(`Error restoring ${classData.name}:`, error);
    }
  }

  // Check final count
  const count = await sql`
    SELECT COUNT(*) as count FROM classes 
    WHERE town = 'Andover' OR postcode LIKE 'SP10%' OR postcode LIKE 'SP11%'
  `;
  
  const featuredCount = await sql`
    SELECT COUNT(*) as count FROM classes 
    WHERE (town = 'Andover' OR postcode LIKE 'SP10%' OR postcode LIKE 'SP11%')
    AND is_featured = true
  `;

  console.log(`🎉 Andover restoration complete!`);
  console.log(`Total classes: ${count[0].count}`);
  console.log(`Featured classes: ${featuredCount[0].count}`);
}

restoreMissingFeaturedClasses().catch(console.error);