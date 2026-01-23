import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

// GET - List all portfolios for management
export async function GET(request: Request) {
    try {
        const user = await getAuthUser();

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "无权限访问" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const sort = searchParams.get("sort") || "createdAt";
        const order = searchParams.get("order") || "desc";

        // Build where clause
        const where: Record<string, unknown> = {};
        if (status && status !== "all") {
            where.status = status;
        }

        // Build order by
        const orderBy: Record<string, string> = {};
        orderBy[sort] = order;

        const portfolios = await prisma.portfolio.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                _count: {
                    select: { items: true },
                },
            },
            orderBy,
        });

        return NextResponse.json({
            portfolios: portfolios.map((p) => ({
                ...p,
                itemCount: p._count.items,
            })),
        });
    } catch (error) {
        console.error("List portfolios error:", error);
        return NextResponse.json(
            { error: "获取失败" },
            { status: 500 }
        );
    }
}
