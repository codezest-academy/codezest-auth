import { UserProfile, Prisma } from '@prisma/client';
import PrismaService from '../database/prisma.service';

import { IUserProfileRepository } from '../../domain/repositories/userProfile.repository.interface';

export class UserProfileRepository implements IUserProfileRepository {
  private prisma = PrismaService.getInstance().client;
  async findByUserId(userId: string): Promise<UserProfile | null> {
    return this.prisma.userProfile.findUnique({
      where: { userId },
    });
  }

  async create(data: Prisma.UserProfileCreateInput): Promise<UserProfile> {
    return this.prisma.userProfile.create({
      data,
    });
  }

  async update(userId: string, data: Prisma.UserProfileUpdateInput): Promise<UserProfile> {
    return this.prisma.userProfile.update({
      where: { userId },
      data,
    });
  }

  async delete(userId: string): Promise<void> {
    await this.prisma.userProfile.delete({
      where: { userId },
    });
  }
}
