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
      prismaUser.firstName,
      prismaUser.lastName,
      prismaUser.userName,
      prismaUser.role as any,
      prismaUser.emailVerified,
      prismaUser.isActive,
      prismaUser.isSuspended,
      prismaUser.suspendedAt,
      prismaUser.suspendedReason,
      prismaUser.lastLoginAt,
      prismaUser.lastLoginIp,
      prismaUser.loginAttempts,
      prismaUser.lockedUntil,
      prismaUser.passwordChangedAt,
      prismaUser.mustChangePassword,
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
    domainUser: Partial<User> & {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    }
  ): Prisma.UserCreateInput {
    return {
      email: domainUser.email,
      password: domainUser.password,
      firstName: domainUser.firstName,
      lastName: domainUser.lastName,
      userName: domainUser.userName || null,
      role: (domainUser.role as UserRole) || UserRole.USER,
      emailVerified: domainUser.emailVerified || false,
      isActive: domainUser.isActive !== undefined ? domainUser.isActive : true,
      isSuspended: domainUser.isSuspended || false,
      loginAttempts: domainUser.loginAttempts || 0,
      mustChangePassword: domainUser.mustChangePassword || false,
    };
  }

  /**
   * Convert Domain User to Prisma UserUpdateInput
   */
  static toUpdateInput(domainUser: Partial<User>): Prisma.UserUpdateInput {
    const updateData: Prisma.UserUpdateInput = {};

    if (domainUser.email) updateData.email = domainUser.email;
    if (domainUser.firstName) updateData.firstName = domainUser.firstName;
    if (domainUser.lastName) updateData.lastName = domainUser.lastName;
    if (domainUser.userName !== undefined) updateData.userName = domainUser.userName;
    if (domainUser.role) {
      updateData.role = domainUser.role as UserRole;
    }
    if (domainUser.emailVerified !== undefined) updateData.emailVerified = domainUser.emailVerified;
    if (domainUser.isActive !== undefined) updateData.isActive = domainUser.isActive;
    if (domainUser.isSuspended !== undefined) updateData.isSuspended = domainUser.isSuspended;
    if (domainUser.lastLoginAt !== undefined) updateData.lastLoginAt = domainUser.lastLoginAt;
    if (domainUser.lastLoginIp !== undefined) updateData.lastLoginIp = domainUser.lastLoginIp;
    if (domainUser.loginAttempts !== undefined) updateData.loginAttempts = domainUser.loginAttempts;
    if (domainUser.lockedUntil !== undefined) updateData.lockedUntil = domainUser.lockedUntil;
    if (domainUser.passwordChangedAt !== undefined)
      updateData.passwordChangedAt = domainUser.passwordChangedAt;
    if (domainUser.mustChangePassword !== undefined)
      updateData.mustChangePassword = domainUser.mustChangePassword;

    return updateData;
  }
}
