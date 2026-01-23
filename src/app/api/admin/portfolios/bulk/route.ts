import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

// PATCH - Bulk update portfolio status
export async function PATCH(request: Request) {
    try {
        const user = await getAuthUser();

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "无权限访问" },
                { status: 403 }
            );
        }

        const { ids, status, isPublic } = await request.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: "请选择要更新的作品集" },
                { status: 400 }
            );
        }

        const updateData: Record<string, unknown> = {};

        if (status) {
            updateData.status = status;
            // If approving, make public; if rejecting, make private
            if (status === "APPROVED") {
                updateData.isPublic = true;
            } else if (status === "REJECTED") {
                updateData.isPublic = false;
            }
        }

        if (typeof isPublic === "boolean") {
            updateData.isPublic = isPublic;
        }

        await prisma.portfolio.updateMany({
            where: {
                id: { in: ids },
            },
            data: updateData,
        });

        return NextResponse.json({
            message: `已更新 ${ids.length} 个作品集`,
        });
    } catch (error) {
        console.error("Bulk update error:", error);
        return NextResponse.json(
            { error: "批量更新失败" },
            { status: 500 }
        );
    }
}

// DELETE - Bulk delete portfolios
export async function DELETE(request: Request) {
    try {
        const user = await getAuthUser();

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "无权限访问" },
                { status: 403 }
            );
        }

        const { ids } = await request.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: "请选择要删除的作品集" },
                { status: 400 }
            );
        }

        // 获取所有要删除的作品的文件路径
        const portfolioItems = await prisma.portfolioItem.findMany({
            where: { portfolioId: { in: ids } },
            select: { url: true, thumbnail: true },
        });

        // 导入文件清理工具
        const { deleteFile } = await import("@/lib/storage");

        // 清理物理文件（异步执行，不阻塞响应）
        const fileCleanupPromises = portfolioItems.map(async (item) => {
            await deleteFile(item.url);
            if (item.thumbnail) {
                await deleteFile(item.thumbnail);
            }
        });
        Promise.allSettled(fileCleanupPromises).catch(console.error);

        // Delete from featured first
        await prisma.featuredPortfolio.deleteMany({
            where: {
                portfolioId: { in: ids },
            },
        });

        // Delete albums that link to any of these portfolios
        const portfolioUrls = ids.map(id => `/portfolio/${id}`);
        await prisma.album.deleteMany({
            where: {
                link: { in: portfolioUrls },
            },
        });

        // Delete portfolio items
        await prisma.portfolioItem.deleteMany({
            where: {
                portfolioId: { in: ids },
            },
        });

        // Then delete portfolios
        await prisma.portfolio.deleteMany({
            where: {
                id: { in: ids },
            },
        });

        return NextResponse.json({
            message: `已删除 ${ids.length} 个作品集`,
        });
    } catch (error) {
        console.error("Bulk delete error:", error);
        return NextResponse.json(
            { error: "批量删除失败" },
            { status: 500 }
        );
    }
}
