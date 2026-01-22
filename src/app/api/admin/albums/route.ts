import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

// GET - List all albums
export async function GET() {
    try {
        const user = await getAuthUser();

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        const albums = await prisma.album.findMany({
            orderBy: { order: "asc" },
        });

        return NextResponse.json({ albums });
    } catch (error) {
        console.error("List albums error:", error);
        return NextResponse.json({ error: "获取失败" }, { status: 500 });
    }
}

// POST - Create new album
export async function POST(request: Request) {
    try {
        const user = await getAuthUser();

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        const formData = await request.formData();
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const link = formData.get("link") as string;
        const coverFile = formData.get("cover") as File | null;

        if (!title) {
            return NextResponse.json({ error: "请输入标题" }, { status: 400 });
        }

        let coverUrl = "";

        if (coverFile) {
            // Save cover image
            const uploadDir = path.join(process.cwd(), "public", "uploads", "albums");
            await mkdir(uploadDir, { recursive: true });

            const ext = path.extname(coverFile.name);
            const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
            const filepath = path.join(uploadDir, filename);

            const bytes = await coverFile.arrayBuffer();
            await writeFile(filepath, Buffer.from(bytes));

            coverUrl = `/uploads/albums/${filename}`;
        }

        // Get max order
        const maxOrder = await prisma.album.findFirst({
            orderBy: { order: "desc" },
            select: { order: true },
        });

        const album = await prisma.album.create({
            data: {
                title,
                description: description || null,
                cover: coverUrl,
                link: link || null,
                order: (maxOrder?.order || 0) + 1,
            },
        });

        return NextResponse.json({ album, message: "轮播图已添加" });
    } catch (error) {
        console.error("Create album error:", error);
        return NextResponse.json({ error: "创建失败" }, { status: 500 });
    }
}
