/**
 * Email Verification Domain Entity
 * Matches Prisma EmailVerification model
 */
export class EmailVerification {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly token: string,
    public readonly verified: boolean,
    public readonly verifiedAt: Date | null,
    public readonly createdAt: Date
  ) {}

  /**
   * Check if email is verified
   */
  isVerified(): boolean {
    return this.verified;
  }

  /**
   * Check if verification is pending
   */
  isPending(): boolean {
    return !this.verified;
  }
}

/**
 * Password Reset Domain Entity
 * Matches Prisma PasswordReset model
 */
export class PasswordReset {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly token: string,
    public readonly expiresAt: Date,
    public readonly used: boolean,
    public readonly usedAt: Date | null,
    public readonly createdAt: Date
  ) {}

  /**
   * Check if token is expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if token has been used
   */
  isUsed(): boolean {
    return this.used;
  }

  /**
   * Check if token is valid (not expired and not used)
   */
  isValid(): boolean {
    return !this.isExpired() && !this.isUsed();
  }

  /**
   * Get remaining time in milliseconds
   */
  getRemainingTime(): number {
    const now = new Date().getTime();
    const expiry = this.expiresAt.getTime();
    return Math.max(0, expiry - now);
  }

  /**
   * Check if token was created recently (within 5 minutes)
   * Useful for rate limiting
   */
  isRecentlyCreated(): boolean {
    const fiveMinutes = 5 * 60 * 1000;
    const now = new Date().getTime();
    const created = this.createdAt.getTime();
    return now - created < fiveMinutes;
  }
}
