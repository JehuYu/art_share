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
    status: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    itemCount: number;
}

export default function AdminPortfoliosPage() {
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("PENDING");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchPortfolios();
    }, [filter]);

    const fetchPortfolios = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/portfolios?status=${filter}`);
            const data = await res.json();
            setPortfolios(data.portfolios || []);
        } catch {
            setError("获取作品列表失败");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/admin/portfolios/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });

            if (!res.ok) throw new Error("操作失败");

            setSuccess(status === "APPROVED" ? "作品已通过审核" : "作品已拒绝");
            fetchPortfolios();
        } catch {
            setError("操作失败");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("确定要删除此作品吗？")) return;

        try {
            const res = await fetch(`/api/admin/portfolios/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("删除失败");

            setSuccess("作品已删除");
            fetchPortfolios();
        } catch {
            setError("删除失败");
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <Link href="/admin" className={styles.backLink}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            返回
                        </Link>
                        <h1 className="heading-2">作品审核</h1>
                    </div>

                    {/* Filter Tabs */}
                    <div className={styles.tabs}>
                        {[
                            { value: "PENDING", label: "待审核" },
                            { value: "APPROVED", label: "已通过" },
                            { value: "REJECTED", label: "已拒绝" },
                            { value: "all", label: "全部" },
                        ].map((tab) => (
                            <button
                                key={tab.value}
                                className={`${styles.tab} ${filter === tab.value ? styles.active : ""}`}
                                onClick={() => setFilter(tab.value)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className={styles.error}>
                        {error}
                        <button onClick={() => setError("")}>×</button>
                    </div>
                )}

                {success && (
                    <div className={styles.success}>
                        {success}
                        <button onClick={() => setSuccess("")}>×</button>
                    </div>
                )}

                {/* Portfolio List */}
                {loading ? (
                    <div className={styles.loading}>
                        <div className="loading-spinner"></div>
                    </div>
                ) : portfolios.length === 0 ? (
                    <div className={styles.empty}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="M21 15l-5-5L5 21" />
                        </svg>
                        <h3>暂无{filter === "PENDING" ? "待审核" : ""}作品</h3>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {portfolios.map((portfolio) => (
                            <div key={portfolio.id} className={styles.card}>
                                <div className={styles.cardCover}>
                                    {portfolio.cover ? (
                                        <Image
                                            src={portfolio.cover}
                                            alt={portfolio.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                            style={{ objectFit: "cover" }}
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
                                    <div className={styles.statusBadge}>
                                        <span
                                            className={`badge ${portfolio.status === "APPROVED"
                                                    ? "badge-success"
                                                    : portfolio.status === "REJECTED"
                                                        ? "badge-error"
                                                        : "badge-warning"
                                                }`}
                                        >
                                            {portfolio.status === "APPROVED"
                                                ? "已通过"
                                                : portfolio.status === "REJECTED"
                                                    ? "已拒绝"
                                                    : "待审核"}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.cardBody}>
                                    <h3 className={styles.cardTitle}>{portfolio.title}</h3>
                                    <div className={styles.cardMeta}>
                                        <span>{portfolio.user.name}</span>
                                        <span>·</span>
                                        <span>{portfolio.itemCount} 项</span>
                                        <span>·</span>
                                        <span>{new Date(portfolio.createdAt).toLocaleDateString("zh-CN")}</span>
                                    </div>

                                    <div className={styles.cardActions}>
                                        <Link
                                            href={`/portfolio/${portfolio.id}`}
                                            target="_blank"
                                            className="btn btn-secondary btn-sm"
                                        >
                                            预览
                                        </Link>

                                        {portfolio.status === "PENDING" && (
                                            <>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => handleAction(portfolio.id, "APPROVED")}
                                                >
                                                    通过
                                                </button>
                                                <button
                                                    className={`btn btn-sm ${styles.rejectBtn}`}
                                                    onClick={() => handleAction(portfolio.id, "REJECTED")}
                                                >
                                                    拒绝
                                                </button>
                                            </>
                                        )}

                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() => handleDelete(portfolio.id)}
                                            title="删除"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
