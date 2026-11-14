import createClient from 'openapi-fetch';
import { env } from '../config/env';
import type { components, paths } from './schema';
type Schemas = components['schemas'];
export type Route = Schemas['Route'];
export type User = Schemas['User'];
export type ForecastResponse = Schemas['ForecastResponse'];
export type QuantileForecast = Schemas['QuantileForecast'];
export type ApiError = Schemas['Error'];
const TOKEN_KEY = 'reshis-avia.token';
export const tokenStore = {
    get(): string | null {
        try {
            return localStorage.getItem(TOKEN_KEY);
        }
        catch {
            return null;
        }
    },
    set(token: string) {
        try {
            localStorage.setItem(TOKEN_KEY, token);
        }
        catch {
            memoryToken = token;
            return;
        }
        memoryToken = token;
    },
    clear() {
        try {
            localStorage.removeItem(TOKEN_KEY);
        }
        catch {
            memoryToken = null;
            return;
        }
        memoryToken = null;
    },
};
let memoryToken: string | null = null;
export const api = createClient<paths>({
    baseUrl: env.apiUrl,
});
api.use({
    onRequest({ request }) {
        const token = tokenStore.get() ?? memoryToken;
        if (token)
            request.headers.set('Authorization', `Bearer ${token}`);
        return request;
    },
});
export function errorText(error: ApiError | undefined, fallback = 'Что-то пошло не так. Попробуйте ещё раз'): string {
    if (!error?.message)
        return fallback;
    return Array.isArray(error.message) ? error.message.join('. ') : error.message;
}
export const NETWORK_ERROR = 'Сервер недоступен. Проверьте, что backend запущен';
