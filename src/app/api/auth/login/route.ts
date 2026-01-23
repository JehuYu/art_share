import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(
    process.env.AUTH_SECRET || "art-share-jwt-secret-2026"
);

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: "请填写邮箱和密码" },
                { status: 400 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { error: "邮箱或密码错误" },
                { status: 401 }
            );
        }

        // Verify password
        const isValidPassword = await compare(password, user.password);

        if (!isValidPassword) {
            return NextResponse.json(
                { error: "邮箱或密码错误" },
                { status: 401 }
            );
        }

        // Create JWT token
        const token = await new SignJWT({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("7d")
            .sign(JWT_SECRET);

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set("auth-token", token, {
            httpOnly: true,
            secure: false, // process.env.NODE_ENV === "production", // Changed to false to allow HTTP access in Docker
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return NextResponse.json({
            message: "登录成功",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "登录失败，请稍后重试" },
            { status: 500 }
        );
    }
}
