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
  
  const priceMatch = text.match(/£?(\d+(?:\.\d{2})?)/);
  return priceMatch ? parseFloat(priceMatch[1]) : null;
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
          
          // Extract town name from city or address
          let town = city || '';
          if (!town && address) {
            // Try to extract town from address
            const addressParts = address.split(',').map(part => part.trim());
            // Look for common UK town patterns
            for (const part of addressParts) {
              if (part && !part.match(/^\d+/) && !part.match(/road|street|lane|avenue|close|drive|way|place/i) && part.length > 2) {
                town = part;
                break;
              }
            }
          }
          
          // Skip if missing essential data - but now postcode OR address is acceptable
          if (!businessName || (!postcode && !address) || isNaN(latitude) || isNaN(longitude)) {
            skippedCount++;
            return;
          }

          const ageRange = extractAgeRange(businessName, description);
          const classCategory = categorizeClass(businessName, description, category);
          const extractedPrice = extractPrice(description) || extractPrice(businessName);
          const isFree = isFreeClass(businessName, description, extractedPrice);
          // Ensure price is always numeric or null for database
          const price = isFree ? null : (typeof extractedPrice === 'number' ? extractedPrice : null);

          results.push({
            name: businessName,
            description: description || `${businessName} - Classes for children`,
            ageGroupMin: ageRange.min,
            ageGroupMax: ageRange.max,
            venue: businessName,
            address: address,
            postcode: postcode,
            town: town || city || '',
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

          // Import in optimized batches for faster processing
          const batchSize = 10; // Smaller batches for debugging
          let successCount = 0;
          let errorCount = 0;
          
          console.log(`Starting import of ${results.length} entries in batches of ${batchSize}...`);
          
          for (let i = 0; i < results.length; i += batchSize) {
            const batch = results.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(results.length/batchSize)} (entries ${i + 1}-${Math.min(i + batchSize, results.length)})`);
            
            try {
              for (const classData of batch) {
                try {
                  // Fast insert without slow duplicate checking
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
                } catch (itemError) {
                  console.error(`Error importing class "${classData.name}":`, itemError.message);
                  errorCount++;
                }
              }

              console.log(`Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(results.length/batchSize)} complete: ${successCount - (i === 0 ? 0 : successCount - batch.length)} imported, ${errorCount - (i === 0 ? 0 : errorCount)} errors`);
            } catch (batchError) {
              console.error(`Error importing batch:`, batchError.message);
              errorCount += batch.length;
            }
          }

          console.log(`Import completed:`);
          console.log(`- Total entries processed: ${results.length}`);
          console.log(`- Successfully imported: ${successCount}`);
          console.log(`- Skipped (duplicates): ${skippedCount}`);
          console.log(`- Errors: ${errorCount}`);

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