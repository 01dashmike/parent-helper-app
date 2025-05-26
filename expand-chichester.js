import { Client } from 'pg';

async function expandChichester() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  console.log('🚀 EXPANDING CHICHESTER COVERAGE...');
  
  // Chichester postcode areas: PO18, PO19, PO20
  // Reassign surrounding West Sussex businesses to Chichester
  const chichesterPostcodes = ['PO18', 'PO19', 'PO20'];
  
  let totalReassigned = 0;
  
  for (const postcode of chichesterPostcodes) {
    const result = await client.query(
      'UPDATE classes SET town = $1 WHERE postcode LIKE $2 AND is_active = true AND town != $1',
      ['Chichester', `${postcode}%`]
    );
    
    if (result.rowCount > 0) {
      console.log(`✅ ${result.rowCount} businesses reassigned from ${postcode} area to Chichester`);
      totalReassigned += result.rowCount;
    }
  }
  
  // Also check for businesses that might be in surrounding towns but should be Chichester
  const surroundingAreas = await client.query(`
    UPDATE classes 
    SET town = 'Chichester'
    WHERE is_active = true 
    AND (
      address LIKE '%Chichester%' OR
      address LIKE '%Bognor Regis%' OR
      address LIKE '%Selsey%' OR
      address LIKE '%Midhurst%' OR
      address LIKE '%Petworth%'
    )
    AND town != 'Chichester'
  `);
  
  if (surroundingAreas.rowCount > 0) {
    console.log(`✅ ${surroundingAreas.rowCount} businesses reassigned from surrounding areas to Chichester`);
    totalReassigned += surroundingAreas.rowCount;
  }
  
  // Get final count
  const finalCount = await client.query(
    'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
    ['Chichester']
  );
  
  console.log(`\n📊 CHICHESTER EXPANSION COMPLETE:`);
  console.log(`   Total businesses reassigned: ${totalReassigned}`);
  console.log(`   Final Chichester count: ${finalCount.rows[0].count} businesses`);
  
  // Show breakdown of what we found
  const breakdown = await client.query(`
    SELECT 
      category,
      COUNT(*) as count
    FROM classes 
    WHERE town = 'Chichester' AND is_active = true 
    GROUP BY category 
    ORDER BY count DESC
  `);
  
  console.log(`\n📈 CHICHESTER CATEGORIES:`);
  breakdown.rows.forEach(row => {
    console.log(`   ${row.category}: ${row.count} businesses`);
  });

  await client.end();
}

// Run the expansion
expandChichester().catch(console.error);