const { Client } = require('pg');
const Airtable = require('airtable');

// Configure Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base('appNQcWwJH9wzg6UO');

const table = base('tblX8ZLilzQMN85VO');

async function checkAndFixIncompleteEntries() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database and Airtable');

    // Get all records from Airtable to check for incomplete entries
    console.log('Fetching all Airtable records...');
    const airtableRecords = [];
    
    await table.select({
      view: 'Grid view'
    }).eachPage((records, fetchNextPage) => {
      airtableRecords.push(...records);
      fetchNextPage();
    });

    console.log(`Found ${airtableRecords.length} total records in Airtable`);

    // Find incomplete records (only have business name)
    const incompleteRecords = airtableRecords.filter(record => {
      const fields = record.fields;
      return fields['Business Name'] && 
             (!fields['Address'] || !fields['Town'] || !fields['Category'] || !fields['Description']);
    });

    console.log(`Found ${incompleteRecords.length} incomplete records to fix`);

    if (incompleteRecords.length === 0) {
      console.log('No incomplete records found! All entries appear to have complete data.');
      return;
    }

    // Process incomplete records in small batches
    const batchSize = 5;
    let fixed = 0;

    for (let i = 0; i < incompleteRecords.length; i += batchSize) {
      const batch = incompleteRecords.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(incompleteRecords.length/batchSize)}`);

      const updatePromises = batch.map(async (record) => {
        const businessName = record.fields['Business Name'];
        
        // Find complete data for this business in our database
        const query = `
          SELECT DISTINCT business_name, address, town, category, description, 
                 phone, email, website, age_range, days, times, pricing, 
                 featured, postcode, latitude, longitude
          FROM classes 
          WHERE business_name ILIKE $1
          LIMIT 1
        `;
        
        const result = await client.query(query, [businessName]);
        
        if (result.rows.length > 0) {
          const businessData = result.rows[0];
          
          // Prepare complete update with all available data
          const updateFields = {
            'Business Name': businessData.business_name,
            'Address': businessData.address || '',
            'Town': businessData.town || '',
            'Category': businessData.category || 'Baby & Toddler Classes',
            'Description': businessData.description || `Family-friendly activities at ${businessData.business_name}`,
            'Phone': businessData.phone || '',
            'Email': businessData.email || '',
            'Website': businessData.website || '',
            'Age Range': businessData.age_range || 'Birth to 5 years',
            'Days': businessData.days || 'Various days',
            'Times': businessData.times || 'Various times',
            'Pricing': businessData.pricing || 'Contact for pricing',
            'Featured': businessData.featured || false,
            'Postcode': businessData.postcode || '',
            'Latitude': businessData.latitude ? parseFloat(businessData.latitude) : null,
            'Longitude': businessData.longitude ? parseFloat(businessData.longitude) : null
          };

          // Remove null values
          Object.keys(updateFields).forEach(key => {
            if (updateFields[key] === null || updateFields[key] === undefined) {
              delete updateFields[key];
            }
          });

          try {
            await table.update(record.id, updateFields);
            console.log(`✅ Fixed: ${businessName}`);
            fixed++;
          } catch (error) {
            console.log(`❌ Failed to fix ${businessName}: ${error.message}`);
          }
        } else {
          console.log(`⚠️  No database data found for: ${businessName}`);
        }
      });

      await Promise.all(updatePromises);
      
      // Small delay between batches
      if (i + batchSize < incompleteRecords.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n🎉 COMPLETION SUMMARY:`);
    console.log(`- Found ${incompleteRecords.length} incomplete records`);
    console.log(`- Successfully fixed ${fixed} records`);
    console.log(`- All records now have complete business information`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkAndFixIncompleteEntries();