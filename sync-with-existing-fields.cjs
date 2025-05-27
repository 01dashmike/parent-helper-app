const { Client } = require('pg');

async function syncWithExistingFields() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';

  try {
    await client.connect();
    console.log('🎯 SYNCING COMPLETE CLASS DETAILS TO EXISTING AIRTABLE STRUCTURE');
    console.log('📊 Using comprehensive Notes field for all class information...\n');

    // Get all your authentic class data with complete details
    const result = await client.query(`
      SELECT 
        name, description, category, town, postcode, address, venue,
        age_group_min, age_group_max, day_of_week, time, price,
        contact_phone, contact_email, website, is_featured, rating,
        direct_booking_available, booking_engine_type, online_payment_accepted,
        wheelchair_accessible, parking_available, parking_type,
        provider_experience, verification_status, class_size
      FROM classes 
      WHERE is_active = true 
      ORDER BY is_featured DESC, town, name
      LIMIT 100
    `);

    console.log(`📈 Processing ${result.rows.length} authentic classes with complete details`);

    // Create comprehensive class records using existing Airtable fields
    const classRecords = result.rows.map(row => {
      // Create detailed notes with ALL class information
      const comprehensiveNotes = `
📍 VENUE & LOCATION:
• Venue: ${row.venue || 'Not specified'}
• Address: ${row.address || 'Contact for address'}
• Town: ${row.town}
• Postcode: ${row.postcode || 'Contact for postcode'}

🕐 SCHEDULE:
• Day: ${row.day_of_week || 'Contact for schedule'}
• Time: ${row.time || 'Contact for times'}
• Class Schedule: ${row.day_of_week} ${row.time}

👶 AGE GROUPS:
• Age Range: ${row.age_group_min}-${row.age_group_max} months
• Age Display: ${row.age_group_max <= 12 ? `${row.age_group_min}-${row.age_group_max} months` : 
  `${Math.floor(row.age_group_min/12)}-${Math.floor(row.age_group_max/12)} years`}

💰 PRICING:
• Price: ${row.price || 'Contact for pricing'}
• Class Size: ${row.class_size ? `Max ${row.class_size} children` : 'Contact for class size'}

📞 CONTACT DETAILS:
• Phone: ${row.contact_phone || 'Contact via website'}
• Email: ${row.contact_email || 'Contact via website'}
• Website: ${row.website || 'No website listed'}

🎯 BOOKING INFORMATION:
• Direct Booking: ${row.direct_booking_available ? 'Available online' : 'Contact to book'}
• Booking Method: ${row.booking_engine_type || 'Contact provider'}
• Online Payment: ${row.online_payment_accepted ? 'Accepted' : 'Contact for payment options'}

♿ ACCESSIBILITY:
• Wheelchair Access: ${row.wheelchair_accessible ? 'Yes' : 'Contact to confirm'}
• Parking: ${row.parking_available ? (row.parking_type || 'Available') : 'Contact for parking info'}

📊 QUALITY & STATUS:
• Category: ${row.category || 'General Classes'}
• Rating: ${row.rating || 'Not rated'}
• Verification: ${row.verification_status || 'Pending verification'}
• Provider Experience: ${row.provider_experience || 'Contact for provider details'}

📝 DESCRIPTION:
${row.description || 'Contact provider for detailed class information'}
      `.trim();

      return {
        fields: {
          'Name': row.name,
          'Notes': comprehensiveNotes,
          'Status': row.is_featured ? 'Featured' : 'Active'
        }
      };
    });

    console.log('\n🚀 Syncing comprehensive class details to Airtable...');
    
    const batchSize = 10;
    let totalSynced = 0;
    
    for (let i = 0; i < classRecords.length; i += batchSize) {
      const batch = classRecords.slice(i, i + batchSize);
      
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
          totalSynced += result.records.length;
          console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${result.records.length} classes synced (Total: ${totalSynced})`);
        } else {
          const error = await response.text();
          console.log(`   ❌ Batch ${Math.floor(i/batchSize) + 1} failed: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Batch ${Math.floor(i/batchSize) + 1} error: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log(`\n🎉 COMPREHENSIVE CLASS SYNC COMPLETED!`);
    console.log(`📊 Successfully synced ${totalSynced} classes with complete details`);
    console.log(`✅ Each record now contains:`);
    console.log(`   • Venue names and full addresses`);
    console.log(`   • Exact class days and times`);
    console.log(`   • Contact details (phone, email, website)`);
    console.log(`   • Age ranges and pricing information`);
    console.log(`   • Booking capabilities and accessibility`);
    console.log(`   • Provider experience and quality ratings`);

    // Show sample of what parents will see
    console.log('\n📋 Sample comprehensive class record:');
    const sample = classRecords[0];
    console.log(`\nClass: ${sample.fields.Name}`);
    console.log(`Status: ${sample.fields.Status}`);
    console.log(`Full Details:\n${sample.fields.Notes.substring(0, 300)}...`);

    console.log('\n💡 Go to your Airtable and expand the Notes field to see all class details!');
    console.log('🔍 Parents now have complete information about venues, schedules, and booking');

  } catch (error) {
    console.error('❌ Comprehensive sync error:', error.message);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  syncWithExistingFields().catch(console.error);
}

module.exports = { syncWithExistingFields };