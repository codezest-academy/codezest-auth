import request from 'supertest';
import app from '../../src/app';
import PrismaService from '../../src/infrastructure/database/prisma.service';

describe('Auth Integration', () => {
  const prismaService = PrismaService.getInstance();
  const prisma = prismaService.client;

  beforeAll(async () => {
    // Connect to database
    await prismaService.connect();
    // Clean up database
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prismaService.disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

      console.log('Response status:', res.status);
      console.log('Response body:', JSON.stringify(res.body, null, 2));
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.tokens).toBeDefined();
    });

    it('should fail with duplicate email', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
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
