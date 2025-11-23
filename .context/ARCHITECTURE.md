# CodeZest Auth Service Architecture

This document details the architecture of the `codezest-auth` microservice, which follows **Clean Architecture** principles. This structure ensures separation of concerns, testability, and independence from external frameworks and drivers.

## Architectural Overview

The application is divided into concentric layers. The inner layers contain business rules and are independent of the outer layers. The outer layers contain infrastructure details (database, web framework, etc.) and depend on the inner layers.

### Dependency Rule

**Source code dependencies must only point inward.**
Nothing in an inner circle can know anything at all about something in an outer circle.

## Directory Structure

```
src/
├── common/                 # Shared utilities, constants, and types
│   ├── utils/              # Helper functions (Password, Token, etc.)
│   └── types/              # Shared TypeScript types
├── config/                 # Configuration (Env vars, Logger, Database config)
├── domain/                 # Enterprise Business Rules (The "Heart")
│   ├── entities/           # Core business objects (User, Session)
│   ├── repositories/       # Interfaces for data access (IUserRepository)
│   └── errors/             # Domain-specific error classes
├── application/            # Application Business Rules (Use Cases)
│   ├── services/           # Implementation of business logic (AuthService)
│   ├── dtos/               # Data Transfer Objects (Input/Output definitions)
│   └── mappers/            # Data conversion (Entity <-> DTO)
├── infrastructure/         # Frameworks & Drivers
│   ├── database/           # Database connection and ORM (Prisma)
│   └── repositories/       # Concrete implementation of domain repositories
├── presentation/           # Interface Adapters
│   ├── controllers/        # HTTP Request Handlers
│   ├── routes/             # API Route Definitions
│   └── middleware/         # Express Middleware
├── app.ts                  # App setup
├── server.ts               # Server entry point
└── index.ts                # Main entry point
```

## Layer Details

### 1. Domain Layer (`src/domain`)

This is the innermost layer. It contains the core business logic and is least likely to change when something external changes.

- **Entities**: Plain objects representing business concepts.
- **Repository Interfaces**: Abstract definitions of how to save/retrieve entities.
- **Errors**: Custom error types (e.g., `UnauthorizedError`, `ConflictError`).

### 2. Application Layer (`src/application`)

This layer contains application-specific business rules. It orchestrates the flow of data to and from the entities.

- **Services**: Classes that implement the use cases (e.g., `AuthService.register`). They depend on Repository Interfaces, not concrete implementations.
- **DTOs**: Define the structure of data crossing the API boundary.
- **Mappers**: Transform raw data or DTOs into Domain Entities and vice-versa.

### 3. Infrastructure Layer (`src/infrastructure`)

This layer contains details about the external world.

- **Repositories**: Concrete classes that implement the interfaces defined in the Domain layer. They use the Database (Prisma) to fetch data.
- **Database**: Configuration and connection logic for the database.

### 4. Presentation Layer (`src/presentation`)

This layer handles the interaction with the outside world (HTTP requests).

- **Controllers**: Receive requests, validate input (using DTO schemas), call Application Services, and return responses.
- **Routes**: Map URLs to Controllers.
- **Middleware**: Handle cross-cutting concerns like authentication, logging, and error handling.

### 5. Common (`src/common`)

Contains code that is used across multiple layers but does not contain business rules, such as utility functions for hashing passwords or generating tokens.

## Data Flow Example: User Registration

1. **Request**: POST `/auth/register` hits `src/presentation/routes/auth.routes.ts`.
2. **Controller**: `AuthController.register` receives the request.
   - Validates body using `RegisterDto` schema.
   - Calls `AuthService.register(dto)`.
3. **Service**: `AuthService` (in Application layer):
   - Checks if user exists using `IUserRepository.findByEmail`.
   - Hashes password using `PasswordUtil`.
   - Calls `IUserRepository.create` to save the new user.
4. **Repository**: `UserRepository` (in Infrastructure layer):
   - Implements `IUserRepository`.
   - Uses `prisma.user.create` to save to the DB.
   - Returns the created User entity.
5. **Response**: Data flows back up: Repository -> Service -> Controller -> Client.

## Key Design Decisions

- **Dependency Injection**: Services receive their dependencies (Repositories) via constructor injection. This allows for easy mocking during testing.
- **DTOs with Zod**: We use Zod for runtime validation of DTOs in the Controller layer.
- **Prisma as ORM**: Prisma is used in the Infrastructure layer. The Domain layer should ideally be agnostic of Prisma, but for pragmatism, we may use Prisma-generated types as Entities initially.
