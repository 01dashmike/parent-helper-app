import { Client } from 'pg';

async function monitorExpansionProgress() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  console.log('📊 MONITORING PRIORITY CITIES EXPANSION PROGRESS...');
  console.log('🔄 Checking every 30 seconds for updates\n');
  
  // Starting counts for comparison
  const startingCounts = {
    'Glasgow': 12,
    'Sheffield': 22,
    'Edinburgh': 15,
    'Cardiff': 12,
    'Bradford': 15,
    'Bristol': 35
  };
  
  let previousCounts = {};
  let checkCount = 0;
  
  while (true) {
    checkCount++;
    console.log(`📈 UPDATE #${checkCount} - ${new Date().toLocaleTimeString()}`);
    
    try {
      // Get current counts for all priority cities
      const result = await client.query(`
        SELECT 
          town, 
          COUNT(*) as current_total
        FROM classes 
        WHERE is_active = true 
        AND town IN ('Glasgow', 'Sheffield', 'Edinburgh', 'Cardiff', 'Bradford', 'Bristol')
        GROUP BY town 
        ORDER BY CASE 
          WHEN town = 'Glasgow' THEN 1
          WHEN town = 'Sheffield' THEN 2
          WHEN town = 'Edinburgh' THEN 3
          WHEN town = 'Cardiff' THEN 4
          WHEN town = 'Bradford' THEN 5
          WHEN town = 'Bristol' THEN 6
        END
      `);
      
      // Get total database count
      const totalResult = await client.query('SELECT COUNT(*) as total FROM classes WHERE is_active = true');
      const totalBusinesses = parseInt(totalResult.rows[0].total);
      
      console.log(`🎯 TOTAL DATABASE: ${totalBusinesses} authentic businesses`);
      console.log('');
      
      let hasChanges = false;
      let activeExpansion = null;
      
      for (const row of result.rows) {
        const town = row.town;
        const current = parseInt(row.current_total);
        const starting = startingCounts[town];
        const added = current - starting;
        const previous = previousCounts[town] || starting;
        const recentChange = current - previous;
        
        let status = '⏸️ No change';
        if (recentChange > 0) {
          status = `🚀 +${recentChange} just added!`;
          hasChanges = true;
          activeExpansion = town;
        } else if (added > 0) {
          status = '✅ Previously expanded';
        }
        
        console.log(`${town.padEnd(12)} | ${current.toString().padStart(2)} businesses | +${added.toString().padStart(2)} total | ${status}`);
        previousCounts[town] = current;
      }
      
      if (hasChanges) {
        console.log(`\n🎉 ACTIVE EXPANSION DETECTED IN ${activeExpansion}!`);
      } else if (checkCount > 1) {
        console.log('\n⏸️ No recent changes detected - expansion may have completed or paused');
      }
      
      // Check if all cities have reached good coverage
      const allExpanded = result.rows.every(row => {
        const current = parseInt(row.current_total);
        const starting = startingCounts[row.town];
        return (current - starting) >= 10; // At least 10 businesses added to each
      });
      
      if (allExpanded) {
        console.log('\n🎉 ALL PRIORITY CITIES APPEAR TO HAVE BEEN EXPANDED!');
        console.log('✅ Expansion likely complete - stopping monitor');
        break;
      }
      
    } catch (error) {
      console.log(`❌ Monitor error: ${error.message}`);
    }
    
    console.log('\n' + '─'.repeat(60) + '\n');
    
    // Wait 30 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
  
  await client.end();
}

// Run the monitor
monitorExpansionProgress().catch(error => {
  console.log('Monitor stopped:', error.message);
});