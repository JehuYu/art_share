import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
    process.env.AUTH_SECRET || "your-secret-key-here"
);

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth-token");

        if (!token?.value) {
            return NextResponse.json({ user: null });
        }

        const { payload } = await jwtVerify(token.value, JWT_SECRET);

        return NextResponse.json({
            user: {
                id: payload.id,
                name: payload.name,
                email: payload.email,
                role: payload.role,
            },
        });
    } catch {
        return NextResponse.json({ user: null });
    }
}
