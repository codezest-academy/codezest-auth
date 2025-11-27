import { injectable } from 'inversify';
import { TokenUtil } from '../../common/utils/token.util';
import cache from '../../infrastructure/cache/cache.service';
import { logger } from '../../config/logger';

@injectable()
export class CsrfService {
  private readonly CSRF_TTL = 24 * 60 * 60; // 24 hours in seconds

  /**
   * Generate a new CSRF token and store it in cache
   */
  async generateToken(): Promise<string> {
    const token = TokenUtil.generateRandomToken();

    // Store token in Redis with TTL
    await cache.set(`csrf:${token}`, JSON.stringify({ createdAt: Date.now() }), this.CSRF_TTL);

    return token;
  }

  /**
   * Validate a CSRF token
   */
  async validateToken(token: string): Promise<boolean> {
    if (!token) return false;

    const exists = await cache.get(`csrf:${token}`);

    if (!exists) {
      logger.warn('Invalid or expired CSRF token attempted');
      return false;
    }

    return true;
  }

  /**
   * Revoke a CSRF token (optional, e.g. on logout)
   */
  async revokeToken(token: string): Promise<void> {
    if (token) {
      await cache.del(`csrf:${token}`);
    }
  }
}
