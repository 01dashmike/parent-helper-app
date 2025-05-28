const { Client } = require('pg');
const Airtable = require('airtable');
const puppeteer = require('puppeteer');

const token = 'patUmtejVE5l6Lbr7.ec8bcb286d09182ff263889564a7948f02045b359816d0d8a1c175a4d4e96f93';
const baseId = 'app9eOTFWck1sZwTG';

const base = new Airtable({
  apiKey: token
}).base(baseId);

const table = base('tblDcOhMjN0kb8dk4');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractPostcode(text) {
  if (!text) return null;
  const postcodeMatch = text.match(/[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][ABD-HJLNP-UW-Z]{2}/gi);
  return postcodeMatch ? postcodeMatch[0].toUpperCase() : null;
}

function extractAddress(text) {
  if (!text) return null;
  
  // Look for common address patterns
  const addressPatterns = [
    /(\d+[\w\s,]+?[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][ABD-HJLNP-UW-Z]{2})/gi,
    /([A-Z][^.!?]*(?:Street|Road|Lane|Avenue|Drive|Close|Way|Court|Place)[^.!?]*?[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][ABD-HJLNP-UW-Z]{2})/gi
  ];
  
  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim();
  }
  
  return null;
}

async function searchWebForBusiness(browser, businessName) {
  const page = await browser.newPage();
  
  try {
    console.log(`🔍 Searching web for: ${businessName}`);
    
    // Search on Google
    const searchQuery = encodeURIComponent(`"${businessName}" address contact baby toddler classes UK`);
    await page.goto(`https://www.google.com/search?q=${searchQuery}`, { waitUntil: 'networkidle0', timeout: 10000 });
    
    // Get search results text
    const searchResults = await page.evaluate(() => {
      return document.body.innerText;
    });
    
    const address = extractAddress(searchResults);
    const postcode = extractPostcode(searchResults);
    
    if (address && postcode) {
      console.log(`✅ Found address: ${address}`);
      return {
        address: address,
        postcode: postcode,
        town: extractTownFromAddress(address, postcode)
      };
    }
    
    return null;
    
  } catch (error) {
    console.log(`❌ Error searching for ${businessName}: ${error.message}`);
    return null;
  } finally {
    await page.close();
  }
}

function extractTownFromAddress(address, postcode) {
  if (!address) return 'Unknown';
  
  let cleanAddress = address.replace(postcode || '', '').trim();
  cleanAddress = cleanAddress.replace(/,$/, '');
  
  const parts = cleanAddress.split(',').map(part => part.trim()).filter(part => part);
  return parts.length > 0 ? parts[parts.length - 1] : 'Unknown';
}

async function webResearchAddresses() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  let browser;
  
  try {
    await client.connect();
    console.log('🚀 Starting web research for missing addresses...');
    
    browser = await puppeteer.launch({ 
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    // Get businesses with missing addresses that are in Airtable
    const incompleteRecords = [];
    
    await table.select({
      maxRecords: 10,
      filterByFormula: "AND({Business_Name} != '', {Full_Address} = '')"
    }).eachPage((records, fetchNextPage) => {
      incompleteRecords.push(...records);
      fetchNextPage();
    });

    console.log(`Found ${incompleteRecords.length} businesses to research`);

    let enhanced = 0;

    for (const record of incompleteRecords) {
      const businessName = record.fields['Business_Name'];
      
      // Research this business online
      const addressData = await searchWebForBusiness(browser, businessName);
      
      if (addressData) {
        // Update database first
        await client.query(`
          UPDATE classes 
          SET address = $1, postcode = $2, town = $3
          WHERE name ILIKE $4
        `, [addressData.address, addressData.postcode, addressData.town, businessName]);
        
        // Update Airtable
        const updateFields = {
          'Full_Address': addressData.address,
          'Postcode': addressData.postcode,
          'Town': addressData.town
        };
        
        await table.update(record.id, updateFields);
        
        console.log(`✅ Enhanced: ${businessName}`);
        console.log(`   Address: ${addressData.address}`);
        enhanced++;
      } else {
        console.log(`⚠️  No address found for: ${businessName}`);
      }
      
      // Delay between searches to be respectful
      await sleep(3000);
    }

    console.log(`\n🎉 Successfully found addresses for ${enhanced} businesses!`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (browser) await browser.close();
    await client.end();
  }
}

webResearchAddresses();