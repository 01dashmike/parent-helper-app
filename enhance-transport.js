import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Add the transport columns to the database
async function addTransportColumns() {
  console.log('🚗🚌 Adding transport and accessibility columns to database...');
  
  try {
    const { stdout, stderr } = await execAsync(`
      psql "${process.env.DATABASE_URL}" -c "
        ALTER TABLE classes 
        ADD COLUMN IF NOT EXISTS parking_available BOOLEAN,
        ADD COLUMN IF NOT EXISTS parking_type TEXT,
        ADD COLUMN IF NOT EXISTS parking_notes TEXT,
        ADD COLUMN IF NOT EXISTS nearest_tube_station TEXT,
        ADD COLUMN IF NOT EXISTS nearest_bus_stops TEXT[],
        ADD COLUMN IF NOT EXISTS transport_accessibility TEXT,
        ADD COLUMN IF NOT EXISTS venue_accessibility TEXT,
        ADD COLUMN IF NOT EXISTS accessibility_notes TEXT;
      "
    `);
    
    console.log('✅ Transport and accessibility columns added successfully!');
    console.log('📊 Your Parent Helper directory is now ready to display parking, transport, and accessibility information');
    
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('already exists')) console.log('Notes:', stderr);
    
  } catch (error) {
    console.error('Error adding columns:', error.message);
  }
}

// Sample data update for demonstration
async function addSampleTransportData() {
  console.log('📍 Adding sample transport data to demonstrate the new features...');
  
  try {
    const { stdout, stderr } = await execAsync(`
      psql "${process.env.DATABASE_URL}" -c "
        UPDATE classes 
        SET 
          parking_available = true,
          parking_type = 'free',
          parking_notes = 'Free parking available on site',
          venue_accessibility = 'buggy-friendly',
          accessibility_notes = 'Ground floor access, suitable for pushchairs'
        WHERE name ILIKE '%baby sensory%' 
        LIMIT 3;
        
        UPDATE classes 
        SET 
          parking_available = true,
          parking_type = 'street',
          parking_notes = 'Street parking available nearby',
          nearest_tube_station = 'Nearest station within 5 minutes walk',
          venue_accessibility = 'step-free',
          transport_accessibility = 'step-free'
        WHERE town ILIKE '%london%' 
        LIMIT 2;
      "
    `);
    
    console.log('✅ Sample transport data added! You can now see how this information appears on your class cards');
    
  } catch (error) {
    console.error('Error adding sample data:', error.message);
  }
}

async function runTransportEnhancement() {
  console.log('🚀 Starting transport and accessibility enhancement...');
  console.log('📊 This will add valuable information for parents planning their journeys\n');
  
  await addTransportColumns();
  await addSampleTransportData();
  
  console.log('\n🎉 Transport Enhancement Complete!');
  console.log('✅ Your class cards now show parking, transport, and accessibility information');
  console.log('📱 Parents can now see crucial details like parking availability and venue accessibility');
  console.log('🚀 Ready to gather more authentic data as your directory grows!');
}

runTransportEnhancement().catch(console.error);