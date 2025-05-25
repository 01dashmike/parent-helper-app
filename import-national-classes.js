import fs from 'fs';
import csv from 'csv-parser';
import pkg from 'pg';
const { Client } = pkg;

// Database connection
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

const results = [];

async function importClasses() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Read and parse CSV
    fs.createReadStream('./attached_assets/Outscraper-20250525164446m03_toddler_classes_+1.csv')
      .pipe(csv())
      .on('data', (data) => {
        // Filter for UK classes with good data
        if (data.name && 
            data.city && 
            data.postal_code && 
            data.country_code === 'GB' &&
            data.latitude && 
            data.longitude) {
          
          // Parse age groups from name/description
          let ageGroupMin = 0;
          let ageGroupMax = 60; // Default 5 years
          
          if (data.name.toLowerCase().includes('baby')) {
            ageGroupMax = 12; // 0-12 months
          }
          
          // Extract price info
          let price = null;
          if (data.description && data.description.includes('£')) {
            const priceMatch = data.description.match(/£(\d+)/);
            if (priceMatch) {
              price = priceMatch[1];
            }
          }
          
          // Determine if it's featured (big brands)
          const isFeatured = data.name.toLowerCase().includes('baby sensory') || 
                           data.name.toLowerCase().includes('toddler sense');
          
          // Clean and format data
          const classData = {
            name: data.name.trim(),
            description: data.description ? data.description.substring(0, 500) : 'Baby and toddler development classes',
            ageGroupMin: ageGroupMin,
            ageGroupMax: ageGroupMax,
            price: price,
            isFeatured: isFeatured,
            venue: data.street || data.city,
            address: data.full_address || `${data.street}, ${data.city}`,
            postcode: data.postal_code.toUpperCase(),
            latitude: data.latitude,
            longitude: data.longitude,
            dayOfWeek: 'Various',
            time: 'Various times',
            category: data.name.toLowerCase().includes('baby') ? 'Baby Classes' : 'Toddler Classes',
            website: data.site || null,
            phone: data.phone || null,
            rating: data.rating ? data.rating.toString() : null,
            reviewCount: data.reviews ? parseInt(data.reviews) : 0,
            isActive: true
          };
          
          results.push(classData);
        }
      })
      .on('end', async () => {
        console.log(`Processed ${results.length} valid classes`);
        
        // Insert into database in batches
        let imported = 0;
        
        for (const classData of results) {
          try {
            const query = `
              INSERT INTO classes (
                name, description, age_group_min, age_group_max, price, is_featured,
                venue, address, postcode, latitude, longitude, day_of_week, time,
                category, website, phone, rating, review_count, is_active
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            `;
            
            await client.query(query, [
              classData.name,
              classData.description,
              classData.ageGroupMin,
              classData.ageGroupMax,
              classData.price,
              classData.isFeatured,
              classData.venue,
              classData.address,
              classData.postcode,
              classData.latitude,
              classData.longitude,
              classData.dayOfWeek,
              classData.time,
              classData.category,
              classData.website,
              classData.phone,
              classData.rating,
              classData.reviewCount,
              classData.isActive
            ]);
            
            imported++;
            
            if (imported % 100 === 0) {
              console.log(`Imported ${imported} classes...`);
            }
            
          } catch (error) {
            console.log(`Error importing ${classData.name}:`, error.message);
          }
        }
        
        console.log(`✅ Successfully imported ${imported} classes!`);
        await client.end();
      });
      
  } catch (error) {
    console.error('Error importing classes:', error);
    await client.end();
  }
}

importClasses();