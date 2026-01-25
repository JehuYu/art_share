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

    // 批量操作状态
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [batchLoading, setBatchLoading] = useState(false);

    useEffect(() => {
        fetchPortfolios();
        setSelectedIds(new Set()); // 切换过滤器时重置选择
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

    // 单个操作
    const handleAction = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/admin/portfolios/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "操作失败");
            }

            setSuccess(status === "APPROVED" ? "作品已通过审核" : "作品已拒绝");
            fetchPortfolios();
        } catch (err) {
            setError(err instanceof Error ? err.message : "操作失败");
        }
    };

    // 单个删除
    const handleDelete = async (id: string) => {
        if (!confirm("确定要删除此作品吗？")) return;

        try {
            const res = await fetch(`/api/admin/portfolios/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "删除失败");
            }

            setSuccess("作品已删除");
            fetchPortfolios();
        } catch (err) {
            setError(err instanceof Error ? err.message : "删除失败");
        }
    };

    // 选择/取消选择
    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    // 全选/取消全选
    const toggleSelectAll = () => {
        if (selectedIds.size === portfolios.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(portfolios.map(p => p.id)));
        }
    };

    // 批量操作
    const handleBatchAction = async (action: "approve" | "reject" | "delete") => {
        if (selectedIds.size === 0) return;

        const actionName = {
            approve: "通过",
            reject: "拒绝",
            delete: "删除"
        }[action];

        if (!confirm(`确定要批量${actionName}选中的 ${selectedIds.size} 个作品吗？${action === 'delete' ? '此操作不可恢复。' : ''}`)) {
            return;
        }

        try {
            setBatchLoading(true);
            const res = await fetch("/api/admin/portfolios/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    ids: Array.from(selectedIds)
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "批量操作失败");
            }

            // 处理结果显示
            if (data.errors && data.errors.length > 0) {
                setError(`部分操作失败:\n${data.errors.join("\n")}`);
            } else {
                setSuccess(data.message);
            }

            // 重置选区并刷新
            setSelectedIds(new Set());
            fetchPortfolios();
        } catch (err) {
            setError(err instanceof Error ? err.message : "批量操作失败");
        } finally {
            setBatchLoading(false);
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

                {/* Batch Action Bar */}
                {portfolios.length > 0 && (
                    <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    checked={portfolios.length > 0 && selectedIds.size === portfolios.length}
                                    onChange={toggleSelectAll}
                                />
                                <span className="text-sm">全选 ({selectedIds.size}/{portfolios.length})</span>
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleBatchAction("approve")}
                                disabled={selectedIds.size === 0 || batchLoading}
                                className="btn btn-sm btn-success"
                                title="批量通过"
                            >
                                通过
                            </button>
                            <button
                                onClick={() => handleBatchAction("reject")}
                                disabled={selectedIds.size === 0 || batchLoading}
                                className="btn btn-sm btn-warning"
                                title="批量拒绝"
                            >
                                拒绝
                            </button>
                            <button
                                onClick={() => handleBatchAction("delete")}
                                disabled={selectedIds.size === 0 || batchLoading}
                                className="btn btn-sm btn-error"
                                title="批量删除"
                            >
                                删除
                            </button>
                        </div>
                    </div>
                )}

                {/* Messages */}
                {error && (
                    <div className={styles.error} style={{ whiteSpace: 'pre-line' }}>
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
                {loading || batchLoading ? (
                    <div className={styles.loading}>
                        <div className="loading-spinner"></div>
                        {batchLoading && <p className="mt-2 text-gray-500">正在处理批量操作...</p>}
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
                            <div
                                key={portfolio.id}
                                className={`${styles.card} ${selectedIds.has(portfolio.id) ? 'ring-2 ring-primary' : ''}`}
                            >
                                <div className={styles.cardCover}>
                                    {/* Selection Checkbox Overlay */}
                                    <div className="absolute top-2 left-2 z-10">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-lg bg-white/80 backdrop-blur-sm"
                                            checked={selectedIds.has(portfolio.id)}
                                            onChange={() => toggleSelection(portfolio.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>

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
                                    <h3
                                        className={`${styles.cardTitle} cursor-pointer hover:text-primary`}
                                        onClick={() => toggleSelection(portfolio.id)}
                                    >
                                        {portfolio.title}
                                    </h3>
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
