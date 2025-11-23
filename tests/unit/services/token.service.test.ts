import { TokenUtil } from '../../../src/common/utils/token.util';
import jwt from 'jsonwebtoken';
import { config } from '../../../src/config';

describe('TokenUtil', () => {
  const mockPayload = {
    userId: '123',
    email: 'test@example.com',
    role: 'STUDENT',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const token = TokenUtil.generateAccessToken(mockPayload);
      expect(token).toBeDefined();

      const decoded = jwt.verify(token, config.jwt.secret) as any;
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.iss).toBe('codezest-auth');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      const token = TokenUtil.generateRefreshToken(mockPayload);
      expect(token).toBeDefined();

      const decoded = jwt.verify(token, config.jwt.refreshSecret) as any;
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.iss).toBe('codezest-auth');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = TokenUtil.generateAccessToken(mockPayload);
      const decoded = TokenUtil.verifyAccessToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        TokenUtil.verifyAccessToken('invalid-token');
      }).toThrow();
    });
  });
});
