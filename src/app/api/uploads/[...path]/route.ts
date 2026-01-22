import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        // Next.js 15 requires awaiting params
        const { path: filePathSegments } = await params;
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        const fullPath = path.join(uploadDir, ...filePathSegments);

        // 安全检查：确保路径不越出 uploads 目录
        if (!fullPath.startsWith(uploadDir)) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        if (!existsSync(fullPath)) {
            return new NextResponse("Not Found", { status: 404 });
        }

        const fileBuffer = await readFile(fullPath);

        // 根据后缀名判断 Content-Type
        const ext = path.extname(fullPath).toLowerCase();
        const contentTypeMap: Record<string, string> = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".mp4": "video/mp4",
            ".webm": "video/webm",
        };

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentTypeMap[ext] || "application/octet-stream",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Serve file error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
