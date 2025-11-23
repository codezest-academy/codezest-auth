# Known Issues

This document tracks known issues, bugs, and limitations in the `codezest-auth` service and its dependencies.

## Table of Contents

- [Active Issues](#active-issues)
- [Resolved Issues](#resolved-issues)
- [Workarounds](#workarounds)

---

## Active Issues

_No active issues at this time._ ✅

All previously identified issues have been resolved. See [Resolved Issues](#resolved-issues) below.

---

## Resolved Issues

### 1. Cache `delPattern` Inconsistency

**Status**: ✅ Resolved  
**Severity**: Low  
**Component**: `@codezest-academy/codezest-cache` (External Dependency)  
**Resolved Version**: v1.0.2  
**Resolved Date**: 2025-11-24

#### Description

The `delPattern` method in the `@codezest-academy/codezest-cache` library exhibited inconsistent behavior when deleting keys by pattern. It sometimes:

- Deleted only one of the matching keys
- Deleted none of the matching keys
- Worked correctly (inconsistent success rate)

#### Root Cause

The method was returning immediately without waiting for the Redis stream to complete, causing a race condition where keys might not be deleted yet when the method returned.

#### Resolution

**Package Update**: Upgraded to `@codezest-academy/codezest-cache@1.0.2`

The fix properly wraps the stream handling in a Promise and waits for all deletions to complete before returning. The method now also returns the count of deleted keys for better observability.

**Changes Made**:

- Updated package: `npm update @codezest-academy/codezest-cache`
- Unskipped test in [tests/integration/cache.test.ts](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-auth/tests/integration/cache.test.ts#L52-L70)
- Added verification for return value (deleted key count)

**Test Results**: ✅ All 12 integration tests passing

#### Related Documentation

- [Bug Analysis](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-auth/.context/CACHE_DELPATTERN_BUG_ANALYSIS.md)
- [Migration Guide](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-auth/.context/MIGRATION_GUIDE_v1.0.2.md)

---

### 2. Auth Login Test Failure (P2002 Session Token Collision)

**Status**: ✅ Resolved  
**Severity**: High  
**Component**: Integration Tests  
**Resolved Date**: 2025-11-24  
**Resolution**: Session cleanup in `beforeEach` hook

#### Description

Integration tests for the login endpoint were failing with a 400 Bad Request error when `NODE_ENV=test` was set. The error was a Prisma P2002 unique constraint violation on `Session.token`.

#### Root Cause

Two distinct issues:

1. **Missing Environment Variables**: `.env.test` was incomplete, missing JWT secrets and other required config variables
2. **Session Token Collision**: Both registration and login tests created sessions with refresh tokens. When tests ran sequentially, JWT tokens generated at the same timestamp would collide on the unique `token` field in the `Session` table

#### Resolution

**Fix 1: Complete `.env.test`**

```bash
# Added all required environment variables
JWT_SECRET=test-jwt-secret-key-for-testing-only
JWT_REFRESH_SECRET=test-jwt-refresh-secret-key-for-testing-only
# ... and other required vars
```

**Fix 2: Session Cleanup Between Tests**

```typescript
beforeEach(async () => {
  // Clean up sessions between tests to prevent token collisions
  await prisma.session.deleteMany();
  // ... rest of setup
});
```

**Fix 3: Comprehensive Database Cleanup**

```typescript
beforeAll(async () => {
  await prismaService.connect();
  // Delete in order respecting foreign key constraints
  await prisma.session.deleteMany();
  await prisma.emailVerification.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.user.deleteMany();
});
```

#### Related Documentation

- [Auth Login Test Fix Walkthrough](file:///Users/cvs/.gemini/antigravity/brain/1f9651a8-9bb4-4926-ace9-a5f99f655dfa/walkthrough.md)
- [Test Infrastructure](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-auth/.context/TEST_INFRASTRUCTURE.md)

---

## Workarounds

### Redis FLUSHALL Command in Production

**Issue**: Production `redis.conf` disables dangerous commands like `FLUSHALL` for security.  
**Impact**: Cannot clear entire Redis cache in production environment.

**Workaround**:

- Use separate `redis.test.conf` for test environment that allows `FLUSHALL`
- In production, delete keys by pattern or individually
- Implement cache namespace strategy for bulk deletions

**Configuration**:

```yaml
# docker-compose.test.yml
redis-test:
  volumes:
    - ./redis.test.conf:/usr/local/etc/redis/redis.conf
```

---

## Reporting New Issues

When reporting a new issue, please include:

1. **Title**: Brief, descriptive summary
2. **Status**: 🔴 Open / 🟡 In Progress / ✅ Resolved
3. **Severity**: Critical / High / Medium / Low
4. **Component**: Affected service or dependency
5. **Description**: Detailed explanation of the issue
6. **Reproduction Steps**: How to reproduce the issue
7. **Impact**: What functionality is affected
8. **Workaround**: Temporary solution if available
9. **Related Files**: Links to relevant code

---

## Issue Status Legend

- 🔴 **Open**: Issue identified, not yet resolved
- 🟡 **In Progress**: Actively being worked on
- ✅ **Resolved**: Issue fixed and verified
- ⚠️ **Blocked**: Waiting on external dependency or decision

---

**Last Updated**: 2025-11-24  
**Maintained By**: Development Team
