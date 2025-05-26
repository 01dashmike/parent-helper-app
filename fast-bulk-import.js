import { db } from './server/db.ts';
import { classes } from './shared/schema.ts';
import fs from 'fs';
import csv from 'csv-parser';

console.log('Starting fast bulk import...');

const results = [];

fs.createReadStream('attached_assets/Outscraper-20250525164446m03_toddler_classes_+1.csv')
  .pipe(csv())
  .on('data', (row) => {
    // Quick processing without duplicate checks
    const businessName = row['name'] || row['business_name'] || row['Business Name'];
    const address = row['address'] || row['Address'] || row['full_address'];
    const postcode = row['postcode'] || row['postal_code'] || extractPostcode(address);
    
    if (businessName && postcode) {
      results.push({
        name: businessName,
        description: `${businessName} - Classes for children`,
        ageGroupMin: 0,
        ageGroupMax: 5,
        venue: businessName,
        address: address || '',
        postcode: postcode,
        town: extractTown(postcode),
        latitude: row['latitude'] || '51.5074',
        longitude: row['longitude'] || '-0.1278',
        dayOfWeek: 'Multiple',
        time: 'Various times',
        category: 'General Classes',
        price: 'Contact for pricing',
        website: row['website'] || null,
        phone: row['phone'] || null,
        rating: parseFloat(row['rating']) || null,
        reviewCount: parseInt(row['review_count']) || 0,
        isActive: true,
        isFeatured: false
      });
    }
  })
  .on('end', async () => {
    console.log(`Bulk importing ${results.length} classes...`);
    
    // Insert in large chunks for speed
    const chunkSize = 100;
    for (let i = 0; i < results.length; i += chunkSize) {
      const chunk = results.slice(i, i + chunkSize);
      await db.insert(classes).values(chunk);
      console.log(`Imported ${i + chunk.length}/${results.length} classes`);
    }
    
    console.log('Bulk import complete!');
    process.exit(0);
  });

function extractPostcode(address) {
  const postcodeMatch = address?.match(/([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/i);
  return postcodeMatch ? postcodeMatch[1].toUpperCase() : 'SW1A 1AA';
}

function extractTown(postcode) {
  if (postcode.startsWith('E') || postcode.startsWith('W') || postcode.startsWith('N') || 
      postcode.startsWith('S') || postcode.startsWith('EC') || postcode.startsWith('WC')) return 'London';
  if (postcode.startsWith('M')) return 'Manchester';
  if (postcode.startsWith('B')) return 'Birmingham';
  if (postcode.startsWith('SO')) return 'Southampton';
  return 'Various';
}