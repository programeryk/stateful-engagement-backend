import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception-filter';

type MockResponse = {
  status: jest.Mock;
  json: jest.Mock;
};

function createHost(url = '/test', method = 'GET') {
  const res: MockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => ({ url, method }),
    }),
  } as unknown as ArgumentsHost;

  return { host, res };
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps 4xx details for client errors', () => {
    const { host, res } = createHost('/auth/login', 'POST');
    const ex = new BadRequestException('bad request payload');

    filter.catch(ex, host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'bad request payload',
      }),
    );
  });

  it('sanitizes non-http exceptions into generic 500 response', () => {
    const { host, res } = createHost('/me', 'GET');
    const ex = new Error('sensitive db details');

    filter.catch(ex, host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'InternalServerError',
        message: 'Internal server error',
      }),
    );
    expect(console.error).toHaveBeenCalled();
  });
});
