import { Controller, Get } from '@nestjs/common';

/** Endpoint healthcheck, dipakai docker-compose untuk memantau container api. */
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
