import { Prisma } from '@prisma/client';
import { Session } from '../entities';

export interface ISessionRepository {
  findByToken(token: string): Promise<Session | null>;
  findByUserId(userId: string): Promise<Session[]>;
  create(data: Prisma.SessionCreateInput): Promise<Session>;
  delete(id: string): Promise<void>;
  deleteByToken(token: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
