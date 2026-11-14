import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}
const publicFields = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
} as const;
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  findByEmailWithHash(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id }, select: publicFields });
  }
  create(
    email: string,
    passwordHash: string,
    name: string | null,
  ): Promise<User> {
    return this.prisma.user.create({
      data: { email, passwordHash, name },
      select: publicFields,
    });
  }
}
