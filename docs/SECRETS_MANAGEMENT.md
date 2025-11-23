# Secrets Management & Repository Structure Guide

Complete guide for managing secrets, environment variables, and repository structure for the CodeZest Auth microservice.

## 📋 Table of Contents

- [Current State Analysis](#current-state-analysis)
- [Repository Structure Strategy](#repository-structure-strategy)
- [Secrets Management Best Practices](#secrets-management-best-practices)
- [Implementation Guide](#implementation-guide)
- [Security Checklist](#security-checklist)

---

## Current State Analysis

### ✅ What's Already Good

1. **`.env.example`** exists with all required variables documented
2. **`.gitignore`** properly excludes `.env` files
3. **Docker Compose** uses environment variable substitution
4. **GitHub Actions** workflows are configured

### ⚠️ What Needs Improvement

1. No `.env` file structure for different environments
2. Docker Compose hardcodes some values
3. No secrets management documentation
4. Missing production-ready configuration

---

## Repository Structure Strategy

### Option 1: Single Public Repository ✅ RECOMMENDED

**Best for**: Open-source projects, portfolio projects, community-driven development

```
codezest-auth/ (PUBLIC)
├── .env.example          # Template with dummy values
├── .env                  # Local dev (gitignored)
├── .env.test             # Test environment (gitignored)
├── docker-compose.yml    # Uses env vars
├── .github/
│   └── workflows/        # CI/CD with GitHub Secrets
└── docs/
    └── DEPLOYMENT.md     # Deployment guide
```

**Secrets Storage**:

- ✅ Local development: `.env` file (gitignored)
- ✅ CI/CD: GitHub Secrets
- ✅ Production: Environment variables in hosting platform (Vercel, Railway, AWS, etc.)

**Pros**:

- Simple to manage
- Good for portfolio/open-source
- Community contributions easier

**Cons**:

- All code is public
- Requires careful secret management

---

### Option 2: Public Code + Private Config Repository

**Best for**: Commercial projects with open-source code but private deployment configs

```
codezest-auth/ (PUBLIC)
├── .env.example
├── docker-compose.yml
└── README.md

codezest-auth-config/ (PRIVATE)
├── .env.production
├── .env.staging
├── docker-compose.prod.yml
├── k8s/
│   ├── secrets.yaml
│   └── configmap.yaml
└── terraform/
```

**Pros**:

- Code is open-source
- Deployment configs are private
- Separation of concerns

**Cons**:

- More complex to manage
- Need to sync between repos

---

### Option 3: Monorepo with Private Deployment

**Best for**: Enterprise, private commercial projects

```
codezest/ (PRIVATE)
├── services/
│   ├── auth/
│   ├── courses/
│   └── payments/
├── infrastructure/
│   ├── terraform/
│   ├── k8s/
│   └── docker-compose/
├── .env.production
└── .github/
    └── workflows/
```

**Pros**:

- Full control
- Centralized secrets
- Easy cross-service development

**Cons**:

- Not open-source
- Harder to share code publicly

---

## Secrets Management Best Practices

### 1. Environment-Based Configuration

Create separate env files for each environment:

```bash
.env                    # Local development (gitignored)
.env.example           # Template (committed)
.env.test              # Testing (gitignored)
.env.staging           # Staging (never committed)
.env.production        # Production (never committed)
```

### 2. Docker Compose Secrets

#### Development (docker-compose.yml)

```yaml
version: '3.8'

services:
  auth-service:
    build:
      context: .
      args:
        GITHUB_TOKEN: ${GITHUB_TOKEN}
    ports:
      - '${PORT:-8081}:${PORT:-8081}'
    env_file:
      - .env
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER:-codezest}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-devpassword}
      POSTGRES_DB: ${DB_NAME:-codezest_dev}
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### Production (docker-compose.prod.yml)

```yaml
version: '3.8'

services:
  auth-service:
    image: ghcr.io/${GITHUB_REPOSITORY}:latest
    ports:
      - '8081:8081'
    environment:
      - NODE_ENV=production
    secrets:
      - jwt_secret
      - jwt_refresh_secret
      - db_password
    env_file:
      - .env.production
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8081/health']
      interval: 30s
      timeout: 10s
      retries: 3

secrets:
  jwt_secret:
    external: true
  jwt_refresh_secret:
    external: true
  db_password:
    external: true
```

### 3. GitHub Actions Secrets

#### How to Add GitHub Secrets

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each secret individually

#### Required Secrets for CI/CD

```
# Automatically provided
GITHUB_TOKEN

# For Tests (optional, will use defaults if not set)
TEST_JWT_SECRET
TEST_JWT_REFRESH_SECRET

# For Docker Build (if using Docker Hub)
DOCKER_USERNAME
DOCKER_PASSWORD

# For Deployment (add when ready)
PRODUCTION_DATABASE_URL
PRODUCTION_JWT_SECRET
PRODUCTION_JWT_REFRESH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
SMTP_USER
SMTP_PASSWORD
```

#### Updated CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: codezest_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Generate Prisma Client
        run: npm run db:generate

      - name: Run tests
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://test:test@localhost:5432/codezest_test
          JWT_SECRET: ${{ secrets.TEST_JWT_SECRET || 'test-secret' }}
          JWT_REFRESH_SECRET: ${{ secrets.TEST_JWT_REFRESH_SECRET || 'test-refresh' }}
        run: npm run test:coverage
```

### 4. Production Deployment Secrets

#### Platform-Specific Examples

**Vercel**:

```bash
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add JWT_REFRESH_SECRET production
```

**Railway**:

```bash
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="your-secret"
```

**AWS ECS/Fargate**:

```json
{
  "secrets": [
    {
      "name": "DATABASE_URL",
      "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-url"
    },
    {
      "name": "JWT_SECRET",
      "valueFrom": "arn:aws:secretsmanager:region:account:secret:jwt-secret"
    }
  ]
}
```

**Kubernetes**:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: auth-secrets
type: Opaque
data:
  jwt-secret: <base64-encoded-value>
  jwt-refresh-secret: <base64-encoded-value>
  db-password: <base64-encoded-value>
```

---

## Implementation Guide

### Step 1: Create Local Environment File

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your local development values:

```bash
# .env (Local Development)
NODE_ENV=development
PORT=8081
DATABASE_URL=postgresql://codezest:devpassword@localhost:5432/codezest_dev
JWT_SECRET=dev-secret-change-in-production-use-openssl-rand
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
GOOGLE_CLIENT_ID=your-dev-google-client-id
GOOGLE_CLIENT_SECRET=your-dev-google-client-secret
GITHUB_CLIENT_ID=your-dev-github-client-id
GITHUB_CLIENT_SECRET=your-dev-github-client-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=dev@example.com
SMTP_PASSWORD=dev-app-password
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
GITHUB_TOKEN=ghp_your_github_token_for_private_packages
```

### Step 2: Update Docker Compose

Replace your current `docker-compose.yml`:

```yaml
version: '3.8'

services:
  auth-service:
    build:
      context: .
      args:
        GITHUB_TOKEN: ${GITHUB_TOKEN}
    ports:
      - '${PORT:-8081}:${PORT:-8081}'
    env_file:
      - .env
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER:-codezest}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-devpassword}
      POSTGRES_DB: ${DB_NAME:-codezest_dev}
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USER:-codezest}']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### Step 3: Generate Secure Production Secrets

**Generate strong secrets for production**:

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate JWT refresh secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 4: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:

```
TEST_JWT_SECRET=<generated-secret>
TEST_JWT_REFRESH_SECRET=<generated-secret>
```

### Step 5: Verify .gitignore

Ensure your `.gitignore` includes:

```
# Environment variables
.env
.env.local
.env.*.local
.env.production
.env.staging
```

### Step 6: Test Locally

```bash
# Start services
docker-compose up

# Or without Docker
npm run dev
```

---

## Security Checklist

### ✅ Pre-Commit Checklist

- [ ] No `.env` files committed
- [ ] No hardcoded secrets in code
- [ ] `.env.example` is up to date
- [ ] `.gitignore` includes all env files
- [ ] No API keys in docker-compose.yml
- [ ] No passwords in configuration files
- [ ] All secrets use environment variables

### ✅ GitHub Repository Checklist

- [ ] GitHub Secrets configured
- [ ] Branch protection enabled for `main`
- [ ] Require PR reviews before merging
- [ ] Require status checks to pass
- [ ] Secret scanning enabled
- [ ] Dependabot alerts enabled
- [ ] No secrets in commit history

### ✅ Production Deployment Checklist

- [ ] All secrets rotated from development values
- [ ] Strong JWT secrets (32+ characters, randomly generated)
- [ ] Database credentials secured
- [ ] OAuth credentials for production domain
- [ ] SMTP credentials configured
- [ ] CORS origins restricted to production domains
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Environment variables validated on startup
- [ ] Secrets stored in platform-specific secret manager

---

## Environment Variables Reference

### Critical Secrets (NEVER commit)

| Variable               | Description                  | How to Generate           |
| ---------------------- | ---------------------------- | ------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string | Provided by database host |
| `JWT_SECRET`           | JWT signing secret           | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET`   | Refresh token secret         | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret          | Google Cloud Console      |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret          | GitHub Developer Settings |
| `SMTP_PASSWORD`        | Email service password       | Email provider            |

### Public Configuration (can be in code)

| Variable           | Description     | Example                  |
| ------------------ | --------------- | ------------------------ |
| `NODE_ENV`         | Environment     | `production`             |
| `PORT`             | Server port     | `8081`                   |
| `API_VERSION`      | API version     | `v1`                     |
| `GOOGLE_CLIENT_ID` | Google OAuth ID | Public ID from console   |
| `GITHUB_CLIENT_ID` | GitHub OAuth ID | Public ID from settings  |
| `FRONTEND_URL`     | Frontend URL    | `https://yourdomain.com` |

---

## Common Pitfalls to Avoid

### ❌ DON'T

1. **Don't commit `.env` files**

   ```bash
   # BAD - Never do this
   git add .env
   ```

2. **Don't hardcode secrets**

   ```typescript
   // BAD
   const JWT_SECRET = 'my-secret-key';

   // GOOD
   const JWT_SECRET = process.env.JWT_SECRET;
   ```

3. **Don't use weak secrets**

   ```bash
   # BAD
   JWT_SECRET=secret123

   # GOOD
   JWT_SECRET=8xK9mP2nQ5rT7vW1yZ3aB6cD4eF8gH0jK
   ```

4. **Don't share secrets in chat/email**
   - Use secure secret sharing tools (1Password, LastPass, etc.)

### ✅ DO

1. **Use environment variables**

   ```typescript
   const config = {
     jwtSecret: process.env.JWT_SECRET,
     database: process.env.DATABASE_URL,
   };
   ```

2. **Validate required secrets on startup**

   ```typescript
   const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
   requiredEnvVars.forEach((varName) => {
     if (!process.env[varName]) {
       throw new Error(`Missing required env var: ${varName}`);
     }
   });
   ```

3. **Use different secrets per environment**
   - Development: Simple, easy to remember
   - Production: Strong, randomly generated

---

## Troubleshooting

### Issue: GitHub Actions can't access secrets

**Solution**: Ensure secrets are added at the repository level, not organization level (unless needed).

### Issue: Docker Compose can't find .env file

**Solution**: Ensure `.env` is in the same directory as `docker-compose.yml`.

### Issue: Tests failing with "JWT_SECRET is undefined"

**Solution**: Add fallback values in test workflow:

```yaml
env:
  JWT_SECRET: ${{ secrets.TEST_JWT_SECRET || 'test-secret-fallback' }}
```

---

## Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Docker Secrets](https://docs.docker.com/engine/swarm/secrets/)
- [12-Factor App Config](https://12factor.net/config)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Environment Variables Best Practices](https://blog.bitsrc.io/best-practices-for-using-environment-variables-in-nodejs-6b0c2c3a5a0a)

---

## Quick Start Checklist

For a new developer setting up the project:

1. [ ] Clone the repository
2. [ ] Copy `.env.example` to `.env`
3. [ ] Fill in your local development values
4. [ ] Run `docker-compose up` or `npm run dev`
5. [ ] Verify the app starts successfully
6. [ ] Run tests: `npm test`
7. [ ] Never commit `.env` file

For production deployment:

1. [ ] Generate strong secrets using `openssl rand -base64 32`
2. [ ] Add secrets to your hosting platform
3. [ ] Update OAuth redirect URIs to production domain
4. [ ] Configure CORS for production domain
5. [ ] Enable HTTPS
6. [ ] Test all endpoints
7. [ ] Monitor logs for any secret-related errors
