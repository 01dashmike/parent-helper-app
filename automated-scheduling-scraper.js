import { neon } from '@neondatabase/serverless';
import puppeteer from 'puppeteer';

const sql = neon(process.env.DATABASE_URL);

class SchedulingScraper {
  constructor() {
    this.browser = null;
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  // Scrape Google Places for business hours and scheduling
  async scrapeGooglePlacesSchedule(businessName, postcode) {
    const page = await this.browser.newPage();
    try {
      const searchQuery = `${businessName} ${postcode} opening hours`;
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
      
      // Wait for results and extract hours
      await page.waitForSelector('.uhHOwf', { timeout: 5000 });
      
      const hours = await page.evaluate(() => {
        const hoursElements = document.querySelectorAll('.uhHOwf tr');
        const schedule = [];
        
        hoursElements.forEach(row => {
          const day = row.querySelector('td')?.textContent?.trim();
          const time = row.querySelector('td:last-child')?.textContent?.trim();
          if (day && time && time !== 'Closed') {
            schedule.push({ day, time });
          }
        });
        
        return schedule;
      });
      
      return hours;
    } catch (error) {
      console.log(`Could not get Google hours for ${businessName}:`, error.message);
      return null;
    } finally {
      await page.close();
    }
  }

  // Scrape franchise websites for class schedules
  async scrapeFranchiseSchedule(businessName, location) {
    const franchiseUrls = {
      'Baby Sensory': `https://www.babysensory.com/find-a-class?location=${location}`,
      'Water Babies': `https://www.waterbabies.co.uk/find-classes?postcode=${location}`,
      'Little Kickers': `https://www.littlekickers.co.uk/classes?location=${location}`,
      'Monkey Music': `https://www.monkeymusic.co.uk/find-classes?area=${location}`,
      'Tumble Tots': `https://www.tumbletots.com/find-classes/${location}`,
      'Stagecoach': `https://www.stagecoach.co.uk/find-school?search=${location}`
    };

    const brand = Object.keys(franchiseUrls).find(brand => businessName.includes(brand));
    if (!brand) return null;

    const page = await this.browser.newPage();
    try {
      await page.goto(franchiseUrls[brand], { waitUntil: 'networkidle2' });
      
      // Generic schedule extraction (adapt for each franchise)
      const schedule = await page.evaluate(() => {
        const timeElements = document.querySelectorAll('[class*="time"], [class*="schedule"], .class-time, .session-time');
        const dayElements = document.querySelectorAll('[class*="day"], .class-day, .session-day');
        
        const sessions = [];
        
        // Try to extract structured data
        timeElements.forEach((timeEl, index) => {
          const time = timeEl.textContent?.trim();
          const dayEl = dayElements[index];
          const day = dayEl?.textContent?.trim();
          
          if (time && day) {
            sessions.push({ day, time });
          }
        });
        
        return sessions;
      });
      
      return schedule;
    } catch (error) {
      console.log(`Could not scrape ${brand} schedule:`, error.message);
      return null;
    } finally {
      await page.close();
    }
  }

  // Use Facebook Events API to get class schedules
  async getFacebookEvents(businessName, location) {
    // This would require Facebook API access
    // For now, return placeholder structure
    return null;
  }

  async updateClassScheduling() {
    console.log('🔧 Starting automated scheduling data collection...');
    
    // Get classes that need scheduling updates
    const classesToUpdate = await sql`
      SELECT id, name, postcode, town FROM classes 
      WHERE day_of_week IN ('Multiple', 'Various', '') 
      OR day_of_week IS NULL 
      OR time IN ('Various times', '') 
      OR time IS NULL
      ORDER BY town
      LIMIT 20
    `;

    console.log(`Updating scheduling for ${classesToUpdate.length} classes...`);

    for (const classItem of classesToUpdate) {
      console.log(`\nProcessing: ${classItem.name} (${classItem.town})`);
      
      let schedule = null;
      
      // Try Google Places first
      schedule = await this.scrapeGooglePlacesSchedule(classItem.name, classItem.postcode);
      
      // Try franchise website if Google didn't work
      if (!schedule || schedule.length === 0) {
        schedule = await this.scrapeFranchiseSchedule(classItem.name, classItem.town);
      }

      if (schedule && schedule.length > 0) {
        // Use the first available schedule slot
        const firstSlot = schedule[0];
        
        try {
          await sql`
            UPDATE classes 
            SET day_of_week = ${firstSlot.day}, time = ${firstSlot.time}
            WHERE id = ${classItem.id}
          `;
          
          console.log(`✅ Updated: ${classItem.name} - ${firstSlot.day} ${firstSlot.time}`);
        } catch (error) {
          console.error(`Error updating ${classItem.name}:`, error);
        }
      } else {
        console.log(`⚠️ No schedule found for: ${classItem.name}`);
      }
      
      // Add delay to be respectful to websites
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

async function runAutomatedSchedulingScraper() {
  const scraper = new SchedulingScraper();
  
  try {
    await scraper.initialize();
    await scraper.updateClassScheduling();
  } catch (error) {
    console.error('Scheduling scraper error:', error);
  } finally {
    await scraper.close();
  }
}

runAutomatedSchedulingScraper().catch(console.error);