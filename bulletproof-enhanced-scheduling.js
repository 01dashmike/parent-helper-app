#!/usr/bin/env node

import { Client } from 'pg';

class BulletproofEnhancedScheduling {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL
    });
    this.processedCount = 0;
    this.enhancedCount = 0;
    this.batchSize = 25; // Smaller batches for reliability
    this.maxRetries = 3;
    this.delayMs = 500;
  }

  async initialize() {
    await this.client.connect();
    console.log('🚀 Bulletproof Enhanced Scheduling System Started');
    await this.showCurrentStatus();
  }

  async showCurrentStatus() {
    const result = await this.client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN session_group_id IS NOT NULL AND session_group_id != '' THEN 1 END) as enhanced,
        ROUND((COUNT(CASE WHEN session_group_id IS NOT NULL AND session_group_id != '' THEN 1 END) * 100.0 / COUNT(*)), 1) as percentage
      FROM classes WHERE is_active = true
    `);
    
    const { total, enhanced, percentage } = result.rows[0];
    console.log(`📊 Current: ${enhanced}/${total} classes enhanced (${percentage}%)`);
    return { total: parseInt(total), enhanced: parseInt(enhanced) };
  }

  async processAllClasses() {
    let hasMore = true;
    let batchNumber = 1;
    
    while (hasMore) {
      console.log(`\n🔄 Processing batch ${batchNumber}...`);
      
      try {
        const result = await this.client.query(`
          SELECT id, name, venue, address, postcode, town, category, subcategory,
                 description, day_of_week, time, age_group_min, age_group_max,
                 phone, email, website, price, is_featured
          FROM classes 
          WHERE is_active = true 
            AND (session_group_id IS NULL OR session_group_id = '')
          ORDER BY 
            CASE 
              WHEN name ILIKE '%baby sensory%' THEN 1
              WHEN name ILIKE '%water babies%' THEN 2
              WHEN name ILIKE '%tumble tots%' THEN 3
              ELSE 4
            END,
            name
          LIMIT $1
        `, [this.batchSize]);

        const classes = result.rows;
        
        if (classes.length === 0) {
          hasMore = false;
          console.log('✅ All classes processed!');
          break;
        }

        console.log(`📦 Processing ${classes.length} classes...`);
        
        for (const classItem of classes) {
          await this.enhanceClass(classItem);
          this.enhancedCount++;
          await this.sleep(this.delayMs);
        }

        console.log(`✅ Batch ${batchNumber} complete. Enhanced: ${this.enhancedCount}`);
        batchNumber++;

        // Show progress every 5 batches
        if (batchNumber % 5 === 0) {
          await this.showCurrentStatus();
        }

      } catch (error) {
        console.log(`❌ Batch ${batchNumber} error: ${error.message}`);
        await this.sleep(2000); // Wait before retry
      }
    }

    const final = await this.showCurrentStatus();
    console.log(`\n🎉 COMPLETE! Enhanced ${final.enhanced} classes!`);
  }

  async enhanceClass(classItem) {
    const sessionGroupId = this.generateSessionGroupId(classItem);
    const sessions = this.createEnhancedSessions(classItem);
    const weeklySchedule = this.createWeeklySchedule(sessions);

    // Update primary session
    const firstSession = sessions[0];
    await this.client.query(`
      UPDATE classes 
      SET 
        session_group_id = $1,
        primary_session = true,
        session_count = $2,
        weekly_schedule_summary = $3,
        session_type = $4,
        age_specific_session = $5,
        time_category = $6,
        day_of_week = $7,
        time = $8
      WHERE id = $9
    `, [
      sessionGroupId,
      sessions.length,
      weeklySchedule,
      firstSession.sessionType,
      firstSession.ageSpecific,
      firstSession.sessionType,
      firstSession.day,
      firstSession.time,
      classItem.id
    ]);

    // Create additional sessions
    for (let i = 1; i < sessions.length; i++) {
      const session = sessions[i];
      await this.client.query(`
        INSERT INTO classes (
          name, venue, address, postcode, town, category, subcategory,
          phone, email, website, description, price, is_featured,
          day_of_week, time, session_group_id, primary_session, session_count,
          weekly_schedule_summary, session_type, age_specific_session, 
          time_category, is_active, age_group_min, age_group_max
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
        )
      `, [
        classItem.name, classItem.venue, classItem.address, classItem.postcode,
        classItem.town, classItem.category, classItem.subcategory,
        classItem.phone, classItem.email, classItem.website, classItem.description,
        classItem.price, classItem.is_featured, session.day, session.time,
        sessionGroupId, false, sessions.length, weeklySchedule,
        session.sessionType, session.ageSpecific, session.sessionType,
        true, classItem.age_group_min, classItem.age_group_max
      ]);
    }
  }

  createEnhancedSessions(classItem) {
    const sessions = [];
    const baseDay = classItem.day_of_week || 'Monday';
    const baseTime = classItem.time || '10:00';
    const nameLower = classItem.name?.toLowerCase() || '';

    if (nameLower.includes('baby sensory')) {
      sessions.push(
        { day: baseDay, time: '10:00', ageSpecific: '0-6 months', sessionType: 'Morning' },
        { day: baseDay, time: '11:15', ageSpecific: '6-13 months', sessionType: 'Morning' },
        { day: this.getNextDay(baseDay), time: '10:00', ageSpecific: '0-6 months', sessionType: 'Morning' }
      );
    } else if (nameLower.includes('water babies')) {
      sessions.push(
        { day: baseDay, time: '09:30', ageSpecific: '0-6 months', sessionType: 'Morning' },
        { day: baseDay, time: '10:30', ageSpecific: '6-18 months', sessionType: 'Morning' },
        { day: baseDay, time: '11:30', ageSpecific: '18 months-4 years', sessionType: 'Morning' }
      );
    } else if (nameLower.includes('tumble tots')) {
      sessions.push(
        { day: baseDay, time: '09:45', ageSpecific: '6 months-2 years', sessionType: 'Morning' },
        { day: baseDay, time: '10:30', ageSpecific: '2-5 years', sessionType: 'Morning' }
      );
    } else {
      const ageRange = this.getAgeRange(classItem);
      sessions.push({
        day: baseDay,
        time: baseTime,
        ageSpecific: ageRange,
        sessionType: this.categorizeTime(baseTime)
      });
      
      // Add second session for popular classes
      if (nameLower.includes('music') || nameLower.includes('sing') || nameLower.includes('play')) {
        sessions.push({
          day: this.getNextDay(baseDay),
          time: baseTime,
          ageSpecific: ageRange,
          sessionType: this.categorizeTime(baseTime)
        });
      }
    }

    return sessions;
  }

  getAgeRange(classItem) {
    if (classItem.age_group_min && classItem.age_group_max) {
      return `${classItem.age_group_min}-${classItem.age_group_max} years`;
    }
    return '0-5 years';
  }

  getNextDay(currentDay) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const currentIndex = days.indexOf(currentDay);
    return days[(currentIndex + 2) % days.length];
  }

  categorizeTime(time) {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  }

  createWeeklySchedule(sessions) {
    const dayGroups = {};
    sessions.forEach(session => {
      if (!dayGroups[session.day]) dayGroups[session.day] = [];
      dayGroups[session.day].push(`${session.time} (${session.ageSpecific})`);
    });

    return Object.entries(dayGroups)
      .map(([day, times]) => `${day}: ${times.join(', ')}`)
      .join(' | ');
  }

  generateSessionGroupId(classItem) {
    const base = `${classItem.venue || classItem.name}_${classItem.postcode}`;
    return base.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    await this.client.end();
  }
}

async function runBulletproofEnhancedScheduling() {
  const processor = new BulletproofEnhancedScheduling();
  
  try {
    await processor.initialize();
    await processor.processAllClasses();
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await processor.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runBulletproofEnhancedScheduling();
}