class CacheService {
    constructor() {
        // Simple in-memory cache
        this.cache = new Map();

        // Optional: Add TTL support
        this.ttl = new Map();
    }

    // Generate cache key for user
    getUserKey(userId) {
        return `user:${userId}`;
    }

    // Store complete user data in cache
    set(userId, data, ttlSeconds = 3600) {
        const key = this.getUserKey(userId);
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });

        // Set TTL
        if (ttlSeconds > 0) {
            setTimeout(() => {
                this.invalidate(userId);
            }, ttlSeconds * 1000);
        }

        console.log(`Cached data for user: ${userId}`);
    }

    // Get complete user data from cache
    get(userId) {
        const key = this.getUserKey(userId);
        const cached = this.cache.get(key);

        if (cached) {
            console.log(`Cache hit for user: ${userId}`);
            return cached.data;
        }

        console.log(`Cache miss for user: ${userId}`);
        return null;
    }

    // Check if user exists in cache
    has(userId) {
        return this.cache.has(this.getUserKey(userId));
    }

    // Invalidate/delete cache for a user
    invalidate(userId) {
        const key = this.getUserKey(userId);
        const deleted = this.cache.delete(key);

        if (deleted) {
            console.log(`Cache invalidated for user: ${userId}`);
        }

        return deleted;
    }

    // Clear all cache (use carefully!)
    clear() {
        this.cache.clear();
        console.log('All cache cleared');
    }

    // Get cache stats
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Export singleton instance
export default new CacheService();