import { Prisma } from '@prisma/client';
import { OAuthAccount } from '../entities';

export interface OAuthRepository {
  findByProvider(provider: string, providerId: string): Promise<OAuthAccount | null>;
  findByUserId(userId: string): Promise<OAuthAccount[]>;
  create(data: Prisma.OAuthAccountCreateInput): Promise<OAuthAccount>;
  delete(id: string): Promise<void>;
}
