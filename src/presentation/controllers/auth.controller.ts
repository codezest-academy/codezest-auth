import { Request, Response } from 'express';
import { AuthService } from '../../application/services/auth.service';
import { UserService } from '../../application/services/user.service';
import { CsrfService } from '../../application/services/csrf.service';
import { asyncHandler } from '../middleware/error.middleware';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ChangePasswordDto,
} from '../../application/dtos/auth.dto';
import { UserDtoMapper } from '../../application/mappers/userDto.mapper';

export class AuthController {
  private authService: AuthService;
  private userService: UserService;
  private csrfService: CsrfService;

  constructor(authService: AuthService, userService: UserService, csrfService: CsrfService) {
    this.authService = authService;
    this.userService = userService;
    this.csrfService = csrfService;
  }

  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const data: RegisterDto = req.body;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.register(data, ip, userAgent);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: UserDtoMapper.toResponse(result.user as any), // Casting as any because result.user is currently Omit<User, 'password'> but Mapper expects User. We might need to adjust mapper or service return type.
        tokens: result.tokens,
      },
    });
  });

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const data: LoginDto = req.body;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.login(data, ip, userAgent);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: UserDtoMapper.toResponse(result.user as any),
        tokens: result.tokens,
      },
    });
  });

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken }: RefreshTokenDto = req.body;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    const tokens = await this.authService.refreshToken(refreshToken, ip, userAgent);

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: { tokens },
    });
  });

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken }: RefreshTokenDto = req.body;

    await this.authService.logout(refreshToken);

    res.status(200).json({
      status: 'success',
      message: 'Logout successful',
    });
  });

  /**
   * Verify email
   * POST /api/v1/auth/verify-email
   */
  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const data: VerifyEmailDto = req.body;

    await this.authService.verifyEmail(data);

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    });
  });

  /**
   * Request password reset
   * POST /api/v1/auth/forgot-password
   */
  requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const data: RequestPasswordResetDto = req.body;

    await this.authService.requestPasswordReset(data);

    res.status(200).json({
      status: 'success',
      message: 'Password reset email sent',
    });
  });

  /**
   * Reset password
   * POST /api/v1/auth/reset-password
   */
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const data: ResetPasswordDto = req.body;

    await this.authService.resetPassword(data);

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful',
    });
  });

  /**
   * Change password (authenticated)
   * POST /api/v1/auth/change-password
   */
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const data: ChangePasswordDto = req.body;

    await this.authService.changePassword(userId, data);

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
    });
  });

  /**
   * Get current user
   * GET /api/v1/auth/me
   */
  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const user = await this.userService.getUserById(userId);

    res.status(200).json({
      status: 'success',
      data: { user: UserDtoMapper.toResponse(user as any) },
    });
  });

  /**
   * Get CSRF token
   * GET /api/v1/auth/csrf-token
   */
  getCsrfToken = asyncHandler(async (req: Request, res: Response) => {
    const token = await this.csrfService.generateToken();

    // Set token in header for client to read
    res.setHeader('X-CSRF-Token', token);

    res.status(200).json({
      status: 'success',
      data: { csrfToken: token },
    });
  });
}
