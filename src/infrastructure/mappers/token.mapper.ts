import {
  EmailVerification as PrismaEmailVerification,
  PasswordReset as PrismaPasswordReset,
  Prisma,
} from '@prisma/client';
import { EmailVerification, PasswordReset } from '../../domain/entities';

/**
 * EmailVerificationMapper - Converts between Prisma EmailVerification and Domain EmailVerification
 */
export class EmailVerificationMapper {
  /**
   * Convert Prisma EmailVerification to Domain EmailVerification
   */
  static toDomain(prismaToken: PrismaEmailVerification): EmailVerification {
    return new EmailVerification(
      prismaToken.id,
      prismaToken.userId,
      prismaToken.token,
      prismaToken.verified,
      prismaToken.verifiedAt,
      prismaToken.createdAt
    );
  }

  /**
   * Convert array of Prisma EmailVerifications to Domain EmailVerifications
   */
  static toDomainList(prismaTokens: PrismaEmailVerification[]): EmailVerification[] {
    return prismaTokens.map((token) => this.toDomain(token));
  }

  /**
   * Convert to Prisma EmailVerificationCreateInput
   */
  static toCreateInput(userId: string, token: string): Prisma.EmailVerificationCreateInput {
    return {
      user: { connect: { id: userId } },
      token,
    };
  }
}

/**
 * PasswordResetMapper - Converts between Prisma PasswordReset and Domain PasswordReset
 */
export class PasswordResetMapper {
  /**
   * Convert Prisma PasswordReset to Domain PasswordReset
   */
  static toDomain(prismaToken: PrismaPasswordReset): PasswordReset {
    return new PasswordReset(
      prismaToken.id,
      prismaToken.userId,
      prismaToken.token,
      prismaToken.expiresAt,
      prismaToken.used,
      prismaToken.usedAt,
      prismaToken.createdAt
    );
  }

  /**
   * Convert array of Prisma PasswordResets to Domain PasswordResets
   */
  static toDomainList(prismaTokens: PrismaPasswordReset[]): PasswordReset[] {
    return prismaTokens.map((token) => this.toDomain(token));
  }

  /**
   * Convert to Prisma PasswordResetCreateInput
   */
  static toCreateInput(
    userId: string,
    token: string,
    expiresAt: Date
  ): Prisma.PasswordResetCreateInput {
    return {
      user: { connect: { id: userId } },
      token,
      expiresAt,
    };
  }
}
