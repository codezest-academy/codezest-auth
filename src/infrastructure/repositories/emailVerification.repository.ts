import { Prisma } from '@prisma/client';
import { EmailVerification } from '../../domain/entities';
import PrismaService from '../database/prisma.service';

import { EmailVerificationRepository } from '../../domain/repositories/emailVerification.repository';
import { EmailVerificationMapper } from '../mappers/token.mapper';

export class PrismaEmailVerificationRepository implements EmailVerificationRepository {
  private prisma = PrismaService.getInstance().client;
  async findByToken(token: string): Promise<EmailVerification | null> {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { token },
    });
    return verification ? EmailVerificationMapper.toDomain(verification) : null;
  }

  async findByUserId(userId: string): Promise<EmailVerification | null> {
    const verification = await this.prisma.emailVerification.findFirst({
      where: { userId },
    });
    return verification ? EmailVerificationMapper.toDomain(verification) : null;
  }

  async create(data: Prisma.EmailVerificationCreateInput): Promise<EmailVerification> {
    const verification = await this.prisma.emailVerification.create({
      data,
    });
    return EmailVerificationMapper.toDomain(verification);
  }

  async markAsVerified(id: string): Promise<EmailVerification> {
    const verification = await this.prisma.emailVerification.update({
      where: { id },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    });
    return EmailVerificationMapper.toDomain(verification);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.emailVerification.delete({
      where: { id },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.emailVerification.deleteMany({
      where: { userId },
    });
  }
}
