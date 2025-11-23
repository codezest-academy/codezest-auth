import { config } from '../src/config';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

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
