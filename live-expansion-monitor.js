import { Client } from 'pg';

async function liveExpansionMonitor() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  console.log('📊 LIVE EXPANSION MONITOR - REAL-TIME UPDATES');
  console.log('🔄 Checking every 10 seconds for changes\n');
  
  const startingCounts = {
    'Glasgow': 12, 'Sheffield': 22, 'Edinburgh': 15,
    'Cardiff': 12, 'Bradford': 15, 'Bristol': 35
  };
  
  let previousCounts = {};
  let updateNumber = 0;
  
  while (true) {
    updateNumber++;
    const now = new Date().toLocaleTimeString();
    
    try {
      // Get current counts
      const result = await client.query(`
        SELECT town, COUNT(*) as count
        FROM classes 
        WHERE is_active = true 
        AND town IN ('Glasgow', 'Sheffield', 'Edinburgh', 'Cardiff', 'Bradford', 'Bristol')
        GROUP BY town
      `);
      
      const totalResult = await client.query('SELECT COUNT(*) as total FROM classes WHERE is_active = true');
      const totalBusinesses = parseInt(totalResult.rows[0].total);
      
      console.log(`\n🕐 UPDATE #${updateNumber} - ${now}`);
      console.log(`📊 TOTAL DATABASE: ${totalBusinesses} businesses`);
      console.log('─'.repeat(50));
      
      let hasActivity = false;
      let mostActive = null;
      let mostRecentChange = 0;
      
      for (const row of result.rows) {
        const town = row.town;
        const current = parseInt(row.count);
        const starting = startingCounts[town];
        const totalAdded = current - starting;
        const previous = previousCounts[town] || starting;
        const recentChange = current - previous;
        
        let status = '⏸️';
        if (recentChange > 0) {
          status = `🚀 +${recentChange}`;
          hasActivity = true;
          if (recentChange > mostRecentChange) {
            mostRecentChange = recentChange;
            mostActive = town;
          }
        } else if (totalAdded > 0) {
          status = '✅';
        }
        
        console.log(`${town.padEnd(12)} | ${current.toString().padStart(3)} total | +${totalAdded.toString().padStart(2)} added | ${status}`);
        previousCounts[town] = current;
      }
      
      if (hasActivity && mostActive) {
        console.log(`\n🎯 ACTIVE EXPANSION: ${mostActive} (+${mostRecentChange} businesses just added!)`);
      } else if (updateNumber > 1) {
        console.log('\n⏸️ No recent activity - expansion may be between cities or completed');
      }
      
      // Check if expansion appears complete
      const totalProgress = result.rows.reduce((sum, row) => {
        const current = parseInt(row.count);
        const starting = startingCounts[row.town];
        return sum + (current - starting);
      }, 0);
      
      if (totalProgress >= 50) {
        console.log('\n🎉 MAJOR PROGRESS ACHIEVED! 50+ businesses added across priority cities');
      }
      
    } catch (error) {
      console.log(`❌ Monitor error: ${error.message}`);
    }
    
    // Wait 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Stop after 20 updates (200 seconds) to avoid endless running
    if (updateNumber >= 20) {
      console.log('\n⏰ Monitor completed 20 updates - stopping to avoid endless running');
      break;
    }
  }
  
  await client.end();
}

// Run the live monitor
liveExpansionMonitor().catch(error => {
  console.log('Monitor error:', error.message);
});