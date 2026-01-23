"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
    const [columns, setColumns] = useState(4);
    const [viewMode, setViewMode] = useState<"grid" | "masonry">("masonry");
    const [shuffleSeed, setShuffleSeed] = useState<number>(() => Date.now());

    // 使用 useCallback 优化 shuffle 函数
    const shuffleArray = useCallback(<T,>(array: T[], seed: number): T[] => {
        const shuffled = [...array];
        // 基于种子的确定性随机（每次刷新页面会产生新的随机顺序）
        let currentSeed = seed;
        const random = () => {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            return currentSeed / 233280;
        };

        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }, []);

    useEffect(() => {
        // 并行获取数据和设置
        const fetchData = async () => {
            try {
                const [portfoliosRes, settingsRes] = await Promise.all([
                    fetch("/api/portfolios?limit=50"),
                    fetch("/api/settings"),
                ]);

                // 处理作品集数据
                if (portfoliosRes.ok) {
                    const data = await portfoliosRes.json();
                    setPortfolios(data.portfolios || []);
                }

                // 处理设置数据
                if (settingsRes.ok) {
                    const settings = await settingsRes.json();
                    if (settings.exploreViewMode) setViewMode(settings.exploreViewMode);
                    if (settings.exploreColumns) setColumns(settings.exploreColumns);
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // 使用 useMemo 避免每次渲染都重新 shuffle
    const displayPortfolios = useMemo(() => {
        return shuffleArray(portfolios, shuffleSeed);
    }, [portfolios, shuffleSeed, shuffleArray]);

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

                {/* Content */}
                {loading ? (
                    <div className={styles.loading}>
                        <div className="loading-spinner"></div>
                        <p>加载中...</p>
                    </div>
                ) : displayPortfolios.length === 0 ? (
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
                        {displayPortfolios.map((portfolio, index) => (
                            <Link
                                key={portfolio.id}
                                href={`/portfolio/${portfolio.id}`}
                                className={styles.card}
                                style={{ "--delay": `${index * 50}ms` } as React.CSSProperties}
                            >
                                <div className={styles.cardCover}>
                                    {portfolio.cover ? (
                                        <img
                                            src={portfolio.cover}
                                            alt={portfolio.title}
                                            loading="lazy"
                                            className={styles.coverImage}
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
                                                                unoptimized
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
