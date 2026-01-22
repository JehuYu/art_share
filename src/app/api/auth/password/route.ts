import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(request: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ error: "未登录" }, { status: 401 });
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "请填写所有字段" }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: "新密码长度至少6个字符" }, { status: 400 });
        }

        // Get user with password
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!dbUser) {
            return NextResponse.json({ error: "用户不存在" }, { status: 404 });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, dbUser.password);
        if (!isValid) {
            return NextResponse.json({ error: "当前密码不正确" }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        return NextResponse.json({ message: "密码修改成功" });
    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json({ error: "修改密码失败" }, { status: 500 });
    }
}
