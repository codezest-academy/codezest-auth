import { Prisma } from '@prisma/client';
import { PasswordReset } from '../entities';

export interface PasswordResetRepository {
  findByToken(token: string): Promise<PasswordReset | null>;
  findByUserId(userId: string): Promise<PasswordReset[]>;
  create(data: Prisma.PasswordResetCreateInput): Promise<PasswordReset>;
  markAsUsed(id: string): Promise<PasswordReset>;
  delete(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
