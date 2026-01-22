import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";
import PortfolioViewer from "@/components/features/PortfolioViewer";
import styles from "./portfolio.module.css";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function PortfolioPage({ params }: Props) {
    const { id } = await params;
    const currentUser = await getAuthUser();

    const portfolio = await prisma.portfolio.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                },
            },
            items: {
                orderBy: { order: "asc" },
            },
        },
    });

    if (!portfolio) {
        notFound();
    }

    // Check access permissions
    const isOwner = currentUser?.id === portfolio.userId;
    const isAdmin = currentUser?.role === "ADMIN";
    const isPubliclyAccessible = portfolio.status === "APPROVED" && portfolio.isPublic;

    // Allow access if: publicly accessible, owner viewing their own, or admin
    if (!isPubliclyAccessible && !isOwner && !isAdmin) {
        notFound();
    }

    // Only increment view count for public views (not owner/admin preview)
    if (isPubliclyAccessible && !isOwner) {
        await prisma.portfolio.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });
    }

    // Determine if showing preview mode
    const isPreview = !isPubliclyAccessible && (isOwner || isAdmin);

    return (
        <div className={styles.page}>
            {isPreview && (
                <div className={styles.previewBanner}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>
                        预览模式 - 此作品集
                        {portfolio.status === "PENDING" && "正在审核中"}
                        {portfolio.status === "REJECTED" && "未通过审核"}
                        {portfolio.status === "APPROVED" && !portfolio.isPublic && "未公开"}
                    </span>
                </div>
            )}
            <PortfolioViewer
                portfolio={{
                    id: portfolio.id,
                    title: portfolio.title,
                    description: portfolio.description,
                    user: portfolio.user,
                    items: portfolio.items.map(item => ({
                        ...item,
                        thumbnail: item.thumbnail ?? undefined,
                        title: item.title ?? undefined,
                    })),
                    viewCount: isPubliclyAccessible ? portfolio.viewCount + (isOwner ? 0 : 1) : portfolio.viewCount,
                    createdAt: portfolio.createdAt.toISOString(),
                }}
            />
        </div>
    );
}
