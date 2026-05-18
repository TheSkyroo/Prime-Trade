import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { logger } from '../utils/logger';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Unhandled error', { error: err });

  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
    res.status(422).json({ success: false, statusCode: 422, message: 'Validation failed', errors });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, statusCode: 409, message: 'Resource already exists' });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, statusCode: 404, message: 'Resource not found' });
      return;
    }
  }

  if (err instanceof TokenExpiredError) {
    res.status(403).json({ success: false, statusCode: 403, message: 'Token expired' });
    return;
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({ success: false, statusCode: 401, message: 'Invalid token' });
    return;
  }

  if (err instanceof Error) {
    const statusCode = (err as Error & { statusCode?: number }).statusCode ?? 500;
    res.status(statusCode).json({
      success: false,
      statusCode,
      message: statusCode === 500 ? 'Internal server error' : err.message,
    });
    return;
  }

  res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error' });
}
