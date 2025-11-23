# Entity Integration Progress

## Overview

We are migrating the codebase from direct Prisma types to rich domain entities while keeping a clean‑architecture separation. The work is organized into phases and tracked here for easy context retrieval.

## Completed Milestones

## Current Status

- **Phase**: Phase 6: Refactor Roles & Profile
- **Status**: Completed (Pending DB Update)
- **Last Updated**: 2025-11-23

## Completed Tasks

- [x] Create Response DTOs
  - [x] UserResponseDto
  - [x] AuthResponseDto
- [x] Create DTO Mappers
  - [x] UserDtoMapper
- [x] Update Controllers
  - [x] AuthController
  - [x] UserController
  - [x] OAuthController
- [x] Cleanup Domain Entities (Remove toPublic)
- [x] Update Tests
- [x] Update Documentation

## Next Steps

1.  **Final Review**: Ensure all documentation is aligned.
2.  **Deployment Prep**: Prepare for deployment/release.

## Timeline (estimated)

| Phase                       | Duration | Status      |
| --------------------------- | -------- | ----------- |
| Phase 2 – Interfaces & Impl | 1‑2 days | In progress |
| Phase 3 – Service Refactor  | 1‑2 days | Pending     |
| Phase 4 – Tests Update      | 1 day    | Pending     |
| Phase 5 – Verification      | 0.5 day  | Pending     |

## Open Items / Questions

- **User password handling** – Domain `User` now stores `password: string | null`. Ensure all services handle the `null` case gracefully.
- **Email verification flow** – Updated entity now includes `verified`/`verifiedAt`. Verify any business logic that previously assumed an `expiresAt` field.

---

_This file is kept up‑to‑date so you can quickly retrieve the current state of the integration task._
