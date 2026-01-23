/**
 * 简单的内存缓存实现
 * 用于缓存频繁访问的数据，减少数据库查询
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

class MemoryCache {
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private maxSize: number = 100; // 最大缓存条目数

    /**
     * 获取缓存数据
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // 检查是否过期
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * 设置缓存数据
     * @param key 缓存键
     * @param data 数据
     * @param ttlSeconds 过期时间（秒），默认 60 秒
     */
    set<T>(key: string, data: T, ttlSeconds: number = 60): void {
        // 如果缓存满了，删除最旧的条目
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(key, {
            data,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }

    /**
     * 删除缓存
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * 删除匹配前缀的所有缓存
     */
    deleteByPrefix(prefix: string): number {
        let count = 0;
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
                count++;
            }
        }
        return count;
    }

    /**
     * 清空所有缓存
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * 获取缓存统计
     */
    getStats(): { size: number; maxSize: number } {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
        };
    }
}

// 全局缓存实例（在开发环境中使用 global 避免热重载时丢失）
const globalForCache = globalThis as unknown as {
    memoryCache: MemoryCache | undefined;
};

export const cache = globalForCache.memoryCache ?? new MemoryCache();

if (process.env.NODE_ENV !== "production") {
    globalForCache.memoryCache = cache;
}

// 缓存键常量
export const CACHE_KEYS = {
    SYSTEM_SETTINGS: "system_settings",
    FEATURED_PORTFOLIOS: "featured_portfolios",
    ALBUMS: "albums",
    PUBLIC_PORTFOLIOS: (page: number, limit: number) => `public_portfolios_${page}_${limit}`,
    PORTFOLIO: (id: string) => `portfolio_${id}`,
    USER: (id: string) => `user_${id}`,
} as const;

// 缓存 TTL 常量（秒）
export const CACHE_TTL = {
    SETTINGS: 300,        // 5 分钟
    PORTFOLIOS: 60,       // 1 分钟
    ALBUMS: 120,          // 2 分钟
    USER: 300,            // 5 分钟
} as const;

/**
 * 带缓存的数据获取辅助函数
 */
export async function getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 60
): Promise<T> {
    // 尝试从缓存获取
    const cached = cache.get<T>(key);
    if (cached !== null) {
        return cached;
    }

    // 缓存未命中，从数据源获取
    const data = await fetcher();

    // 存入缓存
    cache.set(key, data, ttlSeconds);

    return data;
}

/**
 * 使相关缓存失效
 */
export function invalidateCache(pattern: string): void {
    if (pattern.endsWith("*")) {
        cache.deleteByPrefix(pattern.slice(0, -1));
    } else {
        cache.delete(pattern);
    }
}
