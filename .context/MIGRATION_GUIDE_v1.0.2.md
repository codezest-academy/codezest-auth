# Migration Guide: codezest-cache v1.0.2

## Overview

This guide helps you update your services to use the latest version of `@codezest-academy/codezest-cache` (v1.0.2) which includes a critical bug fix for the `delPattern` method.

---

## What Changed in v1.0.2

### 🐛 Fixed: delPattern Async Race Condition

**The Problem**: The `delPattern` method was returning immediately without waiting for Redis stream completion, causing keys to still exist after deletion.

**The Fix**: Now properly waits for all deletions to complete before returning.

### ⚠️ Breaking Change

**Return Type Changed**: `Promise<void>` → `Promise<number>`

The method now returns the count of deleted keys for better observability.

---

## Installation

### Update the Package

```bash
npm update @codezest-academy/codezest-cache
```

Or install specific version:

```bash
npm install @codezest-academy/codezest-cache@1.0.2
```

### Verify Installation

```bash
npm list @codezest-academy/codezest-cache
```

Expected output:

```
@codezest-academy/codezest-cache@1.0.2
```

---

## Code Migration

### Option 1: No Changes Required (Backward Compatible)

Your existing code will continue to work without modifications:

```typescript
// ✅ This still works - just ignore the return value
await cache.delPattern('user:*');
await cache.delPattern('session:*');
```

### Option 2: Use Return Value (Recommended)

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

---

## Common Use Cases

### 1. User Logout - Clear All User Sessions

**Before** (v1.0.1):

```typescript
async logout(userId: string): Promise<void> {
  await this.cache.delPattern(`session:${userId}:*`);
  // Hope it worked! 🤞
}
```

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

### 2. Cache Invalidation After Update

**Before** (v1.0.1):

```typescript
async updateUserProfile(userId: string, data: any): Promise<void> {
  await this.userRepo.update(userId, data);
  await this.cache.delPattern(`user:${userId}:*`);
  // Race condition: Cache might not be cleared yet!
}
```

**After** (v1.0.2):

```typescript
async updateUserProfile(userId: string, data: any): Promise<void> {
  await this.userRepo.update(userId, data);
  const deletedCount = await this.cache.delPattern(`user:${userId}:*`);

  // Now guaranteed to be cleared before returning
  this.logger.debug(`Invalidated ${deletedCount} cache entries for user ${userId}`);
}
```

### 3. Bulk Operations with Verification

**Before** (v1.0.1):

```typescript
async clearExpiredTokens(): Promise<void> {
  await this.cache.delPattern('token:expired:*');
  // No way to know if any were deleted
}
```

**After** (v1.0.2):

```typescript
async clearExpiredTokens(): Promise<number> {
  const deletedCount = await this.cache.delPattern('token:expired:*');

  if (deletedCount > 0) {
    this.logger.info(`Cleared ${deletedCount} expired tokens`);
  }

  return deletedCount;
}
```

### 4. Testing - Verify Cleanup

**Before** (v1.0.1):

```typescript
afterEach(async () => {
  await cache.delPattern('test:*');
  // Hope it's clean! 🤞
});

it('should work', async () => {
  // Test might fail due to race condition
});
```

**After** (v1.0.2):

```typescript
afterEach(async () => {
  const deletedCount = await cache.delPattern('test:*');
  console.log(`Cleaned up ${deletedCount} test keys`);
  // Guaranteed clean before next test
});

it('should work', async () => {
  // No more race conditions! ✅
});
```

---

## TypeScript Type Updates

If you have custom type definitions, update them:

### Before

```typescript
interface CacheService {
  delPattern(pattern: string): Promise<void>;
}
```

### After

```typescript
interface CacheService {
  delPattern(pattern: string): Promise<number>;
}
```

---

## Testing Your Migration

### 1. Update Package

```bash
npm update @codezest-academy/codezest-cache
```

### 2. Run Type Check

```bash
npx tsc --noEmit
```

No errors should appear (backward compatible).

### 3. Run Tests

```bash
npm test
```

All tests should pass without changes.

### 4. Optional: Add Verification

Update your code to use the return value where helpful:

```typescript
// Example: In your cache service wrapper
async invalidateUser(userId: string): Promise<void> {
  const count = await this.cache.delPattern(`user:${userId}:*`);
  this.logger.info(`Invalidated ${count} cache entries for user ${userId}`);
}
```

---

## Example: codezest-auth Service

### File: `src/infrastructure/cache/cache.service.ts`

**Before**:

```typescript
async invalidateUserSessions(userId: string): Promise<void> {
  await this.client.delPattern(`session:${userId}:*`);
}

async invalidateUserCache(userId: string): Promise<void> {
  await this.client.delPattern(`user:${userId}:*`);
}
```

**After** (with improvements):

```typescript
async invalidateUserSessions(userId: string): Promise<number> {
  const deletedCount = await this.client.delPattern(`session:${userId}:*`);
  this.logger.info(`Invalidated ${deletedCount} sessions for user ${userId}`);
  return deletedCount;
}

async invalidateUserCache(userId: string): Promise<number> {
  const deletedCount = await this.client.delPattern(`user:${userId}:*`);
  this.logger.debug(`Cleared ${deletedCount} cache entries for user ${userId}`);
  return deletedCount;
}
```

### File: `tests/integration/cache.test.ts`

**Before**:

```typescript
it('should invalidate user cache', async () => {
  await cache.set('user:123:profile', { name: 'John' });
  await cache.set('user:123:settings', { theme: 'dark' });

  await cache.delPattern('user:123:*');

  // Might fail due to race condition!
  expect(await cache.get('user:123:profile')).toBeNull();
});
```

**After**:

```typescript
it('should invalidate user cache', async () => {
  await cache.set('user:123:profile', { name: 'John' });
  await cache.set('user:123:settings', { theme: 'dark' });

  const deletedCount = await cache.delPattern('user:123:*');

  // Now reliable!
  expect(deletedCount).toBe(2);
  expect(await cache.get('user:123:profile')).toBeNull();
  expect(await cache.get('user:123:settings')).toBeNull();
});
```

---

## Rollback Plan

If you encounter issues, you can rollback:

```bash
npm install @codezest-academy/codezest-cache@1.0.1
```

However, note that v1.0.1 has the race condition bug, so rollback is not recommended.

---

## Benefits of Upgrading

✅ **No More Race Conditions**: Deletions are guaranteed to complete  
✅ **Better Observability**: Know how many keys were deleted  
✅ **Improved Testing**: Tests are more reliable  
✅ **Better Logging**: Can log deletion counts for debugging  
✅ **Backward Compatible**: Existing code works without changes

---

## Verification Checklist

After updating, verify:

- [ ] Package version is 1.0.2: `npm list @codezest-academy/codezest-cache`
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Tests pass: `npm test`
- [ ] Application starts: `npm run dev` or `npm start`
- [ ] Cache operations work correctly in development
- [ ] Optional: Update code to use return values for better logging

---

## Support

If you encounter issues:

1. Check the [Bug Analysis](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-cache/.context/CACHE_DELPATTERN_BUG_ANALYSIS.md)
2. Review the [Fix Guide](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-cache/.context/DELPATTERN_FIX_GUIDE.md)
3. Check GitHub Actions for publish status
4. Verify `.npmrc` is configured for GitHub Packages

---

## Quick Reference

### Update Command

```bash
npm update @codezest-academy/codezest-cache
```

### Backward Compatible Usage

```typescript
await cache.delPattern('pattern:*'); // Still works!
```

### New Usage (Recommended)

```typescript
const count = await cache.delPattern('pattern:*');
console.log(`Deleted ${count} keys`);
```

---

**Version**: 1.0.2  
**Release Date**: 2025-11-24  
**Migration Difficulty**: Easy (backward compatible)  
**Recommended**: ✅ Upgrade immediately
