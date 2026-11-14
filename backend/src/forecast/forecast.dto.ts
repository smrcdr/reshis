import { z } from 'zod';
const airportCode = z
  .string({ error: 'Укажите код аэропорта' })
  .trim()
  .toUpperCase()
  .pipe(
    z.string().regex(/^[A-Z]{3}$/, {
      error: 'ожидался код из 3 латинских букв, например MOW',
    }),
  );
export const ForecastRequestSchema = z.object(
  {
    origin: airportCode,
    destination: airportCode,
    date: z.iso.date({ error: 'ожидалась дата в формате ГГГГ-ММ-ДД' }),
    price: z
      .number({ error: 'цена должна быть числом' })
      .finite({ error: 'цена должна быть числом' })
      .positive({ error: 'цена должна быть больше 0' }),
  },
  { error: 'Тело запроса должно быть JSON-объектом' },
);
export type ForecastRequestDto = z.infer<typeof ForecastRequestSchema>;
