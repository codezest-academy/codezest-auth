import cron from 'node-cron';
import { PrismaSessionRepository } from '../../infrastructure/repositories/session.repository';
import { logger } from '../../config/logger';

export class SessionCleanupJob {
  private sessionRepository: PrismaSessionRepository;

  constructor() {
    this.sessionRepository = new PrismaSessionRepository();
  }

  /**
   * Start the cleanup job
   * Runs every hour at minute 0
   */
  start() {
    logger.info('Initializing session cleanup job...');

    // Schedule job to run every hour
    cron.schedule('0 * * * *', async () => {
      logger.info('Running session cleanup job...');
      try {
        const count = await this.sessionRepository.deleteExpired();
        if (count > 0) {
          logger.info(`Cleaned up ${count} expired sessions`);
        }
      } catch (error) {
        logger.error('Error running session cleanup job:', error);
      }
    });

    logger.info('Session cleanup job scheduled (every hour)');
  }
}
