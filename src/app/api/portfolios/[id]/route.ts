import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

// GET - Get portfolio by ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getAuthUser();

        const portfolio = await prisma.portfolio.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
                items: {
                    orderBy: { order: "asc" },
                },
            },
        });

        if (!portfolio) {
            return NextResponse.json(
                { error: "作品集不存在" },
                { status: 404 }
            );
        }

        // Check access permissions
        const isOwner = user?.id === portfolio.userId;
        const isAdmin = user?.role === "ADMIN";

        if (!isOwner && !isAdmin) {
            // Non-owners can only see approved public portfolios
            if (portfolio.status !== "APPROVED" || !portfolio.isPublic) {
                return NextResponse.json(
                    { error: "无权访问" },
                    { status: 403 }
                );
            }
        }

        // Increment view count for public views
        if (!isOwner && portfolio.status === "APPROVED" && portfolio.isPublic) {
            await prisma.portfolio.update({
                where: { id },
                data: { viewCount: { increment: 1 } },
            });
        }

        return NextResponse.json(portfolio);
    } catch (error) {
        console.error("Get portfolio error:", error);
        return NextResponse.json(
            { error: "获取失败" },
            { status: 500 }
        );
    }
}

// PATCH - Update portfolio
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json(
                { error: "请先登录" },
                { status: 401 }
            );
        }

        const portfolio = await prisma.portfolio.findUnique({
            where: { id },
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

        const body = await request.json();
        const { title, description, cover, isPublic } = body;

        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (cover !== undefined) updateData.cover = cover;
        if (isPublic !== undefined && portfolio.status === "APPROVED") {
            // Check if trying to make private and if portfolio is used in carousel
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
                        { error: "无法设为私密：该作品已被设为首页轮播展示，请先联系管理员移除轮播图" },
                        { status: 400 }
                    );
                }
            }
            updateData.isPublic = isPublic;
        }

        const updated = await prisma.portfolio.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Update portfolio error:", error);
        return NextResponse.json(
            { error: "更新失败" },
            { status: 500 }
        );
    }
}

// DELETE - Delete portfolio
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json(
                { error: "请先登录" },
                { status: 401 }
            );
        }

        // 获取作品集及其所有项目
        const portfolio = await prisma.portfolio.findUnique({
            where: { id },
            include: {
                items: {
                    select: { url: true, thumbnail: true },
                },
            },
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

        // 导入文件清理工具
        const { deleteFileWithThumbnails } = await import("@/lib/image-utils");

        // 删除所有关联的物理文件
        const fileCleanupPromises = portfolio.items.map(async (item) => {
            try {
                await deleteFileWithThumbnails(item.url);
            } catch (err) {
                console.warn(`Failed to delete file ${item.url}:`, err);
            }
        });

        // 并行执行文件清理（但不阻塞响应）
        Promise.allSettled(fileCleanupPromises).catch(console.error);

        // Delete from featured if exists
        await prisma.featuredPortfolio.deleteMany({
            where: { portfolioId: id },
        });

        // Delete associated portfolio items
        await prisma.portfolioItem.deleteMany({
            where: { portfolioId: id },
        });

        // Delete the portfolio
        await prisma.portfolio.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete portfolio error:", error);
        return NextResponse.json(
            { error: "删除失败" },
            { status: 500 }
        );
    }
}
