# CI/CD Workflows

This directory contains GitHub Actions workflows for automated CI/CD.

## Workflows

### 🧪 CI (`ci.yml`)

Runs on every push and pull request to `main` and `develop` branches.

**Jobs:**

- **Test & Lint**: Runs linting and tests with coverage reporting
- **Build**: Builds the TypeScript project and uploads artifacts

**Required Secrets:**

- `CODECOV_TOKEN` (optional): For uploading coverage reports to Codecov

---

### 🐳 Build (`build.yml`)

Builds and pushes Docker images to GitHub Container Registry.

**Triggers:**

- Push to `main` branch
- Version tags (`v*`)
- Manual workflow dispatch

**Features:**

- Multi-platform builds (linux/amd64, linux/arm64)
- Automatic tagging (branch, SHA, semver, latest)
- Build caching for faster builds
- Artifact attestation

**Required Secrets:**

- `GITHUB_TOKEN` (automatically provided)

---

### 🚀 Deploy (`deploy.yml`)

Placeholder workflow for deployment automation.

**Triggers:**

- Manual workflow dispatch with environment and version inputs

**Inputs:**

- `environment`: staging or production
- `version`: Docker image tag to deploy

**Note:** This is a placeholder. Configure actual deployment steps based on your infrastructure (Kubernetes, Cloud Run, ECS, etc.).

## Setup Instructions

1. **Enable GitHub Actions** in your repository settings
2. **Configure secrets** (if using Codecov):
   - Go to Settings → Secrets and variables → Actions
   - Add `CODECOV_TOKEN` if you want coverage reporting
3. **Push to GitHub** to trigger the workflows
4. **Monitor workflows** in the Actions tab

## Image Registry

Docker images are published to:

```
ghcr.io/<owner>/codezest-auth:<tag>
```

To pull images:

```bash
docker pull ghcr.io/<owner>/codezest-auth:latest
```
