import { UserProfile, Prisma } from '@prisma/client';

export interface IUserProfileRepository {
  findByUserId(userId: string): Promise<UserProfile | null>;
  create(data: Prisma.UserProfileCreateInput): Promise<UserProfile>;
  update(userId: string, data: Prisma.UserProfileUpdateInput): Promise<UserProfile>;
  delete(userId: string): Promise<void>;
}
