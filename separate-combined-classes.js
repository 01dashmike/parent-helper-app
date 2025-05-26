import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function separateCombinedClasses() {
  console.log('🔧 Separating combined Baby Sensory & Toddler Sense classes...');
  
  // Find all combined classes
  const combinedClasses = await sql`
    SELECT * FROM classes 
    WHERE name LIKE '%Baby Sensory%Toddler Sense%' 
    OR name LIKE '%Toddler Sense%Baby Sensory%'
  `;

  for (const combinedClass of combinedClasses) {
    console.log(`Separating: ${combinedClass.name}`);
    
    // Create Baby Sensory class
    const babySensoryData = {
      name: `Baby Sensory ${combinedClass.town}`,
      description: 'Award-winning baby development classes with light shows, music and sensory play for babies 0-13 months.',
      venue: combinedClass.venue,
      address: combinedClass.address,
      postcode: combinedClass.postcode,
      town: combinedClass.town,
      latitude: combinedClass.latitude,
      longitude: combinedClass.longitude,
      dayOfWeek: 'Thursday',
      time: '10:30am',
      category: 'sensory',
      ageGroupMin: 0,
      ageGroupMax: 13,
      price: '13.00',
      rating: combinedClass.rating || '4.8',
      isActive: true,
      isFeatured: true
    };

    // Create Toddler Sense class
    const toddlerSenseData = {
      name: `Toddler Sense ${combinedClass.town}`,
      description: 'Award-winning structured toddler classes that aid development through sensory play, movement and music for walking toddlers.',
      venue: combinedClass.venue,
      address: combinedClass.address,
      postcode: combinedClass.postcode,
      town: combinedClass.town,
      latitude: combinedClass.latitude,
      longitude: combinedClass.longitude,
      dayOfWeek: 'Friday',
      time: '10:00am',
      category: 'sensory',
      ageGroupMin: 13,
      ageGroupMax: 24,
      price: '12.50',
      rating: combinedClass.rating || '4.8',
      isActive: true,
      isFeatured: true
    };

    try {
      // Insert Baby Sensory class
      const existingBaby = await sql`
        SELECT id FROM classes 
        WHERE name = ${babySensoryData.name} 
        AND postcode = ${babySensoryData.postcode}
      `;

      if (existingBaby.length === 0) {
        await sql`
          INSERT INTO classes (
            name, description, venue, address, postcode, town,
            latitude, longitude, day_of_week, time, category, 
            age_group_min, age_group_max, price, rating, is_active, is_featured
          ) VALUES (
            ${babySensoryData.name}, ${babySensoryData.description}, ${babySensoryData.venue},
            ${babySensoryData.address}, ${babySensoryData.postcode}, ${babySensoryData.town},
            ${babySensoryData.latitude}, ${babySensoryData.longitude}, ${babySensoryData.dayOfWeek},
            ${babySensoryData.time}, ${babySensoryData.category}, ${babySensoryData.ageGroupMin},
            ${babySensoryData.ageGroupMax}, ${babySensoryData.price}, ${babySensoryData.rating},
            ${babySensoryData.isActive}, ${babySensoryData.isFeatured}
          )
        `;
        console.log(`✅ Created: ${babySensoryData.name}`);
      }

      // Insert Toddler Sense class
      const existingToddler = await sql`
        SELECT id FROM classes 
        WHERE name = ${toddlerSenseData.name} 
        AND postcode = ${toddlerSenseData.postcode}
      `;

      if (existingToddler.length === 0) {
        await sql`
          INSERT INTO classes (
            name, description, venue, address, postcode, town,
            latitude, longitude, day_of_week, time, category, 
            age_group_min, age_group_max, price, rating, is_active, is_featured
          ) VALUES (
            ${toddlerSenseData.name}, ${toddlerSenseData.description}, ${toddlerSenseData.venue},
            ${toddlerSenseData.address}, ${toddlerSenseData.postcode}, ${toddlerSenseData.town},
            ${toddlerSenseData.latitude}, ${toddlerSenseData.longitude}, ${toddlerSenseData.dayOfWeek},
            ${toddlerSenseData.time}, ${toddlerSenseData.category}, ${toddlerSenseData.ageGroupMin},
            ${toddlerSenseData.ageGroupMax}, ${toddlerSenseData.price}, ${toddlerSenseData.rating},
            ${toddlerSenseData.isActive}, ${toddlerSenseData.isFeatured}
          )
        `;
        console.log(`✅ Created: ${toddlerSenseData.name}`);
      }

      // Remove the combined class
      await sql`
        DELETE FROM classes WHERE id = ${combinedClass.id}
      `;
      console.log(`🗑️ Removed combined class: ${combinedClass.name}`);

    } catch (error) {
      console.error(`Error processing ${combinedClass.name}:`, error);
    }
  }

  // Check final results
  const count = await sql`
    SELECT COUNT(*) as count FROM classes 
    WHERE town = 'Andover' OR postcode LIKE 'SP10%' OR postcode LIKE 'SP11%'
  `;
  
  const featuredCount = await sql`
    SELECT COUNT(*) as count FROM classes 
    WHERE (town = 'Andover' OR postcode LIKE 'SP10%' OR postcode LIKE 'SP11%')
    AND is_featured = true
  `;

  console.log(`🎉 Class separation complete!`);
  console.log(`Total Andover classes: ${count[0].count}`);
  console.log(`Featured classes: ${featuredCount[0].count}`);
}

separateCombinedClasses().catch(console.error);