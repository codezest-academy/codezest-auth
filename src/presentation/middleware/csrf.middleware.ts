import { Request, Response, NextFunction } from 'express';
import { CsrfService } from '../../application/services/csrf.service';
import { ForbiddenError } from '../../domain/errors';

const csrfService = new CsrfService();

export const csrfMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF check for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  try {
    const token = req.headers['x-csrf-token'] as string;

    if (!token) {
      throw new ForbiddenError('CSRF token missing');
    }

    const isValid = await csrfService.validateToken(token);

    if (!isValid) {
      throw new ForbiddenError('Invalid or expired CSRF token');
    }

    next();
  } catch (error) {
    next(error);
  }
};
