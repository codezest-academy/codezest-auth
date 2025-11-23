import { Request, Response } from 'express';
import { OAuthService } from '../../application/services/oauth.service';
import { asyncHandler } from '../middleware/error.middleware';
import { config } from '../../config';
import { UserDtoMapper } from '../../application/mappers/userDto.mapper';

export class OAuthController {
  private oauthService: OAuthService;

  constructor(oauthService: OAuthService) {
    this.oauthService = oauthService;
  }

  /**
   * Get Google OAuth authorization URL
   * GET /api/v1/auth/oauth/google
   */
  getGoogleAuthUrl = asyncHandler(async (req: Request, res: Response) => {
    const authUrl = this.oauthService.getAuthorizationUrl('google');

    res.status(200).json({
      status: 'success',
      data: { authUrl },
    });
  });

  /**
   * Handle Google OAuth callback
   * GET /api/v1/auth/oauth/google/callback
   */
  handleGoogleCallback = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Authorization code is required',
      });
    }

    const result = await this.oauthService.handleCallback('google', code);

    // Redirect to frontend with tokens
    const redirectUrl = new URL(config.frontend.url);
    redirectUrl.searchParams.set('accessToken', result.tokens.accessToken);
    redirectUrl.searchParams.set('refreshToken', result.tokens.refreshToken);
    redirectUrl.searchParams.set('isNewUser', result.isNewUser.toString());

    res.redirect(redirectUrl.toString());
  });

  /**
   * Get GitHub OAuth authorization URL
   * GET /api/v1/auth/oauth/github
   */
  getGitHubAuthUrl = asyncHandler(async (req: Request, res: Response) => {
    const authUrl = this.oauthService.getAuthorizationUrl('github');

    res.status(200).json({
      status: 'success',
      data: { authUrl },
    });
  });

  /**
   * Handle GitHub OAuth callback
   * GET /api/v1/auth/oauth/github/callback
   */
  handleGitHubCallback = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Authorization code is required',
      });
    }

    const result = await this.oauthService.handleCallback('github', code);

    // Redirect to frontend with tokens
    const redirectUrl = new URL(config.frontend.url);
    redirectUrl.searchParams.set('accessToken', result.tokens.accessToken);
    redirectUrl.searchParams.set('refreshToken', result.tokens.refreshToken);
    redirectUrl.searchParams.set('isNewUser', result.isNewUser.toString());

    res.redirect(redirectUrl.toString());
  });

  /**
   * Get linked OAuth providers
   * GET /api/v1/auth/oauth/linked
   */
  getLinkedProviders = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const providers = await this.oauthService.getLinkedProviders(userId);

    res.status(200).json({
      status: 'success',
      data: { providers },
    });
  });

  /**
   * Unlink OAuth provider
   * DELETE /api/v1/auth/oauth/:provider
   */
  unlinkProvider = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { provider } = req.params;

    await this.oauthService.unlinkProvider(userId, provider);

    res.status(200).json({
      status: 'success',
      message: `${provider} account unlinked successfully`,
    });
  });
}
