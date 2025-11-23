import { Prisma } from '@prisma/client';
import { OAuthAccount } from '../../domain/entities';
import PrismaService from '../database/prisma.service';
import { OAuthRepository } from '../../domain/repositories/oauth.repository';
import { OAuthAccountMapper } from '../mappers/oauthAccount.mapper';

export class PrismaOAuthRepository implements OAuthRepository {
  private prisma = PrismaService.getInstance().client;
  async findByProvider(provider: string, providerId: string): Promise<OAuthAccount | null> {
    const account = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
      include: {
        user: true,
      },
    });
    return account ? OAuthAccountMapper.toDomain(account) : null;
  }

  async findByUserId(userId: string): Promise<OAuthAccount[]> {
    const accounts = await this.prisma.oAuthAccount.findMany({
      where: { userId },
    });
    return OAuthAccountMapper.toDomainList(accounts);
  }

  async create(data: Prisma.OAuthAccountCreateInput): Promise<OAuthAccount> {
    const account = await this.prisma.oAuthAccount.create({
      data,
    });
    return OAuthAccountMapper.toDomain(account);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.oAuthAccount.delete({
      where: { id },
    });
  }
}
