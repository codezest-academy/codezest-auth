import request from 'supertest';
import app from '../../src/app';
import PrismaService from '../../src/infrastructure/database/prisma.service';
import cache from '../../src/infrastructure/cache/cache.service'; // Import the cache client
import { EmailService } from '../../src/application/services/email.service'; // Import EmailService

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

// Mock EmailService locally for this integration test
jest.mock('../../src/application/services/email.service', () => {
  return {
    EmailService: jest.fn().mockImplementation(() => {
      return {
        sendVerificationEmail: jest.fn(),
        sendPasswordResetEmail: jest.fn(),
      };
    }),
  };
});

describe('Auth Integration', () => {
  const prismaService = PrismaService.getInstance();
  const prisma = prismaService.client;
  let mockCache: jest.Mocked<typeof cache>;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeAll(async () => {
    // Connect to database
    await prismaService.connect();
    // Clean up database - delete sessions first due to foreign key constraints
    await prisma.session.deleteMany();
    await prisma.emailVerification.deleteMany();
    await prisma.passwordReset.deleteMany();
    await prisma.user.deleteMany();
  });

  beforeEach(async () => {
    // Clean up sessions between tests to prevent token collisions
    await prisma.session.deleteMany();

    mockCache = cache as jest.Mocked<typeof cache>;
    mockCache.get.mockReset();
    mockCache.set.mockReset();
    mockEmailService = new EmailService() as jest.Mocked<EmailService>;
    mockEmailService.sendVerificationEmail.mockReset();
    mockEmailService.sendPasswordResetEmail.mockReset();
  });

  afterAll(async () => {
    await prismaService.disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.tokens).toBeDefined();
    });

    it('should fail with duplicate email', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.tokens).toBeDefined();
    });

    it('should fail with invalid credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'test@example.com',
        password: 'WrongPassword123!',
      });

      expect(res.status).toBe(401);
    });
  });
});
