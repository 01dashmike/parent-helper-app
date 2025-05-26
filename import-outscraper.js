import fs from 'fs';
import csv from 'csv-parser';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Function to clean and validate phone numbers
function cleanPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // UK phone number validation
  if (cleaned.startsWith('+44')) {
    return cleaned;
  } else if (cleaned.startsWith('0')) {
    return '+44' + cleaned.substring(1);
  } else if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    return '+44' + cleaned;
  }
  
  return cleaned.length >= 10 ? cleaned : null;
}

// Function to extract age range from business name/description
function extractAgeRange(name, description) {
  const text = `${name} ${description || ''}`.toLowerCase();
  
  // Baby classes (0-12 months)
  if (text.includes('baby') || text.includes('newborn') || text.includes('infant')) {
    return { min: 0, max: 12 };
  }
  
  // Toddler classes (12 months - 5 years)
  if (text.includes('toddler') || text.includes('pre-school') || text.includes('preschool')) {
    return { min: 12, max: 60 };
  }
  
  // Look for specific age mentions
  const ageMatch = text.match(/(\d+)\s*(?:months?|mths?)\s*-?\s*(\d+)?\s*(?:years?|yrs?)?/);
  if (ageMatch) {
    const startMonths = parseInt(ageMatch[1]);
    const endYears = ageMatch[2] ? parseInt(ageMatch[2]) * 12 : startMonths + 12;
    return { min: startMonths, max: endYears };
  }
  
  // Default for children's activities
  return { min: 0, max: 60 };
}

// Function to categorize classes
function categorizeClass(name, description, type) {
  const text = `${name} ${description || ''} ${type || ''}`.toLowerCase();
  
  if (text.includes('yoga') || text.includes('meditation')) return 'Yoga & Mindfulness';
  if (text.includes('swim') || text.includes('water')) return 'Swimming';
  if (text.includes('music') || text.includes('singing') || text.includes('rhyme')) return 'Music & Singing';
  if (text.includes('dance') || text.includes('movement')) return 'Dance & Movement';
  if (text.includes('gym') || text.includes('physical') || text.includes('fitness')) return 'Physical Development';
  if (text.includes('sensory') || text.includes('massage')) return 'Sensory Play';
  if (text.includes('art') || text.includes('craft') || text.includes('messy')) return 'Arts & Crafts';
  if (text.includes('language') || text.includes('signing') || text.includes('communication')) return 'Language & Communication';
  if (text.includes('story') || text.includes('reading') || text.includes('book')) return 'Story Time';
  if (text.includes('play') || text.includes('soft play')) return 'Play Groups';
  
  return 'General Classes';
}

// Function to extract price information
function extractPrice(text) {
  if (!text) return null;
  
  const priceMatch = text.match(/£(\d+(?:\.\d{2})?)/);
  return priceMatch ? `£${priceMatch[1]}` : null;
}

// Function to determine if class is free
function isFreeClass(name, description, price) {
  const text = `${name} ${description || ''} ${price || ''}`.toLowerCase();
  return text.includes('free') || text.includes('no charge') || text.includes('£0');
}

async function importOutscraperData(csvFilePath) {
  console.log('Starting Outscraper data import...');
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS outscraper_import_log (
        id SERIAL PRIMARY KEY,
        file_name TEXT,
        total_rows INTEGER,
        imported_count INTEGER,
        skipped_count INTEGER,
        import_date TIMESTAMP DEFAULT NOW()
      )
    `;

    const results = [];
    let totalRows = 0;
    let importedCount = 0;
    let skippedCount = 0;

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          totalRows++;
          
          // Map Outscraper columns to our schema - handle multiple possible column names
          const businessName = row['name'] || row['business_name'] || row['title'];
          const address = row['full_address'] || row['address'];
          const postcode = row['postal_code'] || row['postcode'] || extractPostcode(address);
          const city = row['city'] || '';
          const phone = cleanPhoneNumber(row['phone'] || row['phone_number']);
          const website = row['site'] || row['website'];
          const latitude = parseFloat(row['latitude'] || row['lat']);
          const longitude = parseFloat(row['longitude'] || row['lng']);
          const rating = parseFloat(row['rating'] || row['google_rating']);
          const reviewCount = parseInt(row['reviews'] || row['reviews_count'] || row['review_count'] || 0);
          const description = row['description'] || row['about'] || row['website_description'] || '';
          
          // Debug logging for Southampton entries
          if (city && city.toLowerCase().includes('southampton')) {
            console.log(`Southampton entry found: ${businessName}, Postcode: ${postcode}, Address: ${address}`);
          }
          const category = row['category'] || row['type'] || '';
          
          // Skip if missing essential data
          if (!businessName || !address || isNaN(latitude) || isNaN(longitude)) {
            skippedCount++;
            return;
          }

          const ageRange = extractAgeRange(businessName, description);
          const classCategory = categorizeClass(businessName, description, category);
          const price = extractPrice(description) || extractPrice(businessName);
          const isFree = isFreeClass(businessName, description, price);

          results.push({
            name: businessName,
            description: description || `${businessName} - Classes for children`,
            ageGroupMin: ageRange.min,
            ageGroupMax: ageRange.max,
            venue: businessName,
            address: address,
            postcode: postcode,
            town: '', // Will be assigned by update-towns script
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            dayOfWeek: 'Multiple', // Default for Outscraper data
            time: 'Various times',
            category: classCategory,
            price: isFree ? 'Free' : (price || 'Contact for pricing'),
            isFree: isFree,
            website: website,
            phone: phone,
            rating: rating || null,
            reviewCount: reviewCount,
            imageUrl: null,
            isActive: true,
            isFeatured: false
          });
        })
        .on('end', async () => {
          console.log(`Processing ${results.length} valid entries...`);

          // Import in batches
          const batchSize = 100;
          for (let i = 0; i < results.length; i += batchSize) {
            const batch = results.slice(i, i + batchSize);
            
            try {
              for (const classData of batch) {
                // Check for duplicates
                const existing = await sql`
                  SELECT id FROM classes 
                  WHERE name = ${classData.name} 
                  AND address = ${classData.address}
                `;

                if (existing.length === 0) {
                  await sql`
                    INSERT INTO classes (
                      name, description, age_group_min, age_group_max, venue, address, 
                      postcode, town, latitude, longitude, day_of_week, time, category, 
                      price, is_free, website, phone, rating, review_count, image_url, 
                      is_active, is_featured
                    ) VALUES (
                      ${classData.name}, ${classData.description}, ${classData.ageGroupMin}, 
                      ${classData.ageGroupMax}, ${classData.venue}, ${classData.address}, 
                      ${classData.postcode}, ${classData.town}, ${classData.latitude}, 
                      ${classData.longitude}, ${classData.dayOfWeek}, ${classData.time}, 
                      ${classData.category}, ${classData.price}, ${classData.isFree}, 
                      ${classData.website}, ${classData.phone}, ${classData.rating}, 
                      ${classData.reviewCount}, ${classData.imageUrl}, ${classData.isActive}, 
                      ${classData.isFeatured}
                    )
                  `;
                  importedCount++;
                } else {
                  skippedCount++;
                }
              }

              console.log(`Imported batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(results.length/batchSize)}...`);
            } catch (error) {
              console.error(`Error importing batch:`, error);
            }
          }

          // Log the import
          await sql`
            INSERT INTO outscraper_import_log (file_name, total_rows, imported_count, skipped_count)
            VALUES (${csvFilePath}, ${totalRows}, ${importedCount}, ${skippedCount})
          `;

          console.log(`Import completed:`);
          console.log(`- Total rows processed: ${totalRows}`);
          console.log(`- Successfully imported: ${importedCount}`);
          console.log(`- Skipped (duplicates/invalid): ${skippedCount}`);

          resolve({ totalRows, importedCount, skippedCount });
        })
        .on('error', reject);
    });

  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

function extractPostcode(address) {
  if (!address) return '';
  const postcodeMatch = address.match(/[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}/i);
  return postcodeMatch ? postcodeMatch[0] : '';
}

// Usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const csvFile = process.argv[2];
  if (!csvFile) {
    console.log('Usage: node import-outscraper.js <csv-file-path>');
    console.log('Example: node import-outscraper.js baby-classes-uk.csv');
    process.exit(1);
  }

  importOutscraperData(csvFile)
    .then(result => {
      console.log('Import successful!', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}

export { importOutscraperData };