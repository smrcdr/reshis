import { z } from 'zod';
export const RouteParamsSchema = z.object({
  route: z
    .string({ error: 'Укажите код маршрута' })
    .trim()
    .toUpperCase()
    .pipe(
      z.string().regex(/^[A-Z]{3}-[A-Z]{3}$/, {
        error: 'ожидался код вида MOW-AER',
      }),
    ),
});
export type RouteParams = z.infer<typeof RouteParamsSchema>;
