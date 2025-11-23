# CodeZest System Architecture & Design

## 1. Executive Summary

This document outlines the production-ready architecture for the CodeZest platform. The system follows a **Microservices Architecture** pattern, emphasizing **SOLID principles**, **Clean Architecture**, and **Event-Driven Communication**.

The goal is to build a scalable, maintainable, and robust platform that supports web and mobile clients, with clear separation of concerns and high cohesion within services.

---

## 2. System Overview

The system is composed of **5 Core Backend Services**, **3 Frontend Applications**, and **Shared Infrastructure Libraries**.

### 2.1 Repository Landscape

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

> **Note**: Subscription logic is fully encapsulated within `codezest-payments`. There is no separate repository for subscriptions.

---

## 3. Architecture Principles

We will strictly adhere to the following principles to ensure a "Solid" foundation.

### 3.1 SOLID Principles (Applied to Microservices)

- **Single Responsibility Principle (SRP)**: Each service has one clear domain (e.g., Auth handles _only_ identity, not billing).
- **Open/Closed Principle (OCP)**: Services are open for extension (via events/plugins) but closed for modification (core logic stable).
- **Liskov Substitution Principle (LSP)**: API contracts must be respected. Replacing a service version shouldn't break clients.
- **Interface Segregation Principle (ISP)**: Client-specific APIs (BFF pattern) or GraphQL to avoid over-fetching.
- **Dependency Inversion Principle (DIP)**: High-level modules (Domain) should not depend on low-level modules (DB/Infrastructure).

### 3.2 Project Structure & Clean Architecture

This project follows **Clean Architecture** principles (also known as Hexagonal or Onion Architecture).

#### Directory Layout

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

#### Detailed Layer Breakdown

**1. Domain Layer (`src/domain`)**
_Dependency Rule_: Depends on _nothing_.

- **Entities**: Core business objects (e.g., `User`, `Course`).
- **Repository Interfaces**: Definitions of how to access data (e.g., `UserRepositoryInterface`).
- **Errors**: Domain-specific errors.

**2. Application Layer (`src/application`)**
_Dependency Rule_: Depends only on _Domain_.

- **Services**: Orchestrate data flow. Implement business use cases.
- **DTOs**: Data Transfer Objects (e.g., `CreateUserDto`).
- **Mappers**: Convert between DTOs and Entities.

**3. Infrastructure Layer (`src/infrastructure`)**
_Dependency Rule_: Depends on _Domain_ and _Application_.

- **Database**: `PrismaService` singleton.
- **Repositories**: Concrete implementations (e.g., `UserRepository`).
- **External Services**: Payment gateways, Email providers.

**4. Presentation Layer (`src/presentation`)**
_Dependency Rule_: Depends on _Application_.

- **Controllers**: Handle HTTP requests (e.g., `UserController`).
- **Routes**: Define API endpoints.

**5. Common & Config**

- **`src/config`**: Centralized config. No direct `process.env` access.
- **`src/common`**: Helper functions, logger, utils.

#### Flow of Control

1. **Request** -> **Route** (`src/presentation/routes`)
2. -> **Controller** (`src/presentation/controllers`)
3. -> **Application Service** (`src/application/services`)
4. -> **Repository Interface** (`src/domain/repositories`)
5. -> **Infrastructure Repository** (`src/infrastructure/repositories`) -> **Database**
6. Data flows back up: Entity -> Service -> Controller -> **Response**

#### Naming Conventions

- **Files and Folders**:
  - Use `dot-case` for file names (e.g., `user.profile.ts`, `auth.service.ts`).
  - Use `kebab-case` for folder names (e.g., `user-profile`, `auth-service`).
  - `index.ts` files are used for barrel exports within directories.
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

### 3.3 12-Factor App

- **Config**: Stored in environment variables.
- **Backing Services**: Treated as attached resources (DB, Redis).
- **Processes**: Stateless and share-nothing.
- **Disposability**: Fast startup and graceful shutdown.

---

## 4. Communication Strategy

A hybrid approach using **Synchronous** for reads/critical writes and **Asynchronous** for side effects.

### 4.1 Synchronous Communication (Request/Response)

- **Protocol**: REST (JSON) or GraphQL.
- **Usage**:
  - Frontend -> Backend (API Gateway / Load Balancer).
  - Service -> Service (Only when data is strictly required immediately, e.g., Auth check).
- **Pattern**: API Gateway acts as the single entry point, routing requests to appropriate services.

### 4.2 Asynchronous Communication (Event-Driven)

- **Protocol**: Message Queue (RabbitMQ) or Event Stream (Redis Streams / Kafka).
- **Usage**: Decoupling services.
- **Example Flow**:
  1.  User pays for subscription (`codezest-payments`).
  2.  `PaymentSucceeded` event published.
  3.  `codezest-auth` consumes event -> Updates user role to PRO.
  4.  `codezest-notifications` consumes event -> Sends "Welcome to Pro" email.
  5.  `codezest-activity` consumes event -> Logs "User upgraded".

### 4.3 Shared Data Strategy

- **`codezest-db`**: A shared library containing the Prisma Schema.
- **Database**: Single physical DB with logical separation (schemas: `auth`, `learning`, etc.) OR separate DBs per service.
  - _Recommendation_: **Separate Schemas** within one Postgres cluster (easier management, strict boundaries enforced by user permissions).

---

## 5. Detailed Service Architecture

### 5.1 `codezest-auth` (Identity Provider)

- **Responsibilities**: Registration, Login, OAuth, Token Management, User Profile Management.
- **Tech**: Express, Passport.js/Lucia, JWT.
- **Events Published**: `UserCreated`, `UserLoggedIn`, `ProfileUpdated`.
- **Events Consumed**: `SubscriptionUpdated` (to update roles).

### 5.2 `codezest-api` (Learning Core)

- **Responsibilities**: Managing Languages, Modules, Materials, Assignments, Quizzes.
- **Tech**: Express, complex aggregation queries.
- **Events Published**: `AssignmentSubmitted`, `QuizCompleted`, `CourseStarted`.
- **Events Consumed**: `UserCreated` (create default enrollments).

### 5.3 `codezest-payments`

- **Responsibilities**: Stripe/PayPal integration, Webhook handling, Invoice generation.
- **Tech**: Express, Stripe SDK.
- **Events Published**: `PaymentSucceeded`, `PaymentFailed`, `SubscriptionCanceled`.

### 5.4 `codezest-notifications`

- **Responsibilities**: Sending Emails (SendGrid/AWS SES), Push Notifications, In-App Alerts.
- **Tech**: BullMQ (Job Queue) for reliable delivery.
- **Events Consumed**: Listens to _all_ relevant business events (`UserCreated`, `PaymentSucceeded`, etc.).

### 5.5 `codezest-activity`

- **Responsibilities**: Analytics, User Activity Feed, Gamification (XP/Badges).
- **Tech**: TimescaleDB or similar for time-series data (optional), or just Postgres.
- **Events Consumed**: All user action events.

---

## 6. Infrastructure & Deployment

### 6.1 Containerization

- **Docker**: Each service has its own `Dockerfile`.
- **Docker Compose**: For local development, spinning up all services + DB + Redis.

### 6.2 CI/CD Pipeline

- **GitHub Actions**:
  - Linting & Testing (Unit/Integration).
  - Build Docker Images.
  - Publish Shared Libs (`codezest-db`) to GitHub Packages.

### 6.3 API Gateway (Optional but Recommended)

- Use **Nginx** or a dedicated Gateway service (e.g., Kong, or a simple Express Gateway) to route `/auth/*` to Auth Service, `/api/*` to Learning Service, etc.

---

## 7. Implementation Roadmap

1.  **Foundation**: Finalize `codezest-db` (Shared Schema).
2.  **Core Services**: Build `auth` and `api` (Learning) first.
3.  **Communication**: Set up Redis/RabbitMQ for event bus.
4.  **Frontend Integration**: Connect `web` to `auth` and `api`.
5.  **Expansion**: Add `payments`, `notifications`, `activity`.

## 8. Design Patterns to Use

- **Repository Pattern**: Abstract DB access.
- **Factory Pattern**: Creating complex objects (e.g., different types of Quiz Questions).
- **Strategy Pattern**: Different payment providers (Stripe, PayPal).
- **Observer/Pub-Sub**: Handling domain events.
- **Adapter Pattern**: Integrating third-party services (Email, Payment Gateways).

---

## 9. Code Style Enforcement

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
