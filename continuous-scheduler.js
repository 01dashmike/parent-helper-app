import { Pool } from 'pg';

class ContinuousScheduler {
  constructor() {
    this.client = null;
    this.isRunning = false;
    this.processedCount = 0;
    this.batchSize = 5; // Very small batches for stability
    this.delayBetweenBatches = 2000; // 2 second pause between batches
    this.maxRetries = 3;
  }

  async initialize() {
    this.client = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 2, // Only 2 connections
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 10000,
    });
    
    console.log('🔄 Continuous Scheduler initialized');
    this.isRunning = true;
    
    // Start the continuous processing loop
    this.startContinuousProcessing();
  }

  async startContinuousProcessing() {
    console.log('🚀 Starting continuous processing...');
    
    while (this.isRunning) {
      try {
        // Get a small batch of unprocessed classes
        const result = await this.client.query(`
          SELECT id, name, venue, town, day_of_week, time, category
          FROM classes 
          WHERE session_group_id IS NULL 
          ORDER BY id
          LIMIT $1
        `, [this.batchSize]);

        const batch = result.rows;

        if (batch.length === 0) {
          console.log('✅ All classes processed! Scheduler complete.');
          await this.showFinalStatus();
          break;
        }

        // Process each class in the batch
        for (const classItem of batch) {
          await this.enhanceClassRobust(classItem);
          this.processedCount++;
          
          // Small delay between each class
          await this.sleep(200);
        }

        // Show progress every 10 classes
        if (this.processedCount % 10 === 0) {
          await this.showProgress();
        }

        // Pause between batches to prevent overwhelming
        await this.sleep(this.delayBetweenBatches);

      } catch (error) {
        console.error('❌ Batch error:', error.message);
        // Wait longer and continue instead of crashing
        await this.sleep(5000);
      }
    }
  }

  async enhanceClassRobust(classItem) {
    let retries = 0;
    
    while (retries < this.maxRetries) {
      try {
        const sessionGroupId = this.generateSessionGroupId(classItem);
        const sessions = this.createBasicSessions(classItem);
        const weeklySchedule = this.createWeeklySchedule(sessions);

        // Update the primary class
        await this.client.query(`
          UPDATE classes 
          SET 
            session_group_id = $1,
            primary_session = true,
            session_count = $2,
            weekly_schedule_summary = $3,
            session_type = $4,
            age_specific_session = $5,
            time_category = $6
          WHERE id = $7
        `, [
          sessionGroupId,
          sessions.length,
          weeklySchedule,
          sessions[0].sessionType,
          sessions[0].ageSpecific,
          sessions[0].timeCategory,
          classItem.id
        ]);

        // Create just one additional session to keep it simple
        if (sessions.length > 1) {
          const additionalSession = sessions[1];
          const sessionName = `${classItem.name || 'Class'} - ${additionalSession.day} ${additionalSession.sessionType}`;
          
          await this.client.query(`
            INSERT INTO classes (
              name, venue, town, day_of_week, time, category,
              description, age_group_min, age_group_max, price, is_featured,
              address, postcode, session_group_id, primary_session, session_count,
              weekly_schedule_summary, session_type, age_specific_session, time_category,
              is_active, created_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, 0, 60, '£15', false, '', '',
              $8, false, $9, $10, $11, $12, $13, true, NOW()
            )
          `, [
            sessionName,
            classItem.venue || '',
            classItem.town || '',
            additionalSession.day,
            additionalSession.time,
            classItem.category || '',
            `Additional session for ${classItem.name || 'class'}`,
            sessionGroupId,
            sessions.length,
            weeklySchedule,
            additionalSession.sessionType,
            additionalSession.ageSpecific,
            additionalSession.timeCategory
          ]);
        }

        return; // Success - exit retry loop

      } catch (error) {
        retries++;
        console.error(`❌ Retry ${retries} for class ${classItem.id}:`, error.message);
        
        if (retries >= this.maxRetries) {
          console.error(`❌ Failed to enhance class ${classItem.id} after ${this.maxRetries} retries`);
          return; // Give up on this class and continue
        }
        
        await this.sleep(1000 * retries); // Exponential backoff
      }
    }
  }

  createBasicSessions(classItem) {
    const sessions = [];
    const baseDay = classItem.day_of_week || 'Monday';
    const baseTime = classItem.time || '10:00 AM';
    const ageRange = this.getAgeRange(classItem);
    const sessionType = this.categorizeTime(baseTime);
    
    // Primary session
    sessions.push({
      day: baseDay,
      time: baseTime,
      sessionType,
      ageSpecific: ageRange,
      timeCategory: sessionType
    });
    
    // One additional session
    const nextDay = this.getNextDay(baseDay);
    const alternateTime = sessionType === 'Morning' ? '2:00 PM' : '10:00 AM';
    
    sessions.push({
      day: nextDay,
      time: alternateTime,
      sessionType: this.categorizeTime(alternateTime),
      ageSpecific: ageRange,
      timeCategory: this.categorizeTime(alternateTime)
    });
    
    return sessions;
  }

  getAgeRange(classItem) {
    const name = (classItem.name || '').toLowerCase();
    
    if (name.includes('baby') || name.includes('newborn')) {
      return '0-12 months';
    } else if (name.includes('toddler')) {
      return '1-3 years';
    }
    
    return '0-5 years';
  }

  getNextDay(currentDay) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const currentIndex = days.indexOf(currentDay);
    return days[(currentIndex + 1) % days.length];
  }

  categorizeTime(time) {
    const hour = parseInt((time || '10:00 AM').split(':')[0]);
    const isPM = (time || '').includes('PM');
    const hour24 = isPM && hour !== 12 ? hour + 12 : (hour === 12 && !isPM ? 0 : hour);
    
    if (hour24 < 12) return 'Morning';
    if (hour24 < 17) return 'Afternoon';
    return 'Evening';
  }

  createWeeklySchedule(sessions) {
    const dayGroups = {};
    
    sessions.forEach(session => {
      if (!dayGroups[session.day]) {
        dayGroups[session.day] = [];
      }
      dayGroups[session.day].push(`${session.time} (${session.ageSpecific})`);
    });
    
    return Object.entries(dayGroups)
      .map(([day, times]) => `${day}: ${times.join(', ')}`)
      .join(' | ');
  }

  generateSessionGroupId(classItem) {
    const cleanName = (classItem.name || 'class').toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
    return `${cleanName}_${classItem.id}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async showProgress() {
    try {
      const result = await this.client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN session_group_id IS NOT NULL THEN 1 END) as enhanced
        FROM classes
      `);
      
      const { total, enhanced } = result.rows[0];
      const percentage = ((enhanced / total) * 100).toFixed(1);
      
      console.log(`📊 Progress: ${enhanced}/${total} classes enhanced (${percentage}%)`);
    } catch (error) {
      console.error('Error showing progress:', error.message);
    }
  }

  async showFinalStatus() {
    try {
      const result = await this.client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN session_group_id IS NOT NULL THEN 1 END) as enhanced
        FROM classes
      `);
      
      const { total, enhanced } = result.rows[0];
      const percentage = ((enhanced / total) * 100).toFixed(1);
      
      console.log('\n🎉 Continuous Scheduling Complete!');
      console.log(`📊 Final Status: ${enhanced}/${total} classes enhanced (${percentage}%)`);
    } catch (error) {
      console.error('Error showing final status:', error.message);
    }
  }

  stop() {
    this.isRunning = false;
    console.log('🛑 Stopping continuous scheduler...');
  }

  async close() {
    this.stop();
    if (this.client) {
      await this.client.end();
    }
  }
}

// Start the continuous scheduler
const scheduler = new ContinuousScheduler();
scheduler.initialize();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await scheduler.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await scheduler.close();
  process.exit(0);
});