const { Pool } = require('pg');
const puppeteer = require('puppeteer');

class ComprehensiveBusinessContactCollector {
  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.browser = null;
    this.processedCount = 0;
    this.emailsFound = 0;
    this.socialFound = 0;
    this.contactsFound = 0;
    this.startTime = Date.now();
  }

  async initialize() {
    this.browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    console.log(`${this.getTimestamp()} 🚀 COMPREHENSIVE Business Contact Collector Starting...`);
    console.log(`${this.getTimestamp()} 🎯 TARGET: Dramatically increase authentic contact coverage`);
  }

  getTimestamp() {
    return new Date().toLocaleTimeString();
  }

  async getBusinessesNeedingContacts() {
    const result = await this.pool.query(`
      SELECT id, name, address, postcode, website, phone, email, social_media, category
      FROM classes 
      WHERE is_active = true 
      AND (email IS NULL OR email = '' OR email LIKE '%.png' OR email LIKE '%@2x%')
      ORDER BY CASE 
        WHEN category LIKE '%Baby%' OR category LIKE '%Toddler%' THEN 1
        WHEN category LIKE '%Featured%' THEN 2
        ELSE 3
      END, id
      LIMIT 1000
    `);
    return result.rows;
  }

  async findBusinessContactsComprehensive(business) {
    const contacts = {
      emails: [],
      phones: [],
      social: [],
      website: business.website
    };

    try {
      // Method 1: Google Places detailed search
      await this.searchGooglePlacesContacts(business, contacts);
      
      // Method 2: Website contact extraction
      if (business.website) {
        await this.extractWebsiteContacts(business.website, contacts);
      }
      
      // Method 3: Business directory searches
      await this.searchBusinessDirectories(business, contacts);
      
      // Method 4: Social media platform searches
      await this.searchSocialPlatforms(business, contacts);
      
      // Method 5: UK business registers
      await this.searchBusinessRegisters(business, contacts);

    } catch (error) {
      console.log(`${this.getTimestamp()} ⚠️  Error finding contacts for ${business.name}: ${error.message}`);
    }

    return contacts;
  }

  async searchGooglePlacesContacts(business, contacts) {
    try {
      const searchQuery = `${business.name} ${business.postcode || business.address}`;
      const placesUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
      
      const page = await this.browser.newPage();
      await page.goto(placesUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Extract contact information from Google Places
      const googleContacts = await page.evaluate(() => {
        const emails = [];
        const phones = [];
        const social = [];
        
        // Look for contact information in the page
        const textContent = document.body.innerText;
        
        // Email extraction
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const foundEmails = textContent.match(emailRegex) || [];
        foundEmails.forEach(email => {
          if (!email.includes('.png') && !email.includes('@2x') && !email.includes('google.com')) {
            emails.push(email);
          }
        });
        
        // Phone extraction
        const phoneRegex = /(\+44|0)\s?[1-9]\d{8,10}/g;
        const foundPhones = textContent.match(phoneRegex) || [];
        phones.push(...foundPhones);
        
        // Social media links
        const links = Array.from(document.querySelectorAll('a[href]'));
        links.forEach(link => {
          const href = link.href;
          if (href.includes('facebook.com') || href.includes('instagram.com') || 
              href.includes('twitter.com') || href.includes('linkedin.com')) {
            social.push(href);
          }
        });
        
        return { emails, phones, social };
      });
      
      contacts.emails.push(...googleContacts.emails);
      contacts.phones.push(...googleContacts.phones);
      contacts.social.push(...googleContacts.social);
      
      await page.close();
    } catch (error) {
      console.log(`${this.getTimestamp()} ⚠️  Google Places search failed: ${error.message}`);
    }
  }

  async extractWebsiteContacts(website, contacts) {
    try {
      const page = await this.browser.newPage();
      
      // Try multiple URL formats
      const urls = [
        website,
        website.startsWith('http') ? website : `https://${website}`,
        website.startsWith('http') ? website : `http://${website}`
      ];
      
      for (const url of urls) {
        try {
          await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });
          
          const siteContacts = await page.evaluate(() => {
            const emails = [];
            const phones = [];
            const social = [];
            
            const textContent = document.body.innerText;
            
            // Enhanced email extraction
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const foundEmails = textContent.match(emailRegex) || [];
            foundEmails.forEach(email => {
              if (!email.includes('.png') && !email.includes('@2x') && 
                  !email.includes('example.') && !email.includes('test@')) {
                emails.push(email);
              }
            });
            
            // Enhanced phone extraction
            const phoneRegex = /(\+44|0)\s?[1-9][\d\s-]{8,15}/g;
            const foundPhones = textContent.match(phoneRegex) || [];
            phones.push(...foundPhones);
            
            // Social media extraction
            const links = Array.from(document.querySelectorAll('a[href]'));
            links.forEach(link => {
              const href = link.href;
              if (href.includes('facebook.com') || href.includes('instagram.com') || 
                  href.includes('twitter.com') || href.includes('linkedin.com')) {
                social.push(href);
              }
            });
            
            return { emails, phones, social };
          });
          
          contacts.emails.push(...siteContacts.emails);
          contacts.phones.push(...siteContacts.phones);
          contacts.social.push(...siteContacts.social);
          
          break; // Success, exit loop
        } catch (urlError) {
          continue; // Try next URL
        }
      }
      
      await page.close();
    } catch (error) {
      console.log(`${this.getTimestamp()} ⚠️  Website extraction failed: ${error.message}`);
    }
  }

  async searchBusinessDirectories(business, contacts) {
    try {
      const directories = [
        `https://www.yell.com/s/${encodeURIComponent(business.name)}-${encodeURIComponent(business.postcode)}`,
        `https://uk.trustpilot.com/review/${business.website ? business.website.replace(/https?:\/\//, '') : business.name}`,
        `https://www.bing.com/search?q="${business.name}" contact ${business.postcode}`
      ];
      
      for (const directoryUrl of directories) {
        try {
          const page = await this.browser.newPage();
          await page.goto(directoryUrl, { waitUntil: 'networkidle0', timeout: 15000 });
          
          const directoryContacts = await page.evaluate(() => {
            const emails = [];
            const phones = [];
            const social = [];
            
            const textContent = document.body.innerText;
            
            // Extract contacts from directory pages
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const foundEmails = textContent.match(emailRegex) || [];
            foundEmails.forEach(email => {
              if (!email.includes('.png') && !email.includes('@2x') && 
                  !email.includes('yell.com') && !email.includes('trustpilot.com')) {
                emails.push(email);
              }
            });
            
            const phoneRegex = /(\+44|0)\s?[1-9][\d\s-]{8,15}/g;
            const foundPhones = textContent.match(phoneRegex) || [];
            phones.push(...foundPhones);
            
            return { emails, phones, social };
          });
          
          contacts.emails.push(...directoryContacts.emails);
          contacts.phones.push(...directoryContacts.phones);
          
          await page.close();
          await this.sleep(1000); // Rate limiting
        } catch (dirError) {
          continue;
        }
      }
    } catch (error) {
      console.log(`${this.getTimestamp()} ⚠️  Directory search failed: ${error.message}`);
    }
  }

  async searchSocialPlatforms(business, contacts) {
    try {
      const searchTerms = [
        `"${business.name}" ${business.postcode}`,
        `"${business.name}" contact`,
        `"${business.name}" email`
      ];
      
      for (const term of searchTerms) {
        try {
          const page = await this.browser.newPage();
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(term)} site:facebook.com OR site:instagram.com`;
          
          await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 15000 });
          
          const socialLinks = await page.evaluate(() => {
            const links = [];
            const anchorTags = Array.from(document.querySelectorAll('a[href]'));
            
            anchorTags.forEach(link => {
              const href = link.href;
              if ((href.includes('facebook.com') || href.includes('instagram.com')) &&
                  !href.includes('google.com')) {
                links.push(href);
              }
            });
            
            return links;
          });
          
          contacts.social.push(...socialLinks);
          await page.close();
          await this.sleep(2000); // Rate limiting for Google
        } catch (socialError) {
          continue;
        }
      }
    } catch (error) {
      console.log(`${this.getTimestamp()} ⚠️  Social platform search failed: ${error.message}`);
    }
  }

  async searchBusinessRegisters(business, contacts) {
    try {
      // Search Companies House for UK business data
      const companiesHouseUrl = `https://find-and-update.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(business.name)}`;
      
      const page = await this.browser.newPage();
      await page.goto(companiesHouseUrl, { waitUntil: 'networkidle0', timeout: 15000 });
      
      // Extract any contact information from business registers
      const registerContacts = await page.evaluate(() => {
        const emails = [];
        const textContent = document.body.innerText;
        
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const foundEmails = textContent.match(emailRegex) || [];
        foundEmails.forEach(email => {
          if (!email.includes('.png') && !email.includes('@2x') && 
              !email.includes('gov.uk') && !email.includes('companieshouse')) {
            emails.push(email);
          }
        });
        
        return { emails };
      });
      
      contacts.emails.push(...registerContacts.emails);
      await page.close();
    } catch (error) {
      console.log(`${this.getTimestamp()} ⚠️  Business register search failed: ${error.message}`);
    }
  }

  async updateBusinessContacts(businessId, contacts) {
    const uniqueEmails = [...new Set(contacts.emails)];
    const uniquePhones = [...new Set(contacts.phones)];
    const uniqueSocial = [...new Set(contacts.social)];
    
    if (uniqueEmails.length > 0 || uniquePhones.length > 0 || uniqueSocial.length > 0) {
      const updateData = {};
      
      if (uniqueEmails.length > 0) {
        updateData.email = uniqueEmails[0]; // Use first valid email
        this.emailsFound++;
      }
      
      if (uniquePhones.length > 0 && !updateData.phone) {
        updateData.phone = uniquePhones[0].replace(/\s/g, ''); // Clean phone number
      }
      
      if (uniqueSocial.length > 0) {
        updateData.social_media = uniqueSocial.join(', ');
        this.socialFound++;
      }
      
      if (Object.keys(updateData).length > 0) {
        const setClause = Object.keys(updateData)
          .map((key, index) => `${key} = $${index + 1}`)
          .join(', ');
        
        const values = Object.values(updateData);
        values.push(businessId);
        
        await this.pool.query(
          `UPDATE classes SET ${setClause} WHERE id = $${values.length}`,
          values
        );
        
        this.contactsFound++;
      }
    }
  }

  async processBatch() {
    const businesses = await this.getBusinessesNeedingContacts();
    
    if (businesses.length === 0) {
      console.log(`${this.getTimestamp()} ✅ All businesses have been processed!`);
      return false;
    }
    
    console.log(`${this.getTimestamp()} 📦 Processing ${businesses.length} businesses needing contacts...`);
    
    for (const business of businesses) {
      try {
        const contacts = await this.findBusinessContactsComprehensive(business);
        await this.updateBusinessContacts(business.id, contacts);
        
        this.processedCount++;
        
        if (this.processedCount % 10 === 0) {
          console.log(`${this.getTimestamp()} 📊 Progress: ${this.processedCount} processed, ${this.emailsFound} emails found, ${this.socialFound} social profiles`);
        }
        
        await this.sleep(1000); // Rate limiting
      } catch (error) {
        console.log(`${this.getTimestamp()} ⚠️  Error processing ${business.name}: ${error.message}`);
      }
    }
    
    return true;
  }

  async runComprehensiveCollection() {
    await this.initialize();
    
    let shouldContinue = true;
    let batchCount = 0;
    
    while (shouldContinue && batchCount < 10) {
      batchCount++;
      console.log(`${this.getTimestamp()} 🔄 COMPREHENSIVE batch ${batchCount}...`);
      
      shouldContinue = await this.processBatch();
      
      if (shouldContinue) {
        await this.sleep(2000);
      }
    }
    
    await this.showFinalResults();
    await this.close();
  }

  async showFinalResults() {
    const result = await this.pool.query(`
      SELECT 
        COUNT(*) as total_classes,
        COUNT(CASE WHEN email IS NOT NULL AND email != '' AND email NOT LIKE '%.png' THEN 1 END) as with_email,
        COUNT(CASE WHEN social_media IS NOT NULL AND social_media != '' THEN 1 END) as with_social,
        COUNT(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 END) as with_phone
      FROM classes WHERE is_active = true
    `);
    
    const stats = result.rows[0];
    const emailPercentage = ((stats.with_email / stats.total_classes) * 100).toFixed(1);
    const socialPercentage = ((stats.with_social / stats.total_classes) * 100).toFixed(1);
    const phonePercentage = ((stats.with_phone / stats.total_classes) * 100).toFixed(1);
    
    console.log(`${this.getTimestamp()} 📊 COMPREHENSIVE COLLECTION RESULTS:`);
    console.log(`${this.getTimestamp()} 📧 Emails: ${stats.with_email}/${stats.total_classes} (${emailPercentage}%)`);
    console.log(`${this.getTimestamp()} 📱 Social: ${stats.with_social}/${stats.total_classes} (${socialPercentage}%)`);
    console.log(`${this.getTimestamp()} 📞 Phones: ${stats.with_phone}/${stats.total_classes} (${phonePercentage}%)`);
    console.log(`${this.getTimestamp()} ⏱️  Runtime: ${((Date.now() - this.startTime) / 1000 / 60).toFixed(1)} minutes`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
    await this.pool.end();
  }
}

async function runComprehensiveBusinessContactCollector() {
  const collector = new ComprehensiveBusinessContactCollector();
  await collector.runComprehensiveCollection();
}

if (require.main === module) {
  runComprehensiveBusinessContactCollector().catch(console.error);
}

module.exports = { ComprehensiveBusinessContactCollector };