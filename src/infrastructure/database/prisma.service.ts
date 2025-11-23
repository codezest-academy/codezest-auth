import { PrismaClient } from '@prisma/client';
import { logger } from '../../config/logger';

/**
 * Prisma Service - Singleton pattern for database connection
 * Implements connection pooling and graceful shutdown
 */
class PrismaService {
  private static instance: PrismaService;
  public client: PrismaClient;

  private constructor() {
    this.client = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });

    // Log queries in development
    if (process.env.NODE_ENV === 'development' && typeof logger.debug === 'function') {
      this.client.$on('query' as never, (e: any) => {
        logger.debug('Query: ' + e.query);
        logger.debug('Duration: ' + e.duration + 'ms');
      });
    }

    // Log errors
    this.client.$on('error' as never, (e: any) => {
      logger.error('Prisma Error:', e);
    });

    // Log warnings
    this.client.$on('warn' as never, (e: any) => {
      logger.warn('Prisma Warning:', e);
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    try {
      await this.client.$connect();
      logger.info('✅ Database connected successfully');
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.$disconnect();
      logger.info('Database disconnected');
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

export default PrismaService;
