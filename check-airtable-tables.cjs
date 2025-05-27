async function checkTables() {
  const token = 'pat9cXVmi4fHA3oxH.7b5b720f8f7ccd23a2eb22b8c90a1741ba8cb353e2f7033face614b3423b3811';
  const baseId = 'app9eOTFWck1sZwTG';
  
  console.log('🔍 Checking your Airtable base structure...');
  
  try {
    const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Found your tables:');
      
      data.tables.forEach((table, idx) => {
        console.log(`\n${idx + 1}. Table: "${table.name}" (ID: ${table.id})`);
        console.log(`   Fields: ${table.fields.length}`);
        table.fields.slice(0, 5).forEach(field => {
          console.log(`   - ${field.name} (${field.type})`);
        });
        if (table.fields.length > 5) {
          console.log(`   ... and ${table.fields.length - 5} more fields`);
        }
      });
      
      // Use the first table for syncing
      const firstTable = data.tables[0];
      console.log(`\n🎯 Will sync to table: "${firstTable.name}"`);
      return firstTable.name;
      
    } else {
      const error = await response.text();
      console.log(`❌ Failed to get tables: ${error}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

checkTables().catch(console.error);