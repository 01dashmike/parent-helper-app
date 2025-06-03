import * as cheerio from 'cheerio';

async function investigateBabySensoryStructure() {
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  console.log('Investigating Baby Sensory website structure...');
  
  const urlsToCheck = [
    'https://www.babysensory.com/find-a-class/',
    'https://www.babysensory.com/locations/',
    'https://www.babysensory.com/franchises/',
    'https://www.babysensory.com/classes/',
    'https://www.babysensory.com/',
    'https://www.babysensory.com/sitemap.xml'
  ];

  for (const url of urlsToCheck) {
    try {
      console.log(`\n=== Checking ${url} ===`);
      
      const response = await fetch(url, {
        headers: { 'User-Agent': userAgent }
      });
      
      if (!response.ok) {
        console.log(`Status: ${response.status} - ${response.statusText}`);
        continue;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      console.log('Page title:', $('title').text().trim());
      
      // Look for location/franchise links
      const locationLinks = new Set();
      
      $('a[href]').each((i, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().trim();
        
        if (href) {
          // Look for UK location patterns
          if (href.match(/\/[a-zA-Z][a-zA-Z-]+\/?$/) && !href.includes('http')) {
            const skipPages = ['about', 'contact', 'find-a-class', 'blog', 'shop', 'training', 'franchise', 'login', 'register', 'terms', 'privacy', 'cookies', 'sitemap'];
            const isLocationPage = !skipPages.some(page => href.includes(page));
            
            if (isLocationPage && text && text.length > 1 && text.length < 50) {
              locationLinks.add(`${href} - ${text}`);
            }
          }
        }
      });
      
      if (locationLinks.size > 0) {
        console.log(`\nFound ${locationLinks.size} potential location links:`);
        Array.from(locationLinks).slice(0, 20).forEach(link => {
          console.log(`  ${link}`);
        });
      }
      
      // Look for postcode search or interactive elements
      const forms = $('form');
      const inputs = $('input[type="text"], input[type="search"], input[name*="postcode"], input[name*="location"]');
      
      if (forms.length > 0) {
        console.log(`\nFound ${forms.length} forms with search functionality`);
      }
      
      if (inputs.length > 0) {
        console.log(`Found ${inputs.length} search inputs`);
        inputs.each((i, input) => {
          const name = $(input).attr('name') || '';
          const placeholder = $(input).attr('placeholder') || '';
          const id = $(input).attr('id') || '';
          console.log(`  Input: name="${name}", placeholder="${placeholder}", id="${id}"`);
        });
      }
      
      // Look for JavaScript that might load locations dynamically
      const scripts = $('script');
      let hasLocationScript = false;
      scripts.each((i, script) => {
        const src = $(script).attr('src') || '';
        const content = $(script).html() || '';
        
        if (src.includes('location') || src.includes('franchise') || 
            content.includes('postcode') || content.includes('location') || content.includes('franchise')) {
          hasLocationScript = true;
        }
      });
      
      if (hasLocationScript) {
        console.log('Found JavaScript that may load locations dynamically');
      }
      
    } catch (error) {
      console.log(`Error checking ${url}: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Try some known UK city patterns
  console.log('\n=== Testing Known UK Cities ===');
  const testCities = [
    'london', 'manchester', 'birmingham', 'liverpool', 'leeds', 'sheffield',
    'bristol', 'winchester', 'reading', 'oxford', 'cambridge', 'brighton',
    'nottingham', 'leicester', 'coventry', 'hull', 'cardiff', 'swansea',
    'northampton', 'portsmouth', 'southampton', 'plymouth', 'derby',
    'stoke-on-trent', 'wolverhampton', 'blackpool', 'preston', 'luton',
    'poole', 'bournemouth', 'swindon', 'crawley', 'worthing', 'eastbourne'
  ];
  
  let validCities = [];
  
  for (const city of testCities.slice(0, 10)) { // Test first 10 cities
    try {
      const testUrl = `https://www.babysensory.com/${city}/`;
      const response = await fetch(testUrl, {
        headers: { 'User-Agent': userAgent }
      });
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        const title = $('title').text();
        
        // Check if this looks like a real franchise page
        if (title && title.toLowerCase().includes('baby sensory') && title.toLowerCase().includes(city)) {
          validCities.push(city);
          console.log(`✓ ${city} - Valid franchise page: "${title}"`);
        }
      }
    } catch (error) {
      // City doesn't exist, continue
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Valid franchise cities found: ${validCities.length}`);
  console.log('Valid cities:', validCities.join(', '));
  
  if (validCities.length > 0) {
    console.log('\nRecommendation: Baby Sensory uses city-based URLs like /city-name/');
    console.log('You should expand the city list to cover all UK locations');
  }
}

investigateBabySensoryStructure().catch(console.error);