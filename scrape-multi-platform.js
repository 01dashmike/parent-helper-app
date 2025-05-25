import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';

class MultiPlatformScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
      defaultViewport: null
    });
    this.page = await this.browser.newPage();
    
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8'
    });
  }

  // Scrape Facebook Events
  async scrapeFacebookEvents(searchTerm, location = 'England') {
    console.log(`Scraping Facebook events for: ${searchTerm} in ${location}`);
    
    try {
      await this.page.goto('https://www.facebook.com/events/search/');
      await this.page.waitForTimeout(3000);
      
      // Search for events
      const searchQuery = `${searchTerm} ${location}`;
      await this.page.type('input[placeholder*="Search"]', searchQuery);
      await this.page.keyboard.press('Enter');
      await this.page.waitForTimeout(5000);
      
      // Extract event data
      const events = await this.page.evaluate(() => {
        const eventElements = document.querySelectorAll('[role="article"]');
        const events = [];
        
        eventElements.forEach(element => {
          try {
            const nameElement = element.querySelector('span[dir="auto"]');
            const locationElement = element.querySelector('[data-testid="event-card-location"]');
            const timeElement = element.querySelector('[data-testid="event-card-time"]');
            
            if (nameElement && nameElement.textContent.trim()) {
              events.push({
                name: nameElement.textContent.trim(),
                location: locationElement ? locationElement.textContent.trim() : '',
                time: timeElement ? timeElement.textContent.trim() : '',
                source: 'Facebook Events'
              });
            }
          } catch (error) {
            console.log('Error extracting event:', error);
          }
        });
        
        return events;
      });
      
      console.log(`Found ${events.length} Facebook events`);
      return events;
      
    } catch (error) {
      console.error('Error scraping Facebook events:', error);
      return [];
    }
  }

  // Scrape Eventbrite
  async scrapeEventbrite(searchTerm, location = 'England') {
    console.log(`Scraping Eventbrite for: ${searchTerm} in ${location}`);
    
    try {
      const searchUrl = `https://www.eventbrite.co.uk/d/united-kingdom--england/${encodeURIComponent(searchTerm)}/`;
      await this.page.goto(searchUrl);
      await this.page.waitForTimeout(3000);
      
      // Extract event data
      const events = await this.page.evaluate(() => {
        const eventCards = document.querySelectorAll('[data-testid="search-event-card"]');
        const events = [];
        
        eventCards.forEach(card => {
          try {
            const nameElement = card.querySelector('h3');
            const locationElement = card.querySelector('[data-testid="event-location"]');
            const organizerElement = card.querySelector('[data-testid="event-organizer"]');
            const priceElement = card.querySelector('[data-testid="event-price"]');
            
            if (nameElement) {
              events.push({
                name: nameElement.textContent.trim(),
                location: locationElement ? locationElement.textContent.trim() : '',
                organizer: organizerElement ? organizerElement.textContent.trim() : '',
                price: priceElement ? priceElement.textContent.trim() : '',
                source: 'Eventbrite'
              });
            }
          } catch (error) {
            console.log('Error extracting Eventbrite event:', error);
          }
        });
        
        return events;
      });
      
      console.log(`Found ${events.length} Eventbrite events`);
      return events;
      
    } catch (error) {
      console.error('Error scraping Eventbrite:', error);
      return [];
    }
  }

  // Scrape local council websites
  async scrapeCouncilWebsites(councils) {
    console.log('Scraping council websites for children\'s activities...');
    const allResults = [];
    
    for (const council of councils) {
      try {
        console.log(`Scraping ${council.name}...`);
        await this.page.goto(council.url);
        await this.page.waitForTimeout(3000);
        
        // Look for children's activities
        const activities = await this.page.evaluate((councilName) => {
          const links = document.querySelectorAll('a');
          const activities = [];
          
          links.forEach(link => {
            const text = link.textContent.toLowerCase();
            if (text.includes('baby') || text.includes('toddler') || 
                text.includes('children') || text.includes('family') ||
                text.includes('class') || text.includes('activity')) {
              activities.push({
                name: link.textContent.trim(),
                url: link.href,
                council: councilName,
                source: 'Council Website'
              });
            }
          });
          
          return activities;
        }, council.name);
        
        allResults.push(...activities);
        console.log(`Found ${activities.length} activities from ${council.name}`);
        
      } catch (error) {
        console.error(`Error scraping ${council.name}:`, error);
      }
    }
    
    return allResults;
  }

  // Scrape Yelp
  async scrapeYelp(searchTerm, location = 'England') {
    console.log(`Scraping Yelp for: ${searchTerm} in ${location}`);
    
    try {
      const searchUrl = `https://www.yelp.co.uk/search?find_desc=${encodeURIComponent(searchTerm)}&find_loc=${encodeURIComponent(location)}`;
      await this.page.goto(searchUrl);
      await this.page.waitForTimeout(3000);
      
      const businesses = await this.page.evaluate(() => {
        const businessCards = document.querySelectorAll('[data-testid="serp-ia-card"]');
        const businesses = [];
        
        businessCards.forEach(card => {
          try {
            const nameElement = card.querySelector('h3 a');
            const addressElement = card.querySelector('[data-testid="address"]');
            const phoneElement = card.querySelector('[data-testid="phone"]');
            const ratingElement = card.querySelector('[data-testid="rating"]');
            
            if (nameElement) {
              businesses.push({
                name: nameElement.textContent.trim(),
                address: addressElement ? addressElement.textContent.trim() : '',
                phone: phoneElement ? phoneElement.textContent.trim() : '',
                rating: ratingElement ? ratingElement.textContent.trim() : '',
                source: 'Yelp'
              });
            }
          } catch (error) {
            console.log('Error extracting Yelp business:', error);
          }
        });
        
        return businesses;
      });
      
      console.log(`Found ${businesses.length} Yelp businesses`);
      return businesses;
      
    } catch (error) {
      console.error('Error scraping Yelp:', error);
      return [];
    }
  }

  // Comprehensive multi-platform search
  async performComprehensiveSearch() {
    console.log('Starting comprehensive multi-platform search...');
    
    const searchTerms = [
      'baby yoga',
      'baby swimming', 
      'baby massage',
      'toddler classes',
      'children music classes',
      'mum and baby fitness'
    ];

    const councils = [
      { name: 'Hampshire County Council', url: 'https://www.hants.gov.uk/socialcareandhealth/childrenandfamilies' },
      { name: 'Surrey County Council', url: 'https://www.surreycc.gov.uk/children' },
      { name: 'Kent County Council', url: 'https://www.kent.gov.uk/leisure-and-community' },
      { name: 'Essex County Council', url: 'https://www.essex.gov.uk/topic/children-families-education' }
    ];

    let allResults = [];

    for (const term of searchTerms) {
      try {
        console.log(`\n=== Searching for: ${term} ===`);
        
        // Facebook Events
        const facebookEvents = await this.scrapeFacebookEvents(term);
        allResults.push(...facebookEvents);
        
        await this.page.waitForTimeout(2000);
        
        // Eventbrite
        const eventbriteEvents = await this.scrapeEventbrite(term);
        allResults.push(...eventbriteEvents);
        
        await this.page.waitForTimeout(2000);
        
        // Yelp
        const yelpBusinesses = await this.scrapeYelp(term);
        allResults.push(...yelpBusinesses);
        
        await this.page.waitForTimeout(3000);
        
      } catch (error) {
        console.error(`Error searching for ${term}:`, error);
      }
    }

    // Council websites (once for all terms)
    const councilResults = await this.scrapeCouncilWebsites(councils);
    allResults.push(...councilResults);

    return allResults;
  }

  async saveResults(results, filename) {
    const csvHeader = 'name,location,organizer,price,phone,rating,source,url\n';
    const csvRows = results.map(item => {
      return `"${item.name || ''}","${item.location || item.address || ''}","${item.organizer || ''}","${item.price || ''}","${item.phone || ''}","${item.rating || ''}","${item.source}","${item.url || ''}"`;
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

// Main execution
async function scrapeMultiplePlatforms() {
  const scraper = new MultiPlatformScraper();
  
  try {
    await scraper.initialize();
    
    console.log('Starting comprehensive multi-platform scraping...');
    console.log('This will search Facebook Events, Eventbrite, Yelp, and council websites');
    
    const results = await scraper.performComprehensiveSearch();
    
    if (results.length > 0) {
      await scraper.saveResults(results, 'multi-platform-classes.csv');
      
      console.log('\n=== SCRAPING SUMMARY ===');
      console.log(`Total results found: ${results.length}`);
      
      // Group by source
      const bySource = results.reduce((acc, item) => {
        acc[item.source] = (acc[item.source] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(bySource).forEach(([source, count]) => {
        console.log(`${source}: ${count} results`);
      });
      
      console.log('\nTo import these results, run:');
      console.log('node import-outscraper.js multi-platform-classes.csv');
    }
    
  } catch (error) {
    console.error('Multi-platform scraping failed:', error);
  } finally {
    await scraper.close();
  }
}

// Usage
if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeMultiplePlatforms()
    .then(() => {
      console.log('Multi-platform scraping completed!');
    })
    .catch(error => {
      console.error('Scraping failed:', error);
    });
}

export { MultiPlatformScraper };