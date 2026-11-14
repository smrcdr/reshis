import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/public.decorator';
import { DataService } from '../data/data.service';
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly data: DataService) {}
  @Get()
  check() {
    return { status: 'ok', flights: this.data.flightCount };
  }
}
