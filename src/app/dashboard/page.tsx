import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import styles from "./dashboard.module.css";

export default async function DashboardPage() {
    const user = await getAuthUser();

    if (!user) {
        redirect("/login");
    }

    // Get user stats
    const portfolios = await prisma.portfolio.findMany({
        where: { userId: user.id },
        include: {
            _count: {
                select: { items: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const totalViews = portfolios.reduce((sum, p) => sum + p.viewCount, 0);
    const totalItems = portfolios.reduce((sum, p) => sum + p._count.items, 0);

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.profile}>
                        <div className={styles.avatar}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.profileInfo}>
                            <h3 className={styles.userName}>{user.name}</h3>
                            <p className={styles.userEmail}>{user.email}</p>
                        </div>
                    </div>

                    <nav className={styles.nav}>
                        <Link href="/dashboard" className={`${styles.navItem} ${styles.active}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                            </svg>
                            控制台
                        </Link>
                        <Link href="/dashboard/portfolios" className={styles.navItem}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="9" cy="9" r="2" />
                                <path d="M21 15l-5-5L5 21" />
                            </svg>
                            作品集
                        </Link>
                        <Link href="/dashboard/settings" className={styles.navItem}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            设置
                        </Link>
                    </nav>

                    {user.role === "ADMIN" && (
                        <Link href="/admin" className={styles.adminLink}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 4.354a4 4 0 1 1 0 5.292M15 21H3v-1a6 6 0 0 1 12 0v1zm0 0h6v-1a6 6 0 0 0-9-5.197M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
                            </svg>
                            管理后台
                        </Link>
                    )}
                </aside>

                {/* Main Content */}
                <main className={styles.main}>
                    <div className={styles.header}>
                        <h1 className="heading-2">欢迎，{user.name}</h1>
                        <p className={styles.headerSubtitle}>管理你的作品集，展示你的创意</p>
                    </div>

                    {/* Stats */}
                    <div className={styles.stats}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <circle cx="9" cy="9" r="2" />
                                    <path d="M21 15l-5-5L5 21" />
                                </svg>
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{portfolios.length}</span>
                                <span className={styles.statLabel}>作品集</span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7" />
                                    <rect x="14" y="3" width="7" height="7" />
                                    <rect x="14" y="14" width="7" height="7" />
                                    <rect x="3" y="14" width="7" height="7" />
                                </svg>
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{totalItems}</span>
                                <span className={styles.statLabel}>作品数</span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{totalViews}</span>
                                <span className={styles.statLabel}>浏览量</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Portfolios */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className="heading-3">最近作品集</h2>
                            <Link href="/dashboard/portfolios/new" className="btn btn-primary">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                创建作品集
                            </Link>
                        </div>

                        {portfolios.length === 0 ? (
                            <div className={styles.empty}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <circle cx="9" cy="9" r="2" />
                                    <path d="M21 15l-5-5L5 21" />
                                </svg>
                                <h3>还没有作品集</h3>
                                <p>创建你的第一个作品集，开始分享你的创意</p>
                                <Link href="/dashboard/portfolios/new" className="btn btn-primary">
                                    创建作品集
                                </Link>
                            </div>
                        ) : (
                            <div className={styles.portfolioGrid}>
                                {portfolios.slice(0, 6).map((portfolio) => (
                                    <Link
                                        key={portfolio.id}
                                        href={`/dashboard/portfolios/${portfolio.id}`}
                                        className={styles.portfolioCard}
                                    >
                                        <div className={styles.portfolioCover}>
                                            {portfolio.cover ? (
                                                <img src={portfolio.cover} alt={portfolio.title} />
                                            ) : (
                                                <div className={styles.portfolioPlaceholder}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                                        <circle cx="9" cy="9" r="2" />
                                                        <path d="M21 15l-5-5L5 21" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div className={styles.portfolioStatus}>
                                                <span
                                                    className={`badge ${portfolio.status === "APPROVED"
                                                            ? "badge-success"
                                                            : portfolio.status === "REJECTED"
                                                                ? "badge-error"
                                                                : "badge-warning"
                                                        }`}
                                                >
                                                    {portfolio.status === "APPROVED"
                                                        ? "已发布"
                                                        : portfolio.status === "REJECTED"
                                                            ? "未通过"
                                                            : "审核中"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={styles.portfolioInfo}>
                                            <h3 className={styles.portfolioTitle}>{portfolio.title}</h3>
                                            <div className={styles.portfolioMeta}>
                                                <span>{portfolio._count.items} 项</span>
                                                <span>{portfolio.viewCount} 浏览</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
