import { Pool } from 'pg';

class UltraOptimizedSchedulingCollector {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 15,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.processed = 0;
    this.schedulesFound = 0;
    this.batchSize = 25; // Smaller batches for API calls
    this.concurrentRequests = 3; // Conservative to respect API limits
    this.apiCallsPerSecond = 10;
    this.lastApiCall = 0;
  }

  async getClassesNeedingScheduling() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, venue, address, postcode, town, time, day_of_week
        FROM classes 
        WHERE is_active = true
        AND (time = 'Various times' OR day_of_week = 'Multiple' OR time IS NULL OR day_of_week IS NULL)
        AND venue IS NOT NULL
        ORDER BY 
          CASE WHEN postcode IS NOT NULL THEN 0 ELSE 1 END,
          RANDOM()
        LIMIT $1
      `, [this.batchSize]);
      
      return result.rows;
    } finally {
      client.release();
    }
  }

  async rateLimitedApiCall(url) {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;
    const minInterval = 1000 / this.apiCallsPerSecond;
    
    if (timeSinceLastCall < minInterval) {
      await this.sleep(minInterval - timeSinceLastCall);
    }
    
    this.lastApiCall = Date.now();
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    
    return response.json();
  }

  async processBatchConcurrently(classes) {
    const chunks = [];
    for (let i = 0; i < classes.length; i += this.concurrentRequests) {
      chunks.push(classes.slice(i, i + this.concurrentRequests));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(classItem => this.processClassSafely(classItem));
      await Promise.allSettled(promises);
      await this.sleep(1000); // Respectful delay between chunks
    }
  }

  async processClassSafely(classItem) {
    try {
      const schedule = await this.getAuthenticSchedule(classItem);
      if (schedule) {
        await this.updateClassSchedule(classItem.id, schedule);
        this.schedulesFound++;
        console.log(`📅 ${classItem.name}: ${schedule.day} ${schedule.time}`);
      }
      this.processed++;
    } catch (error) {
      this.processed++;
    }
  }

  async getAuthenticSchedule(classItem) {
    try {
      const placeId = await this.findPlaceId(classItem);
      if (!placeId) return null;

      const details = await this.getPlaceDetails(placeId);
      if (!details || !details.opening_hours) return null;

      return this.extractScheduleFromOpeningHours(details.opening_hours);
    } catch (error) {
      return null;
    }
  }

  async findPlaceId(classItem) {
    const query = `"${classItem.venue}" ${classItem.postcode || classItem.town}`;
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${this.apiKey}`;
    
    try {
      const data = await this.rateLimitedApiCall(url);
      
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].place_id;
      }
    } catch (error) {
      // Silent fail for individual searches
    }
    
    return null;
  }

  async getPlaceDetails(placeId) {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=opening_hours&key=${this.apiKey}`;
    
    try {
      const data = await this.rateLimitedApiCall(url);
      return data.result;
    } catch (error) {
      return null;
    }
  }

  extractScheduleFromOpeningHours(openingHours) {
    if (!openingHours.weekday_text) return null;

    // Look for class-appropriate times (typically mornings/afternoons for family activities)
    const classTimePatterns = [
      /(\d{1,2}):(\d{2})\s*(am|pm)/gi,
      /(\d{1,2})\s*(am|pm)/gi
    ];

    for (const dayText of openingHours.weekday_text) {
      const dayMatch = dayText.match(/^(\w+):/);
      if (!dayMatch) continue;

      const day = this.capitalizeDay(dayMatch[1]);
      
      for (const pattern of classTimePatterns) {
        const timeMatch = pattern.exec(dayText);
        if (timeMatch && this.isReasonableClassTime(timeMatch[0])) {
          return {
            day: day,
            time: this.formatTime(timeMatch[0])
          };
        }
      }
    }

    return null;
  }

  isReasonableClassTime(timeStr) {
    const hour = parseInt(timeStr.match(/(\d{1,2})/)[1]);
    const isPM = timeStr.toLowerCase().includes('pm');
    
    // Family activities typically run 9am-6pm
    if (isPM) {
      return hour >= 1 && hour <= 6; // 1pm-6pm
    } else {
      return hour >= 9 && hour <= 12; // 9am-12pm
    }
  }

  formatTime(timeStr) {
    return timeStr.replace(/(\d{1,2}):?(\d{2})?\s*(am|pm)/gi, (match, hour, minute, period) => {
      const h = parseInt(hour);
      const m = minute || '00';
      return `${h}:${m} ${period.toUpperCase()}`;
    });
  }

  capitalizeDay(day) {
    return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  }

  async updateClassSchedule(classId, schedule) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE classes 
        SET day_of_week = $1, time = $2, last_verified = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [schedule.day, schedule.time, classId]);
    } finally {
      client.release();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runOptimizedSchedulingCollector() {
    console.log('🚀 Ultra-Optimized Scheduling Collector Starting...');
    console.log('📅 Collecting authentic schedules from verified business profiles');
    
    if (!this.apiKey) {
      console.log('❌ Google Places API key not found. Please configure GOOGLE_PLACES_API_KEY environment variable.');
      return;
    }
    
    let batch = 1;
    while (true) {
      console.log(`\n📦 Processing batch ${batch}...`);
      
      const classes = await this.getClassesNeedingScheduling();
      if (classes.length === 0) {
        console.log('✅ All classes with generic scheduling processed!');
        break;
      }
      
      await this.processBatchConcurrently(classes);
      
      console.log(`📊 Batch ${batch}: ${this.schedulesFound}/${this.processed} authentic schedules found`);
      batch++;
      
      if (batch > 40) { // Safety limit
        console.log('🛑 Reached batch limit');
        break;
      }
    }
    
    await this.showResults();
  }

  async showResults() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE time IS NOT NULL AND time != 'Various times' AND day_of_week IS NOT NULL AND day_of_week != 'Multiple') as with_schedule
        FROM classes WHERE is_active = true
      `);
      
      const { total, with_schedule } = result.rows[0];
      const percentage = ((with_schedule / total) * 100).toFixed(1);
      
      console.log(`\n🎉 Ultra-Optimized Scheduling Collector Complete!`);
      console.log(`📅 Authentic Schedule Coverage: ${with_schedule}/${total} (${percentage}%)`);
      console.log(`✅ Found ${this.schedulesFound} authentic schedules in this run`);
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

async function runUltraOptimizedSchedulingCollector() {
  const collector = new UltraOptimizedSchedulingCollector();
  try {
    await collector.runOptimizedSchedulingCollector();
  } catch (error) {
    console.error('❌ Ultra-optimized scheduling collector failed:', error);
  } finally {
    await collector.close();
  }
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  runUltraOptimizedSchedulingCollector();
}

export { runUltraOptimizedSchedulingCollector };