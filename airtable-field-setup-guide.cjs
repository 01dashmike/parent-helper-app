console.log('📋 AIRTABLE FIELD SETUP GUIDE');
console.log('🎯 Manual steps to create proper columns in your Airtable base\n');

console.log('🏗️ FIELDS TO ADD TO YOUR "PARENT HELPER" TABLE:');
console.log('(Go to your Airtable base and click the + button to add these fields)\n');

const fieldsToAdd = [
  { name: 'Business_Name', type: 'Single line text', description: 'Name of the business/class' },
  { name: 'Category', type: 'Single select', description: 'Type of class (Sensory Play, Swimming, etc.)' },
  { name: 'Town', type: 'Single line text', description: 'Town/city location' },
  { name: 'Postcode', type: 'Single line text', description: 'Postal code' },
  { name: 'Venue_Name', type: 'Single line text', description: 'Name of venue where class is held' },
  { name: 'Full_Address', type: 'Long text', description: 'Complete address of venue' },
  { name: 'Day_of_Week', type: 'Single select', description: 'Day class runs (Monday, Tuesday, etc.)' },
  { name: 'Class_Time', type: 'Single line text', description: 'Time class starts (e.g., 10:30am)' },
  { name: 'Age_Min_Months', type: 'Number', description: 'Minimum age in months' },
  { name: 'Age_Max_Months', type: 'Number', description: 'Maximum age in months' },
  { name: 'Price', type: 'Single line text', description: 'Class price (e.g., £8.50)' },
  { name: 'Contact_Phone', type: 'Phone number', description: 'Business phone number' },
  { name: 'Contact_Email', type: 'Email', description: 'Business email address' },
  { name: 'Website', type: 'URL', description: 'Business website' },
  { name: 'Description', type: 'Long text', description: 'Class description' },
  { name: 'Featured', type: 'Checkbox', description: 'Is this a featured class?' },
  { name: 'Rating', type: 'Number', description: 'Class rating (1-5)' },
  { name: 'Direct_Booking', type: 'Checkbox', description: 'Can book directly online?' },
  { name: 'Online_Payment', type: 'Checkbox', description: 'Accepts online payment?' },
  { name: 'Wheelchair_Access', type: 'Checkbox', description: 'Wheelchair accessible?' },
  { name: 'Parking_Available', type: 'Checkbox', description: 'Parking available?' }
];

fieldsToAdd.forEach((field, index) => {
  console.log(`${index + 1}. Field Name: "${field.name}"`);
  console.log(`   Type: ${field.type}`);
  console.log(`   Purpose: ${field.description}`);
  console.log('');
});

console.log('📊 SUGGESTED SINGLE SELECT OPTIONS:');
console.log('\nFor "Category" field, add these options:');
const categories = ['Sensory Play', 'Swimming', 'Dance & Movement', 'Music Classes', 'Baby Yoga', 'Story Time', 'Arts & Crafts', 'Sports', 'Educational'];
categories.forEach(cat => console.log(`   • ${cat}`));

console.log('\nFor "Day_of_Week" field, add these options:');
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
days.forEach(day => console.log(`   • ${day}`));

console.log('\n🎯 ONCE YOU\'VE ADDED THESE FIELDS:');
console.log('1. Go back to your Airtable base');
console.log('2. Add the fields listed above');
console.log('3. Let me know when ready - I\'ll sync all your authentic data!');
console.log('\n💡 This will give you powerful filtering and sorting of your 5,947 authentic businesses');