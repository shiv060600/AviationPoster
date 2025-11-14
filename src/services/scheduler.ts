import cron from 'node-cron';
import { config } from '../config';

export type ProcessFunction = () => Promise<void>;

export class Scheduler {
  private task: cron.ScheduledTask | null = null;
  private processFn: ProcessFunction | null = null;

  /**
   * Set the function to run on schedule
   */
  setProcessFunction(fn: ProcessFunction): void {
    this.processFn = fn;
  }

  /**
   * Start the daily scheduler
   */
  start(): void {
    if (!this.processFn) {
      throw new Error('Process function not set. Call setProcessFunction() first.');
    }

    // Parse schedule time (e.g., "09:00" -> cron expression)
    const [hour, minute] = config.schedule.time.split(':').map(Number);
    
    // Run daily at the specified time
    // Cron format: minute hour day month dayOfWeek
    const cronExpression = `${minute} ${hour} * * *`;
    
    console.log(`Scheduler starting. Will run daily at ${config.schedule.time}`);
    
    this.task = cron.schedule(cronExpression, async () => {
      console.log(`\n[${new Date().toISOString()}] Scheduled task triggered`);
      try {
        if (this.processFn) {
          await this.processFn();
        }
      } catch (error) {
        console.error('Error in scheduled task:', error);
      }
    }, {
      scheduled: true,
      timezone: config.schedule.timezone,
    });
    
    console.log('Scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('Scheduler stopped');
    }
  }

  /**
   * Run immediately (for testing)
   */
  async runNow(): Promise<void> {
    if (!this.processFn) {
      throw new Error('Process function not set.');
    }
    console.log('Running scheduled task immediately...');
    await this.processFn();
  }
}
