import { INestApplication, Logger } from '@nestjs/common';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { config } from './config/env';
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.enableCors();
}
export function setupSwagger(app: INestApplication) {
  if (!existsSync(config.openapiPath)) {
    new Logger('Swagger').warn(
      `openapi.yaml не найден (${config.openapiPath}) — /api/docs отключён`,
    );
    return;
  }
  const document = parse(
    readFileSync(config.openapiPath, 'utf8'),
  ) as OpenAPIObject;
  SwaggerModule.setup('api/docs', app, document);
}
