import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

// GET - List all featured portfolios
export async function GET() {
    try {
        const featured = await prisma.featuredPortfolio.findMany({
            orderBy: { order: "asc" },
        });

        // Get portfolio details
        const portfolioIds = featured.map((f) => f.portfolioId);
        const portfolios = await prisma.portfolio.findMany({
            where: { id: { in: portfolioIds } },
            include: {
                user: {
                    select: { id: true, name: true, avatar: true },
                },
                _count: { select: { items: true } },
            },
        });

        // Combine data
        const result = featured.map((f) => {
            const portfolio = portfolios.find((p) => p.id === f.portfolioId);
            return {
                id: f.id,
                portfolioId: f.portfolioId,
                order: f.order,
                portfolio: portfolio
                    ? {
                        id: portfolio.id,
                        title: portfolio.title,
                        description: portfolio.description,
                        cover: portfolio.cover,
                        userName: portfolio.user.name,
                        itemCount: portfolio._count.items,
                    }
                    : null,
            };
        });

        return NextResponse.json({ featured: result });
    } catch (error) {
        console.error("List featured error:", error);
        return NextResponse.json({ error: "获取精选列表失败" }, { status: 500 });
    }
}

// POST - Add portfolio to featured
export async function POST(request: Request) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        const body = await request.json();
        const { portfolioId } = body;

        if (!portfolioId) {
            return NextResponse.json({ error: "缺少作品集ID" }, { status: 400 });
        }

        // Check if portfolio exists and is approved
        const portfolio = await prisma.portfolio.findUnique({
            where: { id: portfolioId },
        });

        if (!portfolio) {
            return NextResponse.json({ error: "作品集不存在" }, { status: 404 });
        }

        if (portfolio.status !== "APPROVED") {
            return NextResponse.json({ error: "只能精选已审核通过的作品" }, { status: 400 });
        }

        // Check if already featured
        const existing = await prisma.featuredPortfolio.findUnique({
            where: { portfolioId },
        });

        if (existing) {
            return NextResponse.json({ error: "该作品已是精选" }, { status: 400 });
        }

        // Get max order
        const maxOrder = await prisma.featuredPortfolio.findFirst({
            orderBy: { order: "desc" },
            select: { order: true },
        });

        // Create featured entry
        await prisma.featuredPortfolio.create({
            data: {
                portfolioId,
                order: (maxOrder?.order ?? -1) + 1,
            },
        });

        return NextResponse.json({ message: "已添加到精选" });
    } catch (error) {
        console.error("Add featured error:", error);
        return NextResponse.json({ error: "添加精选失败" }, { status: 500 });
    }
}
