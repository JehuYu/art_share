import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

// POST - Batch import users
export async function POST(request: Request) {
    try {
        const user = await getAuthUser();

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        const { data } = await request.json();

        if (!data || typeof data !== "string") {
            return NextResponse.json({ error: "请提供有效的CSV数据" }, { status: 400 });
        }

        // Parse CSV
        const lines = data.trim().split("\n").filter((line: string) => line.trim());
        const usersToCreate: { name: string; email: string; password: string }[] = [];

        for (const line of lines) {
            const parts = line.split(",").map((p: string) => p.trim());

            if (parts.length < 3) {
                continue;
            }

            const [name, email, password] = parts;

            if (!name || !email || !password) {
                continue;
            }

            // Validate email format
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                continue;
            }

            usersToCreate.push({ name, email, password });
        }

        if (usersToCreate.length === 0) {
            return NextResponse.json({ error: "没有有效的用户数据" }, { status: 400 });
        }

        // Check for existing emails
        const existingEmails = await prisma.user.findMany({
            where: {
                email: { in: usersToCreate.map((u) => u.email) },
            },
            select: { email: true },
        });

        const existingEmailSet = new Set(existingEmails.map((u) => u.email));
        const validUsers = usersToCreate.filter((u) => !existingEmailSet.has(u.email));

        if (validUsers.length === 0) {
            return NextResponse.json({ error: "所有邮箱已被使用" }, { status: 400 });
        }

        // Create users
        const createdUsers = await Promise.all(
            validUsers.map(async (u) => {
                const hashedPassword = await hash(u.password, 12);
                return prisma.user.create({
                    data: {
                        name: u.name,
                        email: u.email,
                        password: hashedPassword,
                    },
                });
            })
        );

        return NextResponse.json({
            message: `成功导入 ${createdUsers.length} 个用户`,
            count: createdUsers.length,
            skipped: usersToCreate.length - validUsers.length,
        });
    } catch (error) {
        console.error("Import users error:", error);
        return NextResponse.json({ error: "导入失败" }, { status: 500 });
    }
}
