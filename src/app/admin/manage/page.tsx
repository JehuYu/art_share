"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./manage.module.css";

interface Portfolio {
    id: string;
    title: string;
    description?: string;
    cover?: string;
    status: string;
    isPublic: boolean;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    itemCount: number;
}

type SortField = "createdAt" | "updatedAt" | "title" | "viewCount";
type SortOrder = "asc" | "desc";

export default function AdminManagePortfoliosPage() {
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ title: "", description: "", isPublic: true });
    const [featuredIds, setFeaturedIds] = useState<string[]>([]);

    useEffect(() => {
        fetchPortfolios();
        fetchFeatured();
    }, [statusFilter, sortField, sortOrder]);

    const fetchPortfolios = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.append("status", statusFilter);
            params.append("sort", sortField);
            params.append("order", sortOrder);
            params.append("all", "true");

            const res = await fetch(`/api/admin/portfolios/manage?${params}`);
            const data = await res.json();
            setPortfolios(data.portfolios || []);
        } catch {
            setError("获取作品列表失败");
        } finally {
            setLoading(false);
        }
    };

    const fetchFeatured = async () => {
        try {
            const res = await fetch("/api/admin/featured");
            const data = await res.json();
            setFeaturedIds((data.featured || []).map((f: { portfolioId: string }) => f.portfolioId));
        } catch {
            console.error("获取精选列表失败");
        }
    };

    const toggleFeatured = async (portfolioId: string) => {
        const isFeatured = featuredIds.includes(portfolioId);
        try {
            if (isFeatured) {
                const res = await fetch(`/api/admin/featured/${portfolioId}`, {
                    method: "DELETE",
                });
                if (!res.ok) throw new Error("操作失败");
                setSuccess("已从精选中移除");
            } else {
                const res = await fetch("/api/admin/featured", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ portfolioId }),
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "操作失败");
                }
                setSuccess("已添加到精选");
            }
            fetchFeatured();
        } catch (err) {
            setError(err instanceof Error ? err.message : "操作失败");
        }
    };

    const filteredPortfolios = portfolios.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleStatusChange = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/admin/portfolios/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });

            if (!res.ok) throw new Error("操作失败");

            setSuccess("状态已更新");
            fetchPortfolios();
        } catch {
            setError("操作失败");
        }
    };

    const handlePublicToggle = async (id: string, isPublic: boolean) => {
        try {
            const res = await fetch(`/api/admin/portfolios/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublic }),
            });

            if (!res.ok) throw new Error("操作失败");

            setSuccess(isPublic ? "已设为公开" : "已设为私密");
            fetchPortfolios();
        } catch {
            setError("操作失败");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("确定要删除此作品集吗？此操作不可撤销。")) return;

        try {
            const res = await fetch(`/api/admin/portfolios/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("删除失败");

            setSuccess("作品集已删除");
            fetchPortfolios();
        } catch {
            setError("删除失败");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`确定要删除选中的 ${selectedIds.length} 个作品集吗？此操作不可撤销。`)) return;

        try {
            const res = await fetch("/api/admin/portfolios/bulk", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedIds }),
            });

            if (!res.ok) throw new Error("批量删除失败");

            setSuccess(`已删除 ${selectedIds.length} 个作品集`);
            setSelectedIds([]);
            fetchPortfolios();
        } catch {
            setError("批量删除失败");
        }
    };

    const handleBulkStatusChange = async (status: string) => {
        if (selectedIds.length === 0) return;

        try {
            const res = await fetch("/api/admin/portfolios/bulk", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedIds, status }),
            });

            if (!res.ok) throw new Error("批量更新失败");

            setSuccess(`已更新 ${selectedIds.length} 个作品集状态`);
            setSelectedIds([]);
            fetchPortfolios();
        } catch {
            setError("批量更新失败");
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredPortfolios.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredPortfolios.map(p => p.id));
        }
    };

    const handleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const startEditing = (portfolio: Portfolio) => {
        setEditingId(portfolio.id);
        setEditForm({
            title: portfolio.title,
            description: portfolio.description || "",
            isPublic: portfolio.isPublic,
        });
    };

    const saveEdit = async () => {
        if (!editingId) return;

        try {
            const res = await fetch(`/api/admin/portfolios/${editingId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });

            if (!res.ok) throw new Error("保存失败");

            setSuccess("作品集已更新");
            setEditingId(null);
            fetchPortfolios();
        } catch {
            setError("保存失败");
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "APPROVED": return "已通过";
            case "REJECTED": return "已拒绝";
            case "PENDING": return "待审核";
            default: return status;
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case "APPROVED": return "badge-success";
            case "REJECTED": return "badge-error";
            case "PENDING": return "badge-warning";
            default: return "";
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <Link href="/admin" className={styles.backLink}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            返回
                        </Link>
                        <h1 className="heading-2">作品集管理</h1>
                        <p className={styles.subtitle}>管理和编辑所有作品集</p>
                    </div>

                    {/* Toolbar */}
                    <div className={styles.toolbar}>
                        {/* Search */}
                        <div className={styles.searchBox}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="搜索作品标题、作者名称或邮箱..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filters */}
                        <div className={styles.filters}>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className={styles.select}
                            >
                                <option value="all">全部状态</option>
                                <option value="PENDING">待审核</option>
                                <option value="APPROVED">已通过</option>
                                <option value="REJECTED">已拒绝</option>
                            </select>

                            <select
                                value={`${sortField}-${sortOrder}`}
                                onChange={(e) => {
                                    const [field, order] = e.target.value.split("-");
                                    setSortField(field as SortField);
                                    setSortOrder(order as SortOrder);
                                }}
                                className={styles.select}
                            >
                                <option value="createdAt-desc">最新创建</option>
                                <option value="createdAt-asc">最旧创建</option>
                                <option value="updatedAt-desc">最近更新</option>
                                <option value="title-asc">标题 A-Z</option>
                                <option value="title-desc">标题 Z-A</option>
                                <option value="viewCount-desc">浏览量最高</option>
                                <option value="viewCount-asc">浏览量最低</option>
                            </select>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedIds.length > 0 && (
                        <div className={styles.bulkActions}>
                            <span className={styles.selectedCount}>
                                已选择 {selectedIds.length} 项
                            </span>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleBulkStatusChange("APPROVED")}
                            >
                                批量通过
                            </button>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleBulkStatusChange("PENDING")}
                            >
                                设为待审核
                            </button>
                            <button
                                className={`btn btn-sm ${styles.dangerBtn}`}
                                onClick={handleBulkDelete}
                            >
                                批量删除
                            </button>
                        </div>
                    )}
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

                {/* Portfolio Table */}
                {loading ? (
                    <div className={styles.loading}>
                        <div className="loading-spinner"></div>
                    </div>
                ) : filteredPortfolios.length === 0 ? (
                    <div className={styles.empty}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="M21 15l-5-5L5 21" />
                        </svg>
                        <h3>暂无作品集</h3>
                        <p>没有找到匹配的作品集</p>
                    </div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.checkboxCell}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === filteredPortfolios.length && filteredPortfolios.length > 0}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th>作品</th>
                                    <th>作者</th>
                                    <th>状态</th>
                                    <th>公开</th>
                                    <th>精选</th>
                                    <th>浏览量</th>
                                    <th>创建时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPortfolios.map((portfolio) => (
                                    <tr key={portfolio.id} className={selectedIds.includes(portfolio.id) ? styles.selected : ""}>
                                        <td className={styles.checkboxCell}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(portfolio.id)}
                                                onChange={() => handleSelectOne(portfolio.id)}
                                            />
                                        </td>
                                        <td>
                                            <div className={styles.portfolioCell}>
                                                <div className={styles.coverThumb}>
                                                    {portfolio.cover ? (
                                                        <Image
                                                            src={portfolio.cover}
                                                            alt={portfolio.title}
                                                            fill
                                                            sizes="48px"
                                                            style={{ objectFit: "cover" }}
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                                            <circle cx="9" cy="9" r="2" />
                                                            <path d="M21 15l-5-5L5 21" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className={styles.portfolioInfo}>
                                                    {editingId === portfolio.id ? (
                                                        <div className={styles.editFields}>
                                                            <input
                                                                type="text"
                                                                value={editForm.title}
                                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                                className={styles.inlineInput}
                                                                placeholder="作品标题"
                                                            />
                                                            <textarea
                                                                value={editForm.description}
                                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                                className={styles.inlineTextarea}
                                                                placeholder="作品说明（可选）"
                                                                rows={2}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className={styles.portfolioTitle}>{portfolio.title}</span>
                                                            {portfolio.description && (
                                                                <span className={styles.portfolioDesc}>{portfolio.description}</span>
                                                            )}
                                                        </>
                                                    )}
                                                    <span className={styles.itemCount}>{portfolio.itemCount} 项作品</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.authorCell}>
                                                <div className={styles.authorAvatar}>
                                                    {portfolio.user.avatar ? (
                                                        <Image
                                                            src={portfolio.user.avatar}
                                                            alt={portfolio.user.name}
                                                            fill
                                                            sizes="32px"
                                                            style={{ objectFit: "cover" }}
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        portfolio.user.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className={styles.authorInfo}>
                                                    <span className={styles.authorName}>{portfolio.user.name}</span>
                                                    <span className={styles.authorEmail}>{portfolio.user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <select
                                                value={portfolio.status}
                                                onChange={(e) => handleStatusChange(portfolio.id, e.target.value)}
                                                className={`${styles.statusSelect} ${styles[portfolio.status.toLowerCase()]}`}
                                            >
                                                <option value="PENDING">待审核</option>
                                                <option value="APPROVED">已通过</option>
                                                <option value="REJECTED">已拒绝</option>
                                            </select>
                                        </td>
                                        <td>
                                            <button
                                                className={`${styles.toggleBtn} ${portfolio.isPublic ? styles.active : ""}`}
                                                onClick={() => handlePublicToggle(portfolio.id, !portfolio.isPublic)}
                                                title={portfolio.isPublic ? "公开" : "私密"}
                                            >
                                                {portfolio.isPublic ? (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                ) : (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                        <line x1="1" y1="1" x2="23" y2="23" />
                                                    </svg>
                                                )}
                                            </button>
                                        </td>
                                        <td>
                                            <button
                                                className={`${styles.toggleBtn} ${featuredIds.includes(portfolio.id) ? styles.featured : ""}`}
                                                onClick={() => toggleFeatured(portfolio.id)}
                                                title={featuredIds.includes(portfolio.id) ? "取消精选" : "设为精选"}
                                                disabled={portfolio.status !== "APPROVED"}
                                            >
                                                <svg viewBox="0 0 24 24" fill={featuredIds.includes(portfolio.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                </svg>
                                            </button>
                                        </td>
                                        <td>
                                            <span className={styles.viewCount}>{portfolio.viewCount}</span>
                                        </td>
                                        <td>
                                            <span className={styles.date}>
                                                {new Date(portfolio.createdAt).toLocaleDateString("zh-CN")}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <Link
                                                    href={`/portfolio/${portfolio.id}`}
                                                    target="_blank"
                                                    className={styles.actionBtn}
                                                    title="预览"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                        <polyline points="15 3 21 3 21 9" />
                                                        <line x1="10" y1="14" x2="21" y2="3" />
                                                    </svg>
                                                </Link>
                                                {editingId === portfolio.id ? (
                                                    <>
                                                        <button
                                                            className={`${styles.actionBtn} ${styles.saveBtn}`}
                                                            onClick={saveEdit}
                                                            title="保存"
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            className={styles.actionBtn}
                                                            onClick={() => setEditingId(null)}
                                                            title="取消"
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                                <line x1="6" y1="6" x2="18" y2="18" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        className={styles.actionBtn}
                                                        onClick={() => startEditing(portfolio)}
                                                        title="编辑"
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>
                                                )}
                                                <button
                                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                    onClick={() => handleDelete(portfolio.id)}
                                                    title="删除"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Stats */}
                <div className={styles.tableFooter}>
                    <span>共 {filteredPortfolios.length} 个作品集</span>
                </div>
            </div>
        </div>
    );
}
