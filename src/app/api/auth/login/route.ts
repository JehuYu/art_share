import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const JWT_SECRET = new TextEncoder().encode(
            process.env.AUTH_SECRET || "art-share-jwt-secret-2026"
        );

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
        // 为了最大限度兼容各种 HTTPS 代理和端口配置，暂时禁用 Secure 限制
        // Secure: false 意味着 Cookie 可以在 HTTP 和 HTTPS 下工作
        // SameSite: lax 是现代浏览器默认值，支持正常的页面导航
        const cookieStore = await cookies();
        cookieStore.set("auth-token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
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
