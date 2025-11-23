/**
 * User Domain Entity
 * Represents a user in the system with business logic
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly role: UserRole,
    public readonly emailVerified: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    private password: string | null = null
  ) {}

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
