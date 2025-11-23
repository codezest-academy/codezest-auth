import nodemailer from 'nodemailer';
import { config } from '../../config';
import { logger } from '../../config/logger';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: {
        user: config.email.smtp.auth.user,
        pass: config.email.smtp.auth.pass,
      },
    });
  }

  /**
   * Send email verification link
   */
  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verificationUrl = `${config.frontend.url}/verify-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: `"${config.email.fromName}" <${config.email.from}>`,
        to,
        subject: 'Verify your email address',
        html: `
          <h1>Welcome to CodeZest Academy!</h1>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p>Or copy and paste this link in your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
        `,
      });
      logger.info('Verification email sent', { to });
    } catch (error) {
      logger.error('Failed to send verification email', { to, error });
      // Don't throw error to avoid blocking registration
    }
  }

  /**
   * Send password reset link
   */
  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${config.frontend.url}/reset-password?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: `"${config.email.fromName}" <${config.email.from}>`,
        to,
        subject: 'Reset your password',
        html: `
          <h1>Password Reset Request</h1>
          <p>You requested to reset your password. Click the link below to proceed:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>Or copy and paste this link in your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });
      logger.info('Password reset email sent', { to });
    } catch (error) {
      logger.error('Failed to send password reset email', { to, error });
      throw new Error('Failed to send password reset email');
    }
  }
}
