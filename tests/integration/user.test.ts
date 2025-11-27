import request from 'supertest';
import app from '../../src/app';
import PrismaService from '../../src/infrastructure/database/prisma.service';
import { TokenUtil } from '../../src/common/utils/token.util';
import { UserRole } from '@prisma/client'; // Import UserRole directly
import cache from '../../src/infrastructure/cache/cache.service'; // Import the cache client

// Mock the cache client locally for this integration test
jest.mock('../../src/infrastructure/cache/cache.service', () => ({
  __esModule: true, // This is important for default exports
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delPattern: jest.fn(),
    clear: jest.fn(),
    disconnect: jest.fn(),
  },
}));

describe('User Integration', () => {
  const prismaService = PrismaService.getInstance();
  const prisma = prismaService.client;
  let authToken: string;
  let userId: string;
  let mockCache: jest.Mocked<typeof cache>;

  beforeAll(async () => {
    // Connect to database
    await prismaService.connect();
    // Clean up database
    await prisma.user.deleteMany();

    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER, // Use UserRole directly
      },
    });
    userId = user.id;

    // Generate token
    authToken = TokenUtil.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  });

  beforeEach(() => {
    mockCache = cache as jest.Mocked<typeof cache>;
    mockCache.get.mockReset();
    mockCache.set.mockReset();
  });

  afterAll(async () => {
    await prismaService.disconnect();
  });

  describe('GET /api/v1/users/profile', () => {
    it('should return user profile', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('user@example.com');
    });

    it('should fail without token', async () => {
      const res = await request(app).get('/api/v1/users/profile');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    it('should update user profile', async () => {
      const res = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: 'Updated bio',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.profile.bio).toBe('Updated bio');
    });
  });
});
