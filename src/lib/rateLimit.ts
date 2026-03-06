type CacheEntry = {
    count: number;
    expiresAt: number;
};

// Global cache (In-memory, will reset on server restart)
const cache = new Map<string, CacheEntry>();

export function rateLimit(options: { interval: number }) {
    return {
        check: (limit: number, token: string) => {
            return new Promise<void>((resolve, reject) => {
                const now = Date.now();
                const current = cache.get(token);

                if (!current) {
                    cache.set(token, { count: 1, expiresAt: now + options.interval });
                    return resolve();
                }

                if (now > current.expiresAt) {
                    // Time window expired, reset count
                    cache.set(token, { count: 1, expiresAt: now + options.interval });
                    return resolve();
                }

                if (current.count >= limit) {
                    // Rate limit exceeded
                    return reject('Rate limit exceeded');
                }

                // Increment count
                current.count += 1;
                resolve();
            });
        }
    };
}
