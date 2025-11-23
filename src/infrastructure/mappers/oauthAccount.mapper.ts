import { OAuthAccount as PrismaOAuthAccount, Prisma } from '@prisma/client';
import { OAuthAccount } from '../../domain/entities';

/**
 * OAuthAccountMapper - Converts between Prisma OAuthAccount and Domain OAuthAccount
 */
export class OAuthAccountMapper {
  /**
   * Convert Prisma OAuthAccount to Domain OAuthAccount
   */
  static toDomain(prismaAccount: PrismaOAuthAccount): OAuthAccount {
    return new OAuthAccount(
      prismaAccount.id,
      prismaAccount.userId,
      prismaAccount.provider,
      prismaAccount.providerId,
      prismaAccount.accessToken,
      prismaAccount.refreshToken,
      prismaAccount.createdAt
    );
  }

  /**
   * Convert array of Prisma OAuthAccounts to Domain OAuthAccounts
   */
  static toDomainList(prismaAccounts: PrismaOAuthAccount[]): OAuthAccount[] {
    return prismaAccounts.map((account) => this.toDomain(account));
  }

  /**
   * Convert to Prisma OAuthAccountCreateInput
   */
  static toCreateInput(
    userId: string,
    provider: string,
    providerId: string,
    accessToken?: string,
    refreshToken?: string
  ): Prisma.OAuthAccountCreateInput {
    return {
      user: { connect: { id: userId } },
      provider,
      providerId,
      accessToken,
      refreshToken,
    };
  }
}
