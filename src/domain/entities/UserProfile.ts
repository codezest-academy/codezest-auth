/**
 * User Profile Domain Entity
 * Matches Prisma UserProfile model
 */
export class UserProfile {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    // Basic Info
    public readonly displayName: string | null,
    public readonly bio: string | null,
    public readonly avatar: string | null,
    public readonly coverImage: string | null,
    public readonly phone: string | null,
    public readonly location: string | null,
    public readonly timezone: string | null,
    public readonly website: string | null,
    // Educational Background (Normalized)
    public readonly educationLevel: string | null,
    public readonly fieldOfStudy: string | null,
    public readonly institution: string | null,
    public readonly graduationYear: number | null,
    public readonly education: any | null, // JSON - Full education history
    // Professional Info (Normalized)
    public readonly occupation: string | null,
    public readonly company: string | null,
    public readonly yearsOfExperience: number | null,
    public readonly skills: any | null, // JSON array
    public readonly experience: any | null, // JSON - Full work history
    // Learning & Goals
    public readonly learningGoals: any | null, // JSON array
    public readonly interests: any | null, // JSON array
    public readonly achievements: any | null, // JSON array
    // Social
    public readonly socials: any | null, // JSON
    // Preferences
    public readonly preferences: any | null, // JSON
    // Timestamps
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
