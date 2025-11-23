import { User } from '../../domain/entities';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserProfileRepository } from '../../domain/repositories/userProfile.repository';
import { NotFoundError } from '../../domain/errors';
import { logger } from '../../config/logger';
import { UpdateProfileDto, UpdatePreferencesDto } from '../dtos/user.dto';
import cache from '../../infrastructure/cache/cache.service'; // Import the cache client

export class UserService {
  private userRepository: UserRepository;
  private userProfileRepository: UserProfileRepository;

  constructor(userRepository: UserRepository, userProfileRepository: UserProfileRepository) {
    this.userRepository = userRepository;
    this.userProfileRepository = userProfileRepository;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    logger.info('Fetching user', { userId });

    const cacheKey = `user:${userId}`;
    // 1. Try cache
    const cachedUser = await cache.get<User>(cacheKey);
    if (cachedUser) {
      logger.info('User found in cache', { userId });
      return cachedUser;
    }

    // 2. Fetch from DB
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 3. Set cache (TTL: 1 hour = 3600 seconds)
    await cache.set(cacheKey, user, 3600);
    logger.info('User fetched from DB and set in cache', { userId });

    return user;
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string) {
    logger.info('Fetching user profile', { userId });

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const profile = await this.userProfileRepository.findByUserId(userId);

    return {
      user,
      profile,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileDto) {
    logger.info('Updating user profile', { userId });

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update user name if provided
    if (data.name) {
      await this.userRepository.update(userId, { name: data.name });
    }

    // Check if profile exists
    let profile = await this.userProfileRepository.findByUserId(userId);

    if (!profile) {
      // Create profile if it doesn't exist
      profile = await this.userProfileRepository.create({
        user: { connect: { id: userId } },
        bio: data.bio,
        avatar: data.avatar,
        location: data.location,
        website: data.website,
        occupation: data.occupation,
        company: data.company,
        phone: data.phone,
        address: data.address,
        socials: data.socials,
      } as any);
    } else {
      // Update existing profile
      profile = await this.userProfileRepository.update(userId, {
        bio: data.bio,
        avatar: data.avatar,
        location: data.location,
        website: data.website,
        occupation: data.occupation,
        company: data.company,
        phone: data.phone,
        address: data.address,
        socials: data.socials,
      } as any);
    }

    logger.info('User profile updated successfully', { userId });

    return profile;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, data: UpdatePreferencesDto) {
    logger.info('Updating user preferences', { userId });

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get or create profile
    let profile = await this.userProfileRepository.findByUserId(userId);

    if (!profile) {
      profile = await this.userProfileRepository.create({
        user: { connect: { id: userId } },
        preferences: data as any,
      });
    } else {
      // Merge preferences
      const currentPreferences = (profile.preferences as any) || {};
      const updatedPreferences = {
        ...currentPreferences,
        ...data,
      };

      profile = await this.userProfileRepository.update(userId, {
        preferences: updatedPreferences,
      });
    }

    logger.info('User preferences updated successfully', { userId });

    return profile.preferences;
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string): Promise<void> {
    logger.info('Deleting user account', { userId });

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Delete profile if exists
    const profile = await this.userProfileRepository.findByUserId(userId);
    if (profile) {
      await this.userProfileRepository.delete(userId);
    }

    // Delete user
    await this.userRepository.delete(userId);

    logger.info('User account deleted successfully', { userId });
  }
}
