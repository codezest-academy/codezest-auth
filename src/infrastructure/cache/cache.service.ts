import { createCacheClient, CacheClientInterface } from '@codezest-academy/codezest-cache';
import { logger } from '../../config/logger';
import { config } from '../../config';

// Create the cache client with connection details and logger
export const cache: CacheClientInterface = createCacheClient({
  host: config.redis.host,
  port: Number(config.redis.port),
  password: config.redis.password,
  logger: logger,
});

// Export the cache client for use in other services
export default cache;