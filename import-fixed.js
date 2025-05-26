import fs from 'fs';
import csv from 'csv-parser';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

console.log('Starting FIXED Outscraper data import...');

// Clean phone number function
function cleanPhoneNumber(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+44')) return cleaned;
  if (cleaned.startsWith('0')) return '+44' + cleaned.substring(1);
  if (cleaned.length === 10 && !cleaned.startsWith('0')) return '+44' + cleaned;
  return cleaned.length >= 10 ? cleaned : null;
}

// Extract postcode from address
function extractPostcode(address) {
  if (!address) return '';
  const postcodeMatch = address.match(/[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}/i);
  return postcodeMatch ? postcodeMatch[0] : '';
}

// Categorize class type
function categorizeClass(name, description, type) {
  const text = `${name} ${description || ''} ${type || ''}`.toLowerCase();
  
  if (text.includes('swim') || text.includes('aqua')) return 'Swimming';
  if (text.includes('music') || text.includes('song') || text.includes('sing')) return 'Music & Singing';
  if (text.includes('dance') || text.includes('ballet') || text.includes('movement')) return 'Dance & Movement';
  if (text.includes('yoga') || text.includes('mindful') || text.includes('relax')) return 'Yoga & Mindfulness';
  if (text.includes('sensory') || text.includes('baby sensory')) return 'Sensory Play';
  if (text.includes('martial') || text.includes('karate') || text.includes('judo')) return 'Physical Development';
  if (text.includes('art') || text.includes('craft') || text.includes('creative')) return 'Arts & Crafts';
  if (text.includes('language') || text.includes('sign') || text.includes('communication')) return 'Language & Communication';
  
  return 'General Classes';
}

async function importData(csvFilePath) {
  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', async (row) => {
        try {
          processedCount++;
          
          // Extract data from CSV
          const businessName = row['name'] || '';
          const address = row['full_address'] || '';
          const postcode = row['postal_code'] || extractPostcode(address);
          const city = row['city'] || '';
          const phone = cleanPhoneNumber(row['phone'] || '');
          const website = row['site'] || null;
          const latitude = parseFloat(row['latitude'] || '0');
          const longitude = parseFloat(row['longitude'] || '0');
          const rating = parseFloat(row['rating'] || '0') || null;
          const reviewCount = parseInt(row['reviews'] || '0') || 0;
          const description = row['description'] || row['website_description'] || '';
          const category = categorizeClass(businessName, description, row['category']);
          
          // Skip if missing essential data
          if (!businessName || (!postcode && !address) || isNaN(latitude) || isNaN(longitude)) {
            return;
          }
          
          // Prepare sanitized data
          const classData = {
            name: businessName.substring(0, 255),
            description: (description || `${businessName} - Classes for children`).substring(0, 1000),
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
            category: category,
            price: 'Contact for pricing',
            website: website?.substring(0, 500) || null,
            phone: phone?.substring(0, 50) || null,
            rating: rating,
            reviewCount: reviewCount,
            isActive: true,
            isFeatured: false
          };

          // Insert into database
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
          
          successCount++;
          
          // Progress update every 100 records
          if (successCount % 100 === 0) {
            console.log(`✓ Progress: ${successCount} classes imported successfully`);
          }
          
          // Small delay to prevent overwhelming database
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (error) {
          errorCount++;
          if (errorCount % 50 === 0) {
            console.log(`⚠ ${errorCount} errors encountered so far`);
          }
        }
      })
      .on('end', () => {
        console.log(`Import completed:`);
        console.log(`- Total processed: ${processedCount}`);
        console.log(`- Successfully imported: ${successCount}`);
        console.log(`- Errors: ${errorCount}`);
        resolve({ processedCount, successCount, errorCount });
      })
      .on('error', reject);
  });
}

// Run the import
const csvFile = process.argv[2];
if (!csvFile) {
  console.error('Please provide CSV file path');
  process.exit(1);
}

importData(csvFile)
  .then(result => {
    console.log('Import finished successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Import failed:', error);
    process.exit(1);
  });