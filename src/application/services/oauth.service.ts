import { User } from '../../domain/entities';
import { UserRepository } from '../../domain/repositories/user.repository';
import { OAuthRepository } from '../../domain/repositories/oauth.repository';
import { SessionRepository } from '../../domain/repositories/session.repository';
import { TokenUtil } from '../../common/utils/token.util';
import { logger } from '../../config/logger';
import { IOAuthStrategy, GoogleOAuthStrategy, GitHubOAuthStrategy } from './oauth/oauth.strategy';
import { AuthTokens } from './auth.service';
import { UserRole } from '@prisma/client';
import cache from '../../infrastructure/cache/cache.service';
import { UnauthorizedError, BadRequestError } from '../../domain/errors';
import { logSecurityEvent, SecurityEvent } from '../../common/utils/security-logger';

export class OAuthService {
  private userRepository: UserRepository;
  private oauthRepository: OAuthRepository;
  private sessionRepository: SessionRepository;
  private strategies: Map<string, IOAuthStrategy>;

  constructor(
    userRepository: UserRepository,
    oauthRepository: OAuthRepository,
    sessionRepository: SessionRepository
  ) {
    this.userRepository = userRepository;
    this.oauthRepository = oauthRepository;
    this.sessionRepository = sessionRepository;
    this.strategies = new Map();

    // Register OAuth strategies
    this.strategies.set('google', new GoogleOAuthStrategy());
    this.strategies.set('github', new GitHubOAuthStrategy());
  }

  /**
   * Get authorization URL for OAuth provider with CSRF protection
   */
  async getAuthorizationUrl(provider: string): Promise<string> {
    const strategy = this.strategies.get(provider.toLowerCase());
    if (!strategy) {
      throw new Error(`OAuth provider ${provider} not supported`);
    }

    // Generate state for CSRF protection
    const state = TokenUtil.generateRandomToken();

    // Store state in Redis with 10-minute TTL for validation
    await cache.set(
      `oauth:state:${state}`,
      JSON.stringify({ provider, timestamp: Date.now() }),
      600 // 10 minutes
    );

    logger.info('OAuth state generated and stored', { provider, state });

    return strategy.getAuthorizationUrl(state);
  }

  /**
   * Handle OAuth callback and authenticate user
   */
  async handleCallback(
    provider: string,
    code: string,
    state: string,
    ip?: string,
    userAgent?: string
  ): Promise<{ user: User; tokens: AuthTokens; isNewUser: boolean }> {
    logger.info('Handling OAuth callback', { provider });

    // Validate state to prevent CSRF attacks
    const storedState = await cache.get<string>(`oauth:state:${state}`);
    if (!storedState) {
      logger.error('Invalid or expired OAuth state', { provider, state });
      logSecurityEvent(SecurityEvent.OAUTH_LOGIN_FAILED, {
        provider,
        error: 'Invalid or expired OAuth state',
      });
      throw new UnauthorizedError('Invalid or expired OAuth state parameter');
    }

    const stateData = JSON.parse(storedState) as { provider: string; timestamp: number };
    if (stateData.provider !== provider) {
      logger.error('OAuth state provider mismatch', {
        expected: stateData.provider,
        actual: provider,
      });
      logSecurityEvent(SecurityEvent.OAUTH_LOGIN_FAILED, {
        provider,
        error: 'OAuth state provider mismatch',
      });
      throw new UnauthorizedError('OAuth state provider mismatch');
    }

    // Delete state to prevent reuse
    await cache.del(`oauth:state:${state}`);
    logger.info('OAuth state validated and deleted', { provider });

    const strategy = this.strategies.get(provider.toLowerCase());
    if (!strategy) {
      throw new Error(`OAuth provider ${provider} not supported`);
    }

    // Authenticate with provider
    const oauthUser = await strategy.authenticate(code);

    // Check if user exists
    let user = await this.userRepository.findByEmail(oauthUser.email);
    let isNewUser = false;

    if (user) {
      // User exists, check if linked
      const oauthAccounts = await this.oauthRepository.findByUserId(user.id);
      const isLinked = oauthAccounts.some((a) => a.provider === provider.toUpperCase());

      if (!isLinked) {
        // Require email verification before linking OAuth account
        if (!user.emailVerified) {
          logger.warn('Attempted OAuth link to unverified account', {
            email: oauthUser.email,
            provider,
          });
          throw new BadRequestError(
            'Please verify your email address before linking OAuth accounts. ' +
              'Check your inbox for the verification link.'
          );
        }

        // Link account
        await this.oauthRepository.create({
          user: { connect: { id: user.id } },
          provider: provider.toUpperCase(),
          providerId: oauthUser.providerId,
          accessToken: oauthUser.accessToken,
          refreshToken: oauthUser.refreshToken,
        });
        logger.info('Linking OAuth account to existing verified user', {
          userId: user.id,
          provider,
        });
      } else {
        logger.info('Existing OAuth user logged in', { userId: user.id, provider });
      }
    } else {
      // Create new user
      // Split name into firstName and lastName for OAuth users
      const nameParts = oauthUser.name.split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';

      user = await this.userRepository.create({
        email: oauthUser.email,
        firstName: firstName,
        lastName: lastName || firstName, // Use firstName if lastName is empty
        password: null, // No password for OAuth users
        role: UserRole.USER,
        // emailVerified: true, // OAuth emails are pre-verified
      });
      isNewUser = true;
      logger.info('New user created via OAuth', { userId: user.id, provider });

      // Link OAuth account
      await this.oauthRepository.create({
        user: { connect: { id: user.id } },
        provider: provider.toUpperCase(),
        providerId: oauthUser.providerId,
        accessToken: oauthUser.accessToken,
        refreshToken: oauthUser.refreshToken,
      });
      logger.info('OAuth account linked to new user', { userId: user.id, provider });
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Create session
    await this.createSession(user.id, tokens.refreshToken, ip, userAgent, provider);

    // Log security event
    logSecurityEvent(SecurityEvent.OAUTH_LOGIN_SUCCESS, {
      userId: user.id,
      email: user.email,
      provider,
      ip,
      userAgent,
    });

    return {
      user,
      tokens,
      isNewUser,
    };
  }

  /**
   * Unlink OAuth provider from user account
   */
  async unlinkProvider(userId: string, provider: string): Promise<void> {
    logger.info('Unlinking OAuth provider', { userId, provider });

    const oauthAccounts = await this.oauthRepository.findByUserId(userId);
    const account = oauthAccounts.find((a) => a.provider === provider.toUpperCase());

    if (!account) {
      throw new Error('OAuth account not found');
    }

    await this.oauthRepository.delete(account.id);

    logger.info('OAuth provider unlinked', { userId, provider });
  }

  /**
   * Get linked OAuth providers for user
   */
  async getLinkedProviders(userId: string): Promise<string[]> {
    const oauthAccounts = await this.oauthRepository.findByUserId(userId);
    return oauthAccounts.map((account) => account.provider.toLowerCase());
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
  private async createSession(
    userId: string,
    refreshToken: string,
    ip?: string,
    userAgent?: string,
    loginMethod: string = 'oauth'
  ): Promise<void> {
    const session = await this.sessionRepository.create({
      user: { connect: { id: userId } },
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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
}
