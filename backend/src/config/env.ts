import 'dotenv/config';
import { resolve } from 'node:path';
import { z } from 'zod';
const optionalString = (description: string) =>
  z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().trim().min(1).optional().describe(description),
  );
const port = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  z.coerce
    .number({ error: 'ожидалось целое число' })
    .int({ error: 'ожидалось целое число' })
    .min(1, { error: 'порт должен быть от 1 до 65535' })
    .max(65535, { error: 'порт должен быть от 1 до 65535' })
    .default(3000),
);
const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'], {
        error: 'ожидалось development, test или production',
      })
      .default('development'),
    PORT: port,
    DATABASE_URL: z
      .url({
        protocol: /^postgres(ql)?$/,
        error: 'ожидался postgresql://user:pass@host:port/db',
      })
      .describe('Строка подключения к PostgreSQL'),
    JWT_SECRET: optionalString('Секрет для подписи JWT'),
    BCRYPT_ROUNDS: z.preprocess(
      (value) =>
        typeof value === 'string' && value.trim() === '' ? undefined : value,
      z.coerce.number().int().min(4).max(31).default(10),
    ),
    DATA_DIR: optionalString('Каталог с CSV-файлами'),
    ROUTES_CSV: optionalString('Имя файла маршрутов'),
    FORECAST_CSV: optionalString('Имя файла прогноза'),
    FRONTEND_DIST: optionalString('Путь к собранному фронтенду'),
    OPENAPI_PATH: optionalString('Путь к openapi.yaml'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.JWT_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET обязателен в production',
      });
    }
  });
const DEV_SECRET = 'dev-only-secret-change-me';
export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  isProduction: boolean;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  bcryptRounds: number;
  dataDir: string;
  routesCsvPath: string;
  forecastCsvPath: string;
  frontendDist: string;
  openapiPath: string;
}
function toAppConfig(env: z.infer<typeof envSchema>): AppConfig {
  const dataDir = env.DATA_DIR ?? resolve(process.cwd(), 'data');
  return {
    nodeEnv: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    jwtSecret: env.JWT_SECRET ?? DEV_SECRET,
    bcryptRounds: env.BCRYPT_ROUNDS,
    dataDir,
    routesCsvPath: resolve(dataDir, env.ROUTES_CSV ?? 'routes.csv'),
    forecastCsvPath: resolve(dataDir, env.FORECAST_CSV ?? 'forecast.csv'),
    frontendDist:
      env.FRONTEND_DIST ?? resolve(process.cwd(), '..', 'frontend', 'dist'),
    openapiPath:
      env.OPENAPI_PATH ?? resolve(process.cwd(), '..', 'openapi.yaml'),
  };
}
export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(
      `Некорректные переменные окружения:\n${z.prettifyError(parsed.error)}`,
    );
  }
  return toAppConfig(parsed.data);
}
export const config: AppConfig = loadConfig();
