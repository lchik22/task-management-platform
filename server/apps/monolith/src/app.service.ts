import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  ping() {
    return {
      status: 'ok',
      message: 'pong',
      timestamp: new Date().toISOString(),
    };
  }
}
