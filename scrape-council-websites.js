import { neon } from '@neondatabase/serverless';
import puppeteer from 'puppeteer';

const sql = neon(process.env.DATABASE_URL);

class CouncilWebsiteScraper {
  constructor() {
    this.browser = null;
    this.importedCount = 0;
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  // Major England councils that publish family activity listings
  getCouncilSources() {
    return [
      {
        name: 'Hampshire County Council',
        url: 'https://www.hants.gov.uk/socialcareandhealth/childrenandfamilies',
        searchTerms: ['baby groups', 'toddler activities', 'children centres']
      },
      {
        name: 'Surrey County Council', 
        url: 'https://www.surreycc.gov.uk/children/support-and-advice',
        searchTerms: ['family activities', 'children services']
      },
      {
        name: 'Kent County Council',
        url: 'https://www.kent.gov.uk/education-and-children/childcare-and-family-support',
        searchTerms: ['family support', 'children centres']
      },
      {
        name: 'Essex County Council',
        url: 'https://www.essex.gov.uk/getting-help-families',
        searchTerms: ['family support', 'children activities']
      },
      // Local district councils with community listings
      {
        name: 'Winchester City Council',
        url: 'https://www.winchester.gov.uk/residents/community',
        searchTerms: ['community groups', 'family activities']
      },
      {
        name: 'Test Valley Borough Council',
        url: 'https://www.testvalley.gov.uk/residents/community-and-leisure',
        searchTerms: ['community activities', 'family support']
      },
      {
        name: 'Basingstoke and Deane Borough Council',
        url: 'https://www.basingstoke.gov.uk/residents/community-and-leisure',
        searchTerms: ['leisure activities', 'community groups']
      }
    ];
  }

  async scrapeCouncilWebsite(councilInfo) {
    const page = await this.browser.newPage();
    
    try {
      console.log(`Scraping ${councilInfo.name}...`);
      await page.goto(councilInfo.url, { waitUntil: 'networkidle2' });
      
      // Look for links to children's centres and family activities
      const links = await page.evaluate(() => {
        const allLinks = Array.from(document.querySelectorAll('a'));
        return allLinks
          .filter(link => {
            const text = link.textContent.toLowerCase();
            return text.includes('children') || 
                   text.includes('family') || 
                   text.includes('baby') ||
                   text.includes('toddler') ||
                   text.includes('group') ||
                   text.includes('centre');
          })
          .map(link => ({
            text: link.textContent.trim(),
            href: link.href
          }))
          .filter(link => link.href && link.text);
      });
      
      console.log(`Found ${links.length} relevant links from ${councilInfo.name}`);
      
      // Extract activity information from promising links
      for (const link of links.slice(0, 5)) { // Limit to avoid overwhelming
        try {
          await page.goto(link.href, { waitUntil: 'networkidle2', timeout: 10000 });
          
          const activityInfo = await page.evaluate(() => {
            const content = document.body.textContent;
            const title = document.title;
            
            // Look for contact information and activity details
            const phoneMatch = content.match(/(?:tel|phone|call)[:\s]*(\d{4,5}[\s-]?\d{6,7}|\d{11})/i);
            const emailMatch = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            const addressMatch = content.match(/([A-Z][a-z\s,]+(?:Road|Street|Lane|Avenue|Close|Way|Drive)[^.]{0,50})/);
            
            return {
              title: title,
              content: content.substring(0, 500), // First 500 chars for context
              phone: phoneMatch ? phoneMatch[1] : null,
              email: emailMatch ? emailMatch[1] : null,
              address: addressMatch ? addressMatch[1] : null
            };
          });
          
          if (activityInfo.title && (activityInfo.phone || activityInfo.email)) {
            await this.saveCouncilActivity(activityInfo, councilInfo.name, link.href);
          }
          
        } catch (error) {
          console.log(`Error processing link ${link.href}: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error(`Error scraping ${councilInfo.name}: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async saveCouncilActivity(activityInfo, councilName, sourceUrl) {
    try {
      // Extract postcode from content if available
      const postcodeMatch = activityInfo.content.match(/([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/i);
      const postcode = postcodeMatch ? postcodeMatch[1].toUpperCase() : null;
      
      if (!postcode) return; // Skip if no postcode found
      
      // Determine if it's baby or toddler focused
      const content = activityInfo.content.toLowerCase();
      let ageGroupMin = 0, ageGroupMax = 60;
      
      if (content.includes('baby') && !content.includes('toddler')) {
        ageGroupMax = 12;
      } else if (content.includes('toddler') && !content.includes('baby')) {
        ageGroupMin = 12;
        ageGroupMax = 36;
      }
      
      // Determine category
      let category = 'general';
      if (content.includes('music')) category = 'music';
      else if (content.includes('swim')) category = 'swimming';
      else if (content.includes('play')) category = 'play';
      else if (content.includes('fitness') || content.includes('exercise')) category = 'fitness';
      
      const classData = {
        name: activityInfo.title.substring(0, 100),
        description: `${activityInfo.title} - Community activity via ${councilName}`,
        ageGroupMin,
        ageGroupMax,
        venue: councilName,
        address: activityInfo.address || `Contact ${councilName} for location`,
        postcode,
        town: this.extractTownFromCouncil(councilName),
        latitude: null,
        longitude: null,
        dayOfWeek: 'Contact for details',
        time: 'Contact for schedule',
        category,
        price: null, // Often free council activities
        contactEmail: activityInfo.email,
        contactPhone: activityInfo.phone,
        website: sourceUrl,
        rating: null,
        reviewCount: 0,
        isActive: true,
        isFeatured: false
      };
      
      // Check if already exists
      const existing = await sql`
        SELECT id FROM classes 
        WHERE name = ${classData.name} 
        AND postcode = ${classData.postcode}
        LIMIT 1
      `;
      
      if (existing.length === 0) {
        await sql`
          INSERT INTO classes (
            name, description, age_group_min, age_group_max, venue, address,
            postcode, town, latitude, longitude, day_of_week, time, category,
            price, contact_email, contact_phone, website, rating, review_count,
            is_active, is_featured
          ) VALUES (
            ${classData.name}, ${classData.description}, ${classData.ageGroupMin},
            ${classData.ageGroupMax}, ${classData.venue}, ${classData.address},
            ${classData.postcode}, ${classData.town}, ${classData.latitude},
            ${classData.longitude}, ${classData.dayOfWeek}, ${classData.time},
            ${classData.category}, ${classData.price}, ${classData.contactEmail},
            ${classData.contactPhone}, ${classData.website}, ${classData.rating},
            ${classData.reviewCount}, ${classData.isActive}, ${classData.isFeatured}
          )
        `;
        this.importedCount++;
        console.log(`Saved council activity: ${classData.name}`);
      }
      
    } catch (error) {
      console.error(`Error saving council activity: ${error.message}`);
    }
  }

  extractTownFromCouncil(councilName) {
    if (councilName.includes('Winchester')) return 'Winchester';
    if (councilName.includes('Test Valley')) return 'Andover';
    if (councilName.includes('Basingstoke')) return 'Basingstoke';
    if (councilName.includes('Hampshire')) return 'Hampshire';
    if (councilName.includes('Surrey')) return 'Surrey';
    if (councilName.includes('Kent')) return 'Kent';
    if (councilName.includes('Essex')) return 'Essex';
    return 'England';
  }

  async scrapeAllCouncils() {
    console.log('Starting council website scraping for family activities...');
    
    const councils = this.getCouncilSources();
    
    for (const council of councils) {
      await this.scrapeCouncilWebsite(council);
      
      // Respectful delay between councils
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log(`\n=== COUNCIL SCRAPING COMPLETE ===`);
    console.log(`Total council activities imported: ${this.importedCount}`);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run the council scraper
async function runCouncilScraper() {
  const scraper = new CouncilWebsiteScraper();
  
  try {
    await scraper.initialize();
    await scraper.scrapeAllCouncils();
  } catch (error) {
    console.error('Council scraping error:', error);
  } finally {
    await scraper.close();
  }
}

runCouncilScraper().catch(console.error);