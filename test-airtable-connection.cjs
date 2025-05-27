const https = require('https');

async function testAirtableConnection() {
  console.log('🔍 Testing your Airtable connection...');
  
  const apiKey = process.env.AIRTABLE_API_KEY;
  console.log(`🔑 Using token: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT FOUND'}`);
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.airtable.com',
      path: '/v0/meta/bases',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📡 Response status: ${res.statusCode}`);
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ Connection successful!');
            console.log(`📊 Found ${response.bases?.length || 0} existing bases`);
            resolve(response);
          } else {
            console.log('❌ Connection failed:', response.error?.message || 'Unknown error');
            console.log('💡 This might be a permissions issue with your token');
            reject(new Error(response.error?.message || `HTTP ${res.statusCode}`));
          }
        } catch (error) {
          console.log('❌ Parse error:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request error:', error.message);
      reject(error);
    });
    
    req.end();
  });
}

if (require.main === module) {
  testAirtableConnection().catch(console.error);
}

module.exports = { testAirtableConnection };