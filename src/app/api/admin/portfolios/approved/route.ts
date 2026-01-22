import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

// GET - List all approved portfolios for carousel selection
export async function GET() {
    try {
        const user = await getAuthUser();

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        const portfolios = await prisma.portfolio.findMany({
            where: {
                status: "APPROVED",
                isPublic: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                items: {
                    take: 1,
                    orderBy: { order: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            portfolios: portfolios.map((p) => ({
                id: p.id,
                title: p.title,
                description: p.description,
                cover: p.cover || p.items[0]?.url || null,
                userName: p.user.name,
            })),
        });
    } catch (error) {
        console.error("List approved portfolios error:", error);
        return NextResponse.json({ error: "获取失败" }, { status: 500 });
    }
}
