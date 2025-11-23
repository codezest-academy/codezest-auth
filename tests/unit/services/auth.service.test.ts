import { AuthService } from '../../../src/application/services/auth.service';
import { SessionRepository } from '../../../src/infrastructure/repositories/session.repository';
import { UserRepository } from '../../../src/infrastructure/repositories/user.repository';
import { EmailVerificationRepository } from '../../../src/infrastructure/repositories/emailVerification.repository';
import { PasswordResetRepository } from '../../../src/infrastructure/repositories/passwordReset.repository';
import { TokenUtil } from '../../../src/common/utils/token.util';
import { BadRequestError, UnauthorizedError, ConflictError } from '../../../src/domain/errors';
import { User } from '../../../src/domain/entities';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('../../../src/infrastructure/repositories/user.repository');
jest.mock('../../../src/infrastructure/repositories/session.repository');
jest.mock('../../../src/infrastructure/repositories/emailVerification.repository');
jest.mock('../../../src/infrastructure/repositories/passwordReset.repository');
jest.mock('../../../src/common/utils/token.util');
jest.mock('bcryptjs');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockSessionRepository: jest.Mocked<SessionRepository>;
  let mockEmailVerificationRepository: jest.Mocked<EmailVerificationRepository>;
  let mockPasswordResetRepository: jest.Mocked<PasswordResetRepository>;

  beforeEach(() => {
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    mockSessionRepository = new SessionRepository() as jest.Mocked<SessionRepository>;
    mockEmailVerificationRepository =
      new EmailVerificationRepository() as jest.Mocked<EmailVerificationRepository>;
    mockPasswordResetRepository =
      new PasswordResetRepository() as jest.Mocked<PasswordResetRepository>;
    authService = new AuthService(
      mockUserRepository,
      mockSessionRepository,
      mockEmailVerificationRepository,
      mockPasswordResetRepository
    );
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
    };

    it('should register a new user successfully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const mockUser = new User(
        'user-id',
        registerDto.email,
        registerDto.name,
        'USER',
        false,
        new Date(),
        new Date(),
        'hashedPassword'
      );

      mockUserRepository.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (TokenUtil.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (TokenUtil.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      mockEmailVerificationRepository.create.mockResolvedValue({} as any);
      mockSessionRepository.create.mockResolvedValue({} as any);

      const result = await authService.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictError if email already exists', async () => {
      const mockUser = new User(
        'existing-id',
        registerDto.email,
        'Existing User',
        'USER',
        true,
        new Date(),
        new Date(),
        'hashedPassword'
      );
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.register(registerDto)).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login successfully with valid credentials', async () => {
      const mockUser = new User(
        'user-id',
        loginDto.email,
        'Test User',
        'USER',
        true,
        new Date(),
        new Date(),
        'hashedPassword'
      );

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (TokenUtil.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (TokenUtil.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      mockSessionRepository.create.mockResolvedValue({} as any);

      const result = await authService.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
    });

    it('should throw UnauthorizedError with invalid credentials', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedError);
    });
  });
});
