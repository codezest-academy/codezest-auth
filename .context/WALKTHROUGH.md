# CodeZest Auth Service Walkthrough

I have successfully implemented the `codezest-auth` microservice following the planned architecture and SOLID principles.

## 🏗️ Implementation Summary

### 1. Core Infrastructure

- **Project Setup**: Initialized TypeScript project with strict configuration.
- **Configuration**: Centralized config loader with environment validation.
- **Logging**: Implemented structured logging using Winston and Morgan.
- **Error Handling**: Created custom error classes and global error middleware.

### 2. Architecture Layers

- **Repositories**: Implemented data access layer for `User`, `Session`, `OAuthAccount`, `UserProfile`, etc.
- **Services**: Implemented business logic for `AuthService`, `UserService`, and `OAuthService`.
- **Controllers**: Created controllers to handle HTTP requests and map to services.
- **Routes**: Defined API routes with validation and authentication middleware.

### 3. Key Features

- **JWT Authentication**: Implemented access and refresh token flow.
- **OAuth Integration**: Added Google and GitHub strategies with account linking.
- **Validation**: Used Zod for robust runtime request validation.
- **Security**: Added rate limiting, Helmet, and CORS configuration.

## 🚀 How to Start

1. **Install Dependencies**
   Ensure you have your `GITHUB_TOKEN` exported to access the private `@codezest-academy/db` package.

   ```bash
   export GITHUB_TOKEN=your_github_token
   npm install
   ```

2. **Setup Environment**
   Copy the example environment file and update it with your credentials.

   ```bash
   cp .env.example .env
   ```

   _Make sure to update `DATABASE_URL`, `JWT_SECRET`, and OAuth credentials._

3. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🧪 Verification Steps

To verify the implementation, you can use Postman or curl to test the endpoints:

1. **Register a User**

   ```bash
   curl -X POST http://localhost:3001/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Password123!","name":"Test User"}'
   ```

2. **Login**

   ```bash
   curl -X POST http://localhost:3001/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Password123!"}'
   ```

3. **Get Profile (Protected)**
   ```bash
   curl -X GET http://localhost:3001/api/v1/users/profile \
     -H "Authorization: Bearer <your_access_token>"
   ```

## 📁 Project Structure

```
src/
├── config/         # Configuration & Logger
├── controllers/    # Request Handlers
├── middleware/     # Auth, Validation, Error Handling
├── repositories/   # Data Access Layer
├── routes/         # API Route Definitions
├── services/       # Business Logic
├── utils/          # Helpers (Password, Token)
├── validators/     # Zod Schemas
├── app.ts          # Express App Setup
└── server.ts       # Entry Point
```
