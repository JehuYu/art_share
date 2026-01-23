import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cache } from "@/lib/cache";

// GET - 健康检查端点
export async function GET() {
    const startTime = Date.now();

    try {
        // 检查数据库连接
        let dbStatus = "healthy";
        let dbLatency = 0;

        try {
            const dbStart = Date.now();
            await prisma.$queryRaw`SELECT 1`;
            dbLatency = Date.now() - dbStart;
        } catch (error) {
            dbStatus = "unhealthy";
            console.error("Database health check failed:", error);
        }

        // 获取缓存状态
        const cacheStats = cache.getStats();

        // 获取基本统计
        let stats = null;
        if (dbStatus === "healthy") {
            try {
                const [userCount, portfolioCount, pendingCount] = await Promise.all([
                    prisma.user.count(),
                    prisma.portfolio.count(),
                    prisma.portfolio.count({ where: { status: "PENDING" } }),
                ]);
                stats = {
                    users: userCount,
                    portfolios: portfolioCount,
                    pendingReviews: pendingCount,
                };
            } catch (error) {
                console.error("Stats fetching failed:", error);
            }
        }

        const responseTime = Date.now() - startTime;

        return NextResponse.json({
            status: dbStatus === "healthy" ? "healthy" : "degraded",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || "0.1.0",
            services: {
                database: {
                    status: dbStatus,
                    latency: `${dbLatency}ms`,
                },
                cache: {
                    status: "healthy",
                    size: cacheStats.size,
                    maxSize: cacheStats.maxSize,
                },
            },
            stats,
            responseTime: `${responseTime}ms`,
        });
    } catch (error) {
        console.error("Health check error:", error);
        return NextResponse.json(
            {
                status: "unhealthy",
                timestamp: new Date().toISOString(),
                error: "Health check failed",
            },
            { status: 503 }
        );
    }
}
