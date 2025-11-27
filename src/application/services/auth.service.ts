import { User } from '../../domain/entities';
import { UserRepository } from '../../domain/repositories/user.repository';
import { SessionRepository } from '../../domain/repositories/session.repository';
import { EmailVerificationRepository } from '../../domain/repositories/emailVerification.repository';
import { PasswordResetRepository } from '../../domain/repositories/passwordReset.repository';
import { TokenUtil } from '../../common/utils/token.util';
import {
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../domain/errors';
import { logger } from '../../config/logger';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from './email.service';
import {
  RegisterDto,
  LoginDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ChangePasswordDto,
} from '../dtos/auth.dto';
import { UserRole } from '@prisma/client';
import cache from '../../infrastructure/cache/cache.service';
import { logSecurityEvent, SecurityEvent } from '../../common/utils/security-logger';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  familyId?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export class AuthService {
  private userRepository: UserRepository;
  private sessionRepository: SessionRepository;
  private emailVerificationRepository: EmailVerificationRepository;
  private passwordResetRepository: PasswordResetRepository;
  private emailService: EmailService;

  constructor(
    userRepository: UserRepository,
    sessionRepository: SessionRepository,
    emailVerificationRepository: EmailVerificationRepository,
    passwordResetRepository: PasswordResetRepository,
    emailService: EmailService // Add EmailService as a dependency
  ) {
    this.userRepository = userRepository;
    this.sessionRepository = sessionRepository;
    this.emailVerificationRepository = emailVerificationRepository;
    this.passwordResetRepository = passwordResetRepository;
    this.emailService = emailService; // Assign the injected EmailService
  }

  /**
   * Register a new user
   */
  async register(data: RegisterDto, ip?: string, userAgent?: string): Promise<AuthResponse> {
    logger.info('Attempting to register user', { email: data.email });

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      userName: data.userName,
      role: UserRole.USER, // Default role
    });

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    // Create email verification token
    const verificationToken = TokenUtil.generateRandomToken();
    await this.emailVerificationRepository.create({
      user: { connect: { id: user.id } },
      token: verificationToken,
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, verificationToken);
    logger.info('Email verification token created and email sent', { userId: user.id });

    // Generate tokens
    const sessionId = uuidv4();
    const tokens = this.generateTokens(user, sessionId);

    // Store token family state in Redis
    if (tokens.familyId) {
      await cache.set(
        `token_family:${tokens.familyId}`,
        JSON.stringify({
          currentToken: tokens.refreshToken,
          userId: user.id,
        }),
        7 * 24 * 60 * 60 // 7 days
      );
    }

    // Create session
    await this.createSession(user.id, tokens.refreshToken, ip, userAgent, sessionId);

    // Log security event
    logSecurityEvent(SecurityEvent.REGISTER_SUCCESS, {
      userId: user.id,
      email: user.email,
      ip,
      userAgent,
    });

    return {
      user,
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginDto, ip?: string, userAgent?: string): Promise<AuthResponse> {
    logger.info('Attempting to login user', { email: data.email });

    // Check for account lockout
    const lockoutKey = `login_attempts:${data.email}`;
    const lockoutState = await cache.get<{ attempts: number; lockedUntil?: number }>(lockoutKey);

    if (lockoutState && lockoutState.lockedUntil && lockoutState.lockedUntil > Date.now()) {
      const remainingMinutes = Math.ceil((lockoutState.lockedUntil - Date.now()) / 60000);
      throw new UnauthorizedError(
        `Account is locked due to too many failed attempts. Please try again in ${remainingMinutes} minutes.`
      );
    }

    // Find user
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      // Increment failed attempts (even for non-existent users to prevent enumeration, though we key by email)
      await this.handleFailedLogin(data.email, lockoutState);
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const passwordHash = user.getPasswordHash();
    if (!passwordHash) {
      // User might be created via OAuth and has no password
      await this.handleFailedLogin(data.email, lockoutState);
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(data.password, passwordHash);
    if (!isValidPassword) {
      await this.handleFailedLogin(data.email, lockoutState);
      throw new UnauthorizedError('Invalid email or password');
    }

    // Clear failed attempts on successful login
    if (lockoutState) {
      await cache.del(lockoutKey);
    }

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    // Generate tokens
    const sessionId = uuidv4();
    const tokens = this.generateTokens(user, sessionId);

    // Store token family state in Redis
    if (tokens.familyId) {
      await cache.set(
        `token_family:${tokens.familyId}`,
        JSON.stringify({
          currentToken: tokens.refreshToken,
          userId: user.id,
        }),
        7 * 24 * 60 * 60 // 7 days
      );
    }

    // Create session
    await this.createSession(user.id, tokens.refreshToken, ip, userAgent, sessionId);

    // Log security event
    logSecurityEvent(SecurityEvent.LOGIN_SUCCESS, {
      userId: user.id,
      email: user.email,
      ip,
      userAgent,
    });

    return {
      user,
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string, ip?: string, userAgent?: string): Promise<AuthTokens> {
    logger.info('Attempting to refresh token');

    // Verify refresh token
    let payload;
    try {
      payload = TokenUtil.verifyRefreshToken(refreshToken);
    } catch (error) {
      logSecurityEvent(SecurityEvent.TOKEN_REFRESH_FAILED, {
        ip,
        userAgent,
        error: 'Invalid or expired refresh token',
      });
      throw new UnauthorizedError('Invalid refresh token');
    }

    // REUSE DETECTION LOGIC
    if (payload.familyId) {
      const familyKey = `token_family:${payload.familyId}`;
      const familyState = await cache.get<{ currentToken: string }>(familyKey);

      if (familyState) {
        const { currentToken } = familyState;

        // If the token being used is NOT the current one, it's a reuse attempt!
        if (currentToken !== refreshToken) {
          logger.warn('Refresh token reuse detected! Invalidating family.', {
            userId: payload.userId,
            familyId: payload.familyId,
          });

          // Log security event
          logSecurityEvent(SecurityEvent.TOKEN_REUSE_DETECTED, {
            userId: payload.userId,
            familyId: payload.familyId,
            ip,
            userAgent,
          });

          // Invalidate the entire family
          await cache.del(familyKey);

          // Optionally: Invalidate all sessions for this user to be safe
          // await this.sessionRepository.deleteByUserId(payload.userId);

          throw new UnauthorizedError('Invalid refresh token (reuse detected)');
        }
      }
    }

    // Check if session exists
    const session = await this.sessionRepository.findByToken(refreshToken);
    if (!session) {
      // If session is missing but token was valid JWT, it might be reuse (session deleted)
      // or just expired/logged out.
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await this.sessionRepository.delete(session.id);
      throw new UnauthorizedError('Refresh token expired');
    }

    // Get user
    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Generate new tokens (keeping same familyId)
    const sessionId = uuidv4();
    const tokens = this.generateTokens(user, sessionId, payload.familyId);

    // Update token family state
    if (payload.familyId) {
      await cache.set(
        `token_family:${payload.familyId}`,
        JSON.stringify({
          currentToken: tokens.refreshToken,
          userId: user.id,
        }),
        7 * 24 * 60 * 60 // 7 days
      );
    }

    // Update session with new refresh token
    await this.sessionRepository.delete(session.id);
    await this.createSession(user.id, tokens.refreshToken, ip, userAgent, sessionId);

    logger.info('Token refreshed successfully', { userId: user.id });

    // Log security event
    logSecurityEvent(SecurityEvent.TOKEN_REFRESH_SUCCESS, {
      userId: user.id,
      ip,
      userAgent,
    });

    return tokens;
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<void> {
    logger.info('Attempting to logout user');

    const session = await this.sessionRepository.findByToken(refreshToken);
    if (session) {
      await this.sessionRepository.delete(session.id);
    }

    logger.info('User logged out successfully');
  }

  /**
   * Verify email
   */
  async verifyEmail(data: VerifyEmailDto): Promise<void> {
    logger.info('Attempting to verify email', { token: data.token });

    const verification = await this.emailVerificationRepository.findByToken(data.token);
    if (!verification) {
      throw new BadRequestError('Invalid verification token');
    }

    if (verification.verifiedAt) {
      throw new BadRequestError('Email already verified');
    }

    // Check if token is expired (24 hours)
    const expirationTime = new Date(verification.createdAt.getTime() + 24 * 60 * 60 * 1000);
    if (expirationTime < new Date()) {
      throw new BadRequestError('Verification token expired');
    }

    // Mark as verified
    await this.emailVerificationRepository.markAsVerified(verification.id);

    // Update user's emailVerified field
    await this.userRepository.update(verification.userId, { emailVerified: true });

    logger.info('Email verified successfully', { userId: verification.userId });

    // Log security event
    logSecurityEvent(SecurityEvent.EMAIL_VERIFIED, {
      userId: verification.userId,
    });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: RequestPasswordResetDto): Promise<void> {
    logger.info('Attempting to request password reset', { email: data.email });

    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      // Don't reveal if user exists
      logger.info('Password reset requested for non-existent user', { email: data.email });
      return;
    }

    // Create password reset token
    const resetToken = TokenUtil.generateRandomToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.passwordResetRepository.create({
      user: { connect: { id: user.id } },
      token: resetToken,
      expiresAt,
    });

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);
    logger.info('Password reset token created and email sent', { userId: user.id });

    // Log security event
    logSecurityEvent(SecurityEvent.PASSWORD_RESET_REQUESTED, {
      userId: user.id,
      email: user.email,
    });
  }

  /**
   * Reset password
   */
  async resetPassword(data: ResetPasswordDto): Promise<void> {
    logger.info('Attempting to reset password', { token: data.token });

    const reset = await this.passwordResetRepository.findByToken(data.token);
    if (!reset) {
      throw new BadRequestError('Invalid reset token');
    }

    if (reset.usedAt) {
      throw new BadRequestError('Reset token already used');
    }

    if (reset.expiresAt < new Date()) {
      throw new BadRequestError('Reset token expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    // Update user password
    await this.userRepository.update(reset.userId, {
      password: hashedPassword,
    });

    // Mark reset token as used
    await this.passwordResetRepository.markAsUsed(reset.id);

    // Invalidate all sessions for security
    await this.sessionRepository.deleteByUserId(reset.userId);

    logger.info('Password reset successfully and all sessions invalidated', {
      userId: reset.userId,
    });

    // Log security event
    logSecurityEvent(SecurityEvent.PASSWORD_RESET_SUCCESS, {
      userId: reset.userId,
    });
  }

  /**
   * Change password (for authenticated users)
   */
  async changePassword(userId: string, data: ChangePasswordDto): Promise<void> {
    logger.info('Attempting to change password', { userId });

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const passwordHash = user.getPasswordHash();
    if (!passwordHash) {
      throw new BadRequestError('User does not have a password set');
    }

    const isValidPassword = await bcrypt.compare(data.currentPassword, passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    // Update password
    await this.userRepository.update(userId, {
      password: hashedPassword,
    });

    // Invalidate all sessions for security
    await this.sessionRepository.deleteByUserId(userId);

    logger.info('Password changed successfully and all sessions invalidated', { userId });

    // Log security event
    logSecurityEvent(SecurityEvent.PASSWORD_CHANGED, {
      userId,
    });
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(user: User, sessionId: string, existingFamilyId?: string): AuthTokens {
    const familyId = existingFamilyId || TokenUtil.generateRandomToken();

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      familyId,
      sessionId,
    };

    return {
      accessToken: TokenUtil.generateAccessToken(payload),
      refreshToken: TokenUtil.generateRefreshToken(payload),
      familyId,
    };
  }

  /**
   * Create a session
   */
  private async createSession(
    userId: string,
    refreshToken: string,
    ip?: string,
    userAgent?: string,
    sessionId?: string,
    loginMethod: 'password' | 'google' | 'github' = 'password'
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = await this.sessionRepository.create({
      id: sessionId,
      user: { connect: { id: userId } },
      token: refreshToken,
      expiresAt,
    });

    // Store session metadata in Redis
    if (ip || userAgent) {
      await cache.set(
        `session_meta:${session.id}`,
        JSON.stringify({
          ip,
          userAgent,
          lastUsedAt: Date.now(),
          lastLoginAt: Date.now(),
          loginMethod,
        }),
        7 * 24 * 60 * 60 // 7 days
      );
    }
  }

  /**
   * Handle failed login attempts
   */
  private async handleFailedLogin(
    email: string,
    lockoutState: { attempts: number; lockedUntil?: number } | null
  ): Promise<void> {
    const lockoutKey = `login_attempts:${email}`;
    const attempts = (lockoutState?.attempts || 0) + 1;
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

    if (attempts >= MAX_ATTEMPTS) {
      // Lock account
      await cache.set(
        lockoutKey,
        JSON.stringify({
          attempts,
          lockedUntil: Date.now() + LOCKOUT_DURATION,
        }),
        LOCKOUT_DURATION / 1000 // TTL in seconds
      );

      // Log security event
      logSecurityEvent(SecurityEvent.ACCOUNT_LOCKED, {
        email,
        attempts,
      });

      throw new UnauthorizedError(
        `Account is locked due to too many failed attempts. Please try again in 30 minutes.`
      );
    } else {
      // Increment attempts
      await cache.set(
        lockoutKey,
        JSON.stringify({
          attempts,
        }),
        60 * 60 // 1 hour TTL for attempts counter
      );

      // Log security event
      logSecurityEvent(SecurityEvent.LOGIN_FAILED, {
        email,
        attempts,
      });
    }
  }
}
