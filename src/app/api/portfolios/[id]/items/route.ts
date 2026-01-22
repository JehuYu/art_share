import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

// Helper to generate unique filename while preserving original name
function generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext)
        .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_') // Clean up special characters, allow Chinese
        .substring(0, 50); // Limit base name length
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${baseName}_${timestamp}_${random}${ext}`;
}

// POST - Add item to portfolio
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: portfolioId } = await params;
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json(
                { error: "请先登录" },
                { status: 401 }
            );
        }

        const portfolio = await prisma.portfolio.findUnique({
            where: { id: portfolioId },
            include: { _count: { select: { items: true } } },
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

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "请选择文件" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
            return NextResponse.json(
                { error: "只支持图片和视频文件" },
                { status: 400 }
            );
        }

        // Get system settings
        const settings = await prisma.systemSettings.findFirst();
        const maxFileSize = settings?.maxFileSize || 52428800; // 50MB default

        if (file.size > maxFileSize) {
            return NextResponse.json(
                { error: `文件大小超过限制 (${Math.round(maxFileSize / 1024 / 1024)}MB)` },
                { status: 400 }
            );
        }

        // Create upload directory
        const uploadDir = path.join(process.cwd(), "public", "uploads", user.id);
        await mkdir(uploadDir, { recursive: true });

        // Save file
        const filename = generateFilename(file.name);
        const filepath = path.join(uploadDir, filename);
        const url = `/uploads/${user.id}/${filename}`;

        const bytes = await file.arrayBuffer();
        await writeFile(filepath, Buffer.from(bytes));

        // Create portfolio item
        const item = await prisma.portfolioItem.create({
            data: {
                type: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
                url,
                originalName: file.name,
                portfolioId,
                order: portfolio._count.items, // Add to end
            },
        });

        // Update portfolio cover if it's the first item
        if (portfolio._count.items === 0) {
            await prisma.portfolio.update({
                where: { id: portfolioId },
                data: { cover: url },
            });
        }

        // If portfolio was approved before, set back to pending for re-review
        const settingsRequireApproval = settings?.requireApproval ?? true;
        if (settingsRequireApproval && portfolio.status === "APPROVED") {
            await prisma.portfolio.update({
                where: { id: portfolioId },
                data: { status: "PENDING", isPublic: false },
            });
        }

        return NextResponse.json(item);
    } catch (error) {
        console.error("Add portfolio item error:", error);
        return NextResponse.json(
            { error: "上传失败" },
            { status: 500 }
        );
    }
}
