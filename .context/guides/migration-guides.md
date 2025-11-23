# Migration Guides

This document consolidates all migration guides for the CodeZest Auth service and its dependencies.

---

## Table of Contents

1. [Cache Package Migration (v1.0.2)](#cache-package-migration-v102)
2. [DB Package Rename Migration](#db-package-rename-migration)
3. [Schema Changes History](#schema-changes-history)

---

## Cache Package Migration (v1.0.2)

### Overview

Migration guide for updating to `@codezest-academy/codezest-cache@1.0.2` which includes a critical bug fix for the `delPattern` method.

### What Changed in v1.0.2

#### 🐛 Fixed: delPattern Async Race Condition

**The Problem**: The `delPattern` method was returning immediately without waiting for Redis stream completion, causing keys to still exist after deletion.

**The Fix**: Now properly waits for all deletions to complete before returning.

#### ⚠️ Breaking Change

**Return Type Changed**: `Promise<void>` → `Promise<number>`

The method now returns the count of deleted keys for better observability.

### Installation

```bash
npm update @codezest-academy/codezest-cache
```

Or install specific version:

```bash
npm install @codezest-academy/codezest-cache@1.0.2
```

### Code Migration

#### Option 1: No Changes Required (Backward Compatible)

Your existing code will continue to work without modifications:

```typescript
// ✅ This still works - just ignore the return value
await cache.delPattern('user:*');
await cache.delPattern('session:*');
```

#### Option 2: Use Return Value (Recommended)

Take advantage of the new return value for better observability:

```typescript
// ✅ New: Get count of deleted keys
const deletedCount = await cache.delPattern('user:123:*');
logger.info(`Deleted ${deletedCount} user cache entries`);

// Verify deletion succeeded
if (deletedCount === 0) {
  logger.warn('No cache entries found for user:123');
}
```

### Common Use Cases

#### User Logout - Clear All User Sessions

**After** (v1.0.2):

```typescript
async logout(userId: string): Promise<void> {
  const deletedCount = await this.cache.delPattern(`session:${userId}:*`);
  this.logger.info(`Cleared ${deletedCount} sessions for user ${userId}`);

  // Optional: Verify expected count
  if (deletedCount === 0) {
    this.logger.warn(`No sessions found for user ${userId}`);
  }
}
```

#### Cache Invalidation After Update

```typescript
async updateUserProfile(userId: string, data: any): Promise<void> {
  await this.userRepo.update(userId, data);
  const deletedCount = await this.cache.delPattern(`user:${userId}:*`);

  // Now guaranteed to be cleared before returning
  this.logger.debug(`Invalidated ${deletedCount} cache entries for user ${userId}`);
}
```

### Benefits of Upgrading

✅ **No More Race Conditions**: Deletions are guaranteed to complete  
✅ **Better Observability**: Know how many keys were deleted  
✅ **Improved Testing**: Tests are more reliable  
✅ **Better Logging**: Can log deletion counts for debugging  
✅ **Backward Compatible**: Existing code works without changes

### Verification

After updating:

- [ ] Package version is 1.0.2: `npm list @codezest-academy/codezest-cache`
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Tests pass: `npm test`
- [ ] Application starts: `npm run dev` or `npm start`

**Status**: ✅ Completed (2025-11-24)

---

## DB Package Rename Migration

### Overview

The package has been renamed from `@codezest-academy/db` to `@codezest-academy/codezest-db` for better clarity and consistency.

**Date**: November 23, 2025  
**Status**: `@codezest-academy/db` is **DEPRECATED**

### Package Details

| Old Package               | New Package                     | Status        |
| ------------------------- | ------------------------------- | ------------- |
| `@codezest-academy/db`    | `@codezest-academy/codezest-db` | ✅ Active     |
| Versions: v1.0.0 - v1.0.3 | Current: v1.0.5+                | ⚠️ Deprecated |

### Migration Steps

#### 1. Update package.json

**Before:**

```json
{
  "dependencies": {
    "@codezest-academy/db": "^1.0.3"
  }
}
```

**After:**

```json
{
  "dependencies": {
    "@codezest-academy/codezest-db": "^1.0.5"
  }
}
```

#### 2. Update Import Statements

**No changes needed!** The imports remain the same:

```typescript
// These imports work exactly the same
import { prisma } from '@codezest-academy/codezest-db';
import { User, Role } from '@codezest-academy/codezest-db';
import { mongo } from '@codezest-academy/codezest-db/mongo';
```

#### 3. Reinstall Dependencies

```bash
# Remove old package
npm uninstall @codezest-academy/db

# Install new package
npm install @codezest-academy/codezest-db

# Or in one command
npm install @codezest-academy/codezest-db && npm uninstall @codezest-academy/db
```

### What's New in v1.0.5

✅ **Production-Ready Tooling**

- ESLint v9 with TypeScript support
- Prettier for code formatting
- Jest for testing (migrated from Vitest)

✅ **Winston Logger**

- Structured logging in `src/common/logger.ts`
- Production and development modes
- Silent in test environment

✅ **Architecture Documentation**

- Comprehensive architecture guides in `.context/`
- Clean Architecture structure documented
- Naming conventions enforced

✅ **Code Quality**

- 0 lint errors, 0 warnings
- All tests passing
- CI/CD with linting and formatting checks

### Troubleshooting

#### Issue: Package not found

**Solution**: Ensure you have access to the GitHub Packages registry and your `.npmrc` is configured correctly.

#### Issue: Type errors after migration

**Solution**: The package exports are identical. Clear your `node_modules` and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Deprecation Notice

> [!WARNING]  
> **`@codezest-academy/db` is deprecated and will not receive updates.**
>
> Please migrate to `@codezest-academy/codezest-db` as soon as possible.
> All new features and bug fixes will only be published to the new package.

**Status**: ✅ Completed (codezest-auth migrated)

---

## Schema Changes History

### November 2025 - User Role & Profile Updates

These changes were applied to the `@codezest-academy/codezest-db` package.

#### 1. UserRole Enum

Simplified roles to just `USER` and `ADMIN`.

```prisma
enum UserRole {
  USER
  ADMIN
}
```

**Rationale**: Simplified role management. Additional roles can be added later if needed.

#### 2. UserProfile Model

Added occupation and contact details.

```prisma
model UserProfile {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Existing fields
  bio         String?
  avatar      String?
  location    String?
  website     String?

  // NEW FIELDS
  occupation  String?
  company     String?
  phone       String?
  address     String?
  socials     Json?    // { github: string, linkedin: string, twitter: string, etc. }

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Impact**:

- Non-breaking change (all new fields are optional)
- Existing data remains valid
- No migration required for existing services

**Status**: ✅ Applied to `@codezest-academy/codezest-db@1.0.5+`

---

## Related Documentation

- [Cache Package Guide](cache-package-guide.md)
- [DB Package Guide](db-package-guide.md)
- [Schema Update Guide](schema-update-guide.md)

---

**Last Updated**: 2025-11-24  
**Maintained By**: Development Team
