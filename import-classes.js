// Import real class data from CSV
const fs = require('fs');
const path = require('path');

const csvData = `Town,Class Name,Age Range,Location,Time,Cost,Link,Tags
Winchester,Baby Sensory Winchester,0–13 mo,Compton & Weeke Halls,Weekdays,"Free trial, then term pricing",https://www.babysensory.com/winchester,"sensory, development, structured"
Winchester,Bloom Baby Classes,0–12 mo,Various community centres,Weekdays,£8.50,https://bloombabyclasses.com/winchester,"music, sensory, bonding"
Winchester,Christ Church Bumps & Babies,0–1 yr,"Christ Church, Winchester",Tuesdays 10:00,Free,https://christchurchwinchester.org.uk,"free, community, drop-in"
Andover,Stage One @ Augusta Park,6–13 mo,Augusta Park Community Centre,Mondays 11:00,£8,https://www.happity.co.uk/,"development, sensory, motor skills"
Andover,Toddler Sense Weekend,13 mo+,"WOW Centre, Andover",Monthly weekends,£9 PAYG,https://www.toddlersense.com/winchester,"active, sensory, weekend"`;

async function importClasses() {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',');
  
  // Clear existing classes first
  await fetch('http://localhost:5000/api/classes/clear', { method: 'POST' });
  
  // Process each class
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const town = values[0];
    const name = values[1];
    const ageRange = values[2];
    const location = values[3];
    const time = values[4];
    const cost = values[5];
    const link = values[6];
    const tags = values[7];
    
    // Parse age range
    let ageGroupMin = 0, ageGroupMax = 60;
    if (ageRange.includes('0–13 mo')) {
      ageGroupMin = 0; ageGroupMax = 13;
    } else if (ageRange.includes('0–12 mo')) {
      ageGroupMin = 0; ageGroupMax = 12;
    } else if (ageRange.includes('0–1 yr')) {
      ageGroupMin = 0; ageGroupMax = 12;
    } else if (ageRange.includes('6–13 mo')) {
      ageGroupMin = 6; ageGroupMax = 13;
    } else if (ageRange.includes('13 mo+')) {
      ageGroupMin = 13; ageGroupMax = 60;
    }
    
    // Get postcode for town
    const postcodes = {
      'Winchester': 'SO23 7AB',
      'Andover': 'SP10 1LT'
    };
    
    const classData = {
      name: name,
      description: `${name} in ${town}. ${tags ? `Features: ${tags}` : ''}`,
      ageGroupMin: ageGroupMin,
      ageGroupMax: ageGroupMax,
      price: cost.toLowerCase().includes('free') ? null : cost.replace(/[£"]/g, ''),
      isFeatured: false,
      venue: location,
      address: `${location}, ${town}`,
      postcode: postcodes[town] || 'SO23 7AB',
      latitude: null,
      longitude: null,
      dayOfWeek: time.includes('Monday') ? 'Monday' : time.includes('Tuesday') ? 'Tuesday' : 'Various',
      time: time,
      contactEmail: null,
      contactPhone: null,
      website: link.replace(/"/g, ''),
      category: tags.includes('sensory') ? 'sensory' : tags.includes('music') ? 'music' : 'general',
      rating: null,
      reviewCount: 0,
      popularity: Math.floor(Math.random() * 100),
      isActive: true
    };
    
    const response = await fetch('http://localhost:5000/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classData)
    });
    
    if (response.ok) {
      console.log(`✓ Imported: ${name}`);
    } else {
      console.error(`✗ Failed to import: ${name}`);
    }
  }
  
  console.log('✅ Import complete!');
}

importClasses().catch(console.error);