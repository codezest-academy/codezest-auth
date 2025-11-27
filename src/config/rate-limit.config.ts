import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { config } from './index';
import { logger } from './logger';

/**
 * Create a Redis-backed rate limiter with auto-fallback to in-memory
 */
export async function createRateLimiter(): Promise<RateLimitRequestHandler> {
  // Try to connect to Redis for distributed rate limiting
  if (config.redis.host && config.redis.port) {
    try {
      const redisClient = createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
        },
        password: config.redis.password || undefined,
      });

      redisClient.on('error', (err: Error) => {
        logger.error('Redis rate limiter error:', err);
      });

      await redisClient.connect();
      logger.info('Redis rate limiter connected successfully');

      return rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
        store: new RedisStore({
          sendCommand: (...args: string[]) => redisClient.sendCommand(args),
        }),
        message: 'Too many requests from this IP, please try again later.',
      });
    } catch (error) {
      logger.warn('Failed to connect to Redis for rate limiting, falling back to in-memory', {
        error,
      });
      // Fall through to in-memory rate limiter
    }
  }

  // Fallback to in-memory rate limiter (for development or if Redis is unavailable)
  logger.info('Using in-memory rate limiter (not suitable for production with multiple instances)');
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
  });
}

/**
 * Create a strict rate limiter for sensitive endpoints (e.g., login, password reset)
 */
export async function createStrictRateLimiter(): Promise<RateLimitRequestHandler> {
  // Try to connect to Redis for distributed rate limiting
  if (config.redis.host && config.redis.port) {
    try {
      const redisClient = createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
        },
        password: config.redis.password || undefined,
      });

      redisClient.on('error', (err: Error) => {
        logger.error('Redis strict rate limiter error:', err);
      });

      await redisClient.connect();
      logger.info('Redis strict rate limiter connected successfully');

      return rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Limit each IP to 5 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
        store: new RedisStore({
          sendCommand: (...args: string[]) => redisClient.sendCommand(args),
        }),
        message: 'Too many attempts from this IP, please try again later.',
      });
    } catch (error) {
      logger.warn(
        'Failed to connect to Redis for strict rate limiting, falling back to in-memory',
        { error }
      );
      // Fall through to in-memory rate limiter
    }
  }

  // Fallback to in-memory rate limiter
  logger.info(
    'Using in-memory strict rate limiter (not suitable for production with multiple instances)'
  );
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many attempts from this IP, please try again later.',
  });
}
