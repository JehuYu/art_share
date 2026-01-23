import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import crypto from "crypto";

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
        const normalizedPath = path.normalize(fullPath).toLowerCase();
        const normalizedUploadDir = path.normalize(uploadDir).toLowerCase();

        if (!normalizedPath.startsWith(normalizedUploadDir)) {
            console.error("Path breakout attempt:", { fullPath, uploadDir });
            return new NextResponse("Forbidden", { status: 403 });
        }

        if (!existsSync(fullPath)) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // 获取文件信息
        const fileStat = await stat(fullPath);
        const lastModified = fileStat.mtime.toUTCString();

        // 生成 ETag
        const etag = crypto
            .createHash("md5")
            .update(`${fileStat.size}-${fileStat.mtime.getTime()}`)
            .digest("hex");

        // 检查 If-None-Match 头（缓存验证）
        const ifNoneMatch = request.headers.get("if-none-match");
        if (ifNoneMatch === `"${etag}"`) {
            return new NextResponse(null, { status: 304 });
        }

        // 检查 If-Modified-Since 头
        const ifModifiedSince = request.headers.get("if-modified-since");
        if (ifModifiedSince && new Date(ifModifiedSince) >= fileStat.mtime) {
            return new NextResponse(null, { status: 304 });
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
            ".svg": "image/svg+xml",
            ".ico": "image/x-icon",
        };

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentTypeMap[ext] || "application/octet-stream",
                "Content-Length": fileStat.size.toString(),
                "Cache-Control": "public, max-age=31536000, immutable",
                "Last-Modified": lastModified,
                "ETag": `"${etag}"`,
                // 允许跨域访问
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error) {
        console.error("Serve file error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

