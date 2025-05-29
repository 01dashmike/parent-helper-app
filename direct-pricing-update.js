import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function updateAuthenticPricing() {
  console.log('🎯 Updating authentic pricing for verified businesses...');
  
  const client = await pool.connect();
  try {
    // Update A Better Start Southend with the £40 pricing we found
    const result1 = await client.query(`
      UPDATE classes 
      SET price = '£40.00', last_verified = CURRENT_TIMESTAMP
      WHERE name LIKE '%A Better Start Southend%' 
      AND website = 'http://www.abetterstartsouthend.co.uk'
      AND (price IS NULL OR price = '' OR price = 'Contact for pricing')
      RETURNING id, name, price
    `);
    
    console.log(`✅ Updated A Better Start Southend: ${result1.rowCount} records`);
    result1.rows.forEach(row => {
      console.log(`   • ${row.name}: ${row.price}`);
    });
    
    // Removed: Generic franchise pricing violates data integrity policy
    // Only individual business pricing from authentic sources should be used
    console.log('⚠️ Skipping franchise pricing - only authentic individual business data allowed');
    
    // Check overall pricing coverage
    const coverage = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE price IS NOT NULL AND price != '' AND price != 'Contact for pricing') as has_pricing
      FROM classes WHERE is_active = true
    `);
    
    const { total, has_pricing } = coverage.rows[0];
    const percentage = ((has_pricing / total) * 100).toFixed(2);
    console.log(`\n📊 Updated pricing coverage: ${has_pricing}/${total} (${percentage}%)`);
    
  } finally {
    client.release();
    await pool.end();
  }
}

updateAuthenticPricing().catch(console.error);