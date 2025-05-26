import fs from 'fs';
import csv from 'csv-parser';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

console.log('Testing single record import...');

// Process just the first record from CSV
fs.createReadStream('attached_assets/Outscraper-20250525164446m03_toddler_classes_+1.csv')
  .pipe(csv())
  .on('data', async (row) => {
    try {
      console.log('Processing first row...');
      
      const businessName = row['name'] || 'Unknown Class';
      const address = row['full_address'] || '';
      const postcode = row['postal_code'] || '';
      const city = row['city'] || '';
      const phone = row['phone'] || null;
      const website = row['site'] || null;
      const latitude = parseFloat(row['latitude'] || '0');
      const longitude = parseFloat(row['longitude'] || '0');
      const rating = parseFloat(row['rating'] || '0') || null;
      const reviewCount = parseInt(row['reviews'] || '0') || 0;
      
      console.log('Extracted data:', {
        businessName,
        city,
        postcode,
        latitude,
        longitude
      });

      const classData = {
        name: businessName.substring(0, 255),
        description: 'Baby and toddler classes',
        ageGroupMin: 0,
        ageGroupMax: 60,
        venue: businessName.substring(0, 255),
        address: address.substring(0, 500),
        postcode: postcode.substring(0, 20),
        town: city.substring(0, 100),
        latitude: !isNaN(latitude) ? latitude : null,
        longitude: !isNaN(longitude) ? longitude : null,
        dayOfWeek: 'Multiple',
        time: 'Various times',
        category: 'General Classes',
        price: 'Contact for pricing',
        website: website?.substring(0, 500) || null,
        phone: phone?.substring(0, 50) || null,
        rating: rating,
        reviewCount: reviewCount,
        isActive: true,
        isFeatured: false
      };

      console.log('Attempting database insert...');
      
      await sql`
        INSERT INTO classes (
        name, description, age_group_min, age_group_max, venue, address, 
        postcode, town, latitude, longitude, day_of_week, time, category, 
        price, website, contact_phone, rating, review_count, 
        is_active, is_featured
      ) VALUES (
        ${classData.name}, ${classData.description}, ${classData.ageGroupMin}, 
        ${classData.ageGroupMax}, ${classData.venue}, ${classData.address}, 
        ${classData.postcode}, ${classData.town}, ${classData.latitude}, 
        ${classData.longitude}, ${classData.dayOfWeek}, ${classData.time}, 
        ${classData.category}, ${classData.price}, ${classData.website}, 
        ${classData.phone}, ${classData.rating}, ${classData.reviewCount}, 
        ${classData.isActive}, ${classData.isFeatured}
      )
      `;
      
      console.log('✓ Successfully imported first record!');
      process.exit(0);
      
    } catch (error) {
      console.error('✗ Error during import:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail
      });
      process.exit(1);
    }
  })
  .on('error', (error) => {
    console.error('CSV error:', error);
    process.exit(1);
  });