import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Get public system settings (no auth required)
export async function GET() {
    try {
        let settings = await prisma.systemSettings.findFirst();

        if (!settings) {
            // Return default settings
            return NextResponse.json({
                siteName: "Art Share",
                siteDescription: "夏令营作品展示平台",
                exploreViewMode: "masonry",
                exploreColumns: 4,
                featuredViewMode: "masonry",
                featuredColumns: 4,
                featuredMaxRows: 2,
                allowRegistration: true,
            });
        }

        // Return only public settings
        return NextResponse.json({
            siteName: settings.siteName,
            siteDescription: settings.siteDescription,
            exploreViewMode: settings.exploreViewMode,
            exploreColumns: settings.exploreColumns,
            featuredViewMode: settings.featuredViewMode,
            featuredColumns: settings.featuredColumns,
            featuredMaxRows: settings.featuredMaxRows,
            allowRegistration: settings.allowRegistration,
        });
    } catch (error) {
        console.error("Get public settings error:", error);
        return NextResponse.json({
            siteName: "Art Share",
            siteDescription: "夏令营作品展示平台",
            exploreViewMode: "masonry",
            exploreColumns: 4,
            featuredViewMode: "masonry",
            featuredColumns: 4,
            featuredMaxRows: 2,
            allowRegistration: true,
        });
    }
}
