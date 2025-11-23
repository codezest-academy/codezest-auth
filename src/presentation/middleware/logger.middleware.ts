import morgan from 'morgan';
import { logger } from '../../config/logger';

// Create a stream object with a 'write' function that will be used by morgan
const stream = {
  write: (message: string) => {
    // Use the http logging level
    logger.http(message.trim());
  },
};

// Skip logging during tests
const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'test';
};

// Build the morgan middleware
export const httpLogger = morgan(
  ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  { stream, skip }
);

// Custom token for user ID (if authenticated)
morgan.token('user-id', (req: any) => {
  return req.user?.userId || 'anonymous';
});

// Detailed logger for development
export const detailedHttpLogger = morgan(
  ':remote-addr [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :user-id - :response-time ms',
  { stream, skip }
);
