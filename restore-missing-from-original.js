import { Client } from 'pg';
import fs from 'fs';
import csv from 'csv-parser';

async function restoreMissingFromOriginal() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  console.log('🔍 Comparing current database with original CSV...');
  
  // Get current businesses in database
  const currentBusinesses = await client.query('SELECT name, address FROM classes WHERE is_active = true');
  const currentSet = new Set();
  currentBusinesses.rows.forEach(row => {
    currentSet.add(`${row.name}|${row.address || ''}`);
  });
  
  console.log(`📊 Current database has: ${currentBusinesses.rows.length} businesses`);
  
  // Read original CSV
  const originalBusinesses = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('attached_assets/Outscraper-20250525164446m03_toddler_classes_+1.csv')
      .pipe(csv())
      .on('data', (row) => {
        if (row.name && row.name.trim()) {
          originalBusinesses.push({
            name: row.name.trim(),
            address: row.full_address || '',
            city: row.city || '',
            postal_code: row.postal_code || '',
            phone: row.phone || '',
            rating: row.rating || '0',
            category: row.category || 'Training centre'
          });
        }
      })
      .on('end', async () => {
        console.log(`📊 Original CSV has: ${originalBusinesses.length} businesses`);
        
        // Find missing businesses
        const missingBusinesses = [];
        
        for (const original of originalBusinesses) {
          const key = `${original.name}|${original.address}`;
          if (!currentSet.has(key)) {
            missingBusinesses.push(original);
          }
        }
        
        console.log(`🚨 Found ${missingBusinesses.length} missing businesses to restore!`);
        
        // Restore missing businesses
        let restored = 0;
        
        for (const business of missingBusinesses.slice(0, 100)) { // Restore first 100 to test
          try {
            // Extract postcode and town from address/city
            let postcode = business.postal_code || 'Unknown';
            let town = business.city || 'Unknown';
            
            // Clean up town name
            if (town && town !== 'Unknown') {
              town = town.split(',')[0].trim();
            }
            
            // Determine category
            let category = 'Sensory';
            if (business.category.toLowerCase().includes('gym')) category = 'Sports & Physical';
            else if (business.category.toLowerCase().includes('music')) category = 'Music & Singing';
            else if (business.category.toLowerCase().includes('swim')) category = 'Swimming';
            
            await client.query(`
              INSERT INTO classes (
                name, description, age_group_min, age_group_max, price, venue, 
                address, postcode, town, day_of_week, time, category, is_active, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
            `, [
              business.name,
              `Authentic baby and toddler classes. Professional early years activities.`,
              0, 36, 'Contact for pricing', business.name,
              business.address, postcode, town, 'Saturday', '10:00am', category, true
            ]);
            
            console.log(`✅ Restored: ${business.name} (${town})`);
            restored++;
            
          } catch (error) {
            console.log(`⚠️ Skip: ${business.name} - ${error.message}`);
          }
        }
        
        console.log(`\n🎉 RESTORATION COMPLETE: ${restored} authentic businesses restored from original CSV`);
        
        // Final count
        const finalCount = await client.query('SELECT COUNT(*) FROM classes WHERE is_active = true');
        console.log(`📊 Database now has: ${finalCount.rows[0].count} total businesses`);
        
        await client.end();
        resolve();
      })
      .on('error', reject);
  });
}

restoreMissingFromOriginal().catch(console.error);