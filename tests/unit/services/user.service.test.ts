import { UserService } from '../../../src/application/services/user.service';
import { PrismaUserRepository } from '../../../src/infrastructure/repositories/user.repository';
import { PrismaUserProfileRepository } from '../../../src/infrastructure/repositories/userProfile.repository';
import { NotFoundError } from '../../../src/domain/errors';
import { User } from '../../../src/domain/entities';
import cache from '../../../src/infrastructure/cache/cache.service'; // Import the cache client

// Mock dependencies
jest.mock('../../../src/infrastructure/repositories/user.repository');
jest.mock('../../../src/infrastructure/repositories/userProfile.repository');
jest.mock('../../../src/infrastructure/cache/cache.service'); // Mock the cache client

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<PrismaUserRepository>;
  let mockUserProfileRepository: jest.Mocked<PrismaUserProfileRepository>;
  let mockCache: jest.Mocked<typeof cache>; // Declare mockCache

  beforeEach(() => {
    mockUserRepository = new PrismaUserRepository() as jest.Mocked<PrismaUserRepository>;
    mockUserProfileRepository = new PrismaUserProfileRepository() as jest.Mocked<PrismaUserProfileRepository>;
    mockCache = cache as jest.Mocked<typeof cache>; // Instantiate mockCache

    // Reset mocks before each test
    mockCache.get.mockReset();
    mockCache.set.mockReset();

    userService = new UserService(mockUserRepository, mockUserProfileRepository);
  });

  describe('getUserById', () => {
    it('should return user from cache if found', async () => {
      const mockUser = new User(
        'user-id',
        'test@example.com',
        'Test User',
        'USER',
        true,
        new Date(),
        new Date(),
        'hashedPassword'
      );
      mockCache.get.mockResolvedValue(mockUser); // Mock cache hit

      const result = await userService.getUserById('user-id');

      expect(result).toEqual(mockUser);
      expect(mockCache.get).toHaveBeenCalledWith('user:user-id');
      expect(mockUserRepository.findById).not.toHaveBeenCalled(); // Should not hit DB
    });

    it('should return user from DB and set cache if not found in cache', async () => {
      const mockUser = new User(
        'user-id',
        'test@example.com',
        'Test User',
        'USER',
        true,
        new Date(),
        new Date(),
        'hashedPassword'
      );
      mockCache.get.mockResolvedValue(null); // Mock cache miss
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById('user-id');

      expect(result).toEqual(mockUser);
      expect(mockCache.get).toHaveBeenCalledWith('user:user-id');
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-id');
      expect(mockCache.set).toHaveBeenCalledWith('user:user-id', mockUser, 3600); // Should set cache
    });

    it('should throw NotFoundError if user not found in DB', async () => {
      mockCache.get.mockResolvedValue(null); // Mock cache miss
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById('user-id')).rejects.toThrow(NotFoundError);
      expect(mockCache.get).toHaveBeenCalledWith('user:user-id');
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-id');
      expect(mockCache.set).not.toHaveBeenCalled(); // Should not set cache
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const userId = 'user-id';
      const profileData = { bio: 'New bio' };
      const mockProfile = { id: 'profile-id', userId, ...profileData };

      const mockUser = new User(
        userId,
        'test@example.com',
        'Test User',
        'USER',
        true,
        new Date(),
        new Date(),
        'hashedPassword'
      );

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserProfileRepository.findByUserId.mockResolvedValue(mockProfile as any);
      mockUserProfileRepository.update.mockResolvedValue(mockProfile as any);

      const result = await userService.updateProfile(userId, profileData);

      expect(result).toEqual(mockProfile);
      expect(mockUserProfileRepository.update).toHaveBeenCalledWith(userId, profileData);
    });
  });
});
