import { RateLimitRequestHandler } from 'express-rate-limit';
import { createRateLimiter, createStrictRateLimiter } from '../../config/rate-limit.config';
import { logger } from '../../config/logger';

// Initialize rate limiters (will be set asynchronously)
let apiLimiter: RateLimitRequestHandler;
let authLimiter: RateLimitRequestHandler;
let passwordResetLimiter: RateLimitRequestHandler;
let emailVerificationLimiter: RateLimitRequestHandler;

/**
 * Initialize all rate limiters
 * This should be called during application startup
 */
export async function initializeRateLimiters(): Promise<void> {
  try {
    logger.info('Initializing rate limiters...');

    // Create general API rate limiter
    apiLimiter = await createRateLimiter();

    // Create strict rate limiters for sensitive endpoints
    authLimiter = await createStrictRateLimiter();
    passwordResetLimiter = await createStrictRateLimiter();
    emailVerificationLimiter = await createStrictRateLimiter();

    logger.info('Rate limiters initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize rate limiters:', error);
    throw error;
  }
}

/**
 * Get the API rate limiter
 * Note: This will throw if called before initialization
 */
export function getApiLimiter(): RateLimitRequestHandler {
  if (!apiLimiter) {
    throw new Error('Rate limiters not initialized. Call initializeRateLimiters() first.');
  }
  return apiLimiter;
}

/**
 * Get the auth rate limiter
 */
export function getAuthLimiter(): RateLimitRequestHandler {
  if (!authLimiter) {
    throw new Error('Rate limiters not initialized. Call initializeRateLimiters() first.');
  }
  return authLimiter;
}

/**
 * Get the password reset rate limiter
 */
export function getPasswordResetLimiter(): RateLimitRequestHandler {
  if (!passwordResetLimiter) {
    throw new Error('Rate limiters not initialized. Call initializeRateLimiters() first.');
  }
  return passwordResetLimiter;
}

/**
 * Get the email verification rate limiter
 */
export function getEmailVerificationLimiter(): RateLimitRequestHandler {
  if (!emailVerificationLimiter) {
    throw new Error('Rate limiters not initialized. Call initializeRateLimiters() first.');
  }
  return emailVerificationLimiter;
}

// Export for backward compatibility (will be set after initialization)
export { apiLimiter, authLimiter, passwordResetLimiter, emailVerificationLimiter };
