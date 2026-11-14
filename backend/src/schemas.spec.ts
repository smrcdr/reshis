import { LoginSchema, RegisterSchema } from './auth/auth.dto';
import { ForecastRequestSchema } from './forecast/forecast.dto';
describe('схемы запросов', () => {
  describe('RegisterSchema', () => {
    it('нормализует email и обрезает имя', () => {
      const dto = RegisterSchema.parse({
        email: '  Manager@Reshis.AVIA ',
        password: 's3cretPass',
        name: '  Иван  ',
      });
      expect(dto).toEqual({
        email: 'manager@reshis.avia',
        password: 's3cretPass',
        name: 'Иван',
      });
    });
    it('отбрасывает лишние поля, как это делал whitelist: true', () => {
      const dto = RegisterSchema.parse({
        email: 'a@b.ru',
        password: 's3cretPass',
        isAdmin: true,
      });
      expect(dto).not.toHaveProperty('isAdmin');
    });
    it('собирает все ошибки сразу', () => {
      const result = RegisterSchema.safeParse({
        email: 'не-email',
        password: '123',
      });
      expect(result.error?.issues.map((i) => i.message)).toEqual([
        'Некорректный email',
        'Пароль должен быть не короче 8 символов',
      ]);
    });
    it('не принимает пароль длиннее 72 символов (ограничение bcrypt)', () => {
      const result = RegisterSchema.safeParse({
        email: 'a@b.ru',
        password: 'x'.repeat(73),
      });
      expect(result.error?.issues[0].message).toBe(
        'Пароль должен быть не длиннее 72 символов',
      );
    });
    it('требует объект в теле запроса', () => {
      expect(RegisterSchema.safeParse(undefined).error?.issues[0].message).toBe(
        'Тело запроса должно быть JSON-объектом',
      );
    });
  });
  it.each([RegisterSchema, LoginSchema])(
    'отклоняет кириллицу длиннее 72 байт',
    (schema) => {
      expect(
        schema.safeParse({ email: 'a@b.ru', password: 'я'.repeat(36) + 'A' })
          .success,
      ).toBe(false);
      expect(
        schema.safeParse({ email: 'a@b.ru', password: 'я'.repeat(36) }).success,
      ).toBe(true);
    },
  );
  describe('LoginSchema', () => {
    it('отклоняет пароли длиннее ограничения bcrypt', () => {
      expect(
        LoginSchema.safeParse({ email: 'a@b.ru', password: 'x'.repeat(100) })
          .success,
      ).toBe(false);
    });
    it('не принимает пустой пароль', () => {
      expect(
        LoginSchema.safeParse({ email: 'a@b.ru', password: '' }).error
          ?.issues[0].message,
      ).toBe('Введите пароль');
    });
  });
  describe('ForecastRequestSchema', () => {
    const valid = {
      origin: 'MOW',
      destination: 'AER',
      date: '2026-06-01',
      price: 10000,
    };
    it('приводит коды аэропортов к верхнему регистру', () => {
      const dto = ForecastRequestSchema.parse({
        ...valid,
        origin: ' mow ',
        destination: 'aer',
      });
      expect(dto).toMatchObject({ origin: 'MOW', destination: 'AER' });
    });
    it.each([
      [
        'неверный код',
        { origin: 'MOWW' },
        'ожидался код из 3 латинских букв, например MOW',
      ],
      [
        'несуществующая дата',
        { date: '2026-02-31' },
        'ожидалась дата в формате ГГГГ-ММ-ДД',
      ],
      [
        'дата в другом формате',
        { date: '01.06.2026' },
        'ожидалась дата в формате ГГГГ-ММ-ДД',
      ],
      ['цена строкой', { price: '10000' }, 'цена должна быть числом'],
      ['нулевая цена', { price: 0 }, 'цена должна быть больше 0'],
      ['отрицательная цена', { price: -1 }, 'цена должна быть больше 0'],
    ])('отклоняет %s', (_label, patch, message) => {
      const result = ForecastRequestSchema.safeParse({ ...valid, ...patch });
      expect(result.error?.issues.map((i) => i.message)).toContain(message);
    });
  });
});
