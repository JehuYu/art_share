import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 如果请求是以 /uploads/ 开头的图片或视频
    if (pathname.startsWith("/uploads/")) {
        // 转发到 /api/uploads/ 接口
        // 例如: /uploads/user1/pic.jpg -> /api/uploads/user1/pic.jpg
        const newPathname = pathname.replace("/uploads/", "/api/uploads/");
        return NextResponse.rewrite(new URL(newPathname, request.url));
    }

    return NextResponse.next();
}

// 仅对 uploads 路径生效，提高性能
export const config = {
    matcher: ["/uploads/:path*"],
};
