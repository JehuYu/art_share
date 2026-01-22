import { NextResponse } from "next/server";
import { cookies } from "next/headers";

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
