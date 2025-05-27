const { Client } = require('pg');
const fs = require('fs');

async function exportForAirtable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🚀 EXPORTING YOUR AUTHENTIC PARENT HELPER DATA');
    console.log('📊 Preparing CSV file for easy Airtable import...\n');

    // Get your authentic business data with enhanced fields
    const result = await client.query(`
      SELECT 
        name as "Business Name",
        description as "Description",
        category as "Category",
        town as "Town",
        postcode as "Postcode",
        address as "Full Address",
        venue as "Venue",
        age_group_min as "Age Min (months)",
        age_group_max as "Age Max (months)",
        day_of_week as "Day of Week",
        time as "Time",
        price as "Price",
        contact_phone as "Phone",
        website as "Website",
        is_featured as "Featured",
        rating as "Rating",
        wheelchair_accessible as "Wheelchair Accessible",
        disability_support as "Disability Support",
        ai_quality_score as "AI Quality Score",
        ai_summary as "AI Summary",
        what_to_expect as "What to Expect",
        what_to_bring as "What to Bring",
        provider_experience as "Provider Experience",
        verification_status as "Verification Status",
        class_size as "Class Size",
        parking_available as "Parking Available",
        parking_type as "Parking Type",
        fixed_course_dates as "Fixed Course Dates",
        booking_required as "Booking Required",
        free_trial_available as "Free Trial Available",
        created_at as "Created Date"
      FROM classes 
      WHERE is_active = true 
      ORDER BY ai_quality_score DESC NULLS LAST, is_featured DESC, town
      LIMIT 1000
    `);

    console.log(`📈 Found ${result.rows.length} authentic businesses to export`);

    // Create CSV content
    const headers = Object.keys(result.rows[0]);
    let csvContent = headers.join(',') + '\n';

    result.rows.forEach(row => {
      const values = headers.map(header => {
        let value = row[header];
        
        // Handle different data types
        if (value === null || value === undefined) {
          return '';
        }
        if (typeof value === 'boolean') {
          return value ? 'TRUE' : 'FALSE';
        }
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvContent += values.join(',') + '\n';
    });

    // Save to file
    fs.writeFileSync('parent-helper-businesses.csv', csvContent);

    console.log('\n✅ CSV EXPORT COMPLETED!');
    console.log('📁 File created: parent-helper-businesses.csv');
    console.log(`📊 Contains ${result.rows.length} authentic family businesses`);

    console.log('\n🎯 TO IMPORT INTO AIRTABLE:');
    console.log('1. Go to your Airtable base');
    console.log('2. Click "Import" in the top toolbar');
    console.log('3. Select "CSV file"');
    console.log('4. Upload the parent-helper-businesses.csv file');
    console.log('5. Map the fields and import!');

    console.log('\n✨ YOUR DATA INCLUDES:');
    console.log('• Complete business information');
    console.log('• AI quality scores and summaries');
    console.log('• Accessibility and booking details');
    console.log('• Provider qualifications');
    console.log('• Geographic coverage');

    // Show sample of what's being exported
    console.log('\n📋 SAMPLE RECORDS:');
    result.rows.slice(0, 3).forEach((row, idx) => {
      console.log(`\n${idx + 1}. ${row['Business Name']} (${row['Town']})`);
      console.log(`   Category: ${row['Category']} | Quality: ${row['AI Quality Score'] || 'Unrated'}/10`);
      console.log(`   Featured: ${row['Featured'] ? 'Yes' : 'No'} | Accessible: ${row['Wheelchair Accessible'] ? 'Yes' : 'No'}`);
    });

  } catch (error) {
    console.error('❌ Export error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  exportForAirtable().catch(console.error);
}

module.exports = { exportForAirtable };