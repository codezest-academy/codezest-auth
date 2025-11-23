# CodeZest Auth Service - Implementation Plan

A production-ready authentication microservice following SOLID principles and industry-standard design patterns.

---

## User Review Required

> [!IMPORTANT] > **Architecture Decisions**
>
> - Using **layered architecture** (Controllers → Services → Repositories) for separation of concerns
> - Implementing **JWT-based authentication** with refresh tokens
> - Using **Zod** for runtime validation instead of class-validator
> - Implementing **Winston + Morgan** for production logging
> - Following **SOLID principles** throughout the codebase

> [!WARNING] > **Database Dependency**
> This service depends on `@codezest-academy/db` package. Ensure the package is:
>
> - Published to GitHub Packages
> - Accessible with proper GitHub token
> - Contains all auth-related models (User, Session, OAuthAccount, etc.)

---

## Proposed Changes

### Core Architecture

#### 1. Layered Architecture (Separation of Concerns)

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Controllers, Routes, Middleware)      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Business Logic Layer            │
│        (Services, Use Cases)            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Data Access Layer               │
│      (Repositories, Prisma)             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│            Database                     │
│         (PostgreSQL)                    │
└─────────────────────────────────────────┘
```

---

### Project Structure

```
codezest-auth/
├── src/
│   ├── config/                    # Configuration files
│   │   ├── database.ts           # Database configuration
│   │   ├── jwt.ts                # JWT configuration
│   │   ├── oauth.ts              # OAuth providers config
│   │   └── logger.ts             # Winston logger config
│   │
│   ├── controllers/               # HTTP request handlers
│   │   ├── auth.controller.ts    # Auth endpoints
│   │   ├── user.controller.ts    # User management
│   │   └── profile.controller.ts # User profile
│   │
│   ├── services/                  # Business logic
│   │   ├── auth.service.ts       # Authentication logic
│   │   ├── user.service.ts       # User management logic
│   │   ├── token.service.ts      # JWT token handling
│   │   ├── email.service.ts      # Email notifications
│   │   └── oauth.service.ts      # OAuth integration
│   │
│   ├── repositories/              # Data access layer
│   │   ├── user.repository.ts    # User CRUD operations
│   │   ├── session.repository.ts # Session management
│   │   └── oauth.repository.ts   # OAuth accounts
│   │
│   ├── middleware/                # Express middleware
│   │   ├── auth.middleware.ts    # JWT verification
│   │   ├── validate.middleware.ts # Zod validation
│   │   ├── error.middleware.ts   # Error handling
│   │   ├── rateLimit.middleware.ts # Rate limiting
│   │   └── logger.middleware.ts  # Request logging
│   │
│   ├── validators/                # Zod schemas
│   │   ├── auth.validator.ts     # Auth request schemas
│   │   ├── user.validator.ts     # User request schemas
│   │   └── profile.validator.ts  # Profile request schemas
│   │
│   ├── types/                     # TypeScript types
│   │   ├── express.d.ts          # Express type extensions
│   │   ├── auth.types.ts         # Auth-related types
│   │   └── common.types.ts       # Shared types
│   │
│   ├── utils/                     # Utility functions
│   │   ├── password.util.ts      # Password hashing
│   │   ├── token.util.ts         # Token generation
│   │   ├── email.util.ts         # Email helpers
│   │   └── errors.util.ts        # Custom error classes
│   │
│   ├── routes/                    # Route definitions
│   │   ├── auth.routes.ts        # Auth routes
│   │   ├── user.routes.ts        # User routes
│   │   └── index.ts              # Route aggregator
│   │
│   ├── di/                        # Dependency Injection
│   │   └── container.ts          # DI container setup
│   │
│   ├── app.ts                     # Express app setup
│   └── server.ts                  # Server entry point
│
├── tests/
│   ├── unit/                      # Unit tests
│   ├── integration/               # Integration tests
│   └── fixtures/                  # Test data
│
├── .env.example
├── .gitignore
├── .npmrc                         # GitHub Packages config
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## SOLID Principles Implementation

### 1. **Single Responsibility Principle (SRP)**

Each class/module has one reason to change:

- **Controllers**: Handle HTTP requests/responses only
- **Services**: Contain business logic
- **Repositories**: Handle data access only
- **Validators**: Validate input data only

**Example:**

```typescript
// ❌ BAD: Controller doing too much
class AuthController {
  async register(req, res) {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await prisma.user.create({ ... });
    const token = jwt.sign({ userId: user.id }, SECRET);
    await sendEmail(user.email, 'Welcome!');
    res.json({ token });
  }
}

// ✅ GOOD: Separation of concerns
class AuthController {
  constructor(
    private authService: AuthService,
    private tokenService: TokenService
  ) {}

  async register(req, res) {
    const user = await this.authService.register(req.body);
    const token = await this.tokenService.generateToken(user);
    res.json({ token });
  }
}
```

---

### 2. **Open/Closed Principle (OCP)**

Open for extension, closed for modification:

**Strategy Pattern for OAuth Providers:**

```typescript
// Base OAuth strategy
interface OAuthStrategy {
  authenticate(code: string): Promise<OAuthUser>;
}

class GoogleOAuthStrategy implements OAuthStrategy {
  async authenticate(code: string): Promise<OAuthUser> {
    // Google-specific implementation
  }
}

class GitHubOAuthStrategy implements OAuthStrategy {
  async authenticate(code: string): Promise<OAuthUser> {
    // GitHub-specific implementation
  }
}

// Easy to add new providers without modifying existing code
class OAuthService {
  private strategies: Map<string, OAuthStrategy>;

  addStrategy(provider: string, strategy: OAuthStrategy) {
    this.strategies.set(provider, strategy);
  }

  async authenticate(provider: string, code: string) {
    const strategy = this.strategies.get(provider);
    return strategy.authenticate(code);
  }
}
```

---

### 3. **Liskov Substitution Principle (LSP)**

Subtypes must be substitutable for their base types:

```typescript
// Base repository interface
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// All repositories follow the same contract
class UserRepository implements IRepository<User> {
  async findById(id: string): Promise<User | null> { ... }
  async create(data: Partial<User>): Promise<User> { ... }
  async update(id: string, data: Partial<User>): Promise<User> { ... }
  async delete(id: string): Promise<void> { ... }
}
```

---

### 4. **Interface Segregation Principle (ISP)**

Clients shouldn't depend on interfaces they don't use:

```typescript
// ❌ BAD: Fat interface
interface IUserService {
  register(data: RegisterDto): Promise<User>;
  login(data: LoginDto): Promise<string>;
  resetPassword(email: string): Promise<void>;
  updateProfile(userId: string, data: ProfileDto): Promise<User>;
  deleteAccount(userId: string): Promise<void>;
}

// ✅ GOOD: Segregated interfaces
interface IAuthService {
  register(data: RegisterDto): Promise<User>;
  login(data: LoginDto): Promise<string>;
  resetPassword(email: string): Promise<void>;
}

interface IUserService {
  updateProfile(userId: string, data: ProfileDto): Promise<User>;
  deleteAccount(userId: string): Promise<void>;
}
```

---

### 5. **Dependency Inversion Principle (DIP)**

Depend on abstractions, not concretions:

```typescript
// ❌ BAD: Direct dependency on Prisma
class AuthService {
  async register(data: RegisterDto) {
    return prisma.user.create({ data });
  }
}

// ✅ GOOD: Depend on abstraction
interface IUserRepository {
  create(data: Partial<User>): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
}

class AuthService {
  constructor(private userRepository: IUserRepository) {}

  async register(data: RegisterDto) {
    return this.userRepository.create(data);
  }
}
```

---

## Design Patterns Implementation

### 1. **Repository Pattern** (Data Access)

Abstracts data access logic from business logic.

#### [NEW] [user.repository.ts](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-auth/src/repositories/user.repository.ts)

```typescript
import { prisma } from "@codezest-academy/db";
import { User, Prisma } from "@codezest-academy/db";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: Prisma.UserCreateInput): Promise<User>;
  update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
  delete(id: string): Promise<void>;
}

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }
}
```

---

### 2. **Factory Pattern** (Token Generation)

Creates objects without specifying exact classes.

#### [NEW] [token.factory.ts](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-auth/src/utils/token.factory.ts)

```typescript
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class TokenFactory {
  static createAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "15m",
      issuer: "codezest-auth",
    });
  }

  static createRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: "7d",
      issuer: "codezest-auth",
    });
  }

  static createEmailVerificationToken(): string {
    return uuidv4();
  }

  static createPasswordResetToken(): string {
    return uuidv4();
  }
}
```

---

### 3. **Strategy Pattern** (OAuth Providers)

Defines family of algorithms, encapsulates each one.

#### [NEW] [oauth.strategy.ts](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-auth/src/services/oauth/oauth.strategy.ts)

```typescript
export interface OAuthUser {
  providerId: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface IOAuthStrategy {
  authenticate(code: string): Promise<OAuthUser>;
}

export class GoogleOAuthStrategy implements IOAuthStrategy {
  async authenticate(code: string): Promise<OAuthUser> {
    // Exchange code for token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const { access_token } = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const userData = await userResponse.json();

    return {
      providerId: userData.id,
      email: userData.email,
      name: userData.name,
      avatar: userData.picture,
    };
  }
}

export class GitHubOAuthStrategy implements IOAuthStrategy {
  async authenticate(code: string): Promise<OAuthUser> {
    // Similar implementation for GitHub
  }
}
```

---

### 4. **Dependency Injection** (Inversion of Control)

Using a DI container for managing dependencies.

#### [NEW] [container.ts](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-auth/src/di/container.ts)

```typescript
import { Container } from "inversify";
import {
  UserRepository,
  IUserRepository,
} from "../repositories/user.repository";
import { AuthService, IAuthService } from "../services/auth.service";
import { TokenService, ITokenService } from "../services/token.service";

const container = new Container();

// Repositories
container.bind<IUserRepository>("UserRepository").to(UserRepository);

// Services
container.bind<IAuthService>("AuthService").to(AuthService);
container.bind<ITokenService>("TokenService").to(TokenService);

export { container };
```

---

### 5. **Middleware Pattern** (Request Processing Pipeline)

#### [NEW] [auth.middleware.ts](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-auth/src/middleware/auth.middleware.ts)

```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../utils/errors.util";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    throw new UnauthorizedError("No token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    throw new UnauthorizedError("Invalid token");
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError("Not authenticated");
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError("Insufficient permissions");
    }

    next();
  };
};
```

---

## Component Details

### Authentication Service

#### [NEW] [auth.service.ts](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-auth/src/services/auth.service.ts)

```typescript
import { injectable, inject } from "inversify";
import bcrypt from "bcryptjs";
import { IUserRepository } from "../repositories/user.repository";
import { ITokenService } from "./token.service";
import { IEmailService } from "./email.service";
import { ConflictError, UnauthorizedError } from "../utils/errors.util";
import { RegisterDto, LoginDto } from "../validators/auth.validator";

export interface IAuthService {
  register(data: RegisterDto): Promise<{ user: User; token: string }>;
  login(
    data: LoginDto
  ): Promise<{ user: User; token: string; refreshToken: string }>;
  verifyEmail(token: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
}

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject("UserRepository") private userRepository: IUserRepository,
    @inject("TokenService") private tokenService: ITokenService,
    @inject("EmailService") private emailService: IEmailService
  ) {}

  async register(data: RegisterDto) {
    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError("User already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: "STUDENT",
    });

    // Generate verification token
    const verificationToken =
      await this.tokenService.createEmailVerificationToken(user.id);

    // Send verification email
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken
    );

    // Generate JWT
    const token = this.tokenService.generateAccessToken(user);

    return { user, token };
  }

  async login(data: LoginDto) {
    // Find user
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Generate tokens
    const token = this.tokenService.generateAccessToken(user);
    const refreshToken = this.tokenService.generateRefreshToken(user);

    // Create session
    await this.sessionRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return { user, token, refreshToken };
  }

  async verifyEmail(token: string) {
    // Implementation
  }

  async requestPasswordReset(email: string) {
    // Implementation
  }

  async resetPassword(token: string, newPassword: string) {
    // Implementation
  }
}
```

---

### Validation Layer (Zod)

#### [NEW] [auth.validator.ts](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-auth/src/validators/auth.validator.ts)

```typescript
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().uuid("Invalid token"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
```

#### [NEW] [validate.middleware.ts](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-auth/src/middleware/validate.middleware.ts)

```typescript
import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ValidationError } from "../utils/errors.util";

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(error.errors);
      }
      next(error);
    }
  };
};
```

---

### Logging (Winston + Morgan)

#### [NEW] [logger.config.ts](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-auth/src/config/logger.ts)

```typescript
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "codezest-auth" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export { logger };
```

#### [NEW] [logger.middleware.ts](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-auth/src/middleware/logger.middleware.ts)

```typescript
import morgan from "morgan";
import { logger } from "../config/logger";

const stream = {
  write: (message: string) => logger.http(message.trim()),
};

export const httpLogger = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  { stream }
);
```

---

### Error Handling

#### [NEW] [errors.util.ts](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-auth/src/utils/errors.util.ts)

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(public errors: any[]) {
    super(400, "Validation failed");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(409, message);
  }
}
```

#### [NEW] [error.middleware.ts](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-auth/src/middleware/error.middleware.ts)

```typescript
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.util";
import { logger } from "../config/logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.error({
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(err instanceof ValidationError && { errors: err.errors }),
    });
  }

  // Unhandled errors
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};
```

---

### Security Features

#### [NEW] [app.ts](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-auth/src/app.ts)

```typescript
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import { httpLogger } from "./middleware/logger.middleware";
import { errorHandler } from "./middleware/error.middleware";
import routes from "./routes";

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
});
app.use("/api/", limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Sanitization
app.use(mongoSanitize());

// Logging
app.use(httpLogger);

// Routes
app.use("/api/v1", routes);

// Error handling
app.use(errorHandler);

export default app;
```

---

## Verification Plan

### Automated Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Coverage report
npm run test:coverage
```

**Test Coverage Goals:**

- Services: 90%+
- Repositories: 85%+
- Middleware: 80%+
- Overall: 85%+

### Manual Verification

1. **Authentication Flow**

   - Register new user → verify email sent
   - Login with credentials → receive JWT
   - Access protected route with JWT → success
   - Access protected route without JWT → 401 error

2. **OAuth Flow**

   - Initiate Google OAuth → redirect to Google
   - Complete OAuth → user created/logged in
   - Repeat with GitHub OAuth

3. **Password Reset Flow**

   - Request password reset → email sent
   - Use reset token → password updated
   - Login with new password → success

4. **Rate Limiting**

   - Make 100+ requests in 15 minutes → rate limited

5. **Error Handling**
   - Send invalid data → proper validation errors
   - Trigger server error → 500 with proper logging

### API Documentation

Generate Swagger documentation:

```bash
npm run docs:generate
```

Access at: `http://localhost:3000/api-docs`

---

## Dependencies

```json
{
  "dependencies": {
    "@codezest-academy/db": "latest",
    "express": "^4.18.2",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.22.4",
    "winston": "^3.11.0",
    "morgan": "^1.10.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5",
    "express-mongo-sanitize": "^2.2.0",
    "inversify": "^6.0.2",
    "reflect-metadata": "^0.2.1",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/morgan": "^1.9.9",
    "@types/cors": "^2.8.17",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "@types/supertest": "^6.0.2",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1"
  }
}
```

---

## Environment Variables

```bash
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OAuth - Google
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/v1/auth/oauth/google/callback

# OAuth - GitHub
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
GITHUB_REDIRECT_URI=http://localhost:3001/api/v1/auth/oauth/github/callback

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@codezest.com

# Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info

# GitHub Packages (for @codezest-academy/db)
GITHUB_TOKEN=ghp_your_token
```
