import { z } from 'zod';
const emailSchema = z
  .string({ error: 'Укажите email' })
  .trim()
  .toLowerCase()
  .email({ error: 'Некорректный email' })
  .max(254, { error: 'Email слишком длинный' });
export const RegisterSchema = z.object(
  {
    email: emailSchema,
    password: z
      .string({ error: 'Укажите пароль' })
      .min(8, { error: 'Пароль должен быть не короче 8 символов' })
      .max(72, { error: 'Пароль должен быть не длиннее 72 символов' })
      .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
        error: 'Пароль должен занимать не более 72 байт UTF-8',
      }),
    name: z
      .string({ error: 'Имя должно быть строкой' })
      .trim()
      .max(100, { error: 'Имя должно быть не длиннее 100 символов' })
      .optional(),
  },
  { error: 'Тело запроса должно быть JSON-объектом' },
);
export const LoginSchema = z.object(
  {
    email: emailSchema,
    password: z
      .string({ error: 'Укажите пароль' })
      .min(1, { error: 'Введите пароль' })
      .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
        error: 'Пароль должен занимать не более 72 байт UTF-8',
      }),
  },
  { error: 'Тело запроса должно быть JSON-объектом' },
);
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
