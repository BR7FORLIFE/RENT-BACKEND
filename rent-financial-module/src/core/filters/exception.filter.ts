import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppException } from '../global-exception.js';
import type { ErrorHttpResponse } from '../types.js';
import { ZodError } from 'zod';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    console.log(exception);
    const ctx = host.switchToHttp();

    const request: Request = ctx.getRequest();
    const response: Response = ctx.getResponse();

    if (exception instanceof AppException) {
      const res: ErrorHttpResponse = {
        message: exception.message,
        error: exception.error,
        localDatetime: new Date().toISOString(),
        path: request.path,
      };

      return response.status(exception.status).json(res);
    }

    if (exception instanceof ZodError) {
      const res: ErrorHttpResponse = {
        message: 'Los datos enviados no cumplen con la estructura esperada!',
        error: exception.issues[0].code,
        localDatetime: new Date().toISOString(),
        path: request.path,
      };

      return response.status(406).json(res);
    }

    return response.status(500).json({
      message: 'Unexpected server error',
      error: 'INTERNAL_SERVER_ERROR',
      localDatetime: new Date().toISOString(),
      path: request.path,
    });
  }
}
