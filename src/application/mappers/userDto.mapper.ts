import { User } from '../../domain/entities';
import { UserResponseDto, UserProfileResponseDto } from '../../application/dtos';

export class UserDtoMapper {
  /**
   * Convert User entity to UserResponseDto
   */
  static toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  /**
   * Convert User entity and profile data to UserProfileResponseDto
   */
  static toProfileResponse(user: User, profile: any): UserProfileResponseDto {
    return {
      user: this.toResponse(user),
      profile: profile
        ? {
            displayName: profile.displayName,
            bio: profile.bio,
            avatar: profile.avatar,
            coverImage: profile.coverImage,
            phone: profile.phone,
            location: profile.location,
            timezone: profile.timezone,
            website: profile.website,
            educationLevel: profile.educationLevel,
            fieldOfStudy: profile.fieldOfStudy,
            institution: profile.institution,
            graduationYear: profile.graduationYear,
            occupation: profile.occupation,
            company: profile.company,
            yearsOfExperience: profile.yearsOfExperience,
            skills: profile.skills,
            learningGoals: profile.learningGoals,
            interests: profile.interests,
            socials: profile.socials,
          }
        : {
            displayName: null,
            bio: null,
            avatar: null,
            coverImage: null,
            phone: null,
            location: null,
            timezone: null,
            website: null,
            educationLevel: null,
            fieldOfStudy: null,
            institution: null,
            graduationYear: null,
            occupation: null,
            company: null,
            yearsOfExperience: null,
            skills: null,
            learningGoals: null,
            interests: null,
            socials: null,
          },
    };
  }
}
