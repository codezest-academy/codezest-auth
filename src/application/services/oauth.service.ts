import { User } from '../../domain/entities';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IOAuthRepository } from '../../domain/repositories/oauth.repository.interface';
import { ISessionRepository } from '../../domain/repositories/session.repository.interface';
import { TokenUtil } from '../../common/utils/token.util';
import { logger } from '../../config/logger';
import { IOAuthStrategy, GoogleOAuthStrategy, GitHubOAuthStrategy } from './oauth/oauth.strategy';
import { AuthTokens } from './auth.service';
import { UserRole } from '@prisma/client'; // Import UserRole

export class OAuthService {
  private userRepository: IUserRepository;
  private oauthRepository: IOAuthRepository;
  private sessionRepository: ISessionRepository;
  private strategies: Map<string, IOAuthStrategy>;

  constructor(
    userRepository: IUserRepository,
    oauthRepository: IOAuthRepository,
    sessionRepository: ISessionRepository
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
   * Get authorization URL for OAuth provider
   */
  getAuthorizationUrl(provider: string): string {
    const strategy = this.strategies.get(provider.toLowerCase());
    if (!strategy) {
      throw new Error(`OAuth provider ${provider} not supported`);
    }

    // Generate state for CSRF protection
    const state = TokenUtil.generateRandomToken();

    return strategy.getAuthorizationUrl(state);
  }

  /**
   * Handle OAuth callback and authenticate user
   */
  async handleCallback(
    provider: string,
    code: string
  ): Promise<{ user: User; tokens: AuthTokens; isNewUser: boolean }> {
    logger.info('Handling OAuth callback', { provider });

    const strategy = this.strategies.get(provider.toLowerCase());
    if (!strategy) {
      throw new Error(`OAuth provider ${provider} not supported`);
    }

    // Authenticate with provider
    const oauthUser = await strategy.authenticate(code);

    // Check if OAuth account exists
    const oauthAccount = await this.oauthRepository.findByProvider(
      provider.toUpperCase(),
      oauthUser.providerId
    );

    let user: User;
    let isNewUser = false;

    if (oauthAccount) {
      // Existing OAuth account - get user
      const existingUser = await this.userRepository.findById(oauthAccount.userId);
      if (!existingUser) {
        throw new Error('User associated with OAuth account not found');
      }
      user = existingUser;
      logger.info('Existing OAuth user logged in', { userId: user.id, provider });
    } else {
      // New OAuth account - check if user exists by email
      const existingUser = await this.userRepository.findByEmail(oauthUser.email);

      if (existingUser) {
        // Link OAuth account to existing user
        user = existingUser;
        logger.info('Linking OAuth account to existing user', { userId: user.id, provider });
      } else {
        // Create new user
        user = await this.userRepository.create({
          email: oauthUser.email,
          name: oauthUser.name,
          password: '', // No password for OAuth users
          role: UserRole.USER,
          // emailVerified: true, // OAuth emails are pre-verified
        });
        isNewUser = true;
        logger.info('New user created via OAuth', { userId: user.id, provider });
      }

      // Create OAuth account link
      await this.oauthRepository.create({
        user: { connect: { id: user.id } },
        provider: provider.toUpperCase(),
        providerId: oauthUser.providerId,
        accessToken: oauthUser.accessToken,
        refreshToken: oauthUser.refreshToken,
      });

      logger.info('OAuth account linked', { userId: user.id, provider });
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Create session
    await this.createSession(user.id, tokens.refreshToken);

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
  private async createSession(userId: string, refreshToken: string): Promise<void> {
    await this.sessionRepository.create({
      user: { connect: { id: userId } },
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
  }
}
