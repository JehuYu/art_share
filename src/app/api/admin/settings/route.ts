import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

// GET - Get system settings
export async function GET() {
    try {
        const user = await getAuthUser();

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        let settings = await prisma.systemSettings.findFirst();

        if (!settings) {
            // Create default settings
            settings = await prisma.systemSettings.create({
                data: {
                    id: "default",
                    siteName: "Art Share",
                    siteDescription: "夏令营作品展示平台",
                    requireApproval: true,
                    maxFileSize: 52428800,
                    storageType: "local",
                    localStoragePath: "uploads",
                    allowRegistration: true,
                },
            });
        }

        return NextResponse.json({ settings });
    } catch (error) {
        console.error("Get settings error:", error);
        return NextResponse.json({ error: "获取设置失败" }, { status: 500 });
    }
}

// PUT - Update system settings
export async function PUT(request: Request) {
    try {
        const user = await getAuthUser();

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "无权访问" }, { status: 403 });
        }

        const data = await request.json();

        const settings = await prisma.systemSettings.upsert({
            where: { id: "default" },
            update: {
                siteName: data.siteName,
                siteDescription: data.siteDescription,
                requireApproval: data.requireApproval,
                maxFileSize: data.maxFileSize,
                storageType: data.storageType,
                localStoragePath: data.localStoragePath,
                allowRegistration: data.allowRegistration,
                exploreViewMode: data.exploreViewMode,
                exploreColumns: data.exploreColumns,
                featuredViewMode: data.featuredViewMode,
                featuredColumns: data.featuredColumns,
                featuredMaxRows: data.featuredMaxRows,
            },
            create: {
                id: "default",
                siteName: data.siteName || "Art Share",
                siteDescription: data.siteDescription || "夏令营作品展示平台",
                requireApproval: data.requireApproval ?? true,
                maxFileSize: data.maxFileSize || 52428800,
                storageType: data.storageType || "local",
                localStoragePath: data.localStoragePath || "uploads",
                allowRegistration: data.allowRegistration ?? true,
                exploreViewMode: data.exploreViewMode || "masonry",
                exploreColumns: data.exploreColumns || 4,
                featuredViewMode: data.featuredViewMode || "masonry",
                featuredColumns: data.featuredColumns || 4,
                featuredMaxRows: data.featuredMaxRows || 2,
            },
        });

        return NextResponse.json({ settings, message: "设置已保存" });
    } catch (error) {
        console.error("Update settings error:", error);
        return NextResponse.json({ error: "保存设置失败" }, { status: 500 });
    }
}
