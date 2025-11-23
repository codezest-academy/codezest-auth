# Project Structure Guide

This project follows **Clean Architecture** principles (also known as Hexagonal or Onion Architecture). The goal is to separate concerns, making the system more maintainable, testable, and independent of external frameworks or databases.

## Directory Layout

```
.
├── src/
│   ├── common/             # Shared utilities, constants, and types used across layers
│   ├── config/             # Environment variables and configuration setup
│   ├── domain/             # Enterprise business rules (The "Heart" of the app)
│   ├── application/        # Application business rules (Use Cases)
│   ├── infrastructure/     # External interfaces (Database, Cache, 3rd Party APIs)
│   ├── presentation/       # Entry points (REST API Controllers, Routes)
│   ├── middleware/         # Express middleware (Auth, Logging, Validation)
│   ├── app.ts              # Express app setup
│   ├── server.ts           # Server entry point
│   └── index.ts            # Main entry point
├── tests/                  # Test suites
├── scripts/                # Utility scripts (e.g., seeding, verification)
└── docker-compose.yml      # Local development infrastructure
```

## Detailed Layer Breakdown

### 1. Domain Layer (`src/domain`)

**Dependency Rule**: This layer depends on _nothing_.

- **Entities**: Core business objects (e.g., `User`, `Course`).
- **Repository Interfaces**: Definitions of how to access data, but _not_ the implementation.
- **Errors**: Domain-specific errors.

### 2. Application Layer (`src/application`)

**Dependency Rule**: Depends only on _Domain_.

- **Services**: Orchestrate the flow of data to/from the domain entities. They implement the business use cases.
- **DTOs (Data Transfer Objects)**: Define the shape of data coming in and out of the API.
- **Mappers**: Convert between DTOs and Domain Entities.

### 3. Infrastructure Layer (`src/infrastructure`)

**Dependency Rule**: Depends on _Domain_ and _Application_.

- **Database**: PrismaService singleton (`src/infrastructure/database/prisma.service.ts`) - manages database connections, logging, and health checks.
- **Repositories**: Concrete implementations of the interfaces defined in `src/domain`. This is where the actual database calls happen using PrismaService.
- **Cache**: Redis service implementation.
- **External Services**: Email providers, Payment gateways, etc.

### 4. Presentation Layer (`src/presentation`)

**Dependency Rule**: Depends on _Application_.

- **Controllers**: Handle HTTP requests, validate input, call Application Services, and return responses.
- **Routes**: Define API endpoints and map them to controllers.

### 5. Common & Config

- **`src/config`**: Centralized configuration. **Never** access `process.env` directly in your code; always go through `config/index.ts`.
- **`src/common`**: Helper functions (logger, date utils) that don't belong to a specific business domain.

## Flow of Control

A typical request follows this path:

1. **Request** hits a **Route** (`src/presentation/routes`).
2. Route passes it to a **Controller** (`src/presentation/controllers`).
3. Controller calls an **Application Service** (`src/application/services`).
4. Service uses a **Repository Interface** (`src/domain/repositories`) to get/save data.
5. At runtime, the **Infrastructure Repository** (`src/infrastructure/repositories`) is injected, which talks to the **Database**.
6. Data flows back up: Entity -> Service -> Controller -> **Response**.

## Why this structure?

- **Testability**: You can test the Application layer without a database by mocking the Repository Interfaces.
- **Flexibility**: You can swap out the database (Infrastructure) without changing the business logic (Domain/Application).
- **Maintainability**: Code is organized by function, making it easier to find and fix issues.
