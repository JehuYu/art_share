"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./MasonryGrid.module.css";

interface Portfolio {
    id: string;
    title: string;
    cover?: string;
    user: {
        id: string;
        name: string;
        avatar?: string;
    };
    viewCount: number;
    itemCount?: number;
}

interface MasonryGridProps {
    portfolios: Portfolio[];
    loading?: boolean;
}

export default function MasonryGrid({ portfolios, loading = false }: MasonryGridProps) {
    const [viewMode, setViewMode] = useState<"grid" | "carousel">("grid");
    const [columns, setColumns] = useState(4);
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
            else setColumns(4);
        };

        updateColumns();
        window.addEventListener("resize", updateColumns);
        return () => window.removeEventListener("resize", updateColumns);
    }, [userColumns]);

    const handleColumnChange = (cols: number) => {
        setUserColumns(cols);
    };

    // Distribute items across columns
    const columnItems: Portfolio[][] = Array.from({ length: columns }, () => []);
    portfolios.forEach((item, index) => {
        columnItems[index % columns].push(item);
    });

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
            {/* Controls */}
            <div className={styles.controls}>
                {viewMode === "grid" && (
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
                )}

                <div className={styles.controlGroup}>
                    <button
                        className={`${styles.controlBtn} ${viewMode === "grid" ? styles.active : ""}`}
                        onClick={() => setViewMode("grid")}
                        title="瀑布流"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                    </button>
                    <button
                        className={`${styles.controlBtn} ${viewMode === "carousel" ? styles.active : ""}`}
                        onClick={() => setViewMode("carousel")}
                        title="轮播"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="6" width="20" height="12" rx="2" />
                            <path d="M8 6v12M16 6v12" />
                        </svg>
                    </button>
                </div>
            </div>

            {viewMode === "grid" ? (
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
                <div
                    className={styles.grid}
                    style={{
                        overflowX: "auto",
                        paddingBottom: "20px",
                        scrollSnapType: "x mandatory" // Enable scroll snapping
                    }}
                >
                    {portfolios.map((portfolio) => (
                        <div
                            key={portfolio.id}
                            style={{
                                minWidth: "300px",
                                scrollSnapAlign: "start"
                            }}
                        >
                            <PortfolioItem portfolio={portfolio} />
                        </div>
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
                    <Image
                        src={portfolio.cover}
                        alt={portfolio.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
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
