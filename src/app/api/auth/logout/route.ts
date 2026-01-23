import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET - Logout via link (redirect to home)
export async function GET() {
    try {
        const cookieStore = await cookies();

        // Clear the auth token cookie
        cookieStore.delete("auth-token");

        // Redirect to home page
        return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"));
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"));
    }
}

// POST - Logout via API call
export async function POST() {
    try {
        const cookieStore = await cookies();

        // Clear the auth token cookie
        cookieStore.delete("auth-token");

        return NextResponse.json({ message: "注销成功" });
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json({ error: "注销失败" }, { status: 500 });
    }
}
