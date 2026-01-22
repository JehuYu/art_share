"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./MasonryGrid.module.css";

interface Portfolio {
    id: string;
    title: string;
    cover?: string | null;
    user: {
        id: string;
        name: string;
        avatar?: string | null;
    };
    viewCount: number;
    itemCount?: number;
}

interface MasonryGridProps {
    portfolios: Portfolio[];
    loading?: boolean;
    initialViewMode?: "masonry" | "grid";
    initialColumns?: number;
    showControls?: boolean;
    maxRows?: number;
}

export default function MasonryGrid({
    portfolios,
    loading = false,
    initialViewMode = "masonry",
    initialColumns = 4,
    showControls = false,
    maxRows
}: MasonryGridProps) {
    const [viewMode, setViewMode] = useState<"masonry" | "grid">(initialViewMode);
    const [columns, setColumns] = useState(initialColumns);
    const [userColumns, setUserColumns] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Responsive columns
    useEffect(() => {
        const updateColumns = () => {
            if (userColumns) {
                // If user selected columns, respect it but cap at max possible for screen width
                const width = window.innerWidth;
                const maxCols = width < 640 ? 1 : width < 1024 ? 3 : 5;
                setColumns(Math.min(userColumns, maxCols));
                return;
            }

            const width = window.innerWidth;
            if (width < 640) setColumns(1);
            else if (width < 768) setColumns(2);
            else if (width < 1024) setColumns(3);
            else setColumns(initialColumns);
        };

        updateColumns();
        window.addEventListener("resize", updateColumns);
        return () => window.removeEventListener("resize", updateColumns);
    }, [userColumns, initialColumns]);

    const handleColumnChange = (cols: number) => {
        setUserColumns(cols);
    };

    // Calculate max items based on maxRows
    const maxItems = maxRows ? maxRows * columns : portfolios.length;
    const displayPortfolios = portfolios.slice(0, maxItems);

    // Distribute items across columns for masonry view
    const columnItems: Portfolio[][] = Array.from({ length: columns }, () => []);

    if (viewMode === "masonry") {
        // Simple distribution - alternate columns
        displayPortfolios.forEach((item, index) => {
            columnItems[index % columns].push(item);
        });
    }

    if (loading) {
        return (
            <div className={styles.gridContainer}>
                <div className={styles.grid} ref={containerRef}>
                    {Array.from({ length: 4 }).map((_, colIndex) => (
                        <div key={colIndex} className={styles.column}>
                            {Array.from({ length: 3 }).map((_, itemIndex) => (
                                <div
                                    key={itemIndex}
                                    className={styles.skeleton}
                                    style={{ height: `${200 + Math.random() * 200}px` }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (portfolios.length === 0) {
        return (
            <div className={styles.empty}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 15l6-6 4 4 8-8" />
                </svg>
                <h3>暂无作品展示</h3>
                <p>期待第一个作品的诞生</p>
            </div>
        );
    }

    return (
        <div className={styles.gridContainer}>
            {/* Controls - Only shown when showControls is true */}
            {showControls && (
                <div className={styles.controls}>
                    <div className={styles.controlGroup}>
                        {[2, 3, 4, 5].map((cols) => (
                            <button
                                key={cols}
                                className={`${styles.controlBtn} ${columns === cols ? styles.active : ""}`}
                                onClick={() => handleColumnChange(cols)}
                                title={`${cols}列`}
                            >
                                <span style={{ fontSize: "12px", fontWeight: "bold" }}>{cols}</span>
                            </button>
                        ))}
                    </div>

                    <div className={styles.controlGroup}>
                        <button
                            className={`${styles.controlBtn} ${viewMode === "masonry" ? styles.active : ""}`}
                            onClick={() => setViewMode("masonry")}
                            title="瀑布流"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="9" />
                                <rect x="14" y="3" width="7" height="5" />
                                <rect x="14" y="12" width="7" height="9" />
                                <rect x="3" y="16" width="7" height="5" />
                            </svg>
                        </button>
                        <button
                            className={`${styles.controlBtn} ${viewMode === "grid" ? styles.active : ""}`}
                            onClick={() => setViewMode("grid")}
                            title="网格"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {viewMode === "masonry" ? (
                <div className={styles.grid} ref={containerRef}>
                    {columnItems.map((column, colIndex) => (
                        <div key={colIndex} className={styles.column}>
                            {column.map((portfolio, itemIndex) => (
                                <PortfolioItem
                                    key={portfolio.id}
                                    portfolio={portfolio}
                                    style={{ animationDelay: `${(colIndex * 3 + itemIndex) * 0.1}s` }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            ) : (
                <div className={`${styles.grid} ${styles.gridView}`}
                    style={{ "--columns": columns } as React.CSSProperties}>
                    {displayPortfolios.map((portfolio, index) => (
                        <PortfolioItem
                            key={portfolio.id}
                            portfolio={portfolio}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function PortfolioItem({ portfolio, style }: { portfolio: Portfolio; style?: React.CSSProperties }) {
    return (
        <Link
            href={`/portfolio/${portfolio.id}`}
            className={styles.item}
            style={style}
        >
            <div className={styles.imageWrapper}>
                {portfolio.cover ? (
                    <img
                        src={portfolio.cover}
                        alt={portfolio.title}
                        className={styles.coverImage}
                        loading="lazy"
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
                <div className={styles.overlay}>
                    <div className={styles.overlayContent}>
                        <h3 className={styles.title}>{portfolio.title}</h3>
                        <div className={styles.meta}>
                            <span className={styles.views}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                                {portfolio.viewCount}
                            </span>
                            {portfolio.itemCount !== undefined && (
                                <span className={styles.count}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="7" height="7" />
                                        <rect x="14" y="3" width="7" height="7" />
                                        <rect x="14" y="14" width="7" height="7" />
                                        <rect x="3" y="14" width="7" height="7" />
                                    </svg>
                                    {portfolio.itemCount}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.info}>
                <div className={styles.author}>
                    <div className={styles.avatar}>
                        {portfolio.user.avatar ? (
                            <Image
                                src={portfolio.user.avatar}
                                alt={portfolio.user.name}
                                width={28}
                                height={28}
                            />
                        ) : (
                            portfolio.user.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <span className={styles.authorName}>{portfolio.user.name}</span>
                </div>
            </div>
        </Link>
    );
}
