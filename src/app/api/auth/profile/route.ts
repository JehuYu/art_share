import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function PUT(request: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ error: "未登录" }, { status: 401 });
        }

        const { name } = await request.json();

        if (!name || name.trim().length === 0) {
            return NextResponse.json({ error: "名称不能为空" }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { name: name.trim() },
        });

        return NextResponse.json({ message: "更新成功" });
    } catch (error) {
        console.error("Update profile error:", error);
        return NextResponse.json({ error: "更新失败" }, { status: 500 });
    }
}
