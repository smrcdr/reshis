import { Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ZodBody } from '../common/zod.decorators';
import { Public } from '../common/public.decorator';
import type { User } from '../users/users.service';
import {
  LoginSchema,
  RegisterSchema,
  type LoginDto,
  type RegisterDto,
} from './auth.dto';
import { AuthService } from './auth.service';
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public()
  @Post('register')
  register(
    @ZodBody(RegisterSchema)
    dto: RegisterDto,
  ) {
    return this.auth.register(dto);
  }
  @Public()
  @Post('login')
  @HttpCode(200)
  login(
    @ZodBody(LoginSchema)
    dto: LoginDto,
  ) {
    return this.auth.login(dto);
  }
  @Get('me')
  me(
    @Req()
    req: Request,
  ) {
    return req.user as User;
  }
}
