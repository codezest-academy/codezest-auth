import { Prisma } from '@prisma/client';
import { Session } from '../../domain/entities';
import PrismaService from '../database/prisma.service';
import { ISessionRepository } from '../../domain/repositories/session.repository.interface';
import { SessionMapper } from '../mappers/session.mapper';

export class SessionRepository implements ISessionRepository {
  private prisma = PrismaService.getInstance().client;
  async findByToken(token: string): Promise<Session | null> {
    const session = await this.prisma.session.findUnique({
      where: { token },
    });
    return session ? SessionMapper.toDomain(session) : null;
  }

  async findByUserId(userId: string): Promise<Session[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return SessionMapper.toDomainList(sessions);
  }

  async create(data: Prisma.SessionCreateInput): Promise<Session> {
    const session = await this.prisma.session.create({
      data,
    });
    return SessionMapper.toDomain(session);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.session.delete({
      where: { id },
    });
  }

  async deleteByToken(token: string): Promise<void> {
    await this.prisma.session.delete({
      where: { token },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }
}
