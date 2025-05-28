const { Client } = require('pg');

async function analyzeTopCompanies() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('📊 Analyzing top companies in your database...');

    // Extract company names from business names and count entries
    const result = await client.query(`
      WITH company_analysis AS (
        SELECT 
          CASE 
            WHEN name ILIKE '%baby sensory%' THEN 'Baby Sensory'
            WHEN name ILIKE '%toddler sense%' THEN 'Toddler Sense'
            WHEN name ILIKE '%water babies%' THEN 'Water Babies'
            WHEN name ILIKE '%tumble tots%' THEN 'Tumble Tots'
            WHEN name ILIKE '%monkey music%' THEN 'Monkey Music'
            WHEN name ILIKE '%jo jingles%' THEN 'Jo Jingles'
            WHEN name ILIKE '%sing and sign%' THEN 'Sing and Sign'
            WHEN name ILIKE '%little kickers%' THEN 'Little Kickers'
            WHEN name ILIKE '%rugrats%' THEN 'Rugrats and Halfpints'
            WHEN name ILIKE '%boogie%' THEN 'Boogie Beat/Pumps'
            WHEN name ILIKE '%diddi dance%' THEN 'Diddi Dance'
            WHEN name ILIKE '%adventure babies%' THEN 'Adventure Babies'
            WHEN name ILIKE '%artventur%' THEN 'ARTventurers'
            WHEN name ILIKE '%moo music%' THEN 'Moo Music'
            WHEN name ILIKE '%tots play%' THEN 'Tots Play'
            WHEN name ILIKE '%splat%' THEN 'Splat Messy Play'
            WHEN name ILIKE '%zozimus%' THEN 'Zozimus Drama'
            WHEN name ILIKE '%you me moments%' THEN 'You Me Moments'
            ELSE 'Other'
          END as company_name,
          name as business_name,
          address,
          venue,
          town,
          postcode
        FROM classes
        WHERE name IS NOT NULL AND name != ''
      )
      SELECT 
        company_name,
        COUNT(*) as total_entries,
        COUNT(CASE WHEN address IS NOT NULL AND address != '' AND address != 'Unknown' THEN 1 END) as entries_with_address,
        COUNT(CASE WHEN venue IS NOT NULL AND venue != '' THEN 1 END) as entries_with_venue,
        ROUND(
          (COUNT(CASE WHEN address IS NOT NULL AND address != '' AND address != 'Unknown' THEN 1 END) * 100.0 / COUNT(*)), 
          1
        ) as address_completion_percentage
      FROM company_analysis
      WHERE company_name != 'Other'
      GROUP BY company_name
      ORDER BY total_entries DESC
      LIMIT 20
    `);

    console.log('\n🏆 TOP COMPANIES BY NUMBER OF ENTRIES:');
    console.log('Company Name                | Total | With Address | Venue | Address %');
    console.log('---------------------------|-------|--------------|-------|----------');
    
    result.rows.forEach(company => {
      console.log(
        `${company.company_name.padEnd(26)} | ${company.total_entries.toString().padStart(5)} | ${company.entries_with_address.toString().padStart(12)} | ${company.entries_with_venue.toString().padStart(5)} | ${company.address_completion_percentage.toString().padStart(7)}%`
      );
    });

    // Get specific details for Baby Sensory and Toddler Sense
    const topTwoDetails = await client.query(`
      SELECT name, address, venue, town, postcode
      FROM classes 
      WHERE name ILIKE '%baby sensory%' OR name ILIKE '%toddler sense%'
      ORDER BY 
        CASE WHEN name ILIKE '%baby sensory%' THEN 1 ELSE 2 END,
        town
      LIMIT 10
    `);

    console.log('\n🔍 SAMPLE ENTRIES FOR TOP COMPANIES:');
    topTwoDetails.rows.forEach(entry => {
      console.log(`${entry.name} - ${entry.town} - ${entry.address || 'No address'}`);
    });

    return result.rows;

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

analyzeTopCompanies();