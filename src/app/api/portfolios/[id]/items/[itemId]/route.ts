import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";
import { deleteFile } from "@/lib/storage";

// DELETE - Delete portfolio item
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    try {
        const { id: portfolioId, itemId } = await params;
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json(
                { error: "请先登录" },
                { status: 401 }
            );
        }

        const portfolio = await prisma.portfolio.findUnique({
            where: { id: portfolioId },
        });

        if (!portfolio) {
            return NextResponse.json(
                { error: "作品集不存在" },
                { status: 404 }
            );
        }

        // Check ownership
        if (portfolio.userId !== user.id && user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "无权操作" },
                { status: 403 }
            );
        }

        const item = await prisma.portfolioItem.findUnique({
            where: { id: itemId },
        });

        if (!item || item.portfolioId !== portfolioId) {
            return NextResponse.json(
                { error: "作品不存在" },
                { status: 404 }
            );
        }

        // Delete files from storage (local or cloud)
        await deleteFile(item.url);
        if (item.thumbnail) {
            await deleteFile(item.thumbnail);
        }

        // Delete from database
        await prisma.portfolioItem.delete({
            where: { id: itemId },
        });

        // Update cover if needed
        if (portfolio.cover === item.url) {
            const firstItem = await prisma.portfolioItem.findFirst({
                where: { portfolioId },
                orderBy: { order: "asc" },
            });

            await prisma.portfolio.update({
                where: { id: portfolioId },
                data: { cover: firstItem?.url || null },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete portfolio item error:", error);
        return NextResponse.json(
            { error: "删除失败" },
            { status: 500 }
        );
    }
}
