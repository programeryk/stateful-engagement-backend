import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type RequestWithLog = Request & {
  id?: string;
  log?: {
    error: (obj: unknown, msg?: string) => void;
  };
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<RequestWithLog>();

    const timestamp = new Date().toISOString();
    const path = req.url;
    const requestId = req.id;

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: unknown = 'Internal server error';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
      } else if (response && typeof response === 'object') {
        const r = response as Record<string, unknown>;
        message = r.message ?? message;
        error = (r.error as string) ?? error;
      }
    } else if (exception instanceof Error) {
      error = exception.name;
    }

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      if (req.log) {
        req.log.error(
          {
            err: exception,
            requestId,
            method: req.method,
            path,
            statusCode,
          },
          'Unhandled exception',
        );
      } else {
        console.error(
          `[${timestamp}] ${req.method} ${path} -> ${statusCode}`,
          exception,
        );
      }
      message = 'Internal server error';
      error = 'InternalServerError';
    }

    res.status(statusCode).json({
      statusCode,
      error,
      message,
      path,
      timestamp,
      requestId,
    });
  }
}
