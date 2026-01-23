"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./portfolios.module.css";

interface Portfolio {
    id: string;
    title: string;
    description?: string;
    cover?: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    isPublic: boolean;
    viewCount: number;
    createdAt: string;
    _count: {
        items: number;
    };
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function PortfoliosPage() {
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
    });
    const [filter, setFilter] = useState<"all" | "PENDING" | "APPROVED" | "REJECTED">("all");

    const fetchPortfolios = async (page: number = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString(),
                mine: "true",
            });
            if (filter !== "all") {
                params.append("status", filter);
            }

            const res = await fetch(`/api/portfolios?${params}`);
            const data = await res.json();

            setPortfolios(data.portfolios || []);
            setPagination(data.pagination || pagination);
        } catch (error) {
            console.error("Failed to fetch portfolios:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPortfolios(1);
    }, [filter]);

    const handlePageChange = (newPage: number) => {
        fetchPortfolios(newPage);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "APPROVED":
                return <span className="badge badge-success">已发布</span>;
            case "REJECTED":
                return <span className="badge badge-error">未通过</span>;
            default:
                return <span className="badge badge-warning">审核中</span>;
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <Link href="/dashboard" className={styles.backLink}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            返回仪表盘
                        </Link>
                        <h1 className="heading-2">我的作品集</h1>
                    </div>
                    <Link href="/dashboard/portfolios/new" className="btn btn-primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        创建作品集
                    </Link>
                </div>

                {/* Filters */}
                <div className={styles.filters}>
                    <button
                        className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`}
                        onClick={() => setFilter("all")}
                    >
                        全部
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === "APPROVED" ? styles.active : ""}`}
                        onClick={() => setFilter("APPROVED")}
                    >
                        已发布
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === "PENDING" ? styles.active : ""}`}
                        onClick={() => setFilter("PENDING")}
                    >
                        审核中
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === "REJECTED" ? styles.active : ""}`}
                        onClick={() => setFilter("REJECTED")}
                    >
                        未通过
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className={styles.loading}>
                        <div className="loading-spinner"></div>
                        <p>加载中...</p>
                    </div>
                ) : portfolios.length === 0 ? (
                    <div className={styles.empty}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="M21 15l-5-5L5 21" />
                        </svg>
                        <h3>暂无作品集</h3>
                        <p>创建你的第一个作品集，开始分享你的创意</p>
                        <Link href="/dashboard/portfolios/new" className="btn btn-primary">
                            创建作品集
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className={styles.grid}>
                            {portfolios.map((portfolio) => (
                                <Link
                                    key={portfolio.id}
                                    href={`/dashboard/portfolios/${portfolio.id}`}
                                    className={styles.card}
                                >
                                    <div className={styles.cardCover}>
                                        {portfolio.cover ? (
                                            <Image
                                                src={portfolio.cover}
                                                alt={portfolio.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 33vw"
                                                style={{ objectFit: "cover" }}
                                                unoptimized
                                            />
                                        ) : (
                                            <div className={styles.placeholder}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                                    <circle cx="9" cy="9" r="2" />
                                                    <path d="M21 15l-5-5L5 21" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className={styles.cardStatus}>
                                            {getStatusBadge(portfolio.status)}
                                        </div>
                                    </div>
                                    <div className={styles.cardInfo}>
                                        <h3 className={styles.cardTitle}>{portfolio.title}</h3>
                                        <div className={styles.cardMeta}>
                                            <span>{portfolio._count.items} 项</span>
                                            <span>{portfolio.viewCount} 浏览</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button
                                    className={styles.pageBtn}
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                </button>
                                <span className={styles.pageInfo}>
                                    第 {pagination.page} 页 / 共 {pagination.totalPages} 页
                                </span>
                                <button
                                    className={styles.pageBtn}
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
