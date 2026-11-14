import { loadConfig } from './env';
const baseEnv = {
  DATABASE_URL:
    'postgresql://reshis:reshis@localhost:5432/reshis?schema=public',
} satisfies NodeJS.ProcessEnv;
describe('loadConfig', () => {
  it('подставляет дефолты для локальной разработки', () => {
    const config = loadConfig({ ...baseEnv });
    expect(config).toMatchObject({
      nodeEnv: 'development',
      isProduction: false,
      port: 3000,
      jwtSecret: 'dev-only-secret-change-me',
      bcryptRounds: 10,
    });
    expect(config.routesCsvPath.endsWith('/data/routes.csv')).toBe(true);
    expect(config.forecastCsvPath.endsWith('/data/forecast.csv')).toBe(true);
  });
  it('читает PORT строкой из .env', () => {
    expect(loadConfig({ ...baseEnv, PORT: '8080' }).port).toBe(8080);
  });
  it('считает пустые значения незаданными', () => {
    const config = loadConfig({ ...baseEnv, JWT_SECRET: '   ', PORT: '' });
    expect(config.jwtSecret).toBe('dev-only-secret-change-me');
    expect(config.port).toBe(3000);
  });
  it('берёт JWT_SECRET из окружения', () => {
    const config = loadConfig({ ...baseEnv, JWT_SECRET: 'x'.repeat(32) });
    expect(config.jwtSecret).toBe('x'.repeat(32));
  });
  it('читает BCRYPT_ROUNDS из окружения и подставляет дефолт для пустой строки', () => {
    expect(loadConfig({ ...baseEnv, BCRYPT_ROUNDS: '12' }).bcryptRounds).toBe(
      12,
    );
    expect(loadConfig({ ...baseEnv, BCRYPT_ROUNDS: ' ' }).bcryptRounds).toBe(
      10,
    );
  });
  it.each(['3', '32', '10.5', 'abc'])(
    'отклоняет некорректный BCRYPT_ROUNDS: %s',
    (value) => {
      expect(() => loadConfig({ ...baseEnv, BCRYPT_ROUNDS: value })).toThrow(
        /BCRYPT_ROUNDS/,
      );
    },
  );
  it('требует JWT_SECRET в production', () => {
    expect(() => loadConfig({ ...baseEnv, NODE_ENV: 'production' })).toThrow(
      /JWT_SECRET обязателен в production/,
    );
  });
  it('принимает production с заданным секретом', () => {
    const config = loadConfig({
      ...baseEnv,
      NODE_ENV: 'production',
      JWT_SECRET: 'x'.repeat(32),
    });
    expect(config.isProduction).toBe(true);
  });
  it('требует DATABASE_URL', () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
  });
  it('не принимает строку подключения не к postgres', () => {
    expect(() => loadConfig({ DATABASE_URL: 'mysql://localhost/db' })).toThrow(
      /postgresql:\/\//,
    );
  });
  it('проверяет диапазон порта и нечисловые значения', () => {
    expect(() => loadConfig({ ...baseEnv, PORT: '70000' })).toThrow(
      /порт должен быть от 1 до 65535/,
    );
    expect(() => loadConfig({ ...baseEnv, PORT: 'abc' })).toThrow(
      /ожидалось целое число/,
    );
  });
  it('собирает пути из DATA_DIR и имён файлов', () => {
    const config = loadConfig({
      ...baseEnv,
      DATA_DIR: '/srv/data',
      ROUTES_CSV: 'my_routes.csv',
      FORECAST_CSV: 'my_forecast.csv',
    });
    expect(config.routesCsvPath).toBe('/srv/data/my_routes.csv');
    expect(config.forecastCsvPath).toBe('/srv/data/my_forecast.csv');
  });
});
