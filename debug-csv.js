import fs from 'fs';
import csv from 'csv-parser';

console.log('Starting CSV diagnostic...');

const results = [];
let rowCount = 0;

fs.createReadStream('attached_assets/Outscraper-20250525164446m03_toddler_classes_+1.csv')
  .pipe(csv())
  .on('data', (row) => {
    rowCount++;
    if (rowCount <= 5) {
      console.log(`Row ${rowCount}:`, JSON.stringify(row, null, 2));
      results.push(row);
    }
  })
  .on('end', () => {
    console.log(`\nTotal rows in CSV: ${rowCount}`);
    console.log('\nFirst 5 rows processed successfully');
    
    // Test data processing on first row
    if (results.length > 0) {
      const firstRow = results[0];
      console.log('\nTesting data processing on first row...');
      
      try {
        const businessName = firstRow['Business Name'] || firstRow['name'] || '';
        const address = firstRow['Address'] || firstRow['address'] || '';
        const latitude = parseFloat(firstRow['Latitude'] || firstRow['lat'] || '0');
        const longitude = parseFloat(firstRow['Longitude'] || firstRow['lng'] || '0');
        
        console.log('Processed data:', {
          businessName,
          address,
          latitude,
          longitude,
          isValidLatLng: !isNaN(latitude) && !isNaN(longitude)
        });
        
      } catch (error) {
        console.error('Error processing first row:', error);
      }
    }
  })
  .on('error', (error) => {
    console.error('CSV reading error:', error);
  });