import { NextResponse } from "next/server";
// import { writeFile, mkdir } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

interface Props {
    params: Promise<{ id: string }>;
}

// PUT - Update album
export async function PUT(request: Request, { params }: Props) {
    try {
        const user = await getAuthUser();
        const { id } = await params;

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        const formData = await request.formData();
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const link = formData.get("link") as string;
        const coverFile = formData.get("cover") as File | null;
        const coverUrl = formData.get("coverUrl") as string;

        const updateData: Record<string, unknown> = {
            title,
            description: description || null,
            link: link || null,
        };

        if (coverFile) {
            // Save new cover image
            const { uploadFile } = await import("@/lib/storage");
            const buffer = Buffer.from(await coverFile.arrayBuffer());
            const ext = path.extname(coverFile.name);
            const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;

            updateData.cover = await uploadFile(buffer, filename, "albums", coverFile.type);
        } else if (coverUrl) {
            updateData.cover = coverUrl;
        }

        await prisma.album.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ message: "轮播图已更新" });
    } catch (error) {
        console.error("Update album error:", error);
        return NextResponse.json({ error: "更新失败" }, { status: 500 });
    }
}

// PATCH - Toggle album visibility
export async function PATCH(request: Request, { params }: Props) {
    try {
        const user = await getAuthUser();
        const { id } = await params;

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        const { isActive } = await request.json();

        await prisma.album.update({
            where: { id },
            data: { isActive },
        });

        return NextResponse.json({ message: "状态已更新" });
    } catch (error) {
        console.error("Toggle album error:", error);
        return NextResponse.json({ error: "更新失败" }, { status: 500 });
    }
}

// DELETE - Delete album
export async function DELETE(_request: Request, { params }: Props) {
    try {
        const user = await getAuthUser();
        const { id } = await params;

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        const album = await prisma.album.findUnique({
            where: { id },
            select: { cover: true },
        });

        if (album?.cover) {
            const { deleteFile } = await import("@/lib/storage");
            await deleteFile(album.cover);
        }

        await prisma.album.delete({
            where: { id },
        });

        return NextResponse.json({ message: "轮播图已删除" });
    } catch (error) {
        console.error("Delete album error:", error);
        const errorMessage = error instanceof Error ? error.message : "未知错误";
        return NextResponse.json({ error: `删除失败: ${errorMessage}` }, { status: 500 });
    }
}
