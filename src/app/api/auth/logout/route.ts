import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

/**
 * 获取实际的来源 URL（支持反向代理）
 */
async function getOriginUrl(request: Request): Promise<string> {
    const headersList = await headers();

    // 优先使用 X-Forwarded 头（反向代理场景）
    const forwardedProto = headersList.get("x-forwarded-proto");
    const forwardedHost = headersList.get("x-forwarded-host");

    if (forwardedHost) {
        const proto = forwardedProto || "https";
        return `${proto}://${forwardedHost}`;
    }

    // 使用 Host 头
    const host = headersList.get("host");
    if (host) {
        // 判断协议
        const proto = host.includes("localhost") ? "http" : "https";
        return `${proto}://${host}`;
    }

    // 最后回退到 request.url
    const url = new URL(request.url);
    return url.origin;
}

// GET - Logout via link (redirect to home)
export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        cookieStore.delete("auth-token");

        const origin = await getOriginUrl(request);
        return NextResponse.redirect(`${origin}/`, { status: 302 });
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.redirect("/", { status: 302 });
    }
}

// POST - Logout via form submission
export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        cookieStore.delete("auth-token");

        const origin = await getOriginUrl(request);
        return NextResponse.redirect(`${origin}/`, { status: 302 });
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.redirect("/", { status: 302 });
    }
}
