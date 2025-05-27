const { Client } = require('pg');

async function checkProgressAndContinue() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('📊 CHECKING CURRENT PROGRESS');
    
    // Quick count of current Airtable records
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/Parent%20Helper?pageSize=1`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      console.log('✅ Airtable connection active');
      
      // Get a few pages to estimate total
      let estimatedTotal = 0;
      let offset = '';
      for (let page = 0; page < 30; page++) {
        const pageUrl = `https://api.airtable.com/v0/${baseId}/Parent%20Helper?pageSize=100${offset ? `&offset=${offset}` : ''}`;
        const pageResponse = await fetch(pageUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (pageResponse.ok) {
          const pageData = await pageResponse.json();
          estimatedTotal += pageData.records.length;
          offset = pageData.offset || '';
          if (!offset) break;
        } else break;
      }
      
      console.log(`📈 Current estimate: ~${estimatedTotal} authentic businesses in Airtable`);
      console.log(`🎯 Target: 5,232 unique authentic businesses`);
      
      const remaining = 5232 - estimatedTotal;
      if (remaining > 0) {
        console.log(`🚀 Continuing with ${remaining} businesses remaining`);
        
        // Continue with efficient batches
        for (let batch = 1; batch <= 10; batch++) {
          const startOffset = Math.floor(Math.random() * 4000);
          const businesses = await client.query(`
            SELECT 
              name, category, town, postcode, venue, address,
              age_group_min, age_group_max, day_of_week, time, price,
              is_featured
            FROM classes 
            WHERE is_active = true 
            ORDER BY id ASC
            LIMIT 10 OFFSET $1
          `, [startOffset]);

          if (businesses.rows.length > 0) {
            const records = businesses.rows.map(row => ({
              fields: {
                'Business_Name': row.name.trim(),
                'Category': row.category || 'Educational',
                'Town': row.town || '',
                'Venue_Name': row.venue || '',
                'Full_Address': row.address || '',
                'Age_Min_Months': parseInt(row.age_group_min) || 0,
                'Age_Max_Months': parseInt(row.age_group_max) || 12,
                'Price': row.price || 'Contact for pricing',
                'Featured': Boolean(row.is_featured)
              }
            }));

            try {
              const addResponse = await fetch(`https://api.airtable.com/v0/${baseId}/Parent%20Helper`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ records, typecast: true })
              });

              if (addResponse.ok) {
                const result = await addResponse.json();
                console.log(`   ✅ Batch ${batch}: Added ${result.records.length} businesses`);
              }
            } catch (error) {
              console.log(`   ⚠️ Batch ${batch}: Continuing...`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        console.log('📦 Batch session complete - building your authentic directory!');
      } else {
        console.log('🎉 Excellent! Your authentic directory appears complete!');
      }
    }

  } catch (error) {
    console.error('Progress check error:', error.message);
  } finally {
    await client.end();
  }
}

checkProgressAndContinue().catch(console.error);