# CodeZest Auth Service

A production-ready authentication microservice for CodeZest Academy, built with Node.js, Express, and TypeScript.

## 🚀 Features

- **Authentication**: JWT-based auth with access and refresh tokens
- **OAuth**: Google and GitHub integration with account linking
- **Security**: Rate limiting, Helmet headers, CORS, and data sanitization
- **Validation**: Runtime request validation using Zod
- **Logging**: Structured logging with Winston and Morgan
- **Architecture**: Layered architecture following SOLID principles

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (via `@codezest-academy/db`)
- **ORM**: Prisma
- **Validation**: Zod
- **Logging**: Winston
- **Testing**: Jest

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd codezest-auth
   ```

2. **Install dependencies**

   ```bash
   # Ensure you have GITHUB_TOKEN set for private packages
   export GITHUB_TOKEN=your_token
   npm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate deploy
   ```

## 🚦 Running the App

**Development Mode**

```bash
npm run dev
```

**Production Build**

```bash
npm run build
npm start
```

## 🧪 Quality Assurance

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🏗️ Architecture

The project follows a layered architecture:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Repositories**: Handle data access
- **Middleware**: Handle cross-cutting concerns (auth, validation, logging)

## 📚 API Documentation

Interactive API documentation is available via Swagger UI.

- **Swagger UI**: [http://localhost:8081/api/docs](http://localhost:8081/api/docs)
- **Static Docs**: See [API.md](./API.md) for offline reference.

## 🔒 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/verify-email` - Verify email address
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### User Management

- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `PUT /api/v1/users/preferences` - Update user preferences
- `DELETE /api/v1/users/account` - Delete user account

### OAuth

- `GET /api/v1/auth/oauth/google` - Google login
- `GET /api/v1/auth/oauth/github` - GitHub login
- `GET /api/v1/auth/oauth/linked` - Get linked providers
- `DELETE /api/v1/auth/oauth/:provider` - Unlink provider

## 📝 License

MIT
