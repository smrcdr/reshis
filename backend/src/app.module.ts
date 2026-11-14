import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { existsSync } from 'node:fs';
import { AuthModule } from './auth/auth.module';
import { config } from './config/env';
import { DataModule } from './data/data.module';
import { ForecastController } from './forecast/forecast.controller';
import { ForecastService } from './forecast/forecast.service';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { RoutesController } from './routes/routes.controller';
const staticModules = existsSync(config.frontendDist)
  ? [
      ServeStaticModule.forRoot({
        rootPath: config.frontendDist,
        exclude: ['/api/{*path}'],
      }),
    ]
  : [];
@Module({
  imports: [PrismaModule, DataModule, AuthModule, ...staticModules],
  controllers: [HealthController, RoutesController, ForecastController],
  providers: [ForecastService],
})
export class AppModule {}
