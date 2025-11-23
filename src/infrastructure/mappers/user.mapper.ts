import { User as PrismaUser, UserRole, Prisma } from '@prisma/client';
import { User } from '../../domain/entities';

/**
 * UserMapper - Converts between Prisma User and Domain User
 */
export class UserMapper {
  /**
   * Convert Prisma User to Domain User
   */
  static toDomain(prismaUser: PrismaUser): User {
    return new User(
      prismaUser.id,
      prismaUser.email,
      prismaUser.name,
      prismaUser.role as any, // Cast to any because domain UserRole might be different
      prismaUser.emailVerified,
      prismaUser.createdAt,
      prismaUser.updatedAt,
      prismaUser.password
    );
  }

  /**
   * Convert array of Prisma Users to Domain Users
   */
  static toDomainList(prismaUsers: PrismaUser[]): User[] {
    return prismaUsers.map((user) => this.toDomain(user));
  }

  /**
   * Convert Domain User to Prisma UserCreateInput
   */
  static toCreateInput(
    domainUser: Partial<User> & { email: string; password: string; name: string }
  ): Prisma.UserCreateInput {
    return {
      email: domainUser.email,
      password: domainUser.password,
      name: domainUser.name,
      role: domainUser.role as UserRole || UserRole.USER,
      emailVerified: domainUser.emailVerified || false,
    };
  }

  /**
   * Convert Domain User to Prisma UserUpdateInput
   */
  static toUpdateInput(domainUser: Partial<User>): Prisma.UserUpdateInput {
    const updateData: Prisma.UserUpdateInput = {};

    if (domainUser.email) updateData.email = domainUser.email;
    if (domainUser.name) updateData.name = domainUser.name;
    if (domainUser.role) {
      updateData.role = domainUser.role as UserRole;
    }
    if (domainUser.emailVerified !== undefined) updateData.emailVerified = domainUser.emailVerified;

    return updateData;
  }
}
