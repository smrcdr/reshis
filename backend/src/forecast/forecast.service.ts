import { Injectable, NotFoundException } from '@nestjs/common';
import { DataService, QUANTILES } from '../data/data.service';
import { ForecastRequestDto } from './forecast.dto';
import { calcBuy, calcWish, round } from './forecast.calc';
@Injectable()
export class ForecastService {
  constructor(private readonly data: DataService) {}
  forecast({ origin, destination, date, price }: ForecastRequestDto) {
    const code = `${origin}-${destination}`;
    const route = this.data.getRoute(code);
    if (!route) throw new NotFoundException(`Маршрут ${code} не найден`);
    const flight = this.data.getFlight(code, date);
    if (!flight)
      throw new NotFoundException(`Рейс ${code} на ${date} не найден`);
    const { seats } = flight;
    const quantiles = QUANTILES.map((q, i) => {
      const baseDemand = flight.baseDemand[i];
      const wish = calcWish(
        baseDemand,
        route.priceSensitivity,
        price,
        route.basePrice,
      );
      return {
        q,
        baseDemand,
        wish,
        buy: calcBuy(wish, seats),
        capped: wish >= seats,
      };
    });
    const median = quantiles[QUANTILES.indexOf(0.5)];
    const warnings: string[] = [];
    if (price < route.priceMin || price > route.priceMax) {
      warnings.push(
        `Цена ${price} ₽ вне рекомендуемого диапазона ${route.priceMin}–${route.priceMax} ₽`,
      );
    }
    return {
      route: code,
      routeName: route.name,
      date,
      price,
      basePrice: route.basePrice,
      priceSensitivity: route.priceSensitivity,
      seats,
      wish: median.wish,
      buy: median.buy,
      soldOut: median.capped,
      loadFactor: round(median.buy / seats, 3),
      recommendedPrice: flight.recommendedPrice,
      revenue: round(median.buy * price, 2),
      profit: round(median.buy * (price - route.costPerPassenger), 2),
      quantiles,
      warnings,
    };
  }
}
