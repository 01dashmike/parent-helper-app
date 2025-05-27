async function testConnection() {
  const token = 'patM7Cd2aY4t6ICC8';
  const baseId = 'app9eOTFWck1sZwTG';
  
  console.log('🔍 Testing Airtable connection...');
  console.log(`Token: ${token.substring(0, 10)}...`);
  console.log(`Base ID: ${baseId}`);
  
  try {
    // Test basic API access
    const response = await fetch(`https://api.airtable.com/v0/meta/bases`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    
    console.log(`\nResponse status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Successfully connected to Airtable!');
      console.log(`Found ${data.bases.length} accessible bases`);
      
      // Check if our base is accessible
      const ourBase = data.bases.find(base => base.id === baseId);
      if (ourBase) {
        console.log(`✅ Found your Parent Helper base: ${ourBase.name}`);
      } else {
        console.log('❌ Your Parent Helper base is not accessible with this token');
        console.log('Available bases:');
        data.bases.forEach(base => {
          console.log(`  - ${base.name} (${base.id})`);
        });
      }
    } else {
      const error = await response.text();
      console.log(`❌ Connection failed: ${error}`);
      
      if (response.status === 401) {
        console.log('\n🔧 Token troubleshooting steps:');
        console.log('1. Check token is active in Airtable Developer Hub');
        console.log('2. Ensure all required scopes are enabled');
        console.log('3. Verify base access is granted');
        console.log('4. Try creating a new token');
      }
    }
    
  } catch (error) {
    console.log(`❌ Connection error: ${error.message}`);
  }
}

testConnection().catch(console.error);