import { config } from '../../../config';

export interface OAuthUser {
  providerId: string;
  email: string;
  name: string;
  avatar?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface IOAuthStrategy {
  getAuthorizationUrl(state: string): string;
  authenticate(code: string): Promise<OAuthUser>;
}

/**
 * Google OAuth Strategy
 */
export class GoogleOAuthStrategy implements IOAuthStrategy {
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: config.oauth.google.clientId,
      redirect_uri: config.oauth.google.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async authenticate(code: string): Promise<OAuthUser> {
    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: config.oauth.google.clientId,
        client_secret: config.oauth.google.clientSecret,
        redirect_uri: config.oauth.google.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const { access_token } = (await tokenResponse.json()) as any;

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userData = (await userResponse.json()) as any;

    return {
      providerId: userData.id,
      email: userData.email,
      name: userData.name,
      avatar: userData.picture,
    };
  }
}

/**
 * GitHub OAuth Strategy
 */
export class GitHubOAuthStrategy implements IOAuthStrategy {
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: config.oauth.github.clientId,
      redirect_uri: config.oauth.github.redirectUri,
      scope: 'read:user user:email',
      state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async authenticate(code: string): Promise<OAuthUser> {
    // Exchange code for token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: config.oauth.github.clientId,
        client_secret: config.oauth.github.clientSecret,
        redirect_uri: config.oauth.github.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const { access_token } = (await tokenResponse.json()) as any;

    // Get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userData = (await userResponse.json()) as any;

    // Get user email (GitHub doesn't always include it in the user object)
    let email = userData.email;
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (emailResponse.ok) {
        const emails = (await emailResponse.json()) as any;
        const primaryEmail = emails.find((e: any) => e.primary);
        email = primaryEmail?.email || emails[0]?.email;
      }
    }

    return {
      providerId: userData.id.toString(),
      email,
      name: userData.name || userData.login,
      avatar: userData.avatar_url,
    };
  }
}
