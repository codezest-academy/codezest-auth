# 🧪 Test Infrastructure Setup

This project uses a dedicated Docker Compose configuration for running integration tests to ensure isolation from the development environment and reliable test execution.

## 🏗️ Architecture

The test environment consists of two services defined in `docker-compose.test.yml`:

1.  **Test Database (`db-test`)**:
    - **Image**: `postgres:15-alpine`
    - **Port**: `5433` (Mapped to host to avoid conflict with dev `5432`)
    - **Database**: `testdb`
    - **User/Pass**: `testuser` / `testpassword`

2.  **Test Cache (`redis-test`)**:
    - **Image**: `redis:7-alpine`
    - **Port**: `6380` (Mapped to host to avoid conflict with dev `6379`)
    - **Password**: `test-redis-password`
    - **Config**: Mounts the production `redis.conf` but overrides the password via command line.

## 🚀 Running Tests

We have added npm scripts to automate the setup and teardown of this environment.

### Automated Flow (Recommended)

Simply run:

```bash
npm run test
```

This command will automatically:

1.  **Pre-test**: Start the test containers (`test:env:up`) and push the Prisma schema to the test database.
2.  **Test**: Run the Jest test suite.
3.  **Post-test**: Stop and remove the test containers (`test:env:down`).

### Manual Control

If you want to keep the test environment running for debugging or faster iteration (watch mode):

1.  **Start Environment**:
    ```bash
    npm run test:env:up
    ```
2.  **Run Tests**:
    ```bash
    npm run test:unit        # Run unit tests only
    npm run test:integration # Run integration tests only
    # or
    npx jest --watch
    ```
3.  **Stop Environment**:
    ```bash
    npm run test:env:down
    ```

## ⚙️ Configuration

### Environment Variables (`.env.test`)

The test environment is configured via `.env.test`, which points to the test ports:

```ini
REDIS_HOST=127.0.0.1
REDIS_PORT=6380
REDIS_PASSWORD=test-redis-password
DATABASE_URL=postgresql://testuser:testpassword@localhost:5433/testdb?schema=public
```

### Jest Setup

- **`tests/env-setup.ts`**: Loads `.env.test` before any test code runs.
- **`tests/setup.ts`**: Mocks global configurations and services.
