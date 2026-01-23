"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./albums.module.css";

interface Album {
    id: string;
    title: string;
    description?: string;
    cover: string;
    link?: string;
    order: number;
    isActive: boolean;
}

interface ApprovedPortfolio {
    id: string;
    title: string;
    description?: string;
    cover?: string;
    userName: string;
}

type SourceType = "custom" | "portfolio";

export default function AdminAlbumsPage() {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [portfolios, setPortfolios] = useState<ApprovedPortfolio[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

    // Form state
    const [sourceType, setSourceType] = useState<SourceType>("custom");
    const [selectedPortfolioId, setSelectedPortfolioId] = useState("");
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        cover: "",
        link: "",
    });
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState("");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchAlbums();
        fetchApprovedPortfolios();
    }, []);

    const fetchAlbums = async () => {
        try {
            const res = await fetch("/api/admin/albums", {
                cache: "no-store",
                headers: {
                    "Cache-Control": "no-cache",
                },
            });
            const data = await res.json();
            setAlbums(data.albums || []);
        } catch {
            setError("获取轮播图失败");
        } finally {
            setLoading(false);
        }
    };

    const fetchApprovedPortfolios = async () => {
        try {
            const res = await fetch("/api/admin/portfolios/approved");
            const data = await res.json();
            setPortfolios(data.portfolios || []);
        } catch {
            console.error("获取作品集失败");
        }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setCoverPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handlePortfolioSelect = (portfolioId: string) => {
        setSelectedPortfolioId(portfolioId);
        const portfolio = portfolios.find(p => p.id === portfolioId);
        if (portfolio) {
            setFormData({
                title: portfolio.title,
                description: portfolio.description || "",
                cover: "",
                link: `/portfolio/${portfolio.id}`,
            });
            if (portfolio.cover) {
                setCoverPreview(portfolio.cover);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const data = new FormData();
            data.append("title", formData.title);
            data.append("description", formData.description);
            data.append("link", formData.link);

            if (coverFile) {
                data.append("cover", coverFile);
            } else if (editingAlbum) {
                data.append("coverUrl", editingAlbum.cover);
            } else if (sourceType === "portfolio" && coverPreview) {
                // Use portfolio cover URL directly
                data.append("coverUrl", coverPreview);
            }

            const url = editingAlbum
                ? `/api/admin/albums/${editingAlbum.id}`
                : "/api/admin/albums";

            const res = await fetch(url, {
                method: editingAlbum ? "PUT" : "POST",
                body: data,
            });

            if (!res.ok) throw new Error("保存失败");

            setSuccess(editingAlbum ? "轮播图已更新" : "轮播图已添加");
            closeModal();
            fetchAlbums();
        } catch {
            setError("保存失败");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("确定要删除此轮播图吗？此操作无法撤销。")) return;

        setError("");
        setSuccess("");

        try {
            const res = await fetch(`/api/admin/albums/${id}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "删除失败");
            }

            setSuccess("轮播图已删除");
            await fetchAlbums();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "删除失败，请重试";
            setError(errorMessage);
            console.error("Delete error:", err);
        }
    };

    const handleToggle = async (id: string, isActive: boolean) => {
        try {
            await fetch(`/api/admin/albums/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !isActive }),
            });
            fetchAlbums();
        } catch {
            setError("更新失败");
        }
    };

    const openAddModal = () => {
        setEditingAlbum(null);
        setSourceType("custom");
        setSelectedPortfolioId("");
        setFormData({ title: "", description: "", cover: "", link: "" });
        setCoverFile(null);
        setCoverPreview("");
        setShowModal(true);
    };

    const openEditModal = (album: Album) => {
        setEditingAlbum(album);
        setSourceType("custom");
        setSelectedPortfolioId("");
        setFormData({
            title: album.title,
            description: album.description || "",
            cover: album.cover,
            link: album.link || "",
        });
        setCoverFile(null);
        setCoverPreview(album.cover);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingAlbum(null);
        setSourceType("custom");
        setSelectedPortfolioId("");
        setCoverFile(null);
        setCoverPreview("");
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
                        <h1 className="heading-2">轮播图管理</h1>
                    </div>
                    <button className="btn btn-primary" onClick={openAddModal}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        添加轮播图
                    </button>
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

                {/* Album List */}
                {loading ? (
                    <div className={styles.loading}>
                        <div className="loading-spinner"></div>
                    </div>
                ) : albums.length === 0 ? (
                    <div className={styles.empty}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="2" y="6" width="20" height="12" rx="2" />
                            <path d="M8 6v12M16 6v12" />
                        </svg>
                        <h3>暂无轮播图</h3>
                        <button className="btn btn-primary" onClick={openAddModal}>
                            添加第一个轮播图
                        </button>
                    </div>
                ) : (
                    <div className={styles.list}>
                        {albums.map((album) => (
                            <div key={album.id} className={`${styles.item} ${!album.isActive ? styles.inactive : ""}`}>
                                <div className={styles.itemCover}>
                                    <Image
                                        src={album.cover}
                                        alt={album.title}
                                        width={200}
                                        height={120}
                                        style={{ objectFit: "cover" }}
                                        unoptimized
                                    />
                                </div>
                                <div className={styles.itemInfo}>
                                    <h3 className={styles.itemTitle}>{album.title}</h3>
                                    {album.description && (
                                        <p className={styles.itemDesc}>{album.description}</p>
                                    )}
                                    {album.link && (
                                        <p className={styles.itemLink}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                            </svg>
                                            {album.link.startsWith("/portfolio/") ? "作品集链接" : album.link}
                                        </p>
                                    )}
                                    <span className={`badge ${album.isActive ? "badge-success" : "badge-warning"}`}>
                                        {album.isActive ? "显示中" : "已隐藏"}
                                    </span>
                                </div>
                                <div className={styles.itemActions}>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleToggle(album.id, album.isActive)}
                                    >
                                        {album.isActive ? "隐藏" : "显示"}
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => openEditModal(album)}
                                    >
                                        编辑
                                    </button>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={() => handleDelete(album.id)}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <>
                        <div className="overlay" onClick={closeModal} />
                        <div className="modal" style={{ maxWidth: "600px" }}>
                            <div className="modal-header">
                                <h3>{editingAlbum ? "编辑轮播图" : "添加轮播图"}</h3>
                                <button onClick={closeModal}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {/* Source Type Toggle (only for new albums) */}
                                    {!editingAlbum && (
                                        <div className={styles.sourceToggle}>
                                            <button
                                                type="button"
                                                className={`${styles.sourceBtn} ${sourceType === "custom" ? styles.active : ""}`}
                                                onClick={() => {
                                                    setSourceType("custom");
                                                    setSelectedPortfolioId("");
                                                    setFormData({ title: "", description: "", cover: "", link: "" });
                                                    setCoverPreview("");
                                                }}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                                    <path d="M12 8v8M8 12h8" />
                                                </svg>
                                                自定义
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.sourceBtn} ${sourceType === "portfolio" ? styles.active : ""}`}
                                                onClick={() => setSourceType("portfolio")}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                                    <circle cx="9" cy="9" r="2" />
                                                    <path d="M21 15l-5-5L5 21" />
                                                </svg>
                                                选择作品集
                                            </button>
                                        </div>
                                    )}

                                    {/* Portfolio Selection */}
                                    {!editingAlbum && sourceType === "portfolio" && (
                                        <div className="form-group">
                                            <label className="label">选择作品集</label>
                                            {portfolios.length === 0 ? (
                                                <p className={styles.noPortfolios}>
                                                    暂无已审核通过的公开作品集
                                                </p>
                                            ) : (
                                                <>
                                                    <div className={styles.portfolioSearch}>
                                                        <input
                                                            type="text"
                                                            placeholder="搜索作品集..."
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className={styles.portfolioGrid}>
                                                        {portfolios
                                                            .filter(p =>
                                                                searchQuery === "" ||
                                                                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                                p.userName.toLowerCase().includes(searchQuery.toLowerCase())
                                                            )
                                                            .map((portfolio) => (
                                                                <div
                                                                    key={portfolio.id}
                                                                    className={`${styles.portfolioOption} ${selectedPortfolioId === portfolio.id ? styles.selected : ""}`}
                                                                    onClick={() => handlePortfolioSelect(portfolio.id)}
                                                                >
                                                                    <div className={styles.portfolioThumb}>
                                                                        {portfolio.cover ? (
                                                                            <Image
                                                                                src={portfolio.cover}
                                                                                alt={portfolio.title}
                                                                                width={120}
                                                                                height={80}
                                                                                style={{ objectFit: "cover" }}
                                                                                unoptimized
                                                                            />
                                                                        ) : (
                                                                            <div className={styles.noThumb}>
                                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                                                                    <circle cx="9" cy="9" r="2" />
                                                                                    <path d="M21 15l-5-5L5 21" />
                                                                                </svg>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className={styles.portfolioInfo}>
                                                                        <span className={styles.portfolioTitle}>{portfolio.title}</span>
                                                                        <span className={styles.portfolioAuthor}>by {portfolio.userName}</span>
                                                                    </div>
                                                                    {selectedPortfolioId === portfolio.id && (
                                                                        <div className={styles.checkmark}>
                                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                                                <polyline points="20 6 9 17 4 12" />
                                                                            </svg>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Title */}
                                    <div className="form-group">
                                        <label className="label">标题</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            required
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="form-group">
                                        <label className="label">描述</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    {/* Cover Image */}
                                    <div className="form-group">
                                        <label className="label">
                                            封面图片
                                            {sourceType === "portfolio" && selectedPortfolioId && " (使用作品集封面或上传新图)"}
                                        </label>
                                        <div className={styles.coverUpload}>
                                            {coverPreview && (
                                                <div className={styles.coverPreview}>
                                                    <img src={coverPreview} alt="Cover preview" />
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleCoverChange}
                                                className={styles.fileInput}
                                                id="cover-upload"
                                            />
                                            <label htmlFor="cover-upload" className="btn btn-secondary btn-sm">
                                                {coverPreview ? "更换图片" : "选择图片"}
                                            </label>
                                        </div>
                                    </div>

                                    {/* Link */}
                                    <div className="form-group">
                                        <label className="label">
                                            跳转链接
                                            {sourceType === "portfolio" && " (自动指向作品集页面)"}
                                        </label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="/portfolio/xxx 或 https://..."
                                            value={formData.link}
                                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                            readOnly={sourceType === "portfolio" && !!selectedPortfolioId}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                        取消
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={sourceType === "portfolio" && !selectedPortfolioId && !editingAlbum}
                                    >
                                        {editingAlbum ? "保存" : "添加"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
