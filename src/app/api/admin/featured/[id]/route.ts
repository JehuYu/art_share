import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

interface Props {
    params: Promise<{ id: string }>;
}

// DELETE - Remove from featured
export async function DELETE(_request: Request, { params }: Props) {
    try {
        const user = await getAuthUser();
        const { id } = await params;

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        // Check if it's a featured ID or portfolio ID
        const featured = await prisma.featuredPortfolio.findFirst({
            where: {
                OR: [{ id }, { portfolioId: id }],
            },
        });

        if (!featured) {
            return NextResponse.json({ error: "精选记录不存在" }, { status: 404 });
        }

        await prisma.featuredPortfolio.delete({
            where: { id: featured.id },
        });

        return NextResponse.json({ message: "已从精选中移除" });
    } catch (error) {
        console.error("Remove featured error:", error);
        return NextResponse.json({ error: "移除精选失败" }, { status: 500 });
    }
}
