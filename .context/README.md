# .context - Documentation Hub

Welcome to the `.context` folder for the **codezest-auth** service. This folder contains comprehensive documentation organized for easy navigation and context retrieval.

---

## 📁 Folder Structure

```
.context/
├── README.md                    # 👈 You are here - Navigation guide
├── WALKTHROUGH.md               # Recent work summary
│
├── this-repo/                   # codezest-auth specific documentation
│   ├── overview.md              # Project overview & tech stack
│   ├── architecture.md          # Architecture & design patterns
│   ├── project-structure.md     # File and folder structure
│   ├── domain-entities.md       # Domain layer documentation
│   ├── api-reference.md         # API endpoints and usage
│   ├── test-infrastructure.md   # Testing setup and guidelines
│   └── known-issues.md          # Known issues and resolutions
│
├── project-wide/                # Overall CodeZest platform
│   ├── platform-overview.md     # Complete platform schema (30 models, 5 services)
│   ├── implementation-plan.md   # Implementation checklist
│   ├── progress-tracker.md      # Progress tracking
│   └── schema-alignment.md      # Cross-service schema alignment
│
├── guides/                      # How-to guides & troubleshooting
│   ├── db-package-guide.md      # Using @codezest-academy/codezest-db
│   ├── cache-package-guide.md   # Using @codezest-academy/codezest-cache
│   ├── redis-integration.md     # Redis setup and integration
│   ├── redis-troubleshooting.md # Redis troubleshooting guide
│   ├── schema-update-guide.md   # How to update database schema
│   └── migration-guides.md      # Package and schema migrations
│
└── archive/                     # Historical reference
    └── cache-delpattern-bug.md  # Resolved cache bug analysis
```

---

## 🚀 Quick Start

### For New Developers

1. **Start Here**: [this-repo/overview.md](this-repo/overview.md) - Understand the project
2. **Architecture**: [this-repo/architecture.md](this-repo/architecture.md) - Learn the design patterns
3. **Structure**: [this-repo/project-structure.md](this-repo/project-structure.md) - Navigate the codebase
4. **API**: [this-repo/api-reference.md](this-repo/api-reference.md) - Explore the endpoints
5. **Issues**: [this-repo/known-issues.md](this-repo/known-issues.md) - Check current limitations

### For Resuming Work

1. **Recent Work**: [WALKTHROUGH.md](WALKTHROUGH.md) - See what was done recently
2. **Current Issues**: [this-repo/known-issues.md](this-repo/known-issues.md) - Check active issues
3. **Guides**: [guides/](guides/) - Find specific how-to guides

### For Understanding the Platform

1. **Platform Overview**: [project-wide/platform-overview.md](project-wide/platform-overview.md) - Complete system architecture
2. **Schema**: [project-wide/schema-alignment.md](project-wide/schema-alignment.md) - Cross-service data models
3. **Progress**: [project-wide/progress-tracker.md](project-wide/progress-tracker.md) - Implementation status

---

## 📚 Documentation Categories

### This Repo (`this-repo/`)

Documentation specific to the **codezest-auth** microservice.

| File                                                       | Purpose                                    | When to Read                    |
| ---------------------------------------------------------- | ------------------------------------------ | ------------------------------- |
| [overview.md](this-repo/overview.md)                       | Project summary, tech stack, current state | First time setup, onboarding    |
| [architecture.md](this-repo/architecture.md)               | Clean Architecture layers, design patterns | Understanding code organization |
| [project-structure.md](this-repo/project-structure.md)     | File and folder layout                     | Navigating the codebase         |
| [domain-entities.md](this-repo/domain-entities.md)         | Domain layer entities and business logic   | Working with domain models      |
| [api-reference.md](this-repo/api-reference.md)             | API endpoints, request/response formats    | Integrating with the API        |
| [test-infrastructure.md](this-repo/test-infrastructure.md) | Testing setup, patterns, guidelines        | Writing tests                   |
| [known-issues.md](this-repo/known-issues.md)               | Active and resolved issues                 | Troubleshooting                 |

### Project-Wide (`project-wide/`)

Documentation for the overall **CodeZest platform** (multi-service architecture).

| File                                                          | Purpose                                          | When to Read                  |
| ------------------------------------------------------------- | ------------------------------------------------ | ----------------------------- |
| [platform-overview.md](project-wide/platform-overview.md)     | Complete platform schema (30 models, 5 services) | Understanding the full system |
| [implementation-plan.md](project-wide/implementation-plan.md) | Implementation checklist and roadmap             | Planning new features         |
| [progress-tracker.md](project-wide/progress-tracker.md)       | Current implementation status                    | Checking what's done          |
| [schema-alignment.md](project-wide/schema-alignment.md)       | Cross-service schema coordination                | Working with shared data      |

### Guides (`guides/`)

How-to guides, troubleshooting, and migration documentation.

| File                                                        | Purpose                           | When to Read                        |
| ----------------------------------------------------------- | --------------------------------- | ----------------------------------- |
| [db-package-guide.md](guides/db-package-guide.md)           | Using the shared database package | Setting up database access          |
| [cache-package-guide.md](guides/cache-package-guide.md)     | Using the shared cache package    | Implementing caching                |
| [redis-integration.md](guides/redis-integration.md)         | Redis setup and configuration     | Setting up Redis locally/production |
| [redis-troubleshooting.md](guides/redis-troubleshooting.md) | Common Redis issues and solutions | Debugging Redis problems            |
| [schema-update-guide.md](guides/schema-update-guide.md)     | How to update database schema     | Making schema changes               |
| [migration-guides.md](guides/migration-guides.md)           | Package and schema migrations     | Upgrading dependencies              |

### Archive (`archive/`)

Historical reference for resolved issues and deprecated documentation.

| File                                                       | Purpose                                  |
| ---------------------------------------------------------- | ---------------------------------------- |
| [cache-delpattern-bug.md](archive/cache-delpattern-bug.md) | Technical analysis of resolved cache bug |

---

## 🔍 Finding What You Need

### By Task

- **Setting up the project**: [this-repo/overview.md](this-repo/overview.md)
- **Understanding the architecture**: [this-repo/architecture.md](this-repo/architecture.md)
- **Adding a new feature**: [this-repo/architecture.md](this-repo/architecture.md) → Development Workflow
- **Writing tests**: [this-repo/test-infrastructure.md](this-repo/test-infrastructure.md)
- **Debugging an issue**: [this-repo/known-issues.md](this-repo/known-issues.md)
- **Setting up Redis**: [guides/redis-integration.md](guides/redis-integration.md)
- **Updating database schema**: [guides/schema-update-guide.md](guides/schema-update-guide.md)
- **Migrating packages**: [guides/migration-guides.md](guides/migration-guides.md)

### By Component

- **Database**: [guides/db-package-guide.md](guides/db-package-guide.md), [guides/schema-update-guide.md](guides/schema-update-guide.md)
- **Cache**: [guides/cache-package-guide.md](guides/cache-package-guide.md), [guides/redis-integration.md](guides/redis-integration.md)
- **API**: [this-repo/api-reference.md](this-repo/api-reference.md)
- **Domain**: [this-repo/domain-entities.md](this-repo/domain-entities.md)
- **Testing**: [this-repo/test-infrastructure.md](this-repo/test-infrastructure.md)

---

## 📝 Document Maintenance

### When to Update

- **this-repo/**: When making changes to codezest-auth architecture or features
- **project-wide/**: When adding services or changing platform-wide schemas
- **guides/**: When updating dependencies or discovering new troubleshooting solutions
- **archive/**: When resolving issues (move from known-issues to archive)

### How to Update

1. Edit the relevant markdown file
2. Update the "Last Updated" date at the bottom
3. Commit with a descriptive message (e.g., `docs: update Redis troubleshooting guide`)

---

## 🎯 Best Practices

### For AI Agents

```bash
# Quick context retrieval
cat .context/this-repo/overview.md          # Current state
cat .context/this-repo/known-issues.md      # Active issues
cat .context/guides/[specific-guide].md     # Specific guidance
```

### For Developers

- **Keep it updated**: Documentation is only useful if it's current
- **Link between docs**: Use relative links to connect related documentation
- **Be specific**: Include code examples and exact commands
- **Track changes**: Note what changed and when in "Last Updated" sections

---

## 📊 Documentation Stats

- **Total Files**: 20 (down from 23 - consolidated for clarity)
- **this-repo/**: 7 files
- **project-wide/**: 4 files
- **guides/**: 6 files
- **archive/**: 1 file
- **Root**: 2 files (README + WALKTHROUGH)

---

## 🔗 External Resources

- **GitHub Repository**: [codezest-auth](https://github.com/codezest-academy/codezest-auth)
- **DB Package**: [@codezest-academy/codezest-db](https://github.com/codezest-academy/codezest-db)
- **Cache Package**: [@codezest-academy/codezest-cache](https://github.com/codezest-academy/codezest-cache)

---

**Last Updated**: 2025-11-24  
**Maintained By**: Development Team  
**Status**: Active, all documentation current
