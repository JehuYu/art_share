import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

interface Props {
    params: Promise<{ id: string }>;
}

// PATCH - Update portfolio (status, title, description, isPublic)
export async function PATCH(request: Request, { params }: Props) {
    try {
        const user = await getAuthUser();
        const { id } = await params;

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        const body = await request.json();
        const { status, title, description, isPublic } = body;

        // Build update data
        const updateData: Record<string, unknown> = {};

        // Handle status update
        if (status) {
            if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
                return NextResponse.json({ error: "无效的状态" }, { status: 400 });
            }
            updateData.status = status;
            // Auto-set isPublic based on status unless explicitly provided
            if (typeof isPublic !== "boolean") {
                updateData.isPublic = status === "APPROVED";
            }
        }

        // Handle title update
        if (title !== undefined) {
            updateData.title = title;
        }

        // Handle description update
        if (description !== undefined) {
            updateData.description = description || null;
        }

        // Handle isPublic toggle
        if (typeof isPublic === "boolean") {
            updateData.isPublic = isPublic;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "没有要更新的字段" }, { status: 400 });
        }

        await prisma.portfolio.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ message: "已更新" });
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
