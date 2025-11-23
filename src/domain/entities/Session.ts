/**
 * Session Domain Entity
 * Represents a user session with expiration logic
 */
export class Session {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly token: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date
  ) {}

  /**
   * Check if session is expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if session is valid
   */
  isValid(): boolean {
    return !this.isExpired();
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
   * Check if session expires soon (within 1 hour)
   */
  expiresSoon(): boolean {
    const oneHour = 60 * 60 * 1000;
    return this.getRemainingTime() < oneHour && this.getRemainingTime() > 0;
  }

  /**
   * Get session age in milliseconds
   */
  getAge(): number {
    const now = new Date().getTime();
    const created = this.createdAt.getTime();
    return now - created;
  }
}
