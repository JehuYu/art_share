import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

interface Props {
    params: Promise<{ id: string }>;
}

// PATCH - Update portfolio (status, title, description, isPublic)
export async function PATCH(request: Request, { params }: Props) {
    try {
        const user = await getAuthUser();
        const { id } = await params;

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        const body = await request.json();
        const { status, title, description, isPublic } = body;

        // Build update data
        const updateData: Record<string, unknown> = {};

        // Handle status update
        if (status) {
            if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
                return NextResponse.json({ error: "无效的状态" }, { status: 400 });
            }
            updateData.status = status;
            // Auto-set isPublic based on status unless explicitly provided
            if (typeof isPublic !== "boolean") {
                updateData.isPublic = status === "APPROVED";
            }
        }

        // Handle title update
        if (title !== undefined) {
            updateData.title = title;
        }

        // Handle description update
        if (description !== undefined) {
            updateData.description = description || null;
        }

        // Handle isPublic toggle
        if (typeof isPublic === "boolean") {
            if (isPublic === false) {
                const portfolioUrl = `/portfolio/${id}`;
                const linkedAlbum = await prisma.album.findFirst({
                    where: {
                        link: portfolioUrl,
                        isActive: true,
                    },
                });

                if (linkedAlbum) {
                    return NextResponse.json(
                        { error: "无法设为私密：该作品已被设为首页轮播展示，请先移除轮播图" },
                        { status: 400 }
                    );
                }
            }
            updateData.isPublic = isPublic;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "没有要更新的字段" }, { status: 400 });
        }

        await prisma.portfolio.update({
            where: { id },
            data: updateData,
        });

        // Sync with linked albums if title or description changed
        if (title !== undefined || description !== undefined) {
            const portfolioUrl = `/portfolio/${id}`;
            const albumUpdateData: Record<string, unknown> = {};
            if (title !== undefined) albumUpdateData.title = title;
            if (description !== undefined) albumUpdateData.description = description || null;

            await prisma.album.updateMany({
                where: {
                    link: portfolioUrl,
                },
                data: albumUpdateData,
            });
        }

        return NextResponse.json({ message: "已更新" });
    } catch (error) {
        console.error("Update portfolio error:", error);
        return NextResponse.json({ error: "更新失败" }, { status: 500 });
    }
}

// DELETE - Delete portfolio
export async function DELETE(_request: Request, { params }: Props) {
    try {
        const user = await getAuthUser();
        const { id } = await params;

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        // Check if portfolio is used in active carousel before deleting
        const portfolioUrl = `/portfolio/${id}`;
        const linkedAlbum = await prisma.album.findFirst({
            where: {
                link: portfolioUrl,
                isActive: true,
            },
        });

        if (linkedAlbum) {
            return NextResponse.json(
                { error: "无法删除：该作品集当前正在首页轮播展示，请先移除相关轮播图" },
                { status: 400 }
            );
        }

        // 获取所有要删除的作品的文件路径
        const portfolioItems = await prisma.portfolioItem.findMany({
            where: { portfolioId: id },
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

        // First delete from featured if exists
        await prisma.featuredPortfolio.deleteMany({
            where: { portfolioId: id },
        });

        // Delete associated portfolio items
        await prisma.portfolioItem.deleteMany({
            where: { portfolioId: id },
        });

        // Then delete the portfolio
        await prisma.portfolio.delete({
            where: { id },
        });

        return NextResponse.json({ message: "作品集已删除" });
    } catch (error) {
        console.error("Delete portfolio error:", error);
        return NextResponse.json({ error: "删除失败" }, { status: 500 });
    }
}
