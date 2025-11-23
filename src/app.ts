import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import { config } from './config';
import { httpLogger } from './presentation/middleware/logger.middleware';
import { errorHandler, notFoundHandler } from './presentation/middleware/error.middleware';
import { apiLimiter } from './presentation/middleware/rateLimit.middleware';
import routes from './presentation/routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.security.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
app.use('/api', apiLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Logging
app.use(httpLogger);

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// ... imports

// API Routes
app.use(`/api/${config.apiVersion}`, routes);

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
