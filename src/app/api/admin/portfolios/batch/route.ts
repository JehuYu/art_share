import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";
import { deleteFile } from "@/lib/storage";
import { cache, CacheKeys } from "@/lib/redis";

/**
 * 批量操作作品集 API
 * POST /api/admin/portfolios/batch
 * 支持批量通过、拒绝、删除
 */
export async function POST(request: Request) {
    try {
        const user = await getAuthUser();

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "无权限访问" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { action, ids } = body as { action: string; ids: string[] };

        // 验证参数
        if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: "参数错误：需要 action 和 ids 数组" },
                { status: 400 }
            );
        }

        if (!["approve", "reject", "delete"].includes(action)) {
            return NextResponse.json(
                { error: "无效的操作类型" },
                { status: 400 }
            );
        }

        // 限制单次批量操作数量
        const MAX_BATCH_SIZE = 100;
        if (ids.length > MAX_BATCH_SIZE) {
            return NextResponse.json(
                { error: `单次最多操作 ${MAX_BATCH_SIZE} 个作品` },
                { status: 400 }
            );
        }

        let result: { success: number; failed: number; errors: string[] };

        switch (action) {
            case "approve":
                result = await batchApprove(ids);
                break;
            case "reject":
                result = await batchReject(ids);
                break;
            case "delete":
                result = await batchDelete(ids);
                break;
            default:
                return NextResponse.json(
                    { error: "无效的操作类型" },
                    { status: 400 }
                );
        }

        // 清除相关缓存
        await cache.delPattern('portfolios:*');
        await cache.del(CacheKeys.HOME_FEATURED);
        await cache.del(CacheKeys.PORTFOLIOS_FEATURED);

        return NextResponse.json({
            message: `批量${getActionName(action)}完成`,
            ...result,
        });
    } catch (error) {
        console.error("Batch operation error:", error);
        return NextResponse.json(
            { error: "批量操作失败" },
            { status: 500 }
        );
    }
}

function getActionName(action: string): string {
    switch (action) {
        case "approve": return "通过";
        case "reject": return "拒绝";
        case "delete": return "删除";
        default: return "操作";
    }
}

/**
 * 批量通过审核
 */
async function batchApprove(ids: string[]): Promise<{ success: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let success = 0;

    // 使用事务批量更新
    try {
        const result = await prisma.portfolio.updateMany({
            where: {
                id: { in: ids },
                status: { not: "APPROVED" }, // 只更新非已通过的
            },
            data: {
                status: "APPROVED",
                isPublic: true,
            },
        });
        success = result.count;
    } catch (error) {
        errors.push(`批量更新失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }

    return {
        success,
        failed: ids.length - success,
        errors,
    };
}

/**
 * 批量拒绝审核
 */
async function batchReject(ids: string[]): Promise<{ success: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let success = 0;

    try {
        const result = await prisma.portfolio.updateMany({
            where: {
                id: { in: ids },
                status: { not: "REJECTED" },
            },
            data: {
                status: "REJECTED",
                isPublic: false,
            },
        });
        success = result.count;
    } catch (error) {
        errors.push(`批量更新失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }

    return {
        success,
        failed: ids.length - success,
        errors,
    };
}

/**
 * 批量删除
 */
async function batchDelete(ids: string[]): Promise<{ success: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let success = 0;

    // 检查是否有作品被设为轮播图
    const linkedAlbums = await prisma.album.findMany({
        where: {
            link: { in: ids.map(id => `/portfolio/${id}`) },
        },
        select: { id: true, title: true, link: true },
    });

    if (linkedAlbums.length > 0) {
        const linkedIds = linkedAlbums.map(a => a.link?.replace('/portfolio/', ''));
        errors.push(`以下作品已被设为轮播图，无法删除: ${linkedIds.join(', ')}`);
        // 过滤掉被链接的作品
        ids = ids.filter(id => !linkedIds.includes(id));
    }

    // 检查是否有作品被设为精选
    const featuredPortfolios = await prisma.featuredPortfolio.findMany({
        where: {
            portfolioId: { in: ids },
        },
        select: { portfolioId: true },
    });

    if (featuredPortfolios.length > 0) {
        // 先删除精选关联
        await prisma.featuredPortfolio.deleteMany({
            where: {
                portfolioId: { in: ids },
            },
        });
    }

    // 获取所有要删除的作品及其文件
    const portfolios = await prisma.portfolio.findMany({
        where: { id: { in: ids } },
        include: { items: true },
    });

    // 逐个删除，以便处理文件清理
    for (const portfolio of portfolios) {
        try {
            // 删除关联的文件
            for (const item of portfolio.items) {
                try {
                    await deleteFile(item.url);
                    if (item.thumbnail) {
                        await deleteFile(item.thumbnail);
                    }
                } catch (fileError) {
                    console.error(`Failed to delete file: ${item.url}`, fileError);
                }
            }

            // 删除封面文件（如果不是来自 items）
            if (portfolio.cover && !portfolio.items.some(item =>
                item.url === portfolio.cover || item.thumbnail === portfolio.cover
            )) {
                try {
                    await deleteFile(portfolio.cover);
                } catch {
                    // 忽略封面删除错误
                }
            }

            // 删除数据库记录（级联删除 items）
            await prisma.portfolio.delete({
                where: { id: portfolio.id },
            });

            success++;
        } catch (error) {
            errors.push(`删除 ${portfolio.title} 失败: ${error instanceof Error ? error.message : "未知错误"}`);
        }
    }

    return {
        success,
        failed: portfolios.length - success + (linkedAlbums.length > 0 ? linkedAlbums.length : 0),
        errors,
    };
}
