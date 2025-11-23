import { Request, Response } from 'express';
import { UserService } from '../../application/services/user.service';
import { asyncHandler } from '../middleware/error.middleware';
import { UpdateProfileDto, UpdatePreferencesDto } from '../../application/dtos/user.dto';
import { UserDtoMapper } from '../../application/mappers/userDto.mapper';

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  /**
   * Get user profile
   * GET /api/v1/users/profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result = await this.userService.getUserProfile(userId);

    res.status(200).json({
      status: 'success',
      data: UserDtoMapper.toProfileResponse(result.user as any, result.profile),
    });
  });

  /**
   * Update user profile
   * PUT /api/v1/users/profile
   */
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const data: UpdateProfileDto = req.body;

    const profile = await this.userService.updateProfile(userId, data);

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { profile },
    });
  });

  /**
   * Update user preferences
   * PUT /api/v1/users/preferences
   */
  updatePreferences = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const data: UpdatePreferencesDto = req.body;

    const preferences = await this.userService.updatePreferences(userId, data);

    res.status(200).json({
      status: 'success',
      message: 'Preferences updated successfully',
      data: { preferences },
    });
  });

  /**
   * Delete user account
   * DELETE /api/v1/users/account
   */
  deleteAccount = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    await this.userService.deleteAccount(userId);

    res.status(200).json({
      status: 'success',
      message: 'Account deleted successfully',
    });
  });
}
