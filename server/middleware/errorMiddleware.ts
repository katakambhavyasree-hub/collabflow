import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('[CollabFlow Server Error]:', err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred. Please try again.';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
