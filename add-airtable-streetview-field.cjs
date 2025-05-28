const Airtable = require('airtable');

async function addStreetViewFieldToAirtable() {
  console.log('🏢 ADDING STREET VIEW FIELD TO AIRTABLE');
  console.log('=' .repeat(50));
  
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    console.log('❌ Missing Airtable credentials');
    console.log('Please provide AIRTABLE_API_KEY and AIRTABLE_BASE_ID');
    return;
  }

  try {
    // Initialize Airtable
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    // Note: Airtable doesn't allow programmatic field creation through the API
    // This would need to be done manually in the Airtable interface
    
    console.log('📋 TO ADD STREET VIEW FIELD TO AIRTABLE:');
    console.log('');
    console.log('1. Open your Airtable base in the browser');
    console.log('2. Click the "+" button to add a new field');
    console.log('3. Choose "URL" as the field type');
    console.log('4. Name the field: "Street View Image"');
    console.log('5. Description: "Google Street View exterior image of venue"');
    console.log('');
    console.log('✅ This will store the Street View URLs for visual venue reference');
    console.log('✅ Parents can see building exterior and parking areas');
    console.log('✅ Helps with venue identification and accessibility planning');

    // Test connection to verify Airtable access
    const records = await base('Classes').select({
      maxRecords: 1,
      fields: ['Name']
    }).firstPage();
    
    console.log('');
    console.log('🔗 Airtable connection verified successfully');
    console.log(`📊 Connected to base with ${records.length > 0 ? 'data' : 'no data'}`);

  } catch (error) {
    console.error('❌ Airtable connection error:', error.message);
    console.log('');
    console.log('Please verify your Airtable credentials and try again');
  }
}

// Run the Airtable field setup guide
if (require.main === module) {
  addStreetViewFieldToAirtable().catch(console.error);
}

module.exports = { addStreetViewFieldToAirtable };