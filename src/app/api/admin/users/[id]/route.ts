import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

interface Props {
    params: Promise<{ id: string }>;
}

// PATCH - Update user
export async function PATCH(request: Request, { params }: Props) {
    try {
        const user = await getAuthUser();
        const { id } = await params;

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        const { role, name } = await request.json();

        const updateData: Record<string, string> = {};
        if (role) updateData.role = role;
        if (name) updateData.name = name;

        await prisma.user.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ message: "更新成功" });
    } catch (error) {
        console.error("Update user error:", error);
        return NextResponse.json({ error: "更新失败" }, { status: 500 });
    }
}

// DELETE - Delete user
export async function DELETE(_request: Request, { params }: Props) {
    try {
        const user = await getAuthUser();
        const { id } = await params;

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        // Don't allow deleting self
        if (user.id === id) {
            return NextResponse.json({ error: "不能删除自己的账号" }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ message: "用户已删除" });
    } catch (error) {
        console.error("Delete user error:", error);
        return NextResponse.json({ error: "删除失败" }, { status: 500 });
    }
}
