import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testPricingExtraction() {
  console.log('🔍 Testing pricing extraction...');
  
  // Test with a known business website
  const testBusinesses = [
    'http://www.360play.co.uk',
    'http://www.abetterstartsouthend.co.uk',
    'http://www.babysensory.com/hemel/'
  ];
  
  for (const website of testBusinesses) {
    console.log(`\n📍 Testing: ${website}`);
    
    try {
      const response = await fetch(website, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000,
        redirect: 'follow'
      });

      if (response.ok) {
        const html = await response.text();
        console.log(`✅ Successfully fetched HTML (${html.length} characters)`);
        
        // Extract pricing using the same logic as the scraper
        const text = html
          .replace(/<script[^>]*>.*?<\/script>/gis, '')
          .replace(/<style[^>]*>.*?<\/style>/gis, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .toLowerCase();
        
        console.log(`📝 Cleaned text length: ${text.length}`);
        
        // Look for pricing patterns
        const pricePatterns = [
          /£\s*(\d+(?:\.\d{2})?)/g,
          /(\d+(?:\.\d{2})?)\s*pounds?/gi,
          /(?:price|cost|fee|charge)[s]?\s*(?:is|are|:|-|from)?\s*£?\s*(\d+(?:\.\d{2})?)/gi,
          /(?:starting|from)\s*(?:at|just)?\s*£?\s*(\d+(?:\.\d{2})?)/gi
        ];
        
        let foundPrices = [];
        
        for (const pattern of pricePatterns) {
          const matches = [...text.matchAll(pattern)];
          for (const match of matches) {
            const priceValue = parseFloat(match[1] || match[0].replace(/[£\s]/g, ''));
            if (priceValue >= 3 && priceValue <= 200) {
              foundPrices.push(priceValue);
              console.log(`💰 Found potential price: £${priceValue} (pattern: ${pattern})`);
            }
          }
        }
        
        if (foundPrices.length === 0) {
          // Show some sample text to see what we're working with
          const sampleText = text.substring(0, 500);
          console.log(`📄 Sample text: ${sampleText}...`);
          
          // Check if pricing keywords exist
          const keywords = ['price', 'cost', 'fee', 'booking', '£'];
          const foundKeywords = keywords.filter(k => text.includes(k));
          console.log(`🔍 Found keywords: ${foundKeywords.join(', ')}`);
        }
        
      } else {
        console.log(`❌ Failed to fetch: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`⚠️ Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  await pool.end();
}

testPricingExtraction().catch(console.error);