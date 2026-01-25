import { NextResponse } from "next/server";
import path from "path";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";
import { CacheKeys } from "@/lib/redis";

// Helper to generate unique filename
function generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}${ext}`;
}

// POST - Create portfolio
export async function POST(request: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json(
                { error: "请先登录" },
                { status: 401 }
            );
        }

        // Verify user exists in database (防止 JWT 和数据库不同步)
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!dbUser) {
            console.error(`User not found in database: ${user.id} (${user.email})`);
            return NextResponse.json(
                { error: "用户不存在，请重新登录" },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const coverIndex = parseInt(formData.get("coverIndex") as string) || 0;
        const files = formData.getAll("files") as File[];

        if (!title?.trim()) {
            return NextResponse.json(
                { error: "请输入作品集标题" },
                { status: 400 }
            );
        }

        // Get system settings
        const settings = await prisma.systemSettings.findFirst();
        const maxFileSize = settings?.maxFileSize || 52428800; // 50MB default
        const requireApproval = settings?.requireApproval ?? true;

        // 动态导入图片处理工具（避免在不需要时加载）
        const { isImageFile, generateThumbnailFromBuffer } = await import("@/lib/image-utils");
        const { uploadFile } = await import("@/lib/storage");

        // Process files
        const uploadedItems: { type: string; url: string; thumbnail?: string; originalName?: string; order: number }[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Check file size
            if (file.size > maxFileSize) {
                return NextResponse.json(
                    { error: `文件 ${file.name} 超过大小限制` },
                    { status: 400 }
                );
            }

            const filename = generateFilename(file.name);
            const buffer = Buffer.from(await file.arrayBuffer());

            // Upload main file
            const url = await uploadFile(buffer, filename, user.id, file.type);

            // 为图片生成缩略图
            let thumbnail: string | undefined;
            if (isImageFile(file.name)) {
                const thumbBuffer = await generateThumbnailFromBuffer(buffer);
                if (thumbBuffer) {
                    const thumbFilename = filename.replace(/\.[^/.]+$/, "") + "_thumbnail.webp";
                    // Only force local if using COS (to support the hybrid requirement), 
                    // or just always force local for thumbnails regardless of setting?
                    // User said "When using cloud storage... use local thumbnail".
                    // If using local storage, this works normally (forceLocal=true is redundant but harmless).
                    thumbnail = await uploadFile(thumbBuffer, thumbFilename, user.id, "image/webp", true);
                }
            }

            uploadedItems.push({
                type: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
                url,
                thumbnail,
                originalName: file.name,
                order: i,
            });
        }

        // Determine cover
        let cover: string | undefined;
        if (uploadedItems.length > 0 && coverIndex < uploadedItems.length) {
            // Prefer thumbnail (which is local) for the cover to improve loading performance
            cover = uploadedItems[coverIndex].thumbnail || uploadedItems[coverIndex].url;
        }

        // Create portfolio
        const portfolio = await prisma.portfolio.create({
            data: {
                title,
                description: description || null,
                cover,
                userId: user.id,
                status: requireApproval ? "PENDING" : "APPROVED",
                isPublic: !requireApproval,
                items: {
                    create: uploadedItems,
                },
            },
        });

        return NextResponse.json({
            id: portfolio.id,
            message: requireApproval ? "作品集已创建，等待审核" : "作品集已创建并发布",
        });
    } catch (error) {
        console.error("Create portfolio error:", error);
        return NextResponse.json(
            { error: "创建失败，请稍后重试" },
            { status: 500 }
        );
    }
}

// GET - List portfolios
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const status = searchParams.get("status");
        const isMine = searchParams.get("mine") === "true";

        const user = await getAuthUser();

        // 缓存处理：仅缓存公共页面的查询（非 "我的"、非特定状态或者是已通过的）
        // 只有当查询公共可见作品时才使用缓存
        const isPublicQuery = !user || (!isMine && (status === "APPROVED" || !status));
        const cacheKey = CacheKeys.PORTFOLIOS_PUBLIC(page, limit);

        // 动态导入 cache 避免循环依赖问题
        const { cache } = await import("@/lib/redis");

        if (isPublicQuery) {
            const cachedData = await cache.get(cacheKey);
            if (cachedData) {
                return NextResponse.json(cachedData);
            }
        }

        // Build where clause
        const where: Record<string, unknown> = {};

        if (user) {
            // User can see their own portfolios
            if (isMine) {
                where.userId = user.id;
                if (status) {
                    where.status = status;
                }
            } else {
                // Public portfolios only
                where.status = "APPROVED";
                where.isPublic = true;
            }
        } else {
            // Guest can only see approved public portfolios
            where.status = "APPROVED";
            where.isPublic = true;
        }

        const [portfolios, total] = await Promise.all([
            prisma.portfolio.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        },
                    },
                    _count: {
                        select: { items: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.portfolio.count({ where }),
        ]);

        const result = {
            portfolios: portfolios.map((p) => ({
                ...p,
                itemCount: p._count.items,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };

        // 如果是公共查询，写入缓存（过期时间 60 秒）
        if (isPublicQuery) {
            await cache.set(cacheKey, result, 60);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("List portfolios error:", error);
        return NextResponse.json(
            { error: "获取失败" },
            { status: 500 }
        );
    }
}
