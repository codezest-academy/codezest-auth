/**
 * User Domain Entity
 * Represents a user in the system with business logic
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly userName: string | null,
    public readonly role: UserRole,
    public readonly emailVerified: boolean,
    public readonly isActive: boolean,
    public readonly isSuspended: boolean,
    public readonly suspendedAt: Date | null,
    public readonly suspendedReason: string | null,
    public readonly lastLoginAt: Date | null,
    public readonly lastLoginIp: string | null,
    public readonly loginAttempts: number,
    public readonly lockedUntil: Date | null,
    public readonly passwordChangedAt: Date | null,
    public readonly mustChangePassword: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    private password: string | null = null
  ) {}

  /**
   * Get full name
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Get display name (userName or full name)
   */
  getDisplayName(): string {
    return this.userName || this.getFullName();
  }

  /**
   * Get password hash
   */
  getPasswordHash(): string | null {
    return this.password;
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  /**
   * Check if user is a standard user
   */
  isUser(): boolean {
    return this.role === 'USER';
  }

  /**
   * Check if user is an admin
   */
  isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  /**
   * Check if email is verified
   */
  isEmailVerified(): boolean {
    return this.emailVerified;
  }

  /**
   * Check if account is active
   */
  isAccountActive(): boolean {
    return this.isActive && !this.isSuspended && !this.isAccountLocked();
  }

  /**
   * Check if account is locked
   */
  isAccountLocked(): boolean {
    if (!this.lockedUntil) return false;
    return this.lockedUntil > new Date();
  }

  /**
   * Check if user has valid email
   */
  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  /**
   * Check if user has valid password
   */
  isValidPassword(): boolean {
    if (!this.password) return false;
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(this.password);
  }
}

/**
 * User Role Enum
 */
export type UserRole = 'USER' | 'ADMIN';
