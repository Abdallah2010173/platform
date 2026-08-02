import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  IUserRepository,
  IUserWithProfile,
  CreateUserData,
} from '../../domain/repositories/user.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<IUserWithProfile | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async findByEmail(email: string): Promise<IUserWithProfile | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });
  }

  async create(data: CreateUserData): Promise<IUserWithProfile> {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role,
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            displayName: `${data.firstName} ${data.lastName}`,
          },
        },
      },
      include: { profile: true },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
