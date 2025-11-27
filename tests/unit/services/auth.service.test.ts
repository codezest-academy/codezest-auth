import { AuthService } from '../../../src/application/services/auth.service';
import { PrismaSessionRepository } from '../../../src/infrastructure/repositories/session.repository';
import { PrismaUserRepository } from '../../../src/infrastructure/repositories/user.repository';
import { PrismaEmailVerificationRepository } from '../../../src/infrastructure/repositories/emailVerification.repository';
import { PrismaPasswordResetRepository } from '../../../src/infrastructure/repositories/passwordReset.repository';
import { TokenUtil } from '../../../src/common/utils/token.util';
import { BadRequestError, UnauthorizedError, ConflictError } from '../../../src/domain/errors';
import { User } from '../../../src/domain/entities';
import bcrypt from 'bcryptjs';
import { EmailService } from '../../../src/application/services/email.service'; // Import EmailService

// Mock dependencies
jest.mock('../../../src/infrastructure/repositories/user.repository');
jest.mock('../../../src/infrastructure/repositories/session.repository');
jest.mock('../../../src/infrastructure/repositories/emailVerification.repository');
jest.mock('../../../src/infrastructure/repositories/passwordReset.repository');
jest.mock('../../../src/common/utils/token.util');
jest.mock('bcryptjs');
jest.mock('../../../src/application/services/email.service'); // Mock EmailService

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<PrismaUserRepository>;
  let mockSessionRepository: jest.Mocked<PrismaSessionRepository>;
  let mockEmailVerificationRepository: jest.Mocked<PrismaEmailVerificationRepository>;
  let mockPasswordResetRepository: jest.Mocked<PrismaPasswordResetRepository>;
  let mockEmailService: jest.Mocked<EmailService>; // Declare mockEmailService

  beforeEach(() => {
    mockUserRepository = new PrismaUserRepository() as jest.Mocked<PrismaUserRepository>;
    mockSessionRepository = new PrismaSessionRepository() as jest.Mocked<PrismaSessionRepository>;
    mockEmailVerificationRepository =
      new PrismaEmailVerificationRepository() as jest.Mocked<PrismaEmailVerificationRepository>;
    mockPasswordResetRepository =
      new PrismaPasswordResetRepository() as jest.Mocked<PrismaPasswordResetRepository>;
    mockEmailService = new EmailService() as jest.Mocked<EmailService>; // Instantiate mockEmailService

    authService = new AuthService(
      mockUserRepository,
      mockSessionRepository,
      mockEmailVerificationRepository,
      mockPasswordResetRepository,
      mockEmailService // Pass mockEmailService to the constructor
    );
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should register a new user successfully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const mockUser = new User(
        'user-id',
        registerDto.email,
        registerDto.firstName,
        registerDto.lastName,
        null,
        'USER',
        false,
        true,
        false,
        null,
        null,
        null,
        null,
        0,
        null,
        null,
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
        'Existing',
        'User',
        null,
        'USER',
        true,
        true,
        false,
        null,
        null,
        null,
        null,
        0,
        null,
        null,
        false,
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
        'Test',
        'User',
        null,
        'USER',
        true,
        true,
        false,
        null,
        null,
        null,
        null,
        0,
        null,
        null,
        false,
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
