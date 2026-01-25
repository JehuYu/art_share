/**
 * Redis 缓存层
 * v0.2.0 - 支持可选的 Redis 缓存，无 Redis 时降级为内存缓存
 */

import Redis from 'ioredis';

// 内存缓存作为降级方案
const memoryCache = new Map<string, { value: string; expireAt: number }>();

// Redis 客户端（单例）
let redisClient: Redis | null = null;
let redisAvailable = false;

/**
 * 获取 Redis 客户端
 * 如果 Redis 不可用，返回 null
 */
function getRedisClient(): Redis | null {
    if (redisClient) return redisAvailable ? redisClient : null;

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        console.log('[Cache] Redis URL not configured, using memory cache');
        return null;
    }

    try {
        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            connectTimeout: 5000,
        });

        redisClient.on('connect', () => {
            console.log('[Cache] Redis connected');
            redisAvailable = true;
        });

        redisClient.on('error', (err) => {
            console.error('[Cache] Redis error:', err.message);
            redisAvailable = false;
        });

        redisClient.on('close', () => {
            console.log('[Cache] Redis connection closed');
            redisAvailable = false;
        });

        // 尝试连接
        redisClient.connect().catch(() => {
            redisAvailable = false;
        });

        return redisClient;
    } catch (error) {
        console.error('[Cache] Failed to create Redis client:', error);
        return null;
    }
}

// 缓存键前缀
const CACHE_PREFIX = 'art_share:';

// 默认过期时间（秒）
const DEFAULT_TTL = 300; // 5 分钟

/**
 * 缓存工具类
 */
export const cache = {
    /**
     * 获取缓存值
     */
    async get<T>(key: string): Promise<T | null> {
        const fullKey = CACHE_PREFIX + key;
        const redis = getRedisClient();

        if (redis && redisAvailable) {
            try {
                const value = await redis.get(fullKey);
                if (value) {
                    return JSON.parse(value) as T;
                }
            } catch (error) {
                console.error('[Cache] Redis get error:', error);
            }
        }

        // 降级到内存缓存
        const cached = memoryCache.get(fullKey);
        if (cached && cached.expireAt > Date.now()) {
            return JSON.parse(cached.value) as T;
        }
        if (cached) {
            memoryCache.delete(fullKey);
        }

        return null;
    },

    /**
     * 设置缓存值
     */
    async set<T>(key: string, value: T, ttlSeconds: number = DEFAULT_TTL): Promise<void> {
        const fullKey = CACHE_PREFIX + key;
        const stringValue = JSON.stringify(value);
        const redis = getRedisClient();

        if (redis && redisAvailable) {
            try {
                await redis.setex(fullKey, ttlSeconds, stringValue);
                return;
            } catch (error) {
                console.error('[Cache] Redis set error:', error);
            }
        }

        // 降级到内存缓存
        memoryCache.set(fullKey, {
            value: stringValue,
            expireAt: Date.now() + ttlSeconds * 1000,
        });
    },

    /**
     * 删除缓存
     */
    async del(key: string): Promise<void> {
        const fullKey = CACHE_PREFIX + key;
        const redis = getRedisClient();

        if (redis && redisAvailable) {
            try {
                await redis.del(fullKey);
            } catch (error) {
                console.error('[Cache] Redis del error:', error);
            }
        }

        memoryCache.delete(fullKey);
    },

    /**
     * 按模式删除缓存（支持通配符）
     */
    async delPattern(pattern: string): Promise<void> {
        const fullPattern = CACHE_PREFIX + pattern;
        const redis = getRedisClient();

        if (redis && redisAvailable) {
            try {
                const keys = await redis.keys(fullPattern);
                if (keys.length > 0) {
                    await redis.del(...keys);
                }
            } catch (error) {
                console.error('[Cache] Redis delPattern error:', error);
            }
        }

        // 清理内存缓存（简单匹配）
        const regex = new RegExp('^' + fullPattern.replace(/\*/g, '.*') + '$');
        for (const key of memoryCache.keys()) {
            if (regex.test(key)) {
                memoryCache.delete(key);
            }
        }
    },

    /**
     * 清空所有缓存
     */
    async clear(): Promise<void> {
        const redis = getRedisClient();

        if (redis && redisAvailable) {
            try {
                const keys = await redis.keys(CACHE_PREFIX + '*');
                if (keys.length > 0) {
                    await redis.del(...keys);
                }
            } catch (error) {
                console.error('[Cache] Redis clear error:', error);
            }
        }

        memoryCache.clear();
    },

    /**
     * 带缓存的数据获取
     * 如果缓存存在则返回缓存，否则执行 fetcher 并缓存结果
     */
    async getOrSet<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttlSeconds: number = DEFAULT_TTL
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const value = await fetcher();
        await this.set(key, value, ttlSeconds);
        return value;
    },
};

// 预定义的缓存键
export const CacheKeys = {
    // 系统设置
    SYSTEM_SETTINGS: 'settings',

    // 作品集列表
    PORTFOLIOS_PUBLIC: (page: number, limit: number) => `portfolios:public:${page}:${limit}`,
    PORTFOLIOS_FEATURED: 'portfolios:featured',
    PORTFOLIO_DETAIL: (id: string) => `portfolio:${id}`,

    // 用户信息
    USER: (id: string) => `user:${id}`,

    // 首页数据
    HOME_CAROUSEL: 'home:carousel',
    HOME_FEATURED: 'home:featured',

    // 统计数据
    STATS_OVERVIEW: 'stats:overview',
};

// 缓存 TTL 常量（秒）
export const CacheTTL = {
    SHORT: 60,          // 1 分钟
    MEDIUM: 300,        // 5 分钟
    LONG: 1800,         // 30 分钟
    VERY_LONG: 3600,    // 1 小时
};

export default cache;
