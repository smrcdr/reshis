import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp, setupSwagger } from './app.setup';
import { config } from './config/env';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  setupSwagger(app);
  await app.listen(config.port);
  Logger.log(
    `API: http://localhost:${config.port}/api  ·  Swagger: http://localhost:${config.port}/api/docs`,
    'Bootstrap',
  );
}
void bootstrap();
