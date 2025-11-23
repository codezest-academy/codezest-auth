import { Prisma } from '@prisma/client';
import { EmailVerification } from '../entities';

export interface IEmailVerificationRepository {
  findByToken(token: string): Promise<EmailVerification | null>;
  findByUserId(userId: string): Promise<EmailVerification | null>;
  create(data: Prisma.EmailVerificationCreateInput): Promise<EmailVerification>;
  markAsVerified(id: string): Promise<EmailVerification>;
  delete(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}
