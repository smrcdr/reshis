import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { config } from '../config/env';
export const QUANTILES = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9] as const;
export type Quantile = (typeof QUANTILES)[number];
export interface RouteInfo {
  code: string;
  name: string;
  origin: {
    code: string;
    city: string;
  };
  destination: {
    code: string;
    city: string;
  };
  basePrice: number;
  priceMin: number;
  priceMax: number;
  priceSensitivity: number;
  costPerPassenger: number;
}
export interface FlightRow {
  route: string;
  date: string;
  seats: number;
  baseDemand: number[];
  recommendedPrice: number;
}
export const csvNumber = z
  .string()
  .trim()
  .min(1, { error: 'ожидалось число' })
  .pipe(
    z.coerce
      .number<string>({ error: 'ожидалось число' })
      .finite({ error: 'ожидалось число' }),
  );
const routeCode = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(
    z
      .string()
      .regex(/^[A-Z]{3}-[A-Z]{3}$/, { error: 'ожидался код вида MOW-AER' }),
  );
const routeRowSchema = z.object({
  route: routeCode,
  name: z
    .string()
    .trim()
    .regex(/^.+ — .+$/, { error: 'ожидалось «Город — Город»' })
    .transform((name) => name.split(/\s+—\s+/) as [string, string]),
  base_price: csvNumber.pipe(
    z.number().positive({ error: 'ожидалась цена больше 0' }),
  ),
  cost_per_passenger: csvNumber.pipe(
    z.number().nonnegative({
      error: 'ожидалась себестоимость не меньше 0',
    }),
  ),
  price_sensitivity: csvNumber.pipe(
    z.number().nonnegative({
      error: 'ожидалась чувствительность не меньше 0',
    }),
  ),
  price_min: csvNumber.pipe(
    z.number().positive({ error: 'ожидалась цена больше 0' }),
  ),
  price_max: csvNumber.pipe(
    z.number().positive({ error: 'ожидалась цена больше 0' }),
  ),
});
const flightRowSchema = z.object({
  route: routeCode,
  date: z.iso.date({ error: 'ожидалась дата ГГГГ-ММ-ДД' }),
  seats: csvNumber.pipe(
    z.number().int({ error: 'ожидалось целое число мест' }).nonnegative({
      error: 'ожидалось неотрицательное число мест',
    }),
  ),
  '0.1_base_demand': csvNumber.pipe(z.number().nonnegative()),
  '0.2_base_demand': csvNumber.pipe(z.number().nonnegative()),
  '0.3_base_demand': csvNumber.pipe(z.number().nonnegative()),
  '0.4_base_demand': csvNumber.pipe(z.number().nonnegative()),
  '0.5_base_demand': csvNumber.pipe(z.number().nonnegative()),
  '0.6_base_demand': csvNumber.pipe(z.number().nonnegative()),
  '0.7_base_demand': csvNumber.pipe(z.number().nonnegative()),
  '0.8_base_demand': csvNumber.pipe(z.number().nonnegative()),
  '0.9_base_demand': csvNumber.pipe(z.number().nonnegative()),
  '0.5_price': csvNumber.pipe(
    z.number().positive({ error: 'ожидалась цена больше 0' }),
  ),
});
@Injectable()
export class DataService implements OnModuleInit {
  private readonly logger = new Logger(DataService.name);
  private routes = new Map<string, RouteInfo>();
  private flights = new Map<string, FlightRow>();
  onModuleInit() {
    this.loadRoutes(config.routesCsvPath);
    this.loadForecast(config.forecastCsvPath);
    this.logger.log(
      `Загружено маршрутов: ${this.routes.size}, рейсов: ${this.flights.size}`,
    );
  }
  private readCsv(path: string): Record<string, string>[] {
    return parse(readFileSync(path, 'utf8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  }
  private parseRow<T extends z.ZodType>(
    schema: T,
    row: unknown,
    path: string,
    line: number,
  ): z.output<T> {
    const result = schema.safeParse(row);
    if (result.success) return result.data;
    const issues = result.error.issues
      .map((issue) =>
        issue.path.length
          ? `${issue.path.join('.')}: ${issue.message}`
          : issue.message,
      )
      .join('; ');
    throw new Error(`${path}, строка ${line}: ${issues}`);
  }
  private loadRoutes(path: string) {
    this.readCsv(path).forEach((row, i) => {
      const r = this.parseRow(routeRowSchema, row, path, i + 2);
      if (r.price_min > r.price_max) {
        throw new Error(`${path}, строка ${i + 2}: price_min больше price_max`);
      }
      const [originCode, destCode] = r.route.split('-');
      const [originCity, destCity] = r.name;
      this.routes.set(r.route, {
        code: r.route,
        name: r.name.join(' — '),
        origin: { code: originCode, city: originCity },
        destination: { code: destCode, city: destCity },
        basePrice: r.base_price,
        priceMin: r.price_min,
        priceMax: r.price_max,
        priceSensitivity: r.price_sensitivity,
        costPerPassenger: r.cost_per_passenger,
      });
    });
  }
  private loadForecast(path: string) {
    this.readCsv(path).forEach((row, i) => {
      const r = this.parseRow(flightRowSchema, row, path, i + 2);
      if (!this.routes.has(r.route)) {
        throw new Error(
          `${path}, строка ${i + 2}: маршрут ${r.route} отсутствует в routes.csv`,
        );
      }
      this.flights.set(`${r.route}|${r.date}`, {
        route: r.route,
        date: r.date,
        seats: r.seats,
        baseDemand: QUANTILES.map((q) => r[`${q}_base_demand`]),
        recommendedPrice: r['0.5_price'],
      });
    });
  }
  getRoutes(): RouteInfo[] {
    return [...this.routes.values()];
  }
  getRoute(code: string): RouteInfo | undefined {
    return this.routes.get(code);
  }
  getFlight(route: string, date: string): FlightRow | undefined {
    return this.flights.get(`${route}|${date}`);
  }
  getDates(route: string): string[] {
    return [...this.flights.values()]
      .filter((f) => f.route === route)
      .map((f) => f.date)
      .sort();
  }
  get flightCount(): number {
    return this.flights.size;
  }
}
