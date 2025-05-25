import { neon } from '@neondatabase/serverless';

// Major towns with population over 15,000
const majorTowns = [
  { name: "London", postcode: "SW1A 1AA", latitude: 51.5074, longitude: -0.1278, population: 8982000, county: "Greater London", region: "London" },
  { name: "Birmingham", postcode: "B1 1AA", latitude: 52.4862, longitude: -1.8904, population: 1141816, county: "West Midlands", region: "West Midlands" },
  { name: "Manchester", postcode: "M1 1AA", latitude: 53.4808, longitude: -2.2426, population: 547000, county: "Greater Manchester", region: "North West" },
  { name: "Leeds", postcode: "LS1 1AA", latitude: 53.8008, longitude: -1.5491, population: 789194, county: "West Yorkshire", region: "Yorkshire and The Humber" },
  { name: "Sheffield", postcode: "S1 1AA", latitude: 53.3811, longitude: -1.4701, population: 584853, county: "South Yorkshire", region: "Yorkshire and The Humber" },
  { name: "Liverpool", postcode: "L1 1AA", latitude: 53.4084, longitude: -2.9916, population: 498042, county: "Merseyside", region: "North West" },
  { name: "Bristol", postcode: "BS1 1AA", latitude: 51.4545, longitude: -2.5879, population: 467099, county: "Bristol", region: "South West" },
  { name: "Newcastle", postcode: "NE1 1AA", latitude: 54.9783, longitude: -1.6178, population: 300196, county: "Tyne and Wear", region: "North East" },
  { name: "Leicester", postcode: "LE1 1AA", latitude: 52.6369, longitude: -1.1398, population: 355218, county: "Leicestershire", region: "East Midlands" },
  { name: "Nottingham", postcode: "NG1 1AA", latitude: 52.9548, longitude: -1.1581, population: 331069, county: "Nottinghamshire", region: "East Midlands" },
  { name: "Southampton", postcode: "SO14 0AA", latitude: 50.9097, longitude: -1.4044, population: 269781, county: "Hampshire", region: "South East" },
  { name: "Portsmouth", postcode: "PO1 1AA", latitude: 50.8198, longitude: -1.0880, population: 238137, county: "Hampshire", region: "South East" },
  { name: "Winchester", postcode: "SO23 8UJ", latitude: 51.0632, longitude: -1.3080, population: 48478, county: "Hampshire", region: "South East" },
  { name: "Reading", postcode: "RG1 1AA", latitude: 51.4543, longitude: -0.9781, population: 174224, county: "Berkshire", region: "South East" },
  { name: "Oxford", postcode: "OX1 1AA", latitude: 51.7520, longitude: -1.2577, population: 162100, county: "Oxfordshire", region: "South East" },
  { name: "Cambridge", postcode: "CB1 1AA", latitude: 52.2053, longitude: 0.1218, population: 145674, county: "Cambridgeshire", region: "East of England" },
  { name: "Brighton", postcode: "BN1 1AA", latitude: 50.8225, longitude: -0.1372, population: 290885, county: "East Sussex", region: "South East" },
  { name: "Bath", postcode: "BA1 1AA", latitude: 51.3811, longitude: -2.3590, population: 94782, county: "Somerset", region: "South West" },
  { name: "Canterbury", postcode: "CT1 1AA", latitude: 51.2802, longitude: 1.0789, population: 55240, county: "Kent", region: "South East" },
  { name: "York", postcode: "YO1 1AA", latitude: 53.9590, longitude: -1.0815, population: 153717, county: "North Yorkshire", region: "Yorkshire and The Humber" },
  { name: "Chester", postcode: "CH1 1AA", latitude: 53.1924, longitude: -2.8910, population: 79645, county: "Cheshire", region: "North West" },
  { name: "Exeter", postcode: "EX1 1AA", latitude: 50.7184, longitude: -3.5339, population: 130709, county: "Devon", region: "South West" },
  { name: "Plymouth", postcode: "PL1 1AA", latitude: 50.3755, longitude: -4.1427, population: 263070, county: "Devon", region: "South West" },
  { name: "Norwich", postcode: "NR1 1AA", latitude: 52.6309, longitude: 1.2974, population: 213166, county: "Norfolk", region: "East of England" },
  { name: "Ipswich", postcode: "IP1 1AA", latitude: 52.0567, longitude: 1.1482, population: 144957, county: "Suffolk", region: "East of England" },
  { name: "Colchester", postcode: "CO1 1AA", latitude: 51.8860, longitude: 0.9035, population: 121859, county: "Essex", region: "East of England" },
  { name: "Chelmsford", postcode: "CM1 1AA", latitude: 51.7356, longitude: 0.4685, population: 181763, county: "Essex", region: "East of England" },
  { name: "Gloucester", postcode: "GL1 1AA", latitude: 51.8642, longitude: -2.2381, population: 132248, county: "Gloucestershire", region: "South West" },
  { name: "Worcester", postcode: "WR1 1AA", latitude: 52.1929, longitude: -2.2207, population: 103872, county: "Worcestershire", region: "West Midlands" },
  { name: "Hereford", postcode: "HR1 1AA", latitude: 52.0567, longitude: -2.7157, population: 61570, county: "Herefordshire", region: "West Midlands" },
  { name: "Derby", postcode: "DE1 1AA", latitude: 52.9225, longitude: -1.4746, population: 261136, county: "Derbyshire", region: "East Midlands" },
  { name: "Lincoln", postcode: "LN1 1AA", latitude: 53.2307, longitude: -0.5406, population: 103837, county: "Lincolnshire", region: "East Midlands" },
  { name: "Shrewsbury", postcode: "SY1 1AA", latitude: 52.7069, longitude: -2.7518, population: 76782, county: "Shropshire", region: "West Midlands" },
  { name: "Stoke-on-Trent", postcode: "ST1 1AA", latitude: 53.0027, longitude: -2.1794, population: 270726, county: "Staffordshire", region: "West Midlands" },
  { name: "Wolverhampton", postcode: "WV1 1AA", latitude: 52.5833, longitude: -2.1333, population: 263700, county: "West Midlands", region: "West Midlands" },
  { name: "Coventry", postcode: "CV1 1AA", latitude: 52.4068, longitude: -1.5197, population: 371521, county: "West Midlands", region: "West Midlands" },
  { name: "Warwick", postcode: "CV34 4AA", latitude: 52.2819, longitude: -1.5849, population: 37267, county: "Warwickshire", region: "West Midlands" },
  { name: "Stratford-upon-Avon", postcode: "CV37 6AA", latitude: 52.1919, longitude: -1.7073, population: 30495, county: "Warwickshire", region: "West Midlands" },
  { name: "Carlisle", postcode: "CA1 1AA", latitude: 54.8951, longitude: -2.9441, population: 108402, county: "Cumbria", region: "North West" },
  { name: "Preston", postcode: "PR1 1AA", latitude: 53.7632, longitude: -2.7031, population: 147800, county: "Lancashire", region: "North West" },
  { name: "Blackpool", postcode: "FY1 1AA", latitude: 53.8175, longitude: -3.0357, population: 139305, county: "Lancashire", region: "North West" },
  { name: "Lancaster", postcode: "LA1 1AA", latitude: 54.0466, longitude: -2.8007, population: 52234, county: "Lancashire", region: "North West" },
  { name: "Burnley", postcode: "BB11 1AA", latitude: 53.7889, longitude: -2.2426, population: 73021, county: "Lancashire", region: "North West" },
  { name: "Blackburn", postcode: "BB1 1AA", latitude: 53.7480, longitude: -2.4820, population: 117963, county: "Lancashire", region: "North West" },
  { name: "Bolton", postcode: "BL1 1AA", latitude: 53.5768, longitude: -2.4282, population: 194189, county: "Greater Manchester", region: "North West" },
  { name: "Wigan", postcode: "WN1 1AA", latitude: 53.5449, longitude: -2.6342, population: 103608, county: "Greater Manchester", region: "North West" },
  { name: "Oldham", postcode: "OL1 1AA", latitude: 53.5409, longitude: -2.1114, population: 96555, county: "Greater Manchester", region: "North West" },
  { name: "Stockport", postcode: "SK1 1AA", latitude: 53.4106, longitude: -2.1575, population: 295243, county: "Greater Manchester", region: "North West" },
  { name: "Rochdale", postcode: "OL16 1AA", latitude: 53.6097, longitude: -2.1561, population: 107926, county: "Greater Manchester", region: "North West" },
  { name: "Salford", postcode: "M50 1AA", latitude: 53.4875, longitude: -2.2901, population: 270000, county: "Greater Manchester", region: "North West" },
  { name: "Bury", postcode: "BL9 0AA", latitude: 53.5933, longitude: -2.2958, population: 81101, county: "Greater Manchester", region: "North West" },
  { name: "Huddersfield", postcode: "HD1 1AA", latitude: 53.6458, longitude: -1.7850, population: 162949, county: "West Yorkshire", region: "Yorkshire and The Humber" },
  { name: "Bradford", postcode: "BD1 1AA", latitude: 53.7960, longitude: -1.7594, population: 537173, county: "West Yorkshire", region: "Yorkshire and The Humber" },
  { name: "Halifax", postcode: "HX1 1AA", latitude: 53.7218, longitude: -1.8640, population: 88134, county: "West Yorkshire", region: "Yorkshire and The Humber" },
  { name: "Wakefield", postcode: "WF1 1AA", latitude: 53.6833, longitude: -1.5000, population: 109766, county: "West Yorkshire", region: "Yorkshire and The Humber" },
  { name: "Barnsley", postcode: "S70 1AA", latitude: 53.5526, longitude: -1.4797, population: 96888, county: "South Yorkshire", region: "Yorkshire and The Humber" },
  { name: "Rotherham", postcode: "S60 1AA", latitude: 53.4302, longitude: -1.3570, population: 109691, county: "South Yorkshire", region: "Yorkshire and The Humber" },
  { name: "Doncaster", postcode: "DN1 1AA", latitude: 53.5228, longitude: -1.1285, population: 113566, county: "South Yorkshire", region: "Yorkshire and The Humber" },
  { name: "Hull", postcode: "HU1 1AA", latitude: 53.7676, longitude: -0.3274, population: 284321, county: "East Riding of Yorkshire", region: "Yorkshire and The Humber" },
  { name: "Grimsby", postcode: "DN31 1AA", latitude: 53.5676, longitude: -0.0759, population: 88243, county: "Lincolnshire", region: "Yorkshire and The Humber" },
  { name: "Scunthorpe", postcode: "DN15 6AA", latitude: 53.5905, longitude: -0.6504, population: 82334, county: "Lincolnshire", region: "Yorkshire and The Humber" },
  { name: "Middlesbrough", postcode: "TS1 1AA", latitude: 54.5742, longitude: -1.2351, population: 140545, county: "North Yorkshire", region: "North East" },
  { name: "Sunderland", postcode: "SR1 1AA", latitude: 54.9069, longitude: -1.3838, population: 174286, county: "Tyne and Wear", region: "North East" },
  { name: "Gateshead", postcode: "NE8 1AA", latitude: 54.9526, longitude: -1.6033, population: 120046, county: "Tyne and Wear", region: "North East" },
  { name: "South Shields", postcode: "NE33 1AA", latitude: 54.9988, longitude: -1.4302, population: 75337, county: "Tyne and Wear", region: "North East" },
  { name: "Darlington", postcode: "DL1 1AA", latitude: 54.5235, longitude: -1.5579, population: 106566, county: "County Durham", region: "North East" },
  { name: "Durham", postcode: "DH1 1AA", latitude: 54.7761, longitude: -1.5733, population: 47785, county: "County Durham", region: "North East" },
  { name: "Hartlepool", postcode: "TS24 7AA", latitude: 54.6896, longitude: -1.2119, population: 93242, county: "County Durham", region: "North East" },
  { name: "Edinburgh", postcode: "EH1 1AA", latitude: 55.9533, longitude: -3.1883, population: 518500, county: "City of Edinburgh", region: "Scotland" },
  { name: "Glasgow", postcode: "G1 1AA", latitude: 55.8642, longitude: -4.2518, population: 633120, county: "Glasgow City", region: "Scotland" },
  { name: "Aberdeen", postcode: "AB10 1AA", latitude: 57.1497, longitude: -2.0943, population: 198590, county: "City of Aberdeen", region: "Scotland" },
  { name: "Dundee", postcode: "DD1 1AA", latitude: 56.4620, longitude: -2.9707, population: 148210, county: "City of Dundee", region: "Scotland" },
  { name: "Stirling", postcode: "FK8 1AA", latitude: 56.1165, longitude: -3.9369, population: 36142, county: "Stirling", region: "Scotland" },
  { name: "Perth", postcode: "PH1 1AA", latitude: 56.3960, longitude: -3.4370, population: 47430, county: "Perth and Kinross", region: "Scotland" },
  { name: "Inverness", postcode: "IV1 1AA", latitude: 57.4778, longitude: -4.2247, population: 47790, county: "Highland", region: "Scotland" },
  { name: "Cardiff", postcode: "CF10 1AA", latitude: 51.4816, longitude: -3.1791, population: 366903, county: "Cardiff", region: "Wales" },
  { name: "Swansea", postcode: "SA1 1AA", latitude: 51.6214, longitude: -3.9436, population: 246466, county: "Swansea", region: "Wales" },
  { name: "Newport", postcode: "NP20 1AA", latitude: 51.5842, longitude: -2.9977, population: 154676, county: "Newport", region: "Wales" },
  { name: "Wrexham", postcode: "LL11 1AA", latitude: 53.0478, longitude: -2.9916, population: 65692, county: "Wrexham", region: "Wales" },
  { name: "Bangor", postcode: "LL57 1AA", latitude: 53.2280, longitude: -4.1281, population: 18808, county: "Gwynedd", region: "Wales" },
  { name: "Belfast", postcode: "BT1 1AA", latitude: 54.5973, longitude: -5.9301, population: 343542, county: "Belfast", region: "Northern Ireland" },
  { name: "Londonderry", postcode: "BT48 6AA", latitude: 54.9966, longitude: -7.3086, population: 105066, county: "Londonderry", region: "Northern Ireland" }
];

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function findClosestMajorTown(latitude, longitude) {
  let closestTown = null;
  let shortestDistance = Infinity;

  for (const town of majorTowns) {
    const distance = calculateDistance(latitude, longitude, town.latitude, town.longitude);
    if (distance < shortestDistance) {
      shortestDistance = distance;
      closestTown = town;
    }
  }

  return closestTown;
}

async function updateTowns() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('Connected to database');
    
    // Get all classes that need town assignment
    const classes = await sql`
      SELECT id, latitude, longitude 
      FROM classes 
      WHERE town IS NULL OR town = '' 
      AND latitude IS NOT NULL 
      AND longitude IS NOT NULL
    `;
    
    console.log(`Found ${classes.length} classes that need town assignment`);
    
    let updated = 0;
    for (const classItem of classes) {
      const lat = parseFloat(classItem.latitude);
      const lon = parseFloat(classItem.longitude);
      
      if (!isNaN(lat) && !isNaN(lon)) {
        const closestTown = findClosestMajorTown(lat, lon);
        
        if (closestTown) {
          await sql`
            UPDATE classes 
            SET town = ${closestTown.name} 
            WHERE id = ${classItem.id}
          `;
          updated++;
          
          if (updated % 100 === 0) {
            console.log(`Updated ${updated} classes...`);
          }
        }
      }
    }
    
    console.log(`Successfully updated ${updated} classes with town assignments`);
    
  } catch (error) {
    console.error('Error updating towns:', error);
  }
}

updateTowns();