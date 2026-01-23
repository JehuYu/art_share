import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import styles from "./admin.module.css";

export default async function AdminPage() {
    const user = await getAuthUser();

    if (!user || user.role !== "ADMIN") {
        redirect("/login");
    }

    // Get stats
    const [userCount, portfolioCount, pendingCount, albumCount] = await Promise.all([
        prisma.user.count(),
        prisma.portfolio.count(),
        prisma.portfolio.count({ where: { status: "PENDING" } }),
        prisma.album.count({ where: { isActive: true } }),
    ]);

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <h2 className={styles.sidebarTitle}>管理后台</h2>
                    </div>

                    <nav className={styles.nav}>
                        <Link href="/admin" className={`${styles.navItem} ${styles.active}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                            </svg>
                            控制台
                        </Link>
                        <Link href="/admin/users" className={styles.navItem}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            用户管理
                        </Link>
                        <Link href="/admin/portfolios" className={styles.navItem}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="9" cy="9" r="2" />
                                <path d="M21 15l-5-5L5 21" />
                            </svg>
                            作品审核
                            {pendingCount > 0 && (
                                <span className={styles.badge}>{pendingCount}</span>
                            )}
                        </Link>
                        <Link href="/admin/manage" className={styles.navItem}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                                <rect x="9" y="3" width="6" height="4" rx="1" />
                                <path d="M9 12h6" />
                                <path d="M9 16h6" />
                            </svg>
                            作品集管理
                        </Link>
                        <Link href="/admin/albums" className={styles.navItem}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="6" width="20" height="12" rx="2" />
                                <path d="M8 6v12M16 6v12" />
                            </svg>
                            轮播图管理
                        </Link>
                        <Link href="/admin/settings" className={styles.navItem}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            系统设置
                        </Link>
                    </nav>

                    <Link href="/dashboard" className={styles.backLink}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        返回个人中心
                    </Link>
                </aside>

                {/* Main */}
                <main className={styles.main}>
                    <div className={styles.header}>
                        <h1 className="heading-2">管理控制台</h1>
                        <p className={styles.subtitle}>欢迎回来，{user.name}</p>
                    </div>

                    {/* Stats */}
                    <div className={styles.stats}>
                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.iconUsers}`}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{userCount}</span>
                                <span className={styles.statLabel}>注册用户</span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.iconPortfolios}`}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <circle cx="9" cy="9" r="2" />
                                    <path d="M21 15l-5-5L5 21" />
                                </svg>
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{portfolioCount}</span>
                                <span className={styles.statLabel}>作品集</span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.iconPending}`}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12,6 12,12 16,14" />
                                </svg>
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{pendingCount}</span>
                                <span className={styles.statLabel}>待审核</span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.iconAlbums}`}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="6" width="20" height="12" rx="2" />
                                    <path d="M8 6v12M16 6v12" />
                                </svg>
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{albumCount}</span>
                                <span className={styles.statLabel}>轮播图</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className={styles.section}>
                        <h2 className="heading-3">快捷操作</h2>
                        <div className={styles.quickActions}>
                            <Link href="/admin/users" className={styles.actionCard}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="8.5" cy="7" r="4" />
                                    <line x1="20" y1="8" x2="20" y2="14" />
                                    <line x1="23" y1="11" x2="17" y2="11" />
                                </svg>
                                <span>添加用户</span>
                            </Link>
                            <Link href="/admin/portfolios" className={styles.actionCard}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 11l3 3L22 4" />
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                </svg>
                                <span>审核作品</span>
                            </Link>
                            <Link href="/admin/manage" className={styles.actionCard}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                                    <rect x="9" y="3" width="6" height="4" rx="1" />
                                    <path d="M9 12h6" />
                                    <path d="M9 16h6" />
                                </svg>
                                <span>管理作品集</span>
                            </Link>
                            <Link href="/admin/albums" className={styles.actionCard}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <line x1="12" y1="8" x2="12" y2="16" />
                                    <line x1="8" y1="12" x2="16" y2="12" />
                                </svg>
                                <span>添加轮播图</span>
                            </Link>
                            <Link href="/admin/settings" className={styles.actionCard}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9" />
                                </svg>
                                <span>系统设置</span>
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
