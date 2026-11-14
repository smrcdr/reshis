import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { config } from '../config/env';
import { Prisma } from '../generated/prisma/client';
import { User, UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './auth.dto';
const EMAIL_TAKEN = 'Пользователь с таким email уже существует';
export const TOKEN_TTL_SECONDS = 24 * 60 * 60;
export interface JwtPayload {
  sub: string;
  email: string;
}
@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}
  async register({ email, password, name }: RegisterDto) {
    if (await this.users.findByEmailWithHash(email)) {
      throw new ConflictException(EMAIL_TAKEN);
    }
    const hash = await bcrypt.hash(password, config.bcryptRounds);
    try {
      const user = await this.users.create(email, hash, name?.trim() || null);
      return this.issueToken(user);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(EMAIL_TAKEN);
      }
      throw e;
    }
  }
  async login({ email, password }: LoginDto) {
    const found = await this.users.findByEmailWithHash(email);
    if (!found || !(await bcrypt.compare(password, found.passwordHash))) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    const { id, name, createdAt } = found;
    return this.issueToken({ id, email, name, createdAt });
  }
  private issueToken(user: User) {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwt.sign(payload),
      tokenType: 'Bearer' as const,
      expiresIn: TOKEN_TTL_SECONDS,
      user,
    };
  }
}
