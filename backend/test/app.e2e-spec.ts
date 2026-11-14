import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';
const EMAIL = `e2e-${randomUUID()}@reshis.test`;
describe('API (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });
  afterAll(async () => {
    await app.get(PrismaService).user.deleteMany({ where: { email: EMAIL } });
    await app.close();
  });
  it('GET /api/health', () =>
    request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', flights: 155 }));
  it('GET /api/routes — 5 маршрутов', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/routes')
      .expect(200);
    expect(res.body).toHaveLength(5);
    expect(
      (
        res.body as {
          code: string;
        }[]
      )[0],
    ).toMatchObject({
      code: 'MOW-AER',
      origin: { code: 'MOW', city: 'Москва' },
    });
  });
  it('GET /api/routes/:route/dates — 31 дата', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/routes/MOW-AER/dates')
      .expect(200);
    expect(
      (
        res.body as {
          dates: string[];
        }
      ).dates,
    ).toHaveLength(31);
    expect(
      (
        res.body as {
          dates: string[];
        }
      ).dates[0],
    ).toBe('2026-06-01');
  });
  it('GET /api/routes/:route/dates — 404', () =>
    request(app.getHttpServer()).get('/api/routes/MOW-XXX/dates').expect(404));
  it('POST /api/forecast без токена — 401', () =>
    request(app.getHttpServer())
      .post('/api/forecast')
      .send({
        origin: 'MOW',
        destination: 'AER',
        date: '2026-06-01',
        price: 10000,
      })
      .expect(401));
  it('регистрация → 201 и токен', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: EMAIL.toUpperCase(),
        password: 's3cretPass',
        name: 'Иван',
      })
      .expect(201);
    expect(
      (
        res.body as {
          tokenType: string;
        }
      ).tokenType,
    ).toBe('Bearer');
    expect(
      (
        res.body as {
          user: {
            email: string;
          };
        }
      ).user.email,
    ).toBe(EMAIL);
    expect(
      (
        res.body as {
          user: unknown;
        }
      ).user,
    ).not.toHaveProperty('passwordHash');
  });
  it('повторная регистрация — 409', () =>
    request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: EMAIL, password: 's3cretPass' })
      .expect(409));
  it('регистрация с коротким паролем — 422', () =>
    request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'x@y.ru', password: '123' })
      .expect(422));
  it('вход с неверным паролем — 401', () =>
    request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: EMAIL, password: 'wrong-pass' })
      .expect(401));
  it('вход → 200 и токен', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: EMAIL, password: 's3cretPass' })
      .expect(200);
    token = (
      res.body as {
        accessToken: string;
      }
    ).accessToken;
  });
  it('GET /api/auth/me', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(
      (
        res.body as {
          email: string;
        }
      ).email,
    ).toBe(EMAIL);
  });
  it('POST /api/forecast — пример из спецификации', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/forecast')
      .set('Authorization', `Bearer ${token}`)
      .send({
        origin: 'mow',
        destination: 'aer',
        date: '2026-06-01',
        price: 10000,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      seats: 900,
      wish: 695,
      buy: 695,
      soldOut: false,
      recommendedPrice: 9565,
      warnings: [],
    });
    expect(
      (
        res.body as {
          quantiles: unknown[];
        }
      ).quantiles,
    ).toHaveLength(9);
    expect(
      (
        res.body as {
          quantiles: unknown[];
        }
      ).quantiles[4],
    ).toMatchObject({
      q: 0.5,
      wish: (
        res.body as {
          wish: number;
        }
      ).wish,
    });
  });
  it('POST /api/forecast — продажи упираются в места при низкой цене', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/forecast')
      .set('Authorization', `Bearer ${token}`)
      .send({
        origin: 'MOW',
        destination: 'AER',
        date: '2026-06-01',
        price: 5000,
      })
      .expect(200);
    expect(
      (
        res.body as {
          buy: number;
        }
      ).buy,
    ).toBe(900);
    expect(
      (
        res.body as {
          soldOut: boolean;
        }
      ).soldOut,
    ).toBe(true);
    expect(
      (
        res.body as {
          warnings: string[];
        }
      ).warnings,
    ).toHaveLength(1);
  });
  it('POST /api/forecast — несуществующий рейс 404', () =>
    request(app.getHttpServer())
      .post('/api/forecast')
      .set('Authorization', `Bearer ${token}`)
      .send({
        origin: 'MOW',
        destination: 'AER',
        date: '2026-08-01',
        price: 10000,
      })
      .expect(404));
  it('POST /api/forecast — невалидная цена 422', () =>
    request(app.getHttpServer())
      .post('/api/forecast')
      .set('Authorization', `Bearer ${token}`)
      .send({
        origin: 'MOW',
        destination: 'AER',
        date: '2026-06-01',
        price: -1,
      })
      .expect(422));
});
