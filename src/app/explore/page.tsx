"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./explore.module.css";

interface Portfolio {
    id: string;
    title: string;
    description?: string;
    cover?: string;
    user: {
        id: string;
        name: string;
        avatar?: string;
    };
    itemCount: number;
    viewCount: number;
}

export default function ExplorePage() {
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [loading, setLoading] = useState(true);
    const [columns, setColumns] = useState(3);
    const [viewMode, setViewMode] = useState<"grid" | "masonry">("masonry");

    useEffect(() => {
        fetchPortfolios();
    }, []);

    const fetchPortfolios = async () => {
        try {
            const res = await fetch("/api/portfolios?limit=50");
            const data = await res.json();
            setPortfolios(data.portfolios || []);
        } catch (error) {
            console.error("Failed to fetch portfolios:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className="heading-1">探索作品</h1>
                        <p className={styles.subtitle}>发现来自夏令营学员的精彩创作</p>
                    </div>
                </div>

                {/* Controls */}
                <div className={styles.controls}>
                    <div className={styles.viewModeToggle}>
                        <button
                            className={`${styles.modeBtn} ${viewMode === "masonry" ? styles.active : ""}`}
                            onClick={() => setViewMode("masonry")}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="9" />
                                <rect x="14" y="3" width="7" height="5" />
                                <rect x="14" y="12" width="7" height="9" />
                                <rect x="3" y="16" width="7" height="5" />
                            </svg>
                            瀑布流
                        </button>
                        <button
                            className={`${styles.modeBtn} ${viewMode === "grid" ? styles.active : ""}`}
                            onClick={() => setViewMode("grid")}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                            </svg>
                            网格
                        </button>
                    </div>

                    <div className={styles.columnSelector}>
                        <span className={styles.columnLabel}>列数:</span>
                        {[2, 3, 4, 5].map((num) => (
                            <button
                                key={num}
                                className={`${styles.columnBtn} ${columns === num ? styles.active : ""}`}
                                onClick={() => setColumns(num)}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
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
                        <h3>暂无作品</h3>
                        <p>还没有已发布的作品，敬请期待</p>
                    </div>
                ) : (
                    <div
                        className={`${styles.gallery} ${viewMode === "grid" ? styles.gridView : styles.masonryView}`}
                        style={{ "--columns": columns } as React.CSSProperties}
                    >
                        {portfolios.map((portfolio, index) => (
                            <Link
                                key={portfolio.id}
                                href={`/portfolio/${portfolio.id}`}
                                className={styles.card}
                                style={{ "--delay": `${index * 50}ms` } as React.CSSProperties}
                            >
                                <div className={styles.cardCover}>
                                    {portfolio.cover ? (
                                        <Image
                                            src={portfolio.cover}
                                            alt={portfolio.title}
                                            fill
                                            sizes={`(max-width: 768px) 50vw, ${100 / columns}vw`}
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
                                    <div className={styles.cardOverlay}>
                                        <div className={styles.cardInfo}>
                                            <h3 className={styles.cardTitle}>{portfolio.title}</h3>
                                            <div className={styles.cardMeta}>
                                                <span className={styles.author}>
                                                    <span className={styles.authorAvatar}>
                                                        {portfolio.user.avatar ? (
                                                            <Image
                                                                src={portfolio.user.avatar}
                                                                alt={portfolio.user.name}
                                                                width={20}
                                                                height={20}
                                                            />
                                                        ) : (
                                                            portfolio.user.name.charAt(0).toUpperCase()
                                                        )}
                                                    </span>
                                                    {portfolio.user.name}
                                                </span>
                                                <span className={styles.stats}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                    {portfolio.viewCount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
