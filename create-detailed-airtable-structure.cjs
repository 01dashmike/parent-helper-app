const { Client } = require('pg');

async function createDetailedAirtableStructure() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🎯 CREATING DETAILED AIRTABLE STRUCTURE');
    console.log('📊 Setting up comprehensive class information fields...\n');

    // Get sample data to show what structure we need
    const result = await client.query(`
      SELECT 
        name, description, category, town, postcode, address, venue,
        age_group_min, age_group_max, day_of_week, time, price,
        contact_phone, contact_email, website, is_featured, rating,
        direct_booking_available, booking_engine_type, online_payment_accepted,
        wheelchair_accessible, parking_available, parking_type
      FROM classes 
      WHERE is_active = true 
      ORDER BY is_featured DESC
      LIMIT 20
    `);

    console.log(`📈 Using ${result.rows.length} authentic businesses as examples`);

    // Clear existing data and create detailed structure
    console.log('\n🔄 Preparing detailed class records for Airtable...');

    const detailedRecords = result.rows.map(row => ({
      fields: {
        // Basic Information
        'Business Name': row.name,
        'Description': row.description || '',
        'Category': row.category || '',
        'Featured': row.is_featured || false,
        'Rating': row.rating ? parseFloat(row.rating) : null,
        
        // Location Details
        'Town': row.town,
        'Postcode': row.postcode || '',
        'Venue Name': row.venue || '',
        'Full Address': row.address || '',
        
        // Schedule Information
        'Day of Week': row.day_of_week || '',
        'Class Time': row.time || '',
        'Schedule': `${row.day_of_week || ''} ${row.time || ''}`.trim(),
        
        // Age Groups
        'Age Min (months)': row.age_group_min || 0,
        'Age Max (months)': row.age_group_max || 60,
        'Age Range': `${row.age_group_min || 0}-${row.age_group_max || 60} months`,
        
        // Pricing
        'Price': row.price || 'Contact for pricing',
        
        // Contact Information
        'Phone': row.contact_phone || '',
        'Email': row.contact_email || '',
        'Website': row.website || '',
        
        // Booking Features
        'Direct Booking': row.direct_booking_available || false,
        'Booking Type': row.booking_engine_type || 'contact',
        'Online Payment': row.online_payment_accepted || false,
        
        // Accessibility
        'Wheelchair Accessible': row.wheelchair_accessible || false,
        'Parking Available': row.parking_available || false,
        'Parking Type': row.parking_type || '',
        
        // Status
        'Status': row.is_featured ? 'Featured' : 'Active'
      }
    }));

    // Sync detailed records to Airtable
    console.log('\n🚀 Syncing detailed class information to Airtable...');
    
    const batchSize = 10;
    let synced = 0;
    
    for (let i = 0; i < detailedRecords.length; i += batchSize) {
      const batch = detailedRecords.slice(i, i + batchSize);
      
      try {
        const response = await fetch(`https://api.airtable.com/v0/${baseId}/Parent%20Helper`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            records: batch,
            typecast: true
          })
        });

        if (response.ok) {
          const result = await response.json();
          synced += result.records.length;
          console.log(`   ✅ Added ${result.records.length} detailed class records (Total: ${synced})`);
        } else {
          const error = await response.text();
          console.log(`   ❌ Batch failed: ${response.status} - ${error.substring(0, 100)}...`);
        }
      } catch (error) {
        console.log(`   ❌ Sync error: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n🎉 DETAILED STRUCTURE CREATED!`);
    console.log(`📊 Added ${synced} classes with comprehensive information`);
    console.log(`✅ Your Airtable now has detailed fields for:`);
    console.log(`   • Class schedules (days and times)`);
    console.log(`   • Venue addresses and contact details`);
    console.log(`   • Age ranges and pricing information`);
    console.log(`   • Booking capabilities and accessibility`);
    console.log(`   • Categories and featured status`);

    // Show sample of what was created
    console.log('\n📋 Sample detailed records in your Airtable:');
    detailedRecords.slice(0, 3).forEach((record, idx) => {
      console.log(`\n${idx + 1}. ${record.fields['Business Name']}`);
      console.log(`   📍 ${record.fields['Venue Name']}, ${record.fields['Town']}`);
      console.log(`   🕐 ${record.fields['Schedule']}`);
      console.log(`   👶 Ages: ${record.fields['Age Range']}`);
      console.log(`   💰 Price: ${record.fields['Price']}`);
      console.log(`   📞 Contact: ${record.fields['Phone'] || 'See website'}`);
    });

    console.log('\n💡 Refresh your Airtable to see the detailed class information!');

  } catch (error) {
    console.error('❌ Structure creation error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  createDetailedAirtableStructure().catch(console.error);
}

module.exports = { createDetailedAirtableStructure };