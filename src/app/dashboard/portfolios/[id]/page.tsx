"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import styles from "./portfolio-edit.module.css";

interface PortfolioItem {
    id: string;
    type: "IMAGE" | "VIDEO";
    url: string;
    thumbnail?: string;
    title?: string;
    order: number;
}

interface Portfolio {
    id: string;
    title: string;
    description?: string;
    cover?: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    isPublic: boolean;
    viewCount: number;
    createdAt: string;
    items: PortfolioItem[];
}

interface UploadingFile {
    id: string;
    file: File;
    progress: number;
    status: "uploading" | "done" | "error";
    preview?: string;
}

export default function PortfolioEditPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Upload state
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);

    // Lightbox
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    // Edit info state
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [editData, setEditData] = useState({ title: "", description: "" });

    // Fetch portfolio data
    const fetchPortfolio = useCallback(async () => {
        try {
            const res = await fetch(`/api/portfolios/${id}`);
            if (!res.ok) {
                if (res.status === 404) {
                    router.push("/dashboard");
                    return;
                }
                throw new Error("获取失败");
            }
            const data = await res.json();
            setPortfolio(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "获取失败");
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        fetchPortfolio();
    }, [fetchPortfolio]);

    const handleStartEdit = () => {
        if (!portfolio) return;
        setEditData({
            title: portfolio.title,
            description: portfolio.description || ""
        });
        setIsEditingInfo(true);
    };

    const handleSaveInfo = async () => {
        if (!portfolio) return;
        setSaving(true);
        setError("");

        if (!editData.title.trim()) {
            setError("标题不能为空");
            setSaving(false);
            return;
        }

        try {
            const res = await fetch(`/api/portfolios/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "更新失败");
            }

            // Refresh the full portfolio data to ensure state consistency
            await fetchPortfolio();
            setIsEditingInfo(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "更新失败");
        } finally {
            setSaving(false);
        }
    };

    // Handle file selection
    const handleFilesSelected = useCallback(async (files: FileList | File[]) => {
        const fileArray = Array.from(files).filter(
            (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
        );

        if (fileArray.length === 0) return;

        // Create upload entries
        const newUploads: UploadingFile[] = fileArray.map((file) => ({
            id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            progress: 0,
            status: "uploading" as const,
            preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        }));

        setUploadingFiles((prev) => [...prev, ...newUploads]);

        // Upload files in parallel (batch of 3)
        const batchSize = 3;
        for (let i = 0; i < newUploads.length; i += batchSize) {
            const batch = newUploads.slice(i, i + batchSize);
            await Promise.all(batch.map((upload) => uploadFile(upload)));
        }
    }, []);

    const uploadFile = async (upload: UploadingFile) => {
        const formData = new FormData();
        formData.append("file", upload.file);
        formData.append("portfolioId", id);

        try {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    setUploadingFiles((prev) =>
                        prev.map((u) => (u.id === upload.id ? { ...u, progress } : u))
                    );
                }
            });

            await new Promise<void>((resolve, reject) => {
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        setUploadingFiles((prev) =>
                            prev.map((u) =>
                                u.id === upload.id ? { ...u, status: "done", progress: 100 } : u
                            )
                        );
                        resolve();
                    } else {
                        reject(new Error("上传失败"));
                    }
                };
                xhr.onerror = () => reject(new Error("网络错误"));
                xhr.open("POST", `/api/portfolios/${id}/items`);
                xhr.send(formData);
            });

            // Remove from uploading after a delay
            setTimeout(() => {
                setUploadingFiles((prev) => prev.filter((u) => u.id !== upload.id));
                fetchPortfolio(); // Refresh data
            }, 1000);
        } catch (err) {
            setUploadingFiles((prev) =>
                prev.map((u) =>
                    u.id === upload.id ? { ...u, status: "error" } : u
                )
            );
        }
    };

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        handleFilesSelected(files);
    };

    // Toggle public
    const handleTogglePublic = async () => {
        if (!portfolio || portfolio.status !== "APPROVED") return;
        setSaving(true);

        try {
            const res = await fetch(`/api/portfolios/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublic: !portfolio.isPublic }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "保存失败");
            }
            setPortfolio({ ...portfolio, isPublic: !portfolio.isPublic });
        } catch (err) {
            setError(err instanceof Error ? err.message : "保存失败");
        } finally {
            setSaving(false);
        }
    };

    // Set cover
    const handleSetCover = async (itemUrl: string) => {
        if (!portfolio) return;
        setSaving(true);

        try {
            const res = await fetch(`/api/portfolios/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cover: itemUrl }),
            });

            if (!res.ok) throw new Error("保存失败");
            setPortfolio({ ...portfolio, cover: itemUrl });
        } catch (err) {
            setError(err instanceof Error ? err.message : "保存失败");
        } finally {
            setSaving(false);
        }
    };

    // Delete item
    const handleDeleteItem = async (itemId: string) => {
        if (!confirm("确定要删除这个作品吗？")) return;

        try {
            const res = await fetch(`/api/portfolios/${id}/items/${itemId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("删除失败");
            fetchPortfolio();
        } catch (err) {
            setError(err instanceof Error ? err.message : "删除失败");
        }
    };

    // Delete portfolio
    const handleDeletePortfolio = async () => {
        if (!confirm("确定要删除整个作品集吗？此操作不可撤销。")) return;
        setDeleting(true);

        try {
            const res = await fetch(`/api/portfolios/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("删除失败");
            router.push("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "删除失败");
            setDeleting(false);
        }
    };

    // Status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <span className={`${styles.statusBadge} ${styles.statusPending}`}>待审核</span>;
            case "APPROVED":
                return <span className={`${styles.statusBadge} ${styles.statusApproved}`}>已通过</span>;
            case "REJECTED":
                return <span className={`${styles.statusBadge} ${styles.statusRejected}`}>已拒绝</span>;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className="empty-state">
                        <div className="loading-spinner"></div>
                        <p>加载中...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!portfolio) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4M12 16h.01" />
                        </svg>
                        <p>作品集不存在</p>
                        <Link href="/dashboard" className="btn btn-primary" style={{ marginTop: 16 }}>
                            返回仪表盘
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
                        <div className={styles.titleRow}>
                            {isEditingInfo ? (
                                <input
                                    type="text"
                                    className={styles.titleInput}
                                    value={editData.title}
                                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                    placeholder="输入作品集标题"
                                    autoFocus
                                />
                            ) : (
                                <h1 className="heading-2">{portfolio.title}</h1>
                            )}
                            {getStatusBadge(portfolio.status)}
                        </div>
                        {isEditingInfo ? (
                            <div className={styles.editInfoActions}>
                                <textarea
                                    className={styles.descriptionInput}
                                    value={editData.description}
                                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                    placeholder="输入作品集描述"
                                    rows={3}
                                />
                                <div className={styles.editActionButtons}>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={handleSaveInfo}
                                        disabled={saving}
                                    >
                                        {saving ? "保存中..." : "保存修改"}
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setIsEditingInfo(false)}
                                        disabled={saving}
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        ) : (
                            portfolio.description && (
                                <p style={{ color: "var(--text-secondary)", marginTop: 8 }}>
                                    {portfolio.description}
                                </p>
                            )
                        )}
                    </div>
                    <div className={styles.headerActions}>
                        {!isEditingInfo && (
                            <button
                                className="btn btn-ghost"
                                onClick={handleStartEdit}
                                style={{ marginRight: 12 }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                编辑标题/描述
                            </button>
                        )}
                        <Link href={`/portfolio/${id}`} className="btn btn-secondary">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                            预览
                        </Link>
                    </div>
                </div>

                {error && (
                    <div style={{
                        padding: "12px 16px",
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: 8,
                        color: "var(--error)",
                        marginBottom: 24,
                    }}>
                        {error}
                    </div>
                )}

                {/* Stats + Actions Row */}
                <div className={styles.statsRow}>
                    <div className={styles.stats}>
                        <div className={styles.statItem}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21,15 16,10 5,21" />
                            </svg>
                            <div>
                                <div className={styles.statValue}>{portfolio.items.length}</div>
                                <div className={styles.statLabel}>作品数</div>
                            </div>
                        </div>
                        <div className={styles.statItem}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                            <div>
                                <div className={styles.statValue}>{portfolio.viewCount}</div>
                                <div className={styles.statLabel}>浏览量</div>
                            </div>
                        </div>
                        <div className={styles.statItem}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <div>
                                <div className={styles.statValue}>
                                    {new Date(portfolio.createdAt).toLocaleDateString("zh-CN")}
                                </div>
                                <div className={styles.statLabel}>创建日期</div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        {/* Public Toggle */}
                        {portfolio.status === "APPROVED" && (
                            <div className={styles.publicToggleCompact}>
                                <span className={styles.toggleLabel}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="2" y1="12" x2="22" y2="12" />
                                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                    </svg>
                                    公开展示
                                </span>
                                <button
                                    className={`${styles.toggle} ${portfolio.isPublic ? styles.active : ""}`}
                                    onClick={handleTogglePublic}
                                    disabled={saving}
                                />
                            </div>
                        )}

                        {/* Delete Button */}
                        <button
                            className={styles.deleteBtn}
                            onClick={handleDeletePortfolio}
                            disabled={deleting}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3,6 5,6 21,6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            {deleting ? "删除中..." : "删除作品集"}
                        </button>
                    </div>
                </div>

                {/* Content - Full Width */}
                <div className={styles.content}>
                    {/* Gallery Section - Full Width */}
                    <div className={styles.gallerySection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                作品列表 ({portfolio.items.length})
                            </h2>
                        </div>

                        {portfolio.items.length > 0 ? (
                            <div className={styles.gallery}>
                                {portfolio.items.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className={styles.galleryItem}
                                        onClick={() => setLightboxIndex(index)}
                                    >
                                        {item.type === "VIDEO" ? (
                                            <video src={item.url} muted />
                                        ) : (
                                            <img src={item.url} alt={item.title || `作品 ${index + 1}`} />
                                        )}
                                        {portfolio.cover === item.url && (
                                            <div className={styles.coverBadge}>封面</div>
                                        )}
                                        <div className={styles.itemOverlay}>
                                            <div className={styles.itemType}>
                                                {item.type === "VIDEO" ? (
                                                    <>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polygon points="5,3 19,12 5,21" />
                                                        </svg>
                                                        视频
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                                            <polyline points="21,15 16,10 5,21" />
                                                        </svg>
                                                        图片
                                                    </>
                                                )}
                                            </div>
                                            <div className={styles.itemActions}>
                                                {portfolio.cover !== item.url && (
                                                    <button
                                                        className={styles.itemBtn}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSetCover(item.url);
                                                        }}
                                                        title="设为封面"
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                        </svg>
                                                    </button>
                                                )}
                                                <button
                                                    className={styles.itemBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteItem(item.id);
                                                    }}
                                                    title="删除"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3,6 5,6 21,6" />
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21,15 16,10 5,21" />
                                </svg>
                                <p>还没有上传作品</p>
                            </div>
                        )}

                        {/* Upload Zone */}
                        <div
                            className={`${styles.uploadZone} ${isDragOver ? styles.dragOver : ""}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                className={styles.fileInput}
                                accept="image/*,video/*"
                                multiple
                                onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
                            />
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17,8 12,3 7,8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span>点击或拖拽批量上传图片/视频</span>
                            <span className={styles.uploadHint}>支持多选，可一次上传多个文件</span>
                        </div>

                        {/* Upload Progress */}
                        {uploadingFiles.length > 0 && (
                            <div className={styles.uploadProgress}>
                                {uploadingFiles.map((upload) => (
                                    <div key={upload.id} className={styles.uploadingItem}>
                                        {upload.preview ? (
                                            <img
                                                src={upload.preview}
                                                alt=""
                                                className={styles.uploadingThumb}
                                            />
                                        ) : (
                                            <div
                                                className={styles.uploadingThumb}
                                                style={{
                                                    background: "var(--bg-tertiary)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                                    <polygon points="5,3 19,12 5,21" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className={styles.uploadingInfo}>
                                            <div className={styles.uploadingName}>{upload.file.name}</div>
                                            <div className={styles.progressBar}>
                                                <div
                                                    className={styles.progressFill}
                                                    style={{ width: `${upload.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className={styles.uploadingStatus}>
                                            {upload.status === "uploading" && `${upload.progress}%`}
                                            {upload.status === "done" && "✓"}
                                            {upload.status === "error" && "失败"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div className={styles.lightbox} onClick={() => setLightboxIndex(null)}>
                    <button
                        className={styles.lightboxClose}
                        onClick={() => setLightboxIndex(null)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>

                    {lightboxIndex > 0 && (
                        <button
                            className={`${styles.lightboxNav} ${styles.prev}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(lightboxIndex - 1);
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                    )}

                    <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                        {portfolio.items[lightboxIndex].type === "VIDEO" ? (
                            <video
                                src={portfolio.items[lightboxIndex].url}
                                controls
                                autoPlay
                            />
                        ) : (
                            <img
                                src={portfolio.items[lightboxIndex].url}
                                alt=""
                            />
                        )}
                    </div>

                    {lightboxIndex < portfolio.items.length - 1 && (
                        <button
                            className={`${styles.lightboxNav} ${styles.next}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(lightboxIndex + 1);
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
