import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";
import { getCachedData, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";

// GET - 获取管理仪表板统计数据
export async function GET() {
    try {
        const user = await getAuthUser();

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        // 使用缓存获取统计数据
        const stats = await getCachedData(
            "admin_dashboard_stats",
            async () => {
                const [
                    totalUsers,
                    totalPortfolios,
                    pendingPortfolios,
                    approvedPortfolios,
                    rejectedPortfolios,
                    totalItems,
                    totalViews,
                    featuredCount,
                    albumCount,
                    recentPortfolios,
                    recentUsers,
                ] = await Promise.all([
                    prisma.user.count(),
                    prisma.portfolio.count(),
                    prisma.portfolio.count({ where: { status: "PENDING" } }),
                    prisma.portfolio.count({ where: { status: "APPROVED" } }),
                    prisma.portfolio.count({ where: { status: "REJECTED" } }),
                    prisma.portfolioItem.count(),
                    prisma.portfolio.aggregate({
                        _sum: { viewCount: true },
                    }),
                    prisma.featuredPortfolio.count(),
                    prisma.album.count(),
                    // 最近 7 天创建的作品集数量
                    prisma.portfolio.count({
                        where: {
                            createdAt: {
                                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                            },
                        },
                    }),
                    // 最近 7 天注册的用户数量
                    prisma.user.count({
                        where: {
                            createdAt: {
                                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                            },
                        },
                    }),
                ]);

                return {
                    users: {
                        total: totalUsers,
                        recent: recentUsers,
                    },
                    portfolios: {
                        total: totalPortfolios,
                        pending: pendingPortfolios,
                        approved: approvedPortfolios,
                        rejected: rejectedPortfolios,
                        recent: recentPortfolios,
                    },
                    items: {
                        total: totalItems,
                    },
                    views: {
                        total: totalViews._sum.viewCount || 0,
                    },
                    featured: {
                        count: featuredCount,
                    },
                    albums: {
                        count: albumCount,
                    },
                };
            },
            CACHE_TTL.PORTFOLIOS // 1 分钟缓存
        );

        return NextResponse.json({ stats });
    } catch (error) {
        console.error("Get dashboard stats error:", error);
        return NextResponse.json({ error: "获取统计失败" }, { status: 500 });
    }
}
