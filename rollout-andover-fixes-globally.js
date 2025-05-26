import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function rolloutAndoverFixesGlobally() {
  console.log('🔧 Rolling out Andover fixes across all areas...');
  
  // 1. Separate all combined Baby Sensory & Toddler Sense classes
  console.log('\n📋 Step 1: Separating combined classes...');
  
  const combinedClasses = await sql`
    SELECT * FROM classes 
    WHERE (name LIKE '%Baby Sensory%Toddler Sense%' 
    OR name LIKE '%Toddler Sense%Baby Sensory%'
    OR name LIKE '%Baby Sensory & Toddler Sense%')
    AND is_active = true
    LIMIT 50
  `;

  console.log(`Found ${combinedClasses.length} combined classes to separate`);

  for (const combinedClass of combinedClasses) {
    try {
      // Create Baby Sensory class
      await sql`
        INSERT INTO classes (
          name, description, venue, address, postcode, town,
          latitude, longitude, day_of_week, time, category, 
          age_group_min, age_group_max, price, rating, is_active, is_featured
        ) VALUES (
          ${'Baby Sensory ' + combinedClass.town}, 
          'Award-winning baby development classes with light shows, music and sensory play for babies 0-13 months.',
          ${combinedClass.venue},
          ${combinedClass.address}, 
          ${combinedClass.postcode}, 
          ${combinedClass.town},
          ${combinedClass.latitude}, 
          ${combinedClass.longitude}, 
          'Thursday',
          '10:30am', 
          'sensory', 
          0,
          13, 
          '13.00', 
          ${combinedClass.rating || '4.8'},
          true, 
          true
        )
      `;

      // Create Toddler Sense class  
      await sql`
        INSERT INTO classes (
          name, description, venue, address, postcode, town,
          latitude, longitude, day_of_week, time, category, 
          age_group_min, age_group_max, price, rating, is_active, is_featured
        ) VALUES (
          ${'Toddler Sense ' + combinedClass.town}, 
          'Award-winning structured toddler classes that aid development through sensory play, movement and music for walking toddlers.',
          ${combinedClass.venue},
          ${combinedClass.address}, 
          ${combinedClass.postcode}, 
          ${combinedClass.town},
          ${combinedClass.latitude}, 
          ${combinedClass.longitude}, 
          'Friday',
          '10:00am', 
          'sensory', 
          13,
          24, 
          '12.50', 
          ${combinedClass.rating || '4.8'},
          true, 
          true
        )
      `;

      // Remove combined class
      await sql`DELETE FROM classes WHERE id = ${combinedClass.id}`;
      
      console.log(`✅ Separated: ${combinedClass.name} → Baby Sensory + Toddler Sense ${combinedClass.town}`);
      
    } catch (error) {
      console.error(`Error separating ${combinedClass.name}:`, error);
    }
  }

  // 2. Add missing featured classes to areas that have Baby Sensory/Toddler Sense but no featured
  console.log('\n⭐ Step 2: Adding missing featured classes...');
  
  const areasNeedingFeatured = await sql`
    SELECT DISTINCT town FROM classes 
    WHERE (name LIKE '%Baby Sensory%' OR name LIKE '%Toddler Sense%') 
    AND is_active = true
    AND town NOT IN (SELECT DISTINCT town FROM classes WHERE is_featured = true AND is_active = true)
    LIMIT 20
  `;

  for (const area of areasNeedingFeatured) {
    try {
      // Check if Baby Sensory exists and make it featured
      const babySensory = await sql`
        SELECT id FROM classes 
        WHERE name LIKE ${'%Baby Sensory%' + area.town + '%'} 
        AND is_active = true
        LIMIT 1
      `;

      if (babySensory.length > 0) {
        await sql`UPDATE classes SET is_featured = true WHERE id = ${babySensory[0].id}`;
        console.log(`⭐ Made Baby Sensory ${area.town} featured`);
      }

      // Check if Toddler Sense exists and make it featured  
      const toddlerSense = await sql`
        SELECT id FROM classes 
        WHERE name LIKE ${'%Toddler Sense%' + area.town + '%'} 
        AND is_active = true
        LIMIT 1
      `;

      if (toddlerSense.length > 0) {
        await sql`UPDATE classes SET is_featured = true WHERE id = ${toddlerSense[0].id}`;
        console.log(`⭐ Made Toddler Sense ${area.town} featured`);
      }
      
    } catch (error) {
      console.error(`Error adding featured to ${area.town}:`, error);
    }
  }

  // 3. Final stats
  const finalStats = await sql`
    SELECT 
      COUNT(*) as total_active,
      COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_count,
      COUNT(CASE WHEN name LIKE '%Baby Sensory%Toddler Sense%' THEN 1 END) as remaining_combined
    FROM classes WHERE is_active = true
  `;

  console.log('\n🎉 Andover fixes rollout complete!');
  console.log(`Total active classes: ${finalStats[0].total_active}`);
  console.log(`Featured classes: ${finalStats[0].featured_count}`);
  console.log(`Remaining combined classes: ${finalStats[0].remaining_combined}`);
}

rolloutAndoverFixesGlobally().catch(console.error);