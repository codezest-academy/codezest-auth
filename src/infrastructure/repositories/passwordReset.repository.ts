import { Prisma } from '@prisma/client';
import { PasswordReset } from '../../domain/entities';
import PrismaService from '../database/prisma.service';

import { IPasswordResetRepository } from '../../domain/repositories/passwordReset.repository.interface';
import { PasswordResetMapper } from '../mappers/token.mapper';

export class PasswordResetRepository implements IPasswordResetRepository {
  private prisma = PrismaService.getInstance().client;
  async findByToken(token: string): Promise<PasswordReset | null> {
    const reset = await this.prisma.passwordReset.findUnique({
      where: { token },
    });
    return reset ? PasswordResetMapper.toDomain(reset) : null;
  }

  async findByUserId(userId: string): Promise<PasswordReset[]> {
    const resets = await this.prisma.passwordReset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return PasswordResetMapper.toDomainList(resets);
  }

  async create(data: Prisma.PasswordResetCreateInput): Promise<PasswordReset> {
    const reset = await this.prisma.passwordReset.create({
      data,
    });
    return PasswordResetMapper.toDomain(reset);
  }

  async markAsUsed(id: string): Promise<PasswordReset> {
    const reset = await this.prisma.passwordReset.update({
      where: { id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });
    return PasswordResetMapper.toDomain(reset);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.passwordReset.delete({
      where: { id },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.passwordReset.deleteMany({
      where: { userId },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.passwordReset.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }
}
