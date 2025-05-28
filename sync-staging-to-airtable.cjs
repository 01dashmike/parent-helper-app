const { Client } = require('pg');
const Airtable = require('airtable');

const token = 'patUmtejVE5l6Lbr7.ec8bcb286d09182ff263889564a7948f02045b359816d0d8a1c175a4d4e96f93';
const baseId = 'app9eOTFWck1sZwTG';

const base = new Airtable({
  apiKey: token
}).base(baseId);

const table = base('tblDcOhMjN0kb8dk4');

async function isExactSessionInAirtable(businessName, venueName, dayOfWeek, timeSlot) {
  try {
    // Check for exact match: same business, venue, day AND time
    let formula = `AND({Business_Name} = "${businessName.replace(/"/g, '\\"')}"`;
    
    if (venueName) {
      formula += `, {Venue_Name} = "${venueName.replace(/"/g, '\\"')}"`;
    }
    if (dayOfWeek) {
      formula += `, {Day_of_Week} = "${dayOfWeek.replace(/"/g, '\\"')}"`;
    }
    if (timeSlot) {
      formula += `, {Time_Slot} = "${timeSlot.replace(/"/g, '\\"')}"`;
    }
    
    formula += ')';
    
    const records = await table.select({
      maxRecords: 1,
      filterByFormula: formula
    }).firstPage();
    
    return records.length > 0;
  } catch (error) {
    console.log(`Error checking session ${businessName}: ${error.message}`);
    return true; // Assume exists to avoid duplicates if error
  }
}

async function syncStagingToAirtable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔄 Starting sync from staging database to Airtable...');

    // Get all businesses from staging database
    const result = await client.query(`
      SELECT * FROM staging_businesses 
      ORDER BY created_at DESC
      LIMIT 20
    `);

    console.log(`Found ${result.rows.length} businesses in staging database`);

    if (result.rows.length === 0) {
      console.log('ℹ️  No businesses found in staging database. Add some businesses first!');
      return;
    }

    let added = 0;
    let skipped = 0;

    for (const business of result.rows) {
      const businessName = business.business_name;
      console.log(`\nChecking: ${businessName}`);

      // Check if this exact session already exists in Airtable
      const exists = await isExactSessionInAirtable(
        businessName, 
        business.venue_name, 
        business.day_of_week, 
        business.time_slot
      );
      
      if (exists) {
        console.log(`⚠️  Session already exists: ${businessName} - ${business.day_of_week} ${business.time_slot}`);
        skipped++;
      } else {
        // Add new business to Airtable
        const airtableFields = {
          'Business_Name': business.business_name,
          'Full_Address': business.full_address || '',
          'Venue_Name': business.venue_name || '',
          'Postcode': business.postcode || '',
          'Town': business.town || '',
          'Category': business.category || '',
          'Age_Groups': business.age_groups || '',
          'Pricing': business.pricing || '',
          'Phone': business.phone || '',
          'Email': business.email || '',
          'Website': business.website || '',
          'Featured': business.featured || false,
          'Description': business.description || '',
          'Day_of_Week': business.day_of_week || '',
          'Time_Slot': business.time_slot || ''
        };

        try {
          await table.create(airtableFields);
          console.log(`✅ Added: ${businessName}`);
          added++;
        } catch (error) {
          console.log(`❌ Error adding ${businessName}: ${error.message}`);
        }
      }

      // Small delay to respect API limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n🎉 SYNC COMPLETE!`);
    console.log(`✅ New businesses added: ${added}`);
    console.log(`⚠️  Duplicates skipped: ${skipped}`);
    console.log(`📊 Total businesses processed: ${result.rows.length}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

syncStagingToAirtable();