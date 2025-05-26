import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Major UK towns and cities with population over 15,000
// This is a representative sample of significant population centers
const majorUKTowns = [
  // England - Major Cities
  'London', 'Birmingham', 'Manchester', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Newcastle upon Tyne',
  'Leicester', 'Coventry', 'Bradford', 'Nottingham', 'Plymouth', 'Southampton', 'Reading', 'Derby',
  'Portsmouth', 'Brighton', 'Luton', 'Wolverhampton', 'Stoke-on-Trent', 'Preston', 'Hull', 'Sunderland',
  
  // England - Large Towns (50k-200k)
  'Milton Keynes', 'Northampton', 'Norwich', 'Bournemouth', 'Swindon', 'Crawley', 'Ipswich', 'Wigan',
  'Croydon', 'Warrington', 'Stockport', 'Rotherham', 'Oldham', 'York', 'Poole', 'Bolton', 'Blackpool',
  'Peterborough', 'Middlesbrough', 'Oxford', 'Blackburn', 'Colchester', 'Rochdale', 'Burnley', 'Gillingham',
  'Maidstone', 'Basildon', 'Hastings', 'Watford', 'Exeter', 'Scunthorpe', 'Gloucester', 'Salford',
  'Chesterfield', 'Carlisle', 'Worcester', 'Bath', 'Eastbourne', 'Grimsby', 'St Helens', 'Telford',
  
  // England - Medium Towns (30k-50k)
  'Cambridge', 'Cheltenham', 'Chelmsford', 'Southend-on-Sea', 'Harrogate', 'High Wycombe', 'Slough',
  'Guildford', 'Lincoln', 'King\'s Lynn', 'Shrewsbury', 'Mansfield', 'Stevenage', 'Canterbury',
  'Chester', 'Doncaster', 'Barnsley', 'Taunton', 'Nuneaton', 'Bedford', 'Worthing', 'Tamworth',
  'Folkestone', 'Kidderminster', 'Redditch', 'Dartford', 'Gravesend', 'Stafford', 'Crewe',
  
  // England - Smaller Towns (15k-30k)
  'Leamington Spa', 'Aylesbury', 'Basingstoke', 'Bracknell', 'Banbury', 'Kettering', 'Wellingborough',
  'Corby', 'Woking', 'Reigate', 'Farnborough', 'Aldershot', 'Camberley', 'Windsor', 'Maidenhead',
  'Margate', 'Ramsgate', 'Dover', 'Ashford', 'Tunbridge Wells', 'Tonbridge', 'Sevenoaks',
  'Dartford', 'Epsom', 'Leatherhead', 'Dorking', 'Horsham', 'Redhill', 'Crawley', 'East Grinstead',
  
  // Wales
  'Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Barry', 'Caerphilly', 'Bridgend', 'Neath',
  'Port Talbot', 'Cwmbran', 'Llanelli', 'Rhondda', 'Merthyr Tydfil', 'Pontypridd', 'Flint',
  
  // Scotland  
  'Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Stirling', 'Perth', 'Inverness', 'Ayr',
  'Paisley', 'East Kilbride', 'Livingston', 'Hamilton', 'Kirkcaldy', 'Dunfermline', 'Cumbernauld',
  
  // Northern Ireland
  'Belfast', 'Derry', 'Lisburn', 'Craigavon', 'Bangor', 'Newtownabbey', 'Carrickfergus', 'Newry'
];

async function analyzeTownCoverage() {
  try {
    console.log('🔍 Analyzing class coverage for major UK towns (population 15k+)...\n');
    
    const underCoveredTowns = [];
    const wellCoveredTowns = [];
    const noCoverageTowns = [];
    
    for (const town of majorUKTowns) {
      const result = await pool.query(`
        SELECT COUNT(*) as class_count 
        FROM classes 
        WHERE town ILIKE $1 OR town ILIKE $2
      `, [`%${town}%`, town]);
      
      const classCount = parseInt(result.rows[0].class_count);
      
      if (classCount === 0) {
        noCoverageTowns.push({ town, count: classCount });
      } else if (classCount < 5) {
        underCoveredTowns.push({ town, count: classCount });
      } else {
        wellCoveredTowns.push({ town, count: classCount });
      }
    }
    
    console.log('📊 COVERAGE ANALYSIS RESULTS\n');
    
    // Towns with excellent coverage (5+ classes)
    console.log(`✅ WELL COVERED TOWNS (${wellCoveredTowns.length} towns with 5+ classes):`);
    wellCoveredTowns
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
      .forEach(item => {
        console.log(`   ${item.town}: ${item.count} classes`);
      });
    
    console.log(`\n❌ ZERO COVERAGE TOWNS (${noCoverageTowns.length} major towns with NO classes):`);
    noCoverageTowns.forEach(item => {
      console.log(`   ${item.town}: ${item.count} classes`);
    });
    
    console.log(`\n⚠️  UNDER-COVERED TOWNS (${underCoveredTowns.length} towns with 1-4 classes):`);
    underCoveredTowns
      .sort((a, b) => a.count - b.count)
      .forEach(item => {
        console.log(`   ${item.town}: ${item.count} classes`);
      });
    
    // Investigate under-covered towns
    console.log('\n🔍 INVESTIGATING UNDER-COVERED TOWNS:\n');
    
    for (const item of underCoveredTowns) {
      const detailResult = await pool.query(`
        SELECT name, address, postcode, category 
        FROM classes 
        WHERE town ILIKE $1 OR town ILIKE $2
        ORDER BY name
      `, [`%${item.town}%`, item.town]);
      
      console.log(`📍 ${item.town} (${item.count} classes):`);
      detailResult.rows.forEach(cls => {
        console.log(`   • ${cls.name} - ${cls.category} (${cls.postcode})`);
      });
      console.log('');
    }
    
    // Summary statistics
    console.log('\n📈 SUMMARY STATISTICS:');
    console.log(`Total major towns analyzed: ${majorUKTowns.length}`);
    console.log(`Well covered (5+ classes): ${wellCoveredTowns.length} (${((wellCoveredTowns.length/majorUKTowns.length)*100).toFixed(1)}%)`);
    console.log(`Under-covered (1-4 classes): ${underCoveredTowns.length} (${((underCoveredTowns.length/majorUKTowns.length)*100).toFixed(1)}%)`);
    console.log(`Zero coverage: ${noCoverageTowns.length} (${((noCoverageTowns.length/majorUKTowns.length)*100).toFixed(1)}%)`);
    
    // Check for possible naming issues
    console.log('\n🔍 POSSIBLE NAMING VARIATIONS CHECK:');
    console.log('Checking if under-covered towns might have classes under different names...\n');
    
    for (const item of underCoveredTowns.slice(0, 10)) {
      const similarResult = await pool.query(`
        SELECT DISTINCT town, COUNT(*) as count
        FROM classes 
        WHERE town ILIKE $1 
        GROUP BY town 
        ORDER BY count DESC
      `, [`%${item.town.split(' ')[0]}%`]);
      
      if (similarResult.rows.length > 0) {
        console.log(`${item.town} variations found:`);
        similarResult.rows.forEach(row => {
          console.log(`   • "${row.town}": ${row.count} classes`);
        });
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Error during town coverage analysis:', error);
  } finally {
    await pool.end();
  }
}

analyzeTownCoverage();