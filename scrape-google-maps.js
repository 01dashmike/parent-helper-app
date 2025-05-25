const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class GoogleMapsScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for faster scraping
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Set a realistic user agent
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Set viewport
    await this.page.setViewport({ width: 1366, height: 768 });
  }

  async searchAndScrape(searchTerm, location = 'England', maxResults = 100) {
    const query = `${searchTerm} in ${location}`;
    console.log(`Searching for: ${query}`);
    
    // Navigate to Google Maps
    await this.page.goto('https://www.google.com/maps', { waitUntil: 'networkidle2' });
    
    // Search for the term
    await this.page.waitForSelector('input[id="searchboxinput"]');
    await this.page.type('input[id="searchboxinput"]', query);
    await this.page.keyboard.press('Enter');
    
    // Wait for results to load
    await this.page.waitForTimeout(3000);
    
    const results = [];
    let previousResultsCount = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 20;
    
    while (results.length < maxResults && scrollAttempts < maxScrollAttempts) {
      // Extract current results
      const currentResults = await this.page.evaluate(() => {
        const businessElements = document.querySelectorAll('[data-result-index]');
        const businesses = [];
        
        businessElements.forEach(element => {
          try {
            const nameElement = element.querySelector('[class*="fontHeadlineSmall"]');
            const addressElement = element.querySelector('[data-value="Address"]');
            const phoneElement = element.querySelector('[data-value="Phone"]');
            const websiteElement = element.querySelector('a[data-value="Website"]');
            const ratingElement = element.querySelector('[class*="fontBodyMedium"] span[aria-hidden="true"]');
            const reviewCountElement = element.querySelector('[class*="fontBodyMedium"] span:nth-child(2)');
            
            if (nameElement) {
              const business = {
                name: nameElement.textContent.trim(),
                address: addressElement ? addressElement.textContent.trim() : '',
                phone: phoneElement ? phoneElement.textContent.trim() : '',
                website: websiteElement ? websiteElement.href : '',
                rating: ratingElement ? parseFloat(ratingElement.textContent) : null,
                reviewCount: reviewCountElement ? parseInt(reviewCountElement.textContent.replace(/[^\d]/g, '')) : 0
              };
              
              // Only add if we have a name and address
              if (business.name && business.address) {
                businesses.push(business);
              }
            }
          } catch (error) {
            console.log('Error extracting business data:', error);
          }
        });
        
        return businesses;
      });
      
      // Add new results (avoid duplicates)
      currentResults.forEach(business => {
        if (!results.find(existing => existing.name === business.name && existing.address === business.address)) {
          results.push(business);
        }
      });
      
      console.log(`Found ${results.length} results so far...`);
      
      // Check if we got new results
      if (results.length === previousResultsCount) {
        scrollAttempts++;
      } else {
        scrollAttempts = 0; // Reset if we found new results
        previousResultsCount = results.length;
      }
      
      // Scroll to load more results
      await this.page.evaluate(() => {
        const sidebar = document.querySelector('[role="main"]');
        if (sidebar) {
          sidebar.scrollTop = sidebar.scrollHeight;
        }
      });
      
      // Wait for new results to load
      await this.page.waitForTimeout(2000);
    }
    
    console.log(`Completed search for "${searchTerm}": ${results.length} results`);
    return results;
  }

  async saveToCSV(results, filename) {
    const csvHeader = 'name,address,phone,website,rating,reviewCount\n';
    const csvRows = results.map(business => {
      return `"${business.name}","${business.address}","${business.phone}","${business.website}",${business.rating || ''},${business.reviewCount || 0}`;
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;
    await fs.writeFile(filename, csvContent, 'utf8');
    console.log(`Saved ${results.length} results to ${filename}`);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main scraping function
async function scrapeSpecializedClasses() {
  const scraper = new GoogleMapsScraper();
  
  try {
    await scraper.initialize();
    
    const searchTerms = [
      'baby yoga',
      'baby swimming',
      'baby massage', 
      'toddler gymnastics',
      'children music classes',
      'mum and baby fitness',
      'postnatal yoga',
      'nursery rhyme time'
    ];
    
    for (const term of searchTerms) {
      try {
        const results = await scraper.searchAndScrape(term, 'England', 200);
        
        if (results.length > 0) {
          const filename = `${term.replace(/\s+/g, '-').toLowerCase()}-england.csv`;
          await scraper.saveToCSV(results, filename);
          
          // Wait between searches to avoid rate limiting
          console.log('Waiting 30 seconds before next search...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      } catch (error) {
        console.error(`Error scraping ${term}:`, error);
        // Continue with next search term
      }
    }
    
  } catch (error) {
    console.error('Scraping failed:', error);
  } finally {
    await scraper.close();
  }
}

// Usage
if (require.main === module) {
  console.log('Starting Google Maps scraping for specialized classes...');
  console.log('This will create CSV files that you can import using: node import-outscraper.js filename.csv');
  
  scrapeSpecializedClasses()
    .then(() => {
      console.log('Scraping completed! Check the generated CSV files.');
    })
    .catch(error => {
      console.error('Scraping failed:', error);
    });
}

module.exports = { GoogleMapsScraper };