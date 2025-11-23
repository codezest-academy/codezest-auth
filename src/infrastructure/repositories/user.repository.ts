import { Prisma } from '@prisma/client';
import { User } from '../../domain/entities';
import PrismaService from '../database/prisma.service';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserMapper } from '../mappers/user.mapper';

export class PrismaUserRepository implements UserRepository {
  private prisma = PrismaService.getInstance().client;

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });
    return user ? UserMapper.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });
    return user ? UserMapper.toDomain(user) : null;
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const user = await this.prisma.user.create({
      data,
      include: {
        profile: true,
      },
    });
    return UserMapper.toDomain(user);
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        profile: true,
      },
    });
    return UserMapper.toDomain(user);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    });
    return count > 0;
  }
}
