/**
 * User Profile Domain Entity
 * Matches Prisma UserProfile model
 */
export class UserProfile {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly bio: string | null,
    public readonly avatar: string | null,
    public readonly location: string | null,
    public readonly website: string | null,
    public readonly occupation: string | null,
    public readonly company: string | null,
    public readonly phone: string | null,
    public readonly address: string | null,
    public readonly socials: any | null, // Using any for JSON type flexibility
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
