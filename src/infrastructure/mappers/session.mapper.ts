import { Session as PrismaSession, Prisma } from '@prisma/client';
import { Session } from '../../domain/entities';

/**
 * SessionMapper - Converts between Prisma Session and Domain Session
 */
export class SessionMapper {
  /**
   * Convert Prisma Session to Domain Session
   */
  static toDomain(prismaSession: PrismaSession): Session {
    return new Session(
      prismaSession.id,
      prismaSession.userId,
      prismaSession.token,
      prismaSession.expiresAt,
      prismaSession.createdAt
    );
  }

  /**
   * Convert array of Prisma Sessions to Domain Sessions
   */
  static toDomainList(prismaSessions: PrismaSession[]): Session[] {
    return prismaSessions.map((session) => this.toDomain(session));
  }

  /**
   * Convert Domain Session to Prisma SessionCreateInput
   */
  static toCreateInput(userId: string, token: string, expiresAt: Date): Prisma.SessionCreateInput {
    return {
      user: { connect: { id: userId } },
      token,
      expiresAt,
    };
  }
}
