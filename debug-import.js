import fs from 'fs';
import csv from 'csv-parser';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

console.log('Starting diagnostic import...');

// Test a single insert to identify the exact issue
const testData = {
  name: 'Test Class',
  description: 'Test Description',
  ageGroupMin: 0,
  ageGroupMax: 60,
  venue: 'Test Venue',
  address: 'Test Address',
  postcode: 'TE5T 1NG',
  town: 'Test Town',
  latitude: 51.5074,
  longitude: -0.1278,
  dayOfWeek: 'Monday',
  time: '10:00 AM',
  category: 'Test Category',
  price: 'Free',
  website: null,
  phone: null,
  rating: null,
  reviewCount: 0,
  isActive: true,
  isFeatured: false
};

try {
  console.log('Testing database connection...');
  const connectionTest = await sql`SELECT 1 as test`;
  console.log('✓ Database connection works:', connectionTest);

  console.log('Testing single insert...');
  await sql`
    INSERT INTO classes (
    name, description, age_group_min, age_group_max, venue, address, 
    postcode, town, latitude, longitude, day_of_week, time, category, 
    price, website, contact_phone, rating, review_count, 
    is_active, is_featured
  ) VALUES (
    ${testData.name}, ${testData.description}, ${testData.ageGroupMin}, 
    ${testData.ageGroupMax}, ${testData.venue}, ${testData.address}, 
    ${testData.postcode}, ${testData.town}, ${testData.latitude}, 
    ${testData.longitude}, ${testData.dayOfWeek}, ${testData.time}, 
    ${testData.category}, ${testData.price}, ${testData.website}, 
    ${testData.phone}, ${testData.rating}, ${testData.reviewCount}, 
    ${testData.isActive}, ${testData.isFeatured}
  )
  `;
  console.log('✓ Test insert successful!');

  // Delete the test record
  await sql`DELETE FROM classes WHERE name = 'Test Class' AND venue = 'Test Venue'`;
  console.log('✓ Test record cleaned up');

} catch (error) {
  console.error('✗ Error during test:', error);
  console.error('Error details:', {
    message: error.message,
    code: error.code,
    detail: error.detail,
    hint: error.hint,
    position: error.position
  });
}

console.log('Diagnostic complete.');