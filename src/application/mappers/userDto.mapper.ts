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
      name: user.name,
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
            bio: profile.bio,
            avatar: profile.avatar,
            location: profile.location,
            website: profile.website,
            occupation: profile.occupation,
            company: profile.company,
            phone: profile.phone,
            address: profile.address,
            socials: profile.socials,
          }
        : {
            bio: null,
            avatar: null,
            location: null,
            website: null,
            occupation: null,
            company: null,
            phone: null,
            address: null,
            socials: null,
          },
    };
  }
}
