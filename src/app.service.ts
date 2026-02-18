import { Injectable } from '@nestjs/common';

type EndpointGroup = {
  name: string;
  path: string;
};

type ApiHomeResponse = {
  name: string;
  message: string;
  version: string;
  docs: string;
  health: string;
  endpoints: EndpointGroup[];
};

@Injectable()
export class AppService {
  getApiHome(): ApiHomeResponse {
    return {
      name: 'Stateful Engagement Backend',
      message: 'API is running. Open /api for Swagger and test endpoints.',
      version: 'v1',
      docs: '/api',
      health: '/health',
      endpoints: [
        { name: 'Auth', path: '/auth' },
        { name: 'Check-ins', path: '/checkins' },
        { name: 'Tools', path: '/tools' },
        { name: 'Rewards', path: '/rewards' },
        { name: 'Profile', path: '/me' },
      ],
    };
  }
}
