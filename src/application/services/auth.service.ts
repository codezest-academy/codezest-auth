import { User } from '../../domain/entities';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { ISessionRepository } from '../../domain/repositories/session.repository.interface';
import { IEmailVerificationRepository } from '../../domain/repositories/emailVerification.repository.interface';
import { IPasswordResetRepository } from '../../domain/repositories/passwordReset.repository.interface';
import { TokenUtil } from '../../common/utils/token.util';
import {
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../domain/errors';
import { logger } from '../../config/logger';
import bcrypt from 'bcryptjs';
import { EmailService } from './email.service';
import {
  RegisterDto,
  LoginDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ChangePasswordDto,
} from '../dtos/auth.dto';
import { UserRole } from '@prisma/client'; // Import UserRole directly

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export class AuthService {
  private userRepository: IUserRepository;
  private sessionRepository: ISessionRepository;
  private emailVerificationRepository: IEmailVerificationRepository;
  private passwordResetRepository: IPasswordResetRepository;
  private emailService: EmailService;

  constructor(
    userRepository: IUserRepository,
    sessionRepository: ISessionRepository,
    emailVerificationRepository: IEmailVerificationRepository,
    passwordResetRepository: IPasswordResetRepository
  ) {
    this.userRepository = userRepository;
    this.sessionRepository = sessionRepository;
    this.emailVerificationRepository = emailVerificationRepository;
    this.passwordResetRepository = passwordResetRepository;
    this.emailService = new EmailService();
  }

  /**
   * Register a new user
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
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
      name: data.name,
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
    const tokens = this.generateTokens(user);

    // Create session
    await this.createSession(user.id, tokens.refreshToken);

    return {
      user,
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    logger.info('Attempting to login user', { email: data.email });

    // Find user
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const passwordHash = user.getPasswordHash();
    if (!passwordHash) {
      // User might be created via OAuth and has no password
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(data.password, passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Create session
    await this.createSession(user.id, tokens.refreshToken);

    return {
      user,
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    logger.info('Attempting to refresh token');

    // Verify refresh token
    let payload;
    try {
      payload = TokenUtil.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if session exists
    const session = await this.sessionRepository.findByToken(refreshToken);
    if (!session) {
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

    // Generate new tokens
    const tokens = this.generateTokens(user);

    // Update session with new refresh token
    await this.sessionRepository.delete(session.id);
    await this.createSession(user.id, tokens.refreshToken);

    logger.info('Token refreshed successfully', { userId: user.id });

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

    // Invalidate all sessions
    // This would require a method in SessionRepository to delete all by userId
    // For now we skip this as it's not in the interface
    // await this.sessionRepository.deleteByUserId(reset.userId);

    logger.info('Password reset successfully', { userId: reset.userId });
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

    // Invalidate all sessions
    // This would require a method in SessionRepository to delete all by userId
    // For now we skip this as it's not in the interface
    // await this.sessionRepository.deleteByUserId(userId);

    logger.info('Password changed successfully', { userId });
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(user: User): AuthTokens {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: TokenUtil.generateAccessToken(payload),
      refreshToken: TokenUtil.generateRefreshToken(payload),
    };
  }

  /**
   * Create a session
   */
  private async createSession(userId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.sessionRepository.create({
      user: { connect: { id: userId } },
      token: refreshToken,
      expiresAt,
    });
  }
}
