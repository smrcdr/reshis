import { z } from 'zod';
const envSchema = z.object({
    VITE_API_URL: z.string().trim().min(1, { error: 'VITE_API_URL не может быть пустым' }).optional(),
});
export type Env = {
    apiUrl: string;
};
export function parseEnv(source: ImportMetaEnv): Env {
    const parsed = envSchema.safeParse(source);
    if (!parsed.success) {
        throw new Error(`Некорректные переменные окружения:\n${z.prettifyError(parsed.error)}`);
    }
    return { apiUrl: parsed.data.VITE_API_URL ?? '/api' };
}
export const env: Env = parseEnv(import.meta.env);
