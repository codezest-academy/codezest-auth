import cache from '../../src/infrastructure/cache/cache.service';

describe('Cache Integration', () => {
  beforeAll(async () => {
    // Ensure the cache client is connected
    // The cache client connects automatically on instantiation,
    // but we can ensure it's ready before tests run.
    // For integration tests, we want to use the real cache.
    // No mocking here.
  });

  beforeEach(async () => {
    // Clear the cache before each test to ensure isolation
    await cache.clear();
  });

  afterAll(async () => {
    // Disconnect the cache client after all tests are done
    await cache.disconnect();
  });

  it('should set and get a value from the cache', async () => {
    const key = 'test-key';
    const value = { message: 'Hello, Redis!' };

    await cache.set(key, value, 60); // Set with 60 seconds expiration
    const retrievedValue = await cache.get<{ message: string }>(key);

    expect(retrievedValue).toEqual(value);
  });

  it('should return null for a non-existent key', async () => {
    const key = 'non-existent-key';
    const retrievedValue = await cache.get(key);

    expect(retrievedValue).toBeNull();
  });

  it('should delete a key from the cache', async () => {
    const key = 'key-to-delete';
    const value = { data: 'some data' };

    await cache.set(key, value);
    let retrievedValue = await cache.get(key);
    expect(retrievedValue).toEqual(value);

    await cache.del(key);
    retrievedValue = await cache.get(key);
    expect(retrievedValue).toBeNull();
  });

  it('should delete keys by pattern', async () => {
    const patternKey1 = 'pattern:1';
    const patternKey2 = 'pattern:2';
    const otherKey = 'other:key';

    await cache.set(patternKey1, { id: 1 });
    await cache.set(patternKey2, { id: 2 });
    await cache.set(otherKey, { id: 3 });

    // v1.0.2: delPattern now returns the count of deleted keys
    const deletedCount = await cache.delPattern('pattern:*');

    // Verify the count of deleted keys
    expect(deletedCount).toBe(2);

    // Verify the keys are actually deleted
    expect(await cache.get(patternKey1)).toBeNull();
    expect(await cache.get(patternKey2)).toBeNull();
    expect(await cache.get(otherKey)).toEqual({ id: 3 }); // Should not be deleted
  });

  it('should expire a key after its TTL', async () => {
    const key = 'expiring-key';
    const value = { data: 'ephemeral' };
    const ttl = 1; // 1 second

    await cache.set(key, value, ttl);
    expect(await cache.get(key)).toEqual(value);

    // Use real timers for integration test
    await new Promise((resolve) => setTimeout(resolve, ttl * 1000 + 500)); // Wait a bit longer than TTL

    expect(await cache.get(key)).toBeNull();
  });
});
