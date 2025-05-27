const { Client } = require('pg');

async function createAirtableBaseStructure() {
  console.log('🎯 CREATING AIRTABLE BASE STRUCTURE FOR PARENT HELPER');
  console.log('📊 Designing the perfect schema for your family directory...\n');

  const baseStructure = {
    name: "Parent Helper Directory",
    tables: [
      {
        name: "Family Businesses",
        description: "Complete directory of family-friendly businesses across the UK",
        fields: [
          // Core Business Information
          { name: "Business Name", type: "singleLineText", options: { required: true } },
          { name: "Description", type: "multilineText" },
          { name: "Category", type: "singleSelect", options: { 
            choices: [
              "Music Classes", "Swimming", "Sensory Play", "Dance & Movement",
              "Baby Yoga", "Play Groups", "SEND Support", "Photography",
              "After School Clubs", "Parent Support Groups"
            ]
          }},
          
          // Location Details
          { name: "Town", type: "singleLineText" },
          { name: "Postcode", type: "singleLineText" },
          { name: "Full Address", type: "multilineText" },
          { name: "Venue", type: "singleLineText" },
          
          // Age Groups
          { name: "Age Min (months)", type: "number", options: { precision: 0 } },
          { name: "Age Max (months)", type: "number", options: { precision: 0 } },
          { name: "Age Range Display", type: "formula", options: { 
            formula: `IF({Age Max (months)} <= 12, "Babies (0-12m)", 
                     IF({Age Max (months)} <= 36, "Toddlers (1-3y)", 
                     IF({Age Max (months)} <= 60, "Preschool (3-5y)", "School Age (5+y)")))`
          }},
          
          // Scheduling
          { name: "Day of Week", type: "singleSelect", options: {
            choices: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          }},
          { name: "Time", type: "singleLineText" },
          { name: "Fixed Course Dates", type: "checkbox" },
          { name: "Booking Required", type: "checkbox" },
          { name: "Drop In Allowed", type: "checkbox" },
          { name: "Free Trial Available", type: "checkbox" },
          
          // Pricing
          { name: "Price", type: "singleLineText" },
          { name: "Class Size", type: "number", options: { precision: 0 } },
          
          // Contact Information
          { name: "Phone", type: "phoneNumber" },
          { name: "Website", type: "url" },
          { name: "Email", type: "email" },
          
          // Quality & Features
          { name: "Featured", type: "checkbox" },
          { name: "AI Quality Score", type: "number", options: { precision: 1 } },
          { name: "Rating", type: "rating", options: { max: 5 } },
          { name: "Verification Status", type: "singleSelect", options: {
            choices: ["Verified", "Pending", "Flagged"]
          }},
          
          // Accessibility
          { name: "Wheelchair Accessible", type: "checkbox" },
          { name: "Disability Support", type: "multilineText" },
          { name: "Parking Available", type: "checkbox" },
          { name: "Parking Type", type: "singleSelect", options: {
            choices: ["Free", "Paid", "Street", "Limited", "None"]
          }},
          
          // Enhanced Information
          { name: "What to Expect", type: "multilineText" },
          { name: "What to Bring", type: "multilineText" },
          { name: "Provider Experience", type: "multilineText" },
          { name: "AI Summary", type: "multilineText" },
          
          // Dates
          { name: "Created Date", type: "dateTime" },
          { name: "Last Updated", type: "lastModifiedTime" }
        ]
      },
      
      {
        name: "Towns Coverage",
        description: "Track geographic coverage across UK towns",
        fields: [
          { name: "Town Name", type: "singleLineText" },
          { name: "Business Count", type: "count", options: { linkedRecordId: "Family Businesses" } },
          { name: "Featured Count", type: "rollup", options: { 
            linkedRecordId: "Family Businesses",
            rollupColumnId: "Featured"
          }},
          { name: "Average Quality Score", type: "rollup", options: {
            linkedRecordId: "Family Businesses",
            rollupColumnId: "AI Quality Score",
            rollupFunction: "AVERAGE"
          }},
          { name: "Coverage Status", type: "formula", options: {
            formula: `IF({Business Count} >= 10, "Excellent", 
                     IF({Business Count} >= 5, "Good", 
                     IF({Business Count} >= 1, "Limited", "No Coverage")))`
          }}
        ]
      },
      
      {
        name: "Categories Overview",
        description: "Track different types of family services",
        fields: [
          { name: "Category Name", type: "singleLineText" },
          { name: "Business Count", type: "count", options: { linkedRecordId: "Family Businesses" } },
          { name: "Average Price", type: "singleLineText" },
          { name: "Most Popular Towns", type: "rollup", options: {
            linkedRecordId: "Family Businesses",
            rollupColumnId: "Town"
          }}
        ]
      }
    ]
  };

  console.log('📋 RECOMMENDED AIRTABLE BASE STRUCTURE:');
  console.log('=====================================\n');
  
  baseStructure.tables.forEach((table, idx) => {
    console.log(`${idx + 1}. ${table.name}`);
    console.log(`   ${table.description}`);
    console.log(`   ${table.fields.length} fields configured\n`);
  });

  console.log('🎨 KEY FEATURES OF YOUR BASE:');
  console.log('• Visual quality scoring with AI-generated ratings');
  console.log('• Geographic coverage tracking across UK towns');
  console.log('• Accessibility and inclusion filtering');
  console.log('• Enhanced booking and scheduling information');
  console.log('• Automated age range categorization');
  console.log('• Provider experience and qualification tracking');
  console.log('• Real-time coverage analysis by location');

  console.log('\n📊 VIEWS YOU CAN CREATE:');
  console.log('• Featured Businesses (high-quality, verified)');
  console.log('• By Location (map view of all businesses)');
  console.log('• Accessibility First (wheelchair accessible only)');
  console.log('• New Additions (recently added businesses)');
  console.log('• Quality Leaders (highest AI scores)');
  console.log('• Coverage Gaps (underserved areas)');

  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Create a new base in Airtable using this structure');
  console.log('2. Share your base ID (starts with "app...")');
  console.log('3. I\'ll sync your 5,947 authentic businesses immediately!');

  // Show sample data structure
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const sampleData = await client.query(`
      SELECT name, category, town, age_group_min, age_group_max, 
             is_featured, ai_quality_score, wheelchair_accessible
      FROM classes 
      WHERE is_active = true 
      ORDER BY ai_quality_score DESC NULLS LAST
      LIMIT 5
    `);

    console.log('\n📋 SAMPLE RECORDS READY FOR SYNC:');
    sampleData.rows.forEach((row, idx) => {
      console.log(`\n${idx + 1}. ${row.name} (${row.town})`);
      console.log(`   Category: ${row.category}`);
      console.log(`   Ages: ${row.age_group_min}-${row.age_group_max} months`);
      console.log(`   Quality: ${row.ai_quality_score || 'Unrated'}/10`);
      console.log(`   Featured: ${row.is_featured ? '⭐' : '•'} | Accessible: ${row.wheelchair_accessible ? '♿' : '•'}`);
    });

  } catch (error) {
    console.log('Note: Database connection for sample data not available');
  } finally {
    await client.end();
  }

  return baseStructure;
}

if (require.main === module) {
  createAirtableBaseStructure().catch(console.error);
}

module.exports = { createAirtableBaseStructure };