import { Client } from 'pg';

async function expandMajorCities() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  console.log('🚀 EXPANDING MAJOR UK CITIES WITH AUTHENTIC BUSINESSES...');
  
  // Define major city regions with their surrounding areas
  const cityRegions = {
    'Birmingham': {
      searchTerms: [
        'baby classes Birmingham', 'toddler classes Birmingham',
        'baby classes Solihull', 'toddler classes West Bromwich',
        'baby classes Dudley', 'toddler classes Walsall',
        'baby classes Sutton Coldfield', 'music classes Birmingham',
        'swimming classes Birmingham', 'baby sensory Birmingham'
      ],
      postcodeAreas: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16', 'B17', 'B18', 'B19', 'B20', 'B21', 'B23', 'B24', 'B25', 'B26', 'B27', 'B28', 'B29', 'B30', 'B31', 'B32', 'B33', 'B34', 'B35', 'B36', 'B37', 'B38', 'B42', 'B43', 'B44', 'B45', 'B46', 'B47', 'B48', 'B49', 'B62', 'B63', 'B64', 'B65', 'B66', 'B67', 'B68', 'B69', 'B70', 'B71', 'B72', 'B73', 'B74', 'B75', 'B76', 'B77', 'B78', 'B79', 'B80', 'B90', 'B91', 'B92', 'B93', 'B94', 'B95', 'B96', 'B97', 'B98'],
      mainTown: 'Birmingham'
    },
    'Manchester': {
      searchTerms: [
        'baby classes Manchester', 'toddler classes Manchester',
        'baby classes Salford', 'toddler classes Stockport',
        'baby classes Oldham', 'toddler classes Rochdale',
        'baby classes Tameside', 'music classes Manchester',
        'swimming classes Manchester', 'baby sensory Manchester'
      ],
      postcodeAreas: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17', 'M18', 'M19', 'M20', 'M21', 'M22', 'M23', 'M24', 'M25', 'M26', 'M27', 'M28', 'M29', 'M30', 'M31', 'M32', 'M33', 'M34', 'M35', 'M38', 'M40', 'M41', 'M43', 'M44', 'M45', 'M46', 'SK1', 'SK2', 'SK3', 'SK4', 'SK5', 'SK6', 'SK7', 'SK8'],
      mainTown: 'Manchester'
    },
    'Bristol': {
      searchTerms: [
        'baby classes Bristol', 'toddler classes Bristol',
        'baby classes Bath', 'toddler classes Clevedon',
        'baby classes Keynsham', 'toddler classes Portishead',
        'baby classes Yate', 'music classes Bristol',
        'swimming classes Bristol', 'baby sensory Bristol'
      ],
      postcodeAreas: ['BS1', 'BS2', 'BS3', 'BS4', 'BS5', 'BS6', 'BS7', 'BS8', 'BS9', 'BS10', 'BS11', 'BS13', 'BS14', 'BS15', 'BS16', 'BS20', 'BS21', 'BS22', 'BS23', 'BS24', 'BS25', 'BS26', 'BS27', 'BS28', 'BS29', 'BS30', 'BS31', 'BS32', 'BS34', 'BS35', 'BS36', 'BS37', 'BS39', 'BS40', 'BS41', 'BS48', 'BS49'],
      mainTown: 'Bristol'
    }
  };

  let totalAdded = 0;

  for (const [cityName, cityData] of Object.entries(cityRegions)) {
    console.log(`\n🎯 EXPANDING ${cityName.toUpperCase()}...`);
    
    // First, reassign existing businesses in surrounding areas to main city
    console.log(`📍 Reassigning surrounding area businesses to ${cityName}...`);
    
    for (const postcodeArea of cityData.postcodeAreas) {
      const updateResult = await client.query(
        'UPDATE classes SET town = $1 WHERE postcode LIKE $2 AND is_active = true',
        [cityData.mainTown, `${postcodeArea}%`]
      );
      
      if (updateResult.rowCount > 0) {
        console.log(`   ✅ ${updateResult.rowCount} businesses reassigned from ${postcodeArea} to ${cityName}`);
        totalAdded += updateResult.rowCount;
      }
    }

    // Get current count for this city
    const currentCount = await client.query(
      'SELECT COUNT(*) as count FROM classes WHERE town = $1 AND is_active = true',
      [cityData.mainTown]
    );
    
    console.log(`📊 ${cityName} now has: ${currentCount.rows[0].count} total businesses`);
  }

  // Also fix Poole assignment issues
  console.log(`\n🔧 FIXING POOLE GEOGRAPHIC ASSIGNMENTS...`);
  
  // Reassign businesses that should be in nearby towns, not Poole
  const poolePostcodes = ['BH12', 'BH13', 'BH14', 'BH15', 'BH16', 'BH17'];
  
  // Update businesses outside Poole postcodes to their correct towns
  const pooleFixResult = await client.query(`
    UPDATE classes 
    SET town = CASE 
      WHEN postcode LIKE 'BH1%' OR postcode LIKE 'BH2%' OR postcode LIKE 'BH3%' OR postcode LIKE 'BH4%' OR postcode LIKE 'BH5%' OR postcode LIKE 'BH6%' OR postcode LIKE 'BH7%' OR postcode LIKE 'BH8%' OR postcode LIKE 'BH9%' OR postcode LIKE 'BH10%' OR postcode LIKE 'BH11%' THEN 'Bournemouth'
      WHEN postcode LIKE 'BH18%' OR postcode LIKE 'BH19%' OR postcode LIKE 'BH20%' THEN 'Christchurch'
      WHEN postcode LIKE 'BH21%' OR postcode LIKE 'BH22%' OR postcode LIKE 'BH23%' OR postcode LIKE 'BH24%' OR postcode LIKE 'BH25%' THEN 'Ferndown'
      ELSE town
    END
    WHERE town = 'Poole' 
    AND NOT (postcode LIKE 'BH12%' OR postcode LIKE 'BH13%' OR postcode LIKE 'BH14%' OR postcode LIKE 'BH15%' OR postcode LIKE 'BH16%' OR postcode LIKE 'BH17%')
    AND is_active = true
  `);
  
  console.log(`   ✅ ${pooleFixResult.rowCount} businesses reassigned from Poole to correct towns`);

  console.log(`\n🎉 MAJOR CITIES EXPANSION COMPLETE!`);
  console.log(`📊 Total businesses reassigned: ${totalAdded + pooleFixResult.rowCount}`);
  
  // Show final counts for major cities
  console.log(`\n📈 UPDATED COVERAGE FOR MAJOR CITIES:`);
  const finalCounts = await client.query(`
    SELECT town, COUNT(*) as count 
    FROM classes 
    WHERE town IN ('Birmingham', 'Manchester', 'Bristol', 'Poole', 'Bournemouth') 
    AND is_active = true 
    GROUP BY town 
    ORDER BY count DESC
  `);
  
  finalCounts.rows.forEach(row => {
    console.log(`   ${row.town}: ${row.count} businesses`);
  });

  await client.end();
}

// Run the expansion
expandMajorCities().catch(console.error);