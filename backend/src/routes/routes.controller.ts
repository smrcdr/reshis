import { Controller, Get, NotFoundException } from '@nestjs/common';
import { Public } from '../common/public.decorator';
import { ZodParams } from '../common/zod.decorators';
import { DataService } from '../data/data.service';
import { RouteParamsSchema, type RouteParams } from './routes.dto';
@Public()
@Controller('routes')
export class RoutesController {
  constructor(private readonly data: DataService) {}
  @Get()
  list() {
    return this.data.getRoutes();
  }
  @Get(':route/dates')
  dates(
    @ZodParams(RouteParamsSchema)
    { route }: RouteParams,
  ) {
    if (!this.data.getRoute(route)) {
      throw new NotFoundException(`Маршрут ${route} не найден`);
    }
    return { route, dates: this.data.getDates(route) };
  }
}
