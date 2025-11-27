import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  familyId?: string;
  sessionId?: string;
}

export class TokenUtil {
  /**
   * Generate an access token (short-lived)
   */
  static generateAccessToken(payload: TokenPayload): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
      issuer: 'codezest-auth',
      audience: 'codezest-api',
    });
  }

  /**
   * Generate a refresh token (long-lived)
   */
  static generateRefreshToken(payload: object): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as any,
      issuer: 'codezest-auth',
      audience: 'codezest-api',
    });
  }

  /**
   * Verify an access token
   */
  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwt.secret, {
      issuer: 'codezest-auth',
      audience: 'codezest-api',
    }) as TokenPayload;
  }

  /**
   * Verify a refresh token
   */
  static verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwt.refreshSecret, {
      issuer: 'codezest-auth',
      audience: 'codezest-api',
    }) as TokenPayload;
  }

  /**
   * Generate a random token for email verification or password reset
   */
  static generateRandomToken(): string {
    return uuidv4();
  }

  /**
   * Decode a token without verification (for debugging)
   */
  static decode(token: string): unknown {
    return jwt.decode(token);
  }
}
