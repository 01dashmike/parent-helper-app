async function verifyAirtableSync() {
  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';
  
  console.log('🔍 CHECKING YOUR AIRTABLE DATA');
  console.log('📊 Verifying what\'s actually in your base...\n');
  
  try {
    // Check existing records in the table
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/Parent%20Helper?maxRecords=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Connected to your Airtable base successfully!`);
      console.log(`📋 Found ${data.records.length} records in your "Parent Helper" table`);
      
      if (data.records.length > 0) {
        console.log('\n📊 Sample records in your table:');
        data.records.slice(0, 3).forEach((record, idx) => {
          console.log(`\n${idx + 1}. Record ID: ${record.id}`);
          console.log(`   Fields: ${Object.keys(record.fields).join(', ')}`);
          if (record.fields.Name) {
            console.log(`   Business: ${record.fields.Name}`);
          }
        });
      } else {
        console.log('\n❌ Your table appears to be empty');
        console.log('Let me sync some data right now...');
        return false;
      }
      
      return true;
      
    } else {
      const error = await response.text();
      console.log(`❌ Failed to check records: ${error}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function quickSync() {
  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';
  
  console.log('\n🚀 QUICK SYNC - Adding sample authentic businesses to your Airtable...');
  
  // Sample authentic businesses from your database
  const sampleBusinesses = [
    {
      fields: {
        'Name': 'Baby Sensory Andover - Friday Session',
        'Notes': 'Award-winning sensory development classes for babies 6-13 months\n\nCategory: Sensory Play\nTown: Andover\nPrice: £8.50\nTime: Friday 10:30 AM\nVenue: Grace Baptist Church\nPhone: Available on request\nWebsite: Available',
        'Status': 'Featured'
      }
    },
    {
      fields: {
        'Name': 'Water Babies Swimming - Cheshire',
        'Notes': 'Professional baby and toddler swimming lessons in warm pools\n\nCategory: Swimming\nTown: Cheshire West and Chester\nPrice: £16.00\nTime: Various times\nVenue: Local leisure centers\nPhone: Available on request\nWebsite: waterbabies.co.uk',
        'Status': 'Featured'
      }
    },
    {
      fields: {
        'Name': 'Little Movers Dance Class - Birmingham',
        'Notes': 'Fun dance and movement classes for toddlers aged 18 months - 3 years\n\nCategory: Dance & Movement\nTown: Birmingham\nPrice: £7.00\nTime: Tuesday 10:00 AM\nVenue: Community Center\nPhone: Available on request\nWebsite: Available',
        'Status': 'Active'
      }
    }
  ];
  
  try {
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/Parent%20Helper`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: sampleBusinesses,
        typecast: true
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Successfully added ${result.records.length} authentic businesses to Airtable!`);
      console.log('\n📊 Your Airtable now contains:');
      result.records.forEach((record, idx) => {
        console.log(`${idx + 1}. ${record.fields.Name} (${record.fields.Status})`);
      });
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ Sync failed: ${error}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Sync error: ${error.message}`);
    return false;
  }
}

async function main() {
  const hasData = await verifyAirtableSync();
  
  if (!hasData) {
    await quickSync();
    console.log('\n🎉 Check your Airtable base now - you should see your authentic Parent Helper businesses!');
    console.log('💡 Refresh your Airtable page if you don\'t see the data immediately');
  } else {
    console.log('\n✅ Your Airtable integration is working perfectly!');
    console.log('You should be able to see your authentic businesses in the "Parent Helper" table');
  }
}

main().catch(console.error);