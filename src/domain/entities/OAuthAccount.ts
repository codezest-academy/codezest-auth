/**
 * OAuthAccount Domain Entity
 */
export class OAuthAccount {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly provider: string,
    public readonly providerId: string,
    public readonly accessToken: string | null,
    public readonly refreshToken: string | null,
    public readonly createdAt: Date
  ) {}
}
