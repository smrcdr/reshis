import { Controller, HttpCode, Post } from '@nestjs/common';
import { ZodBody } from '../common/zod.decorators';
import { ForecastRequestSchema, type ForecastRequestDto } from './forecast.dto';
import { ForecastService } from './forecast.service';
@Controller('forecast')
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}
  @Post()
  @HttpCode(200)
  create(
    @ZodBody(ForecastRequestSchema)
    dto: ForecastRequestDto,
  ) {
    return this.forecastService.forecast(dto);
  }
}
