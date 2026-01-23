import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";
import { cleanupOrphanedFiles, deleteFileWithThumbnails, getDirectorySize, formatFileSize } from "@/lib/image-utils";
import path from "path";

// POST - 清理孤立文件（不在数据库中引用的文件）
export async function POST() {
    try {
        const user = await getAuthUser();

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        // 获取所有有效的文件 URL
        const portfolioItems = await prisma.portfolioItem.findMany({
            select: { url: true, thumbnail: true },
        });

        const albums = await prisma.album.findMany({
            select: { cover: true },
        });

        const portfolios = await prisma.portfolio.findMany({
            select: { cover: true },
        });

        const users = await prisma.user.findMany({
            select: { avatar: true },
        });

        // 收集所有有效的 URL
        const validUrls: string[] = [];

        portfolioItems.forEach((item) => {
            if (item.url) validUrls.push(item.url);
            if (item.thumbnail) validUrls.push(item.thumbnail);
        });

        albums.forEach((album) => {
            if (album.cover) validUrls.push(album.cover);
        });

        portfolios.forEach((portfolio) => {
            if (portfolio.cover) validUrls.push(portfolio.cover);
        });

        users.forEach((u) => {
            if (u.avatar) validUrls.push(u.avatar);
        });

        // 执行清理
        const result = await cleanupOrphanedFiles(validUrls);

        // 获取清理后的存储使用情况
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        const totalSize = await getDirectorySize(uploadsDir);

        return NextResponse.json({
            message: `清理完成，删除了 ${result.deleted.length} 个孤立文件`,
            deleted: result.deleted,
            errors: result.errors,
            storageUsed: formatFileSize(totalSize),
        });
    } catch (error) {
        console.error("Cleanup files error:", error);
        return NextResponse.json({ error: "清理失败" }, { status: 500 });
    }
}

// GET - 获取存储使用情况
export async function GET() {
    try {
        const user = await getAuthUser();

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        const totalSize = await getDirectorySize(uploadsDir);

        // 获取文件统计
        const [portfolioItemCount, albumCount, portfolioCount] = await Promise.all([
            prisma.portfolioItem.count(),
            prisma.album.count(),
            prisma.portfolio.count(),
        ]);

        return NextResponse.json({
            storageUsed: formatFileSize(totalSize),
            storageBytes: totalSize,
            stats: {
                portfolioItems: portfolioItemCount,
                albums: albumCount,
                portfolios: portfolioCount,
            },
        });
    } catch (error) {
        console.error("Get storage info error:", error);
        return NextResponse.json({ error: "获取失败" }, { status: 500 });
    }
}
