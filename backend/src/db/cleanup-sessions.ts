import { db } from './connection';
import { timerSessions } from '@stage-timer/db';
import { sql } from 'drizzle-orm';

/**
 * Clean up duplicate timer sessions, keeping only the latest session per timer
 * This function should be called once to migrate from the old multi-session approach
 * to the new single-session-per-timer approach
 */
export async function cleanupDuplicateTimerSessions() {
  try {
    console.log('🧹 Starting timer sessions cleanup...');

    // Get count before cleanup
    const beforeCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(timerSessions);

    console.log(`📊 Found ${beforeCount[0].count} timer sessions before cleanup`);

    // Create temporary table with latest sessions
    await db.execute(sql`
      CREATE TEMP TABLE latest_sessions AS
      SELECT DISTINCT ON (timer_id) 
          id, timer_id, kickoff, deadline, last_stop, status
      FROM timer_sessions 
      ORDER BY timer_id, id DESC
    `);

    // Delete all existing sessions
    await db.delete(timerSessions);

    // Insert back only the latest sessions
    await db.execute(sql`
      INSERT INTO timer_sessions (timer_id, kickoff, deadline, last_stop, status)
      SELECT timer_id, kickoff, deadline, last_stop, status
      FROM latest_sessions
    `);

    // Get count after cleanup
    const afterCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(timerSessions);

    console.log(`✅ Cleanup complete! Reduced from ${beforeCount[0].count} to ${afterCount[0].count} sessions`);
    console.log(`🗑️ Removed ${beforeCount[0].count - afterCount[0].count} duplicate sessions`);

    return {
      before: beforeCount[0].count,
      after: afterCount[0].count,
      removed: beforeCount[0].count - afterCount[0].count
    };

  } catch (error) {
    console.error('❌ Error during timer sessions cleanup:', error);
    throw error;
  }
}

/**
 * Add unique constraint to timer_id if it doesn't exist
 * This should be called after cleanup to prevent future duplicates
 */
export async function addUniqueConstraint() {
  try {
    console.log('🔒 Adding unique constraint to timer_sessions.timer_id...');
    
    await db.execute(sql`
      ALTER TABLE timer_sessions 
      ADD CONSTRAINT timer_sessions_timer_id_unique 
      UNIQUE (timer_id)
    `);
    
    console.log('✅ Unique constraint added successfully');
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️ Unique constraint already exists');
    } else {
      console.error('❌ Error adding unique constraint:', error);
      throw error;
    }
  }
}

/**
 * Complete migration: cleanup duplicates and add constraint
 */
export async function migrateToSingleSessionPerTimer() {
  console.log('🚀 Starting migration to single session per timer...');
  
  const stats = await cleanupDuplicateTimerSessions();
  await addUniqueConstraint();
  
  console.log('🎉 Migration completed successfully!');
  return stats;
}
