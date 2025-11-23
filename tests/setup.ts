// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

// Mock the config module to prevent environment variable errors during tests
jest.mock('../src/config', () => ({
  config: {
    env: 'test',
    port: 3001,
    apiVersion: 'v1',
    database: {
      url: 'postgresql://user:password@localhost:5432/testdb?schema=public',
    },
    jwt: {
      secret: 'test-secret',
      refreshSecret: 'test-refresh-secret',
      expiresIn: '15m',
      refreshExpiresIn: '7d',
    },
    oauth: {
      google: {
        clientId: 'test-google-client-id',
        clientSecret: 'test-google-client-secret',
        redirectUri: 'http://localhost:3001/api/v1/auth/oauth/google/callback',
      },
      github: {
        clientId: 'test-github-client-id',
        clientSecret: 'test-github-client-secret',
        redirectUri: 'http://localhost:3001/api/v1/auth/oauth/github/callback',
      },
    },
    email: {
      smtp: {
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@test.com',
          pass: 'test-pass',
        },
      },
      from: 'noreply@test.com',
      fromName: 'Test Academy',
    },
    frontend: {
      url: 'http://localhost:3000',
    },
    security: {
      allowedOrigins: ['http://localhost:3000'],
      rateLimitWindowMs: 900000,
      rateLimitMaxRequests: 100,
    },
    logging: {
      level: 'info',
    },
    redis: { // Add Redis config for tests
      host: 'localhost',
      port: 6379,
      password: '',
    },
  },
}));

// Mock the cache module
jest.mock('@codezest-academy/codezest-cache', () => ({
  createCacheClient: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delPattern: jest.fn(),
    clear: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

// Mock EmailService
jest.mock('../src/application/services/email.service', () => {
  return {
    EmailService: jest.fn().mockImplementation(() => {
      return {
        sendVerificationEmail: jest.fn(),
        sendPasswordResetEmail: jest.fn(),
      };
    }),
  };
});

// Mock logger to silence output during tests
jest.mock('../src/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    http: jest.fn(),
  },
}));

// Global test setup
beforeAll(async () => {
  // Setup code
});

afterAll(async () => {
  // Cleanup code
});
