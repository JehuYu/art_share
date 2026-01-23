import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

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

        // Create upload directory
        const uploadDir = path.join(process.cwd(), "public", "uploads", user.id);
        await mkdir(uploadDir, { recursive: true });

        // 动态导入图片处理工具（避免在不需要时加载）
        const { generateThumbnail, isImageFile } = await import("@/lib/image-utils");

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
            const filepath = path.join(uploadDir, filename);
            const url = `/uploads/${user.id}/${filename}`;

            // Write file
            const bytes = await file.arrayBuffer();
            await writeFile(filepath, Buffer.from(bytes));

            // 为图片生成缩略图
            let thumbnail: string | undefined;
            if (isImageFile(file.name)) {
                const thumbResult = await generateThumbnail(filepath);
                if (thumbResult) {
                    thumbnail = thumbResult;
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
            cover = uploadedItems[coverIndex].url;
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

        const user = await getAuthUser();

        // Build where clause
        const where: Record<string, unknown> = {};

        if (user) {
            // User can see their own portfolios
            if (searchParams.get("mine") === "true") {
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

        return NextResponse.json({
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
        });
    } catch (error) {
        console.error("List portfolios error:", error);
        return NextResponse.json(
            { error: "获取失败" },
            { status: 500 }
        );
    }
}
