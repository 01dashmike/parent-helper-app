import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function applySessionGroupingGlobally() {
  console.log('🔧 Applying session grouping fixes globally...');
  
  // Find all businesses that have multiple sessions (like Baby Sensory, Toddler Sense, etc.)
  const duplicateBusinesses = await sql`
    SELECT 
      TRIM(REGEXP_REPLACE(name, ' - (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday).*$', '', 'i')) as base_name,
      COUNT(*) as session_count,
      town
    FROM classes 
    WHERE is_active = true
    GROUP BY base_name, town
    HAVING COUNT(*) > 1
    ORDER BY session_count DESC
    LIMIT 50
  `;

  console.log(`Found ${duplicateBusinesses.length} businesses with multiple sessions to optimize`);

  for (const business of duplicateBusinesses) {
    console.log(`\n📋 Processing: ${business.base_name} in ${business.town} (${business.session_count} sessions)`);
    
    // Get all sessions for this business
    const sessions = await sql`
      SELECT * FROM classes 
      WHERE TRIM(REGEXP_REPLACE(name, ' - (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday).*$', '', 'i')) = ${business.base_name}
      AND town = ${business.town}
      AND is_active = true
      ORDER BY day_of_week, time
    `;

    if (sessions.length > 1) {
      // Keep the first session as the main business listing
      const mainSession = sessions[0];
      const additionalSessions = sessions.slice(1);

      // Update the main session to have the clean business name
      await sql`
        UPDATE classes 
        SET name = ${business.base_name}
        WHERE id = ${mainSession.id}
      `;

      // Create session records in a sessions table (or mark others as grouped)
      for (const session of additionalSessions) {
        await sql`
          UPDATE classes 
          SET is_active = false, 
              name = ${session.name + ' (GROUPED)'}
          WHERE id = ${session.id}
        `;
      }

      console.log(`✅ Grouped ${business.base_name}: 1 main + ${additionalSessions.length} grouped sessions`);
    }
  }

  // Check results
  const finalCount = await sql`
    SELECT COUNT(*) as active_classes FROM classes WHERE is_active = true
  `;
  
  const uniqueBusinesses = await sql`
    SELECT COUNT(DISTINCT TRIM(REGEXP_REPLACE(name, ' - (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday).*$', '', 'i'))) as unique_count 
    FROM classes WHERE is_active = true
  `;

  console.log(`🎉 Session grouping complete!`);
  console.log(`Active classes: ${finalCount[0].active_classes}`);
  console.log(`Unique businesses: ${uniqueBusinesses[0].unique_count}`);
}

applySessionGroupingGlobally().catch(console.error);