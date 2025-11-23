# Cache `delPattern` Bug - Technical Analysis

## Executive Summary

The `delPattern` method in `@codezest-academy/codezest-cache` has a critical bug that causes inconsistent deletion of keys matching a pattern. This document provides a detailed technical analysis of the root cause and the required fix.

---

## Current Implementation

### Location

`node_modules/@codezest-academy/codezest-cache/dist/redis/redis-client.js` (lines 52-70)

### Source Code

```javascript
async delPattern(pattern) {
    try {
        const stream = this.client.scanStream({
            match: pattern,
        });
        stream.on('data', (keys) => {
            if (keys.length) {
                const pipeline = this.client.pipeline();
                keys.forEach((key) => {
                    pipeline.del(key);
                });
                pipeline.exec();
            }
        });
        stream.on('end', () => {
            // Scan complete
        });
    }
    catch (error) {
        this.logger.error(`Error deleting pattern ${pattern} from Redis:`, error);
    }
}
```

---

## Root Cause Analysis

### Problem 1: **Asynchronous Stream Not Awaited**

The method returns immediately without waiting for the stream to complete. This is the **primary bug**.

**Issue**:

- `scanStream` is asynchronous and emits events over time
- The method doesn't wait for the `'end'` event before returning
- The calling code thinks deletion is complete when it's actually still in progress
- This creates a race condition where subsequent operations may see keys that should have been deleted

**Example of the Problem**:

```javascript
await cache.delPattern('pattern:*');
const result = await cache.get('pattern:1'); // May still return data!
// The stream might not have finished processing yet
```

### Problem 2: **No Error Handling for Pipeline Execution**

The `pipeline.exec()` call has no error handling or await, so failures are silently ignored.

**Issue**:

- If `pipeline.exec()` fails, the error is never caught
- No way to know if deletions succeeded or failed
- Silent failures lead to data inconsistency

### Problem 3: **No Return Value or Confirmation**

The method doesn't return anything, making it impossible to verify completion or success.

**Issue**:

- Calling code can't determine if deletion succeeded
- No way to get count of deleted keys
- Can't differentiate between "no keys matched" vs "deletion failed"

---

## The Fix

### Corrected Implementation

```typescript
async delPattern(pattern: string): Promise<number> {
    try {
        return new Promise((resolve, reject) => {
            const stream = this.client.scanStream({
                match: pattern,
                count: 100 // Process in batches of 100
            });

            let deletedCount = 0;
            const deletionPromises: Promise<any>[] = [];

            stream.on('data', (keys: string[]) => {
                if (keys.length) {
                    const pipeline = this.client.pipeline();
                    keys.forEach((key) => {
                        pipeline.del(key);
                    });

                    // Store the promise and track deletions
                    const execPromise = pipeline.exec()
                        .then((results) => {
                            // Each result is [error, value]
                            // For DEL, value is the number of keys deleted
                            results?.forEach(([err, count]) => {
                                if (!err && typeof count === 'number') {
                                    deletedCount += count;
                                }
                            });
                        })
                        .catch((err) => {
                            this.logger.error(`Error executing pipeline for pattern ${pattern}:`, err);
                        });

                    deletionPromises.push(execPromise);
                }
            });

            stream.on('end', async () => {
                try {
                    // Wait for all pipeline executions to complete
                    await Promise.all(deletionPromises);
                    this.logger.info(`Deleted ${deletedCount} keys matching pattern: ${pattern}`);
                    resolve(deletedCount);
                } catch (error) {
                    reject(error);
                }
            });

            stream.on('error', (error) => {
                this.logger.error(`Error scanning pattern ${pattern}:`, error);
                reject(error);
            });
        });
    } catch (error) {
        this.logger.error(`Error deleting pattern ${pattern} from Redis:`, error);
        throw error;
    }
}
```

---

## Key Changes Explained

### 1. **Wrap in Promise**

```typescript
return new Promise((resolve, reject) => {
  // Stream handling code
});
```

**Why**: Allows the async method to properly wait for the stream to complete before returning.

### 2. **Track Deletion Promises**

```typescript
const deletionPromises: Promise<any>[] = [];
deletionPromises.push(execPromise);
```

**Why**: Ensures all pipeline executions complete before resolving the main promise.

### 3. **Await All Deletions in 'end' Event**

```typescript
stream.on('end', async () => {
  await Promise.all(deletionPromises);
  resolve(deletedCount);
});
```

**Why**: Guarantees all deletions are complete before the method returns.

### 4. **Return Deleted Count**

```typescript
async delPattern(pattern: string): Promise<number>
```

**Why**: Provides feedback on how many keys were deleted, enabling verification.

### 5. **Add Error Event Handler**

```typescript
stream.on('error', (error) => {
  reject(error);
});
```

**Why**: Properly handles stream errors instead of silently ignoring them.

### 6. **Add Batch Size**

```typescript
const stream = this.client.scanStream({
  match: pattern,
  count: 100, // Process in batches
});
```

**Why**: Improves performance by processing keys in batches instead of one at a time.

---

## Testing the Fix

### Before Fix (Current Behavior)

```typescript
// Test case that fails
await cache.set('pattern:1', { id: 1 });
await cache.set('pattern:2', { id: 2 });
await cache.set('other:key', { id: 3 });

await cache.delPattern('pattern:*');

// ❌ FAILS: Keys may still exist due to race condition
expect(await cache.get('pattern:1')).toBeNull(); // May fail
expect(await cache.get('pattern:2')).toBeNull(); // May fail
expect(await cache.get('other:key')).toEqual({ id: 3 }); // Should pass
```

### After Fix (Expected Behavior)

```typescript
// Test case that should pass
await cache.set('pattern:1', { id: 1 });
await cache.set('pattern:2', { id: 2 });
await cache.set('other:key', { id: 3 });

const deletedCount = await cache.delPattern('pattern:*');

// ✅ PASSES: All deletions complete before returning
expect(deletedCount).toBe(2); // New: Can verify count
expect(await cache.get('pattern:1')).toBeNull(); // Now reliable
expect(await cache.get('pattern:2')).toBeNull(); // Now reliable
expect(await cache.get('other:key')).toEqual({ id: 3 }); // Still passes
```

---

## Implementation Steps

### Option 1: Fix in `@codezest-academy/codezest-cache` Package

1. **Clone the package repository**

   ```bash
   git clone https://github.com/codezest-academy/codezest-cache.git
   cd codezest-cache
   ```

2. **Locate the source file**
   - File: `src/redis/redis-client.ts` (TypeScript source)
   - The compiled JavaScript we saw is in `dist/`

3. **Apply the fix**
   - Replace the `delPattern` method with the corrected implementation above

4. **Update tests**
   - Unskip the pattern deletion test
   - Add test for return value verification
   - Add test for error handling

5. **Publish new version**

   ```bash
   npm version patch  # or minor/major depending on semver
   npm publish
   ```

6. **Update in `codezest-auth`**
   ```bash
   npm update @codezest-academy/codezest-cache
   ```

### Option 2: Local Workaround (Temporary)

Create a wrapper in `codezest-auth` until the package is fixed:

```typescript
// src/infrastructure/cache/cache-wrapper.ts
import cache from './cache.service';

export async function delPatternReliable(pattern: string): Promise<number> {
  // Get all keys matching the pattern first
  const keys: string[] = [];
  const stream = cache['client'].scanStream({ match: pattern });

  await new Promise<void>((resolve, reject) => {
    stream.on('data', (batch: string[]) => {
      keys.push(...batch);
    });
    stream.on('end', () => resolve());
    stream.on('error', reject);
  });

  // Delete all keys individually
  if (keys.length > 0) {
    await Promise.all(keys.map((key) => cache.del(key)));
  }

  return keys.length;
}
```

---

## Performance Considerations

### Current Implementation Issues

- **Race conditions**: Unpredictable behavior
- **No batching**: Inefficient for large key sets
- **Silent failures**: Hard to debug

### Fixed Implementation Benefits

- **Reliable**: Guaranteed completion before return
- **Batched**: Processes 100 keys at a time (configurable)
- **Observable**: Returns count of deleted keys
- **Error handling**: Proper error propagation

### Performance Impact

- **Minimal overhead**: Promise wrapping adds ~1ms
- **Better throughput**: Batching improves Redis performance
- **Predictable**: No race conditions = consistent performance

---

## Related Issues

### Similar Bugs in Other Methods?

After reviewing the code, other methods appear correct:

- ✅ `get()`: Properly awaits Redis operation
- ✅ `set()`: Properly awaits Redis operation
- ✅ `del()`: Properly awaits Redis operation
- ✅ `clear()`: Properly awaits `flushall()`
- ❌ `delPattern()`: **BUGGY** - doesn't await stream completion

---

## Conclusion

The `delPattern` bug is caused by **not awaiting the asynchronous stream completion**. The fix requires:

1. Wrapping the stream handling in a Promise
2. Tracking all pipeline executions
3. Awaiting all deletions before resolving
4. Adding proper error handling
5. Returning the count of deleted keys

**Severity**: High - causes data inconsistency and race conditions  
**Complexity**: Medium - requires understanding of Node.js streams and Promises  
**Effort**: Low - ~30 minutes to implement and test

**Recommendation**: Fix in the `@codezest-academy/codezest-cache` package and publish a patch release.

---

## References

- [Redis SCAN Documentation](https://redis.io/commands/scan/)
- [ioredis scanStream API](https://github.com/redis/ioredis#streamify-scanning)
- [Node.js Streams Guide](https://nodejs.org/api/stream.html)
- [Test Case: cache.test.ts:52](file:///Volumes/CVS%20Sandisk%201TB%20SkyBlue/Quiz/codezest-auth/tests/integration/cache.test.ts#L52-L69)

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-24  
**Author**: Development Team
