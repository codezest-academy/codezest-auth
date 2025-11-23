# CodeZest Auth Service - Overview

## Project Summary

`codezest-auth` is the authentication and user management microservice for the CodeZest Academy platform. It handles user registration, login, session management, OAuth integrations, and user profile management.

---

## Architecture

The project follows **Clean Architecture** principles to ensure separation of concerns, testability, and maintainability.

### Layers

1.  **Domain Layer** (`src/domain`)
    - **Purpose**: Contains enterprise business rules and logic. Independent of external frameworks.
    - **Contents**: Repository Interfaces (`src/domain/repositories`), Custom Errors (`src/domain/errors`).
    - **Dependencies**: None.

2.  **Application Layer** (`src/application`)
    - **Purpose**: Orchestrates data flow and implements use cases.
    - **Contents**: Services (`src/application/services`), DTOs (`src/application/dtos`).
    - **Dependencies**: Domain Layer.

3.  **Infrastructure Layer** (`src/infrastructure`)
    - **Purpose**: Provides implementations for external interfaces (Database, 3rd party APIs).
    - **Contents**: Concrete Repositories (`src/infrastructure/repositories`), Database Service (`src/infrastructure/database`).
    - **Dependencies**: Domain Layer, Application Layer.

4.  **Presentation Layer** (`src/presentation`)
    - **Purpose**: Handles HTTP requests and responses. Entry point for the application.
    - **Contents**: Controllers (`src/presentation/controllers`), Routes (`src/presentation/routes`), Middleware (`src/presentation/middleware`).
    - **Dependencies**: Application Layer.

5.  **Common** (`src/common`)
    - **Purpose**: Shared utilities and types used across layers.
    - **Contents**: Utils (`src/common/utils`), Types (`src/common/types`).

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database ORM**: Prisma (via `@codezest-academy/db` package)
- **Validation**: Zod
- **Authentication**: JWT (Access & Refresh Tokens)
- **OAuth Strategies**: Google, GitHub (Custom implementation)
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston & Morgan
- **Caching**: Redis (via `@codezest-academy/codezest-cache` package)

---

## Key Patterns & Implementation Details

### Dependency Injection

- Dependencies are injected via **Constructor Injection**.
- **Routes** (`src/presentation/routes`) act as the Composition Root, wiring up Repositories, Services, and Controllers.
- **Example**: `AuthController` depends on `AuthService`, which depends on `IUserRepository`, `ISessionRepository`, etc.

### Repository Pattern

- **Interfaces**: Defined in `src/domain/repositories` (e.g., `IUserRepository`).
- **Implementations**: Defined in `src/infrastructure/repositories` (e.g., `UserRepository` using Prisma).
- **Benefit**: Decouples business logic from the database implementation.

### Data Transfer Objects (DTOs)

- Input validation is handled using **Zod** schemas.
- DTO types are inferred from Zod schemas and located in `src/application/dtos`.

### Database Connection Management

- **PrismaService Singleton**: Centralized database connection management via `src/infrastructure/database/prisma.service.ts`.
- **Features**:
  - Singleton pattern ensures single database connection pool
  - Query logging in development mode
  - Error and warning logging
  - Health check endpoint support
  - Graceful connection/disconnection
- **Usage**: All repositories use `PrismaService.getInstance().client` instead of direct Prisma imports.
- **Benefit**: Better connection pooling, monitoring, and lifecycle management.

### Error Handling

- Global error handling middleware in `src/presentation/middleware/error.middleware.ts`.
- Custom error classes (`AppError`, `NotFoundError`, `ValidationError`) in `src/domain/errors`.
- Async route handlers are wrapped with `asyncHandler` to catch exceptions.

---

## Development Workflow

To add a new feature:

1.  **Domain**: Define repository interfaces if data access is needed.
2.  **Infrastructure**: Implement the repository interfaces.
3.  **Application**: Create/Update Service to implement business logic, using injected repositories. Define DTOs.
4.  **Presentation**: Create/Update Controller to handle HTTP requests. Define Routes and wire up dependencies.

---

## Current State

- **Refactor Complete**: The project has been fully refactored to Clean Architecture, including Application Layer Mappers.
- **Build Status**: Passing (`npm run build`).
- **Test Status**: All tests passing (`npm test`).
- **Integration Tests**: All 12 integration tests passing (including cache tests).

---

## How to Use This Documentation Folder

This `.context/` folder contains comprehensive documentation for the codezest-auth service:

### Quick Navigation

- **this-repo/** - Documentation specific to codezest-auth
  - `overview.md` - This file (project overview)
  - `architecture.md` - Detailed architecture and design patterns
  - `project-structure.md` - File and folder structure
  - `domain-entities.md` - Domain entity documentation
  - `api-reference.md` - API endpoints and usage
  - `test-infrastructure.md` - Testing setup and guidelines
  - `known-issues.md` - Known issues and resolutions

- **project-wide/** - Overall CodeZest platform documentation
  - Multi-service architecture
  - Platform-wide schema (30 models, 5 services)
  - Implementation plans and progress

- **guides/** - How-to guides and troubleshooting
  - Package usage guides (DB, Cache)
  - Redis integration and troubleshooting
  - Migration guides

- **archive/** - Historical reference
  - Resolved bug analyses

### For New Developers

1. Start with this file (`overview.md`) to understand the project
2. Read `architecture.md` for detailed design patterns
3. Check `project-structure.md` for file organization
4. Review `api-reference.md` for API endpoints
5. See `known-issues.md` for any current limitations

### For Resuming Work

1. Check `known-issues.md` for current state
2. Review recent `WALKTHROUGH.md` (in parent folder)
3. Refer to specific guides as needed

---

**Last Updated**: 2025-11-24  
**Status**: Production-ready, all tests passing
