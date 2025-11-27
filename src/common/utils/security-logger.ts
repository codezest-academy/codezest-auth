import { logger } from '../../config/logger';

/**
 * Security Event Types for Identity Provider
 */
export enum SecurityEvent {
  // Authentication Events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  REGISTER_SUCCESS = 'REGISTER_SUCCESS',

  // Account Security Events
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',

  // Token Events
  TOKEN_REFRESH_SUCCESS = 'TOKEN_REFRESH_SUCCESS',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  TOKEN_REUSE_DETECTED = 'TOKEN_REUSE_DETECTED',

  // Password Events
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',

  // OAuth Events
  OAUTH_LOGIN_SUCCESS = 'OAUTH_LOGIN_SUCCESS',
  OAUTH_LOGIN_FAILED = 'OAUTH_LOGIN_FAILED',

  // Session Events
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_REVOKED = 'SESSION_REVOKED',

  // Email Verification Events
  EMAIL_VERIFICATION_SENT = 'EMAIL_VERIFICATION_SENT',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
}

/**
 * Security Event Metadata
 */
export interface SecurityEventMetadata {
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  sessionId?: string;
  provider?: string; // For OAuth events
  error?: string;
  [key: string]: unknown;
}

/**
 * Log a security event with structured metadata
 */
export function logSecurityEvent(event: SecurityEvent, metadata: SecurityEventMetadata = {}): void {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  // Determine log level based on event type
  const isFailure = event.includes('FAILED') || event.includes('DETECTED');
  const isWarning = event.includes('LOCKED') || event.includes('RESET_REQUESTED');

  if (isFailure) {
    logger.warn('Security Event', logData);
  } else if (isWarning) {
    logger.warn('Security Event', logData);
  } else {
    logger.info('Security Event', logData);
  }
}
