import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('test-db')
  async testDb() {
    return {
      message: 'API is running!',
      timestamp: new Date().toISOString(),
      status: 'healthy',
    };
  }
}
