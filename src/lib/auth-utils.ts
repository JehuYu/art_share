import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

export async function getAuthUser(): Promise<AuthUser | null> {
    try {
        const JWT_SECRET = new TextEncoder().encode(
            process.env.AUTH_SECRET || "art-share-jwt-secret-2026"
        );

        const cookieStore = await cookies();
        const token = cookieStore.get("auth-token");

        if (!token?.value) {
            // 尝试获取 headers 来调试来源
            const { headers } = await import("next/headers");
            const headerList = await headers();
            const referer = headerList.get("referer") || "unknown";
            const userAgent = headerList.get("user-agent") || "unknown";
            // 降低这个日志的级别，或者是为了调试才打开。
            // 只有当 referer 指向管理后台等需要登录的页面时才打印 Warning
            if (referer.includes("/admin") || referer.includes("/dashboard")) {
                console.warn(`[Auth] Missing cookie on protected route. Referer: ${referer}, UA: ${userAgent}`);
            }
            return null;
        }

        console.log("[Auth] Token found, verifying...");
        const { payload } = await jwtVerify(token.value, JWT_SECRET);
        console.log("[Auth] Token verified for user:", payload.email);

        return {
            id: payload.id as string,
            name: payload.name as string,
            email: payload.email as string,
            role: payload.role as string,
        };
    } catch (error) {
        console.error("[Auth] Token verification failed:", error);
        return null;
    }
}
