import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

interface Props {
    params: Promise<{ id: string }>;
}

// PATCH - Update portfolio status (approve/reject)
export async function PATCH(request: Request, { params }: Props) {
    try {
        const user = await getAuthUser();
        const { id } = await params;

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        const { status } = await request.json();

        if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
            return NextResponse.json({ error: "无效的状态" }, { status: 400 });
        }

        await prisma.portfolio.update({
            where: { id },
            data: {
                status,
                isPublic: status === "APPROVED",
            },
        });

        return NextResponse.json({ message: "状态已更新" });
    } catch (error) {
        console.error("Update portfolio error:", error);
        return NextResponse.json({ error: "更新失败" }, { status: 500 });
    }
}

// DELETE - Delete portfolio
export async function DELETE(_request: Request, { params }: Props) {
    try {
        const user = await getAuthUser();
        const { id } = await params;

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        await prisma.portfolio.delete({
            where: { id },
        });

        return NextResponse.json({ message: "作品集已删除" });
    } catch (error) {
        console.error("Delete portfolio error:", error);
        return NextResponse.json({ error: "删除失败" }, { status: 500 });
    }
}
