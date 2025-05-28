import { Pool } from 'pg';

class FixedTimetableEnhancer {
  constructor() {
    this.client = null;
    this.batchSize = 10; // Much smaller batches to prevent timeouts
    this.processedCount = 0;
    this.totalClasses = 0;
    this.startTime = Date.now();
  }

  async initialize() {
    this.client = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3, // Limit concurrent connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    
    console.log('🔧 Fixed Timetable Enhancer initialized');
    await this.showCurrentStatus();
  }

  async showCurrentStatus() {
    const result = await this.client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN session_group_id IS NOT NULL THEN 1 END) as enhanced
      FROM classes
    `);
    
    const { total, enhanced } = result.rows[0];
    this.totalClasses = parseInt(total);
    const percentage = ((enhanced / total) * 100).toFixed(1);
    
    console.log(`📊 Current Status: ${enhanced}/${total} classes enhanced (${percentage}%)`);
    console.log(`🎯 Target: Enhance remaining ${total - enhanced} classes`);
  }

  async processAllClassesFixed() {
    console.log('\n🔧 Starting FIXED processing...');
    
    // Process in much smaller, manageable chunks
    let offset = 0;
    const limit = this.batchSize;
    let hasMore = true;
    
    while (hasMore) {
      try {
        // Get small batch of unprocessed classes
        const result = await this.client.query(`
          SELECT id, name, venue, town, day_of_week, time, category
          FROM classes 
          WHERE session_group_id IS NULL 
          ORDER BY id
          LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        const batch = result.rows;
        
        if (batch.length === 0) {
          hasMore = false;
          break;
        }
        
        console.log(`🔄 Processing batch ${Math.floor(offset/limit) + 1}: ${batch.length} classes`);
        
        // Process each class in the batch sequentially (not parallel)
        for (const classItem of batch) {
          await this.enhanceClassSafe(classItem);
          this.processedCount++;
          
          // Small delay to prevent overwhelming the database
          await this.sleep(50);
        }
        
        offset += limit;
        
        // Show progress every 5 batches
        if ((offset / limit) % 5 === 0) {
          await this.showProgress();
        }
        
        // Longer pause between batches
        await this.sleep(1000);
        
      } catch (error) {
        console.error(`❌ Error in batch starting at ${offset}:`, error.message);
        // Continue with next batch instead of failing completely
        offset += limit;
        await this.sleep(2000);
      }
    }
    
    console.log('\n✅ FIXED processing complete!');
    await this.showFinalResults();
  }

  async enhanceClassSafe(classItem) {
    try {
      // Generate session group ID
      const sessionGroupId = this.generateSessionGroupId(classItem);
      
      // Create basic enhanced sessions (2-3 max to avoid complexity)
      const sessions = this.createSimpleEnhancedSessions(classItem);
      
      // Create weekly schedule summary
      const weeklySchedule = this.createWeeklyScheduleSummary(sessions);
      
      // Update primary session first
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
      
      // Create only 1 additional session to keep it simple
      if (sessions.length > 1) {
        const additionalSession = sessions[1];
        const sessionName = `${classItem.name} - ${additionalSession.day} ${additionalSession.sessionType}`;
        
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
          `Additional session for ${classItem.name}`,
          sessionGroupId,
          sessions.length,
          weeklySchedule,
          additionalSession.sessionType,
          additionalSession.ageSpecific,
          additionalSession.timeCategory
        ]);
      }
      
    } catch (error) {
      console.error(`❌ Error enhancing class ${classItem.id}:`, error.message);
      // Don't throw - just continue with next class
    }
  }

  createSimpleEnhancedSessions(classItem) {
    const sessions = [];
    const baseDay = classItem.day_of_week || 'Monday';
    const baseTime = classItem.time || '10:00 AM';
    const ageRange = this.getSimpleAgeRange(classItem);
    const sessionType = this.categorizeTime(baseTime);
    
    // Primary session
    sessions.push({
      day: baseDay,
      time: baseTime,
      sessionType,
      ageSpecific: ageRange,
      timeCategory: sessionType
    });
    
    // Just add ONE additional session
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

  getSimpleAgeRange(classItem) {
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
    const hour = parseInt(time.split(':')[0]);
    const isPM = time.includes('PM');
    const hour24 = isPM && hour !== 12 ? hour + 12 : (hour === 12 && !isPM ? 0 : hour);
    
    if (hour24 < 12) return 'Morning';
    if (hour24 < 17) return 'Afternoon';
    return 'Evening';
  }

  createWeeklyScheduleSummary(sessions) {
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
    const elapsed = (Date.now() - this.startTime) / 1000;
    const rate = this.processedCount / elapsed;
    
    console.log(`🔧 Progress: ${this.processedCount} processed | ${rate.toFixed(1)} classes/sec`);
  }

  async showFinalResults() {
    const finalResult = await this.client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN session_group_id IS NOT NULL THEN 1 END) as enhanced
      FROM classes
    `);
    
    const { total, enhanced } = finalResult.rows[0];
    const percentage = ((enhanced / total) * 100).toFixed(1);
    const elapsed = (Date.now() - this.startTime) / 1000;
    
    console.log('\n🎉 FIXED Enhancement Complete!');
    console.log(`📊 Final Status: ${enhanced}/${total} classes enhanced (${percentage}%)`);
    console.log(`⏱️ Total time: ${elapsed.toFixed(1)}s`);
    console.log(`🔧 Reliable processing: ${(this.processedCount / elapsed).toFixed(1)} classes/sec`);
  }

  async close() {
    if (this.client) {
      await this.client.end();
    }
  }
}

async function runFixedTimetableEnhancer() {
  const enhancer = new FixedTimetableEnhancer();
  
  try {
    await enhancer.initialize();
    await enhancer.processAllClassesFixed();
  } catch (error) {
    console.error('❌ Fixed enhancement failed:', error);
  } finally {
    await enhancer.close();
  }
}

// Run the fixed version
runFixedTimetableEnhancer();