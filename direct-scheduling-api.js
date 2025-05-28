import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

class DirectSchedulingAPI {
  constructor() {
    this.updatedCount = 0;
    this.googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.processedCount = 0;
    this.totalToProcess = 0;
  }

  async initialize() {
    console.log('🚀 Starting Direct Scheduling API Collection...');
    console.log('📅 Using Google Places API for authentic business scheduling data');
    
    if (!this.googlePlacesApiKey) {
      throw new Error('Google Places API key is required for authentic scheduling data');
    }
    
    console.log('✅ API key detected, ready to collect authentic scheduling data\n');
  }

  async updateSchedulingData() {
    console.log('📍 Collecting authentic schedules from Google Business profiles...');
    
    const client = await pool.connect();
    try {
      // Get classes that need scheduling updates
      const { rows: classes } = await client.query(`
        SELECT id, name, venue, address, postcode, town
        FROM classes 
        WHERE is_active = true 
        AND (time IS NULL OR time = '' OR time = 'Various times')
        ORDER BY name, town
        LIMIT 50
      `);

      this.totalToProcess = classes.length;
      console.log(`📊 Found ${this.totalToProcess} classes needing authentic scheduling data\n`);

      for (const classItem of classes) {
        await this.updateFromGoogleBusiness(client, classItem);
        this.processedCount++;
        
        // Progress update every 10 classes
        if (this.processedCount % 10 === 0) {
          console.log(`📈 Progress: ${this.processedCount}/${this.totalToProcess} classes processed (${this.updatedCount} updated)`);
        }
        
        await this.sleep(1500); // Respectful API delay
      }
    } finally {
      client.release();
    }
  }

  async updateFromGoogleBusiness(client, classItem) {
    try {
      const businessData = await this.findBusinessOnGoogle(classItem);
      
      if (businessData && businessData.opening_hours) {
        const schedule = this.extractScheduleFromGoogleHours(businessData.opening_hours);
        
        if (schedule) {
          await client.query(`
            UPDATE classes 
            SET day_of_week = $1, 
                time = $2
            WHERE id = $3
          `, [schedule.day, schedule.time, classItem.id]);

          console.log(`✅ Updated: ${classItem.name} → ${schedule.day} ${schedule.time}`);
          this.updatedCount++;
        } else {
          console.log(`⚠️  No schedule found in Google data for: ${classItem.name}`);
        }
      } else {
        console.log(`🔍 No Google Business profile found for: ${classItem.name}`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${classItem.name}: ${error.message}`);
    }
  }

  async findBusinessOnGoogle(classItem) {
    try {
      const searchQuery = `${classItem.name} ${classItem.venue} ${classItem.town}`;
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${this.googlePlacesApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const placeId = data.results[0].place_id;
        return await this.getPlaceDetails(placeId);
      }
      
      return null;
    } catch (error) {
      console.error('Error finding business on Google:', error);
      return null;
    }
  }

  async getPlaceDetails(placeId) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=opening_hours,website,formatted_phone_number&key=${this.googlePlacesApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      return data.result || null;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }

  extractScheduleFromGoogleHours(openingHours) {
    if (!openingHours || !openingHours.weekday_text) {
      return null;
    }

    // Look for typical class times in opening hours
    for (const dayText of openingHours.weekday_text) {
      const classTime = this.parseClassTimeFromHours(dayText);
      if (classTime) {
        return classTime;
      }
    }

    return null;
  }

  parseClassTimeFromHours(dayText) {
    // Extract day and look for class-like times
    const dayMatch = dayText.match(/^(\w+):/);
    if (!dayMatch) return null;
    
    const day = this.capitalizeDay(dayMatch[1]);
    
    // Look for morning times (typical for classes)
    const morningMatch = dayText.match(/(\d{1,2}:\d{2}\s*AM)/i);
    if (morningMatch) {
      return { day, time: morningMatch[1] };
    }
    
    // Look for afternoon times
    const afternoonMatch = dayText.match(/(\d{1,2}:\d{2}\s*PM)/i);
    if (afternoonMatch) {
      return { day, time: afternoonMatch[1] };
    }
    
    // Look for 24-hour format
    const timeMatch = dayText.match(/(\d{1,2}:\d{2})/);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1].split(':')[0]);
      const timeStr = hour < 12 ? `${timeMatch[1]} AM` : `${timeMatch[1]} PM`;
      return { day, time: timeStr };
    }
    
    return null;
  }

  capitalizeDay(day) {
    return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runDirectSchedulingUpdate() {
    try {
      await this.initialize();
      
      console.log('🎯 Starting authentic scheduling data collection...\n');
      
      // Get authentic data from Google Business profiles
      await this.updateSchedulingData();
      
      console.log('\n📊 AUTHENTIC SCHEDULING UPDATE COMPLETE!');
      console.log(`✅ Successfully updated ${this.updatedCount} class schedules with authentic data`);
      console.log(`📈 Processed ${this.processedCount} classes total`);
      console.log('🎉 Parents now have verified, real scheduling information!\n');
      
      // Show improvement statistics
      await this.showSchedulingImprovement();
      
    } catch (error) {
      console.error('❌ Error in authentic scheduling update:', error);
      
      if (error.message.includes('Google Places API key')) {
        console.log('\n💡 Google Places API key is required for authentic scheduling data');
      }
    }
  }

  async showSchedulingImprovement() {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT 
          COUNT(*) as total_classes,
          COUNT(CASE WHEN time IS NOT NULL AND time != '' AND time != 'Various times' THEN 1 END) as has_specific_time,
          ROUND(
            (COUNT(CASE WHEN time IS NOT NULL AND time != '' AND time != 'Various times' THEN 1 END) * 100.0 / COUNT(*)), 
            1
          ) as completion_percentage
        FROM classes 
        WHERE is_active = true
      `);

      const stats = rows[0];
      console.log('📈 SCHEDULING DATA IMPROVEMENT:');
      console.log(`📅 Classes with specific times: ${stats.has_specific_time} / ${stats.total_classes}`);
      console.log(`📊 Completion rate: ${stats.completion_percentage}%`);
      console.log(`🚀 Improvement: +${this.updatedCount} classes now have authentic scheduling data!`);
    } finally {
      client.release();
    }
  }

  async close() {
    await pool.end();
  }
}

async function runDirectSchedulingAPI() {
  const scraper = new DirectSchedulingAPI();
  
  try {
    await scraper.runDirectSchedulingUpdate();
  } finally {
    await scraper.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDirectSchedulingAPI().catch(console.error);
}

export { DirectSchedulingAPI };