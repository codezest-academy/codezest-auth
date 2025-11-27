# CodeZest Auth Service - Architecture & Design

## Table of Contents

- [Architectural Overview](#architectural-overview)
- [Clean Architecture Layers](#clean-architecture-layers)
- [Directory Structure](#directory-structure)
- [Data Flow Example](#data-flow-example)
- [System-Wide Architecture](#system-wide-architecture)
- [Design Patterns](#design-patterns)
- [Naming Conventions](#naming-conventions)
- [Code Style Enforcement](#code-style-enforcement)

---

## Architectural Overview

This document details the architecture of the `codezest-auth` microservice, which follows **Clean Architecture** principles. This structure ensures separation of concerns, testability, and independence from external frameworks and drivers.

The application is divided into concentric layers. The inner layers contain business rules and are independent of the outer layers. The outer layers contain infrastructure details (database, web framework, etc.) and depend on the inner layers.

### Dependency Rule

**Source code dependencies must only point inward.**
Nothing in an inner circle can know anything at all about something in an outer circle.

---

## Clean Architecture Layers

### Directory Structure

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

### Layer Details

#### 1. Domain Layer (`src/domain`)

This is the innermost layer. It contains the core business logic and is least likely to change when something external changes.

- **Entities**: Plain objects representing business concepts.
- **Repository Interfaces**: Abstract definitions of how to save/retrieve entities.
- **Errors**: Custom error types (e.g., `UnauthorizedError`, `ConflictError`).

**Dependency Rule**: Depends on _nothing_.

#### 2. Application Layer (`src/application`)

This layer contains application-specific business rules. It orchestrates the flow of data to and from the entities.

- **Services**: Classes that implement the use cases (e.g., `AuthService.register`). They depend on Repository Interfaces, not concrete implementations.
- **DTOs**: Define the structure of data crossing the API boundary.
- **Mappers**: Transform raw data or DTOs into Domain Entities and vice-versa.

**Dependency Rule**: Depends only on _Domain_.

#### 3. Infrastructure Layer (`src/infrastructure`)

This layer contains details about the external world.

- **Repositories**: Concrete classes that implement the interfaces defined in the Domain layer. They use the Database (Prisma) to fetch data.
- **Database**: Configuration and connection logic for the database.

**Dependency Rule**: Depends on _Domain_ and _Application_.

#### 4. Presentation Layer (`src/presentation`)

This layer handles the interaction with the outside world (HTTP requests).

- **Controllers**: Receive requests, validate input (using DTO schemas), call Application Services, and return responses.
- **Routes**: Map URLs to Controllers.
- **Middleware**: Handle cross-cutting concerns like authentication, logging, and error handling.

**Dependency Rule**: Depends on _Application_.

#### 5. Common (`src/common`)

Contains code that is used across multiple layers but does not contain business rules, such as utility functions for hashing passwords or generating tokens.

---

## Data Flow Example

### User Registration Flow

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

### Flow of Control

1. **Request** -> **Route** (`src/presentation/routes`)
2. -> **Controller** (`src/presentation/controllers`)
3. -> **Application Service** (`src/application/services`)
4. -> **Repository Interface** (`src/domain/repositories`)
5. -> **Infrastructure Repository** (`src/infrastructure/repositories`) -> **Database**
6. Data flows back up: Entity -> Service -> Controller -> **Response**

---

## System-Wide Architecture

### CodeZest Platform Overview

The CodeZest platform follows a **Microservices Architecture** pattern, emphasizing **SOLID principles**, **Clean Architecture**, and **Event-Driven Communication**.

#### Repository Landscape

| Repository               | Type       | Tech Stack          | Responsibility                    |
| ------------------------ | ---------- | ------------------- | --------------------------------- |
| **Frontends**            |            |                     |                                   |
| `codezest-web`           | Web App    | Next.js / React     | Student learning portal           |
| `codezest-admin`         | Web App    | React / Vite        | Admin & Instructor dashboard      |
| `codezest-mobile`        | Mobile App | React Native        | Mobile learning experience        |
| **Backend Services**     |            |                     |                                   |
| `codezest-auth`          | Service    | Node.js / Express   | Identity, Auth, Profiles          |
| `codezest-api`           | Service    | Node.js / Express   | Core Learning Domain (LMS)        |
| `codezest-payments`      | Service    | Node.js / Express   | Subscriptions, Billing, Invoices  |
| `codezest-notifications` | Service    | Node.js / Express   | Email, Push, In-app notifications |
| `codezest-activity`      | Service    | Node.js / Express   | Analytics, Activity Feeds         |
| **Shared Libs**          |            |                     |                                   |
| `codezest-db`            | Library    | Prisma / TypeScript | Shared Database Schema & Client   |
| `codezest-cache`         | Library    | Redis / TypeScript  | Shared Caching Logic              |

### Architecture Principles

#### SOLID Principles (Applied to Microservices)

- **Single Responsibility Principle (SRP)**: Each service has one clear domain (e.g., Auth handles _only_ identity, not billing).
- **Open/Closed Principle (OCP)**: Services are open for extension (via events/plugins) but closed for modification (core logic stable).
- **Liskov Substitution Principle (LSP)**: API contracts must be respected. Replacing a service version shouldn't break clients.
- **Interface Segregation Principle (ISP)**: Client-specific APIs (BFF pattern) or GraphQL to avoid over-fetching.
- **Dependency Inversion Principle (DIP)**: High-level modules (Domain) should not depend on low-level modules (DB/Infrastructure).

#### 12-Factor App

- **Config**: Stored in environment variables.
- **Backing Services**: Treated as attached resources (DB, Redis).
- **Processes**: Stateless and share-nothing.
- **Disposability**: Fast startup and graceful shutdown.

### Communication Strategy

#### Synchronous Communication (Request/Response)

- **Protocol**: REST (JSON) or GraphQL.
- **Usage**:
  - Frontend -> Backend (API Gateway / Load Balancer).
  - Service -> Service (Only when data is strictly required immediately, e.g., Auth check).
- **Pattern**: API Gateway acts as the single entry point, routing requests to appropriate services.

#### Asynchronous Communication (Event-Driven)

- **Protocol**: Message Queue (RabbitMQ) or Event Stream (Redis Streams / Kafka).
- **Usage**: Decoupling services.
- **Example Flow**:
  1.  User pays for subscription (`codezest-payments`).
  2.  `PaymentSucceeded` event published.
  3.  `codezest-auth` consumes event -> Updates user role to PRO.
  4.  `codezest-notifications` consumes event -> Sends "Welcome to Pro" email.
  5.  `codezest-activity` consumes event -> Logs "User upgraded".

#### Shared Data Strategy

- **`codezest-db`**: A shared library containing the Prisma Schema.
- **Database**: Single physical DB with logical separation (schemas: `auth`, `learning`, etc.) OR separate DBs per service.
  - _Recommendation_: **Separate Schemas** within one Postgres cluster (easier management, strict boundaries enforced by user permissions).

---

## Design Patterns

### Patterns Used in codezest-auth

- **Repository Pattern**: Abstract DB access.
- **Factory Pattern**: Creating complex objects (e.g., different types of Quiz Questions).
- **Strategy Pattern**: Different payment providers (Stripe, PayPal).
- **Observer/Pub-Sub**: Handling domain events.
- **Adapter Pattern**: Integrating third-party services (Email, Payment Gateways).
- **Singleton Pattern**: Database connection management (PrismaService).

### Key Design Decisions

- **Dependency Injection**: Services receive their dependencies (Repositories) via constructor injection. This allows for easy mocking during testing.
- **DTOs with Zod**: We use Zod for runtime validation of DTOs in the Controller layer.
- **Prisma as ORM**: Prisma is used in the Infrastructure layer. The Domain layer should ideally be agnostic of Prisma, but for pragmatism, we may use Prisma-generated types as Entities initially.

---

## Naming Conventions

### Files and Folders

- Use `dot-case` for file names (e.g., `user.profile.ts`, `auth.service.ts`).
- Use `kebab-case` for folder names (e.g., `user-profile`, `auth-service`).
- `index.ts` files are used for barrel exports within directories.

### Code Elements

- **Classes**: `PascalCase` (e.g., `UserService`).
- **Interfaces**: `PascalCase` (e.g., `UserRepository`).
- **Functions/Methods/Vars**: `camelCase` (e.g., `getUserById`, `userName`).
- **Constants**: `camelCase` (e.g., `jwtSecret`, `maxLoginAttempts`).
- **Enums**: `PascalCase` (e.g., `UserRole.Admin`).
- **DTOs**: `PascalCase` + `Dto` suffix (e.g., `CreateUserDto`).
- **Mappers**: `PascalCase` + `Mapper` suffix (e.g., `UserMapper`).
- **Services**: `PascalCase` + `Service` suffix (e.g., `AuthService`).
- **Controllers**: `PascalCase` + `Controller` suffix (e.g., `AuthController`).
- **Repositories**: `PascalCase` + `Repository` suffix (e.g., `UserRepository`).
- **Entities**: `PascalCase` (e.g., `User`).

---

## Code Style Enforcement

### ESLint Naming Convention Rules

To enforce the naming conventions outlined above, the following ESLint rules are applied:

```json
[
  "error",

  // ──────────────────────────────────────────────────────────────
  // 1. General PascalCase for types, classes, enums, etc.
  // ──────────────────────────────────────────────────────────────
  {
    "selector": ["class", "interface", "typeAlias", "enum", "typeParameter"],
    "format": ["PascalCase"],
    "leadingUnderscore": "forbid",
    "trailingUnderscore": "forbid"
  },

  // ──────────────────────────────────────────────────────────────
  // 2. Block I-prefix and "Interface" suffix on interfaces
  // ──────────────────────────────────────────────────────────────
  {
    "selector": "interface",
    "format": ["PascalCase"],
    "custom": {
      "regex": "^(I[^a-z]|.*Interface$)",
      "match": false
    }
  },

  // ──────────────────────────────────────────────────────────────
  // 3. Specific suffixes we DO want (DTO, Service, Controller, etc.)
  // ──────────────────────────────────────────────────────────────
  {
    "selector": "class",
    "suffix": ["Dto"],
    "format": ["PascalCase"],
    "custom": {
      "regex": "Dto$",
      "match": true
    }
  },
  {
    "selector": "class",
    "suffix": [
      "Service",
      "Controller",
      "Repository",
      "Mapper",
      "Guard",
      "Interceptor",
      "Filter",
      "Provider"
    ],
    "format": ["PascalCase"]
  },

  // ──────────────────────────────────────────────────────────────
  // 4. Variables & functions → camelCase (const allowed UPPER too)
  // ──────────────────────────────────────────────────────────────
  {
    "selector": ["variable", "function", "parameter"],
    "format": ["camelCase", "PascalCase"], // PascalCase allowed for React components, etc.
    "leadingUnderscore": "allow"
  },

  // Allow UPPER_CASE only for const variables (classic constants)
  {
    "selector": "variable",
    "modifiers": ["const"],
    "format": ["camelCase", "UPPER_CASE"],
    "leadingUnderscore": "allow"
  },

  // Exported const variables (config objects, etc.) → usually camelCase
  {
    "selector": "variable",
    "modifiers": ["const", "exported"],
    "format": ["camelCase", "UPPER_CASE"]
  },

  // ──────────────────────────────────────────────────────────────
  // 5. Enum members → PascalCase (UserRole.Admin)
  // ──────────────────────────────────────────────────────────────
  {
    "selector": "enumMember",
    "format": ["PascalCase"]
  },

  // ──────────────────────────────────────────────────────────────
  // 6. Properties & methods → camelCase
  // ──────────────────────────────────────────────────────────────
  {
    "selector": [
      "objectLiteralProperty",
      "classProperty",
      "classMethod",
      "objectLiteralMethod",
      "parameterProperty"
    ],
    "format": ["camelCase", "UPPER_CASE"],
    "leadingUnderscore": "allow"
  },

  // ──────────────────────────────────────────────────────────────
  // 7. Optional: Allow _id style private fields (common in Prisma entities)
  // ──────────────────────────────────────────────────────────────
  {
    "selector": "classProperty",
    "modifiers": ["private"],
    "format": ["camelCase"],
    "leadingUnderscore": "require"
  }
]
```

---

**Last Updated**: 2025-11-24  
**Related Documents**:

- [Overview](overview.md)
- [Project Structure](project-structure.md)
- [Domain Entities](domain-entities.md)
