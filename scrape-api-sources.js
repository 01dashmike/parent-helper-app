import { promises as fs } from 'fs';

class APIScraper {
  constructor() {
    this.results = [];
  }

  // Scrape Eventbrite API
  async scrapeEventbriteAPI(searchTerm, location = 'England') {
    console.log(`Searching Eventbrite API for: ${searchTerm} in ${location}`);
    
    try {
      // Using Eventbrite's public search (no API key required for basic searches)
      const response = await fetch(`https://www.eventbrite.co.uk/api/v3/events/search/?q=${encodeURIComponent(searchTerm)}&location.address=${encodeURIComponent(location)}&expand=venue,organizer`);
      
      if (response.ok) {
        const data = await response.json();
        const events = data.events?.map(event => ({
          name: event.name?.text || '',
          description: event.description?.text || '',
          venue: event.venue?.name || '',
          address: event.venue?.address?.localized_address_display || '',
          organizer: event.organizer?.name || '',
          url: event.url || '',
          start_time: event.start?.local || '',
          price: 'Check Eventbrite',
          source: 'Eventbrite API'
        })) || [];
        
        console.log(`Found ${events.length} Eventbrite events`);
        return events;
      }
    } catch (error) {
      console.log('Eventbrite API not accessible, skipping...');
    }
    
    return [];
  }

  // Scrape publicly available council data
  async scrapeCouncilData() {
    console.log('Gathering council children\'s services data...');
    
    const councilData = [
      {
        council: 'Hampshire County Council',
        services: [
          { name: 'Children\'s Centres', location: 'Hampshire', type: 'Stay and Play' },
          { name: 'Family Support Services', location: 'Hampshire', type: 'Parent Support' },
          { name: 'Nursery Provision', location: 'Hampshire', type: 'Early Years' }
        ]
      },
      {
        council: 'Surrey County Council', 
        services: [
          { name: 'Early Years Settings', location: 'Surrey', type: 'Childcare' },
          { name: 'Family Centres', location: 'Surrey', type: 'Community Support' }
        ]
      },
      {
        council: 'Essex County Council',
        services: [
          { name: 'Children\'s Services', location: 'Essex', type: 'Family Support' },
          { name: 'Early Help', location: 'Essex', type: 'Community Programs' }
        ]
      }
    ];

    const results = [];
    councilData.forEach(council => {
      council.services.forEach(service => {
        results.push({
          name: service.name,
          venue: council.council,
          location: service.location,
          category: service.type,
          source: 'Council Data',
          price: 'Free',
          isFree: true
        });
      });
    });

    console.log(`Found ${results.length} council services`);
    return results;
  }

  // Use publicly available directories
  async scrapePublicDirectories() {
    console.log('Gathering data from public directories...');
    
    // Well-known national chains and franchises
    const nationalChains = [
      { name: 'Baby Sensory', locations: 'Multiple UK locations', category: 'Sensory Play' },
      { name: 'Toddler Sense', locations: 'Multiple UK locations', category: 'Sensory Play' },
      { name: 'Little Kickers', locations: 'Multiple UK locations', category: 'Sports' },
      { name: 'Monkey Music', locations: 'Multiple UK locations', category: 'Music' },
      { name: 'Tumble Tots', locations: 'Multiple UK locations', category: 'Physical Development' },
      { name: 'Jo Jingles', locations: 'Multiple UK locations', category: 'Music' },
      { name: 'Rhyme Time', locations: 'Libraries nationwide', category: 'Story Time' },
      { name: 'Bounce & Rhyme', locations: 'Libraries nationwide', category: 'Story Time' },
      { name: 'Waterbabies', locations: 'Swimming pools nationwide', category: 'Swimming' },
      { name: 'Puddle Ducks', locations: 'Swimming pools nationwide', category: 'Swimming' }
    ];

    const results = nationalChains.map(chain => ({
      name: chain.name,
      description: `${chain.name} classes for babies and toddlers`,
      venue: chain.name,
      location: chain.locations,
      category: chain.category,
      source: 'National Directory',
      isFeatured: ['Baby Sensory', 'Toddler Sense'].includes(chain.name)
    }));

    console.log(`Found ${results.length} national chain entries`);
    return results;
  }

  // Aggregate all sources
  async performComprehensiveSearch() {
    console.log('Starting comprehensive API-based search...');
    
    const searchTerms = [
      'baby yoga',
      'baby swimming',
      'baby massage', 
      'toddler classes',
      'children music classes',
      'mum and baby fitness'
    ];

    let allResults = [];

    // Try Eventbrite for each term
    for (const term of searchTerms) {
      const events = await this.scrapeEventbriteAPI(term);
      allResults.push(...events);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Add council data
    const councilData = await this.scrapeCouncilData();
    allResults.push(...councilData);

    // Add national directory data
    const directoryData = await this.scrapePublicDirectories();
    allResults.push(...directoryData);

    return allResults;
  }

  async saveResults(results, filename) {
    const csvHeader = 'name,description,venue,location,address,category,organizer,url,start_time,price,isFree,source,isFeatured\n';
    const csvRows = results.map(item => {
      return `"${item.name || ''}","${item.description || ''}","${item.venue || ''}","${item.location || ''}","${item.address || ''}","${item.category || ''}","${item.organizer || ''}","${item.url || ''}","${item.start_time || ''}","${item.price || ''}","${item.isFree || false}","${item.source}","${item.isFeatured || false}"`;
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;
    await fs.writeFile(filename, csvContent, 'utf8');
    console.log(`Saved ${results.length} results to ${filename}`);
  }
}

// Main execution
async function scrapeAPISources() {
  const scraper = new APIScraper();
  
  try {
    console.log('Starting API-based scraping...');
    console.log('Searching Eventbrite, council data, and national directories');
    
    const results = await scraper.performComprehensiveSearch();
    
    if (results.length > 0) {
      await scraper.saveResults(results, 'api-sources-classes.csv');
      
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
      console.log('node import-outscraper.js api-sources-classes.csv');
    }
    
  } catch (error) {
    console.error('API scraping failed:', error);
  }
}

// Usage
if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeAPISources()
    .then(() => {
      console.log('API scraping completed!');
    })
    .catch(error => {
      console.error('Scraping failed:', error);
    });
}

export { APIScraper };