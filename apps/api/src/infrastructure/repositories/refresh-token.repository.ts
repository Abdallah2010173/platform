import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  IRefreshTokenRepository,
  IRefreshToken,
} from '../../domain/repositories/user.repository.interface';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    token: string;
    family: string;
    expiresAt: Date;
  }): Promise<IRefreshToken> {
    return this.prisma.refreshToken.create({ data });
  }

  async findByToken(token: string): Promise<IRefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { token } });
  }

  async revokeByFamily(family: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeToken(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}
