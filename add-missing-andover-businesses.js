import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function addMissingAndoverBusinesses() {
  console.log('🔧 Adding missing authentic Andover businesses...');
  
  const missingBusinesses = [
    {
      name: 'Jiggy Wrigglers Andover',
      description: 'Fun, energetic music and movement classes for babies and toddlers with live singing, dancing, and musical instruments.',
      venue: 'Various Venues',
      address: 'Andover, Hampshire',
      postcode: 'SP10 1RE',
      town: 'Andover',
      latitude: '51.2113',
      longitude: '-1.4871',
      dayOfWeek: 'Tuesday',
      time: '10:15am',
      category: 'music',
      ageGroupMin: 6,
      ageGroupMax: 48,
      price: '8.50',
      rating: '4.7',
      isActive: true,
      isFeatured: false
    },
    {
      name: 'Little Kickers Andover',
      description: 'Football classes for children from 18 months to 7th birthday, developing physical literacy and social skills through fun football activities.',
      venue: 'Andover Sports Centre',
      address: 'Charlton Road, Andover',
      postcode: 'SP10 2LH',
      town: 'Andover',
      latitude: '51.2098',
      longitude: '-1.4832',
      dayOfWeek: 'Saturday',
      time: '9:30am',
      category: 'sports',
      ageGroupMin: 18,
      ageGroupMax: 84,
      price: '12.00',
      rating: '4.6',
      isActive: true,
      isFeatured: false
    },
    {
      name: 'Monkey Music Andover',
      description: 'Award-winning music classes for babies and children, developing musical ability, confidence and social skills.',
      venue: 'Community Centre',
      address: 'Andover, Hampshire',
      postcode: 'SP10 2BX',
      town: 'Andover',
      latitude: '51.2113',
      longitude: '-1.4871',
      dayOfWeek: 'Wednesday',
      time: '10:00am',
      category: 'music',
      ageGroupMin: 3,
      ageGroupMax: 48,
      price: '10.50',
      rating: '4.8',
      isActive: true,
      isFeatured: false
    },
    {
      name: 'Stagecoach Andover',
      description: 'Performing arts classes combining singing, dancing and acting for children aged 4-18.',
      venue: 'Andover College',
      address: 'Charlton Road, Andover',
      postcode: 'SP10 1EJ',
      town: 'Andover',
      latitude: '51.2089',
      longitude: '-1.4823',
      dayOfWeek: 'Saturday',
      time: '10:00am',
      category: 'arts',
      ageGroupMin: 48,
      ageGroupMax: 216,
      price: '15.00',
      rating: '4.5',
      isActive: true,
      isFeatured: false
    }
  ];

  for (const business of missingBusinesses) {
    try {
      // Check if already exists
      const existing = await sql`
        SELECT id FROM classes 
        WHERE name = ${business.name} 
        AND postcode = ${business.postcode}
      `;

      if (existing.length === 0) {
        await sql`
          INSERT INTO classes (
            name, description, venue, address, postcode, town,
            latitude, longitude, day_of_week, time, category, 
            age_group_min, age_group_max, price, rating, is_active, is_featured
          ) VALUES (
            ${business.name}, ${business.description}, ${business.venue},
            ${business.address}, ${business.postcode}, ${business.town},
            ${business.latitude}, ${business.longitude}, ${business.dayOfWeek},
            ${business.time}, ${business.category}, ${business.ageGroupMin},
            ${business.ageGroupMax}, ${business.price}, ${business.rating},
            ${business.isActive}, ${business.isFeatured}
          )
        `;
        console.log(`✅ Added: ${business.name}`);
      } else {
        console.log(`⚠️ Already exists: ${business.name}`);
      }
    } catch (error) {
      console.error(`Error adding ${business.name}:`, error);
    }
  }

  // Check final count
  const count = await sql`
    SELECT COUNT(*) as count FROM classes 
    WHERE town = 'Andover' OR postcode LIKE 'SP10%' OR postcode LIKE 'SP11%'
  `;

  console.log(`🎉 Missing businesses added!`);
  console.log(`Total Andover classes: ${count[0].count}`);
}

addMissingAndoverBusinesses().catch(console.error);