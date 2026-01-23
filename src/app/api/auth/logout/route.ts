import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET - Logout via link (redirect to home)
// GET - Logout via link (redirect to home)
export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();

        // Clear the auth token cookie
        cookieStore.delete("auth-token");

        // Redirect to home page dynamicall
        const url = new URL(request.url);
        return NextResponse.redirect(new URL("/", url.origin));
    } catch (error) {
        console.error("Logout error:", error);
        // Fallback
        return NextResponse.redirect(new URL("/", request.url));
    }
}

// POST - Logout via API call | Form submission
export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();

        // Clear the auth token cookie
        cookieStore.delete("auth-token");

        // 如果是表单提交，重定向其到首页
        const url = new URL(request.url);
        return NextResponse.redirect(new URL("/", url.origin));
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.redirect(new URL("/", request.url));
    }
}
