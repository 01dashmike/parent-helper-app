const { Client } = require('pg');

async function investigateSyncIssues() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🔍 INVESTIGATING SYNC ISSUES');
    console.log('📊 Finding why all 5,947 authentic businesses aren\'t syncing...\n');

    // 1. Check exact count in database
    const dbCount = await client.query('SELECT COUNT(*) FROM classes WHERE is_active = true');
    console.log(`📈 Database: ${dbCount.rows[0].count} authentic businesses`);

    // 2. Check for duplicate names in database
    const duplicateCheck = await client.query(`
      SELECT name, COUNT(*) as count 
      FROM classes 
      WHERE is_active = true 
      GROUP BY name 
      HAVING COUNT(*) > 1 
      ORDER BY count DESC 
      LIMIT 10
    `);
    
    console.log(`🔄 Database duplicates: ${duplicateCheck.rows.length} business names appear multiple times`);
    if (duplicateCheck.rows.length > 0) {
      console.log('Top duplicate business names:');
      duplicateCheck.rows.forEach(row => {
        console.log(`   "${row.name}": ${row.count} entries`);
      });
    }

    // 3. Get accurate Airtable count
    let airtableBusinesses = new Map();
    let airtableCount = 0;
    let offset = '';
    
    console.log('\n📋 Checking complete Airtable contents...');
    do {
      const url = `https://api.airtable.com/v0/${baseId}/Parent%20Helper?pageSize=100&fields%5B%5D=Business_Name${offset ? `&offset=${offset}` : ''}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        data.records.forEach(record => {
          if (record.fields.Business_Name) {
            const name = record.fields.Business_Name.trim();
            if (airtableBusinesses.has(name)) {
              airtableBusinesses.set(name, airtableBusinesses.get(name) + 1);
            } else {
              airtableBusinesses.set(name, 1);
            }
          }
        });
        airtableCount += data.records.length;
        offset = data.offset || '';
        
        if (airtableCount % 500 === 0) {
          console.log(`   Checked ${airtableCount} Airtable records...`);
        }
      } else {
        console.log(`❌ Airtable API error: ${response.status}`);
        break;
      }
    } while (offset);

    console.log(`📊 Airtable: ${airtableCount} total records`);

    // 4. Check for duplicates in Airtable
    const airtableDuplicates = Array.from(airtableBusinesses.entries())
      .filter(([name, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);
    
    console.log(`🔄 Airtable duplicates: ${airtableDuplicates.length} business names appear multiple times`);
    if (airtableDuplicates.length > 0) {
      console.log('Top duplicate business names in Airtable:');
      airtableDuplicates.slice(0, 10).forEach(([name, count]) => {
        console.log(`   "${name}": ${count} entries`);
      });
    }

    // 5. Find businesses missing from Airtable
    const allDbBusinesses = await client.query(`
      SELECT DISTINCT name 
      FROM classes 
      WHERE is_active = true 
      ORDER BY name
    `);

    const missingFromAirtable = allDbBusinesses.rows.filter(row => 
      !airtableBusinesses.has(row.name.trim())
    );

    console.log(`\n📋 SYNC ANALYSIS:`);
    console.log(`   Database unique businesses: ${allDbBusinesses.rows.length}`);
    console.log(`   Airtable unique businesses: ${airtableBusinesses.size}`);
    console.log(`   Missing from Airtable: ${missingFromAirtable.length}`);
    console.log(`   Extra duplicates in Airtable: ${airtableCount - airtableBusinesses.size}`);

    if (missingFromAirtable.length > 0) {
      console.log(`\n📝 Sample businesses missing from Airtable:`);
      missingFromAirtable.slice(0, 10).forEach((row, idx) => {
        console.log(`   ${idx + 1}. "${row.name}"`);
      });
    }

    // 6. Check data quality issues
    const dataQualityCheck = await client.query(`
      SELECT 
        COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as empty_names,
        COUNT(CASE WHEN town IS NULL OR town = '' THEN 1 END) as empty_towns,
        COUNT(CASE WHEN venue IS NULL OR venue = '' THEN 1 END) as empty_venues,
        COUNT(CASE WHEN LENGTH(name) > 100 THEN 1 END) as long_names
      FROM classes 
      WHERE is_active = true
    `);

    const quality = dataQualityCheck.rows[0];
    console.log(`\n🔍 DATA QUALITY ISSUES:`);
    console.log(`   Empty/null names: ${quality.empty_names}`);
    console.log(`   Empty/null towns: ${quality.empty_towns}`);
    console.log(`   Empty/null venues: ${quality.empty_venues}`);
    console.log(`   Very long names (>100 chars): ${quality.long_names}`);

    // 7. Root cause analysis
    console.log(`\n🎯 ROOT CAUSE ANALYSIS:`);
    
    if (missingFromAirtable.length > 3000) {
      console.log(`❌ MAJOR ISSUE: ${missingFromAirtable.length} businesses never synced`);
      console.log(`   Likely causes: Sync process incomplete, API rate limiting, or connection issues`);
    } else if (airtableDuplicates.length > 500) {
      console.log(`❌ DUPLICATE ISSUE: Many businesses synced multiple times`);
      console.log(`   Cause: Sync process not checking for existing entries properly`);
    } else if (quality.empty_names > 0) {
      console.log(`❌ DATA ISSUE: ${quality.empty_names} businesses have empty names`);
      console.log(`   Cause: Data quality problems preventing sync`);
    } else {
      console.log(`✅ No major blocking issues identified`);
      console.log(`   Sync appears to be working but may need to complete more cycles`);
    }

    // 8. Recommended solution
    console.log(`\n💡 RECOMMENDED SOLUTION:`);
    if (airtableDuplicates.length > 100) {
      console.log(`1. Clean up duplicates in Airtable first`);
      console.log(`2. Implement duplicate checking in sync process`);
      console.log(`3. Resume sync with missing businesses only`);
    } else {
      console.log(`1. Continue systematic sync of ${missingFromAirtable.length} missing businesses`);
      console.log(`2. Use smaller batches to avoid API limits`);
      console.log(`3. Implement proper duplicate checking`);
    }

  } catch (error) {
    console.error('❌ Investigation error:', error.message);
  } finally {
    await client.end();
  }
}

investigateSyncIssues().catch(console.error);