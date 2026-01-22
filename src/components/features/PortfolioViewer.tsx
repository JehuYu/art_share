"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./PortfolioViewer.module.css";

interface PortfolioItem {
    id: string;
    type: string;
    url: string;
    thumbnail?: string;
    title?: string;
}

interface Portfolio {
    id: string;
    title: string;
    description?: string | null;
    user: {
        id: string;
        name: string;
        avatar?: string | null;
    };
    items: PortfolioItem[];
    viewCount: number;
    createdAt: string;
}

interface PortfolioViewerProps {
    portfolio: Portfolio;
}

type ViewMode = "carousel" | "album";

export default function PortfolioViewer({ portfolio }: PortfolioViewerProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("carousel");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const { items } = portfolio;

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
    }, [items.length]);

    const goToPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    }, [items.length]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" || e.key === " ") {
                e.preventDefault();
                goToNext();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                goToPrev();
            } else if (e.key === "Escape") {
                setIsFullscreen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [goToNext, goToPrev]);

    const currentItem = items[currentIndex];

    return (
        <div className={styles.viewer}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/" className={styles.backBtn}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div className={styles.info}>
                        <h1 className={styles.title}>{portfolio.title}</h1>
                        <div className={styles.meta}>
                            <Link href={`/user/${portfolio.user.id}`} className={styles.author}>
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
                                <span>{portfolio.user.name}</span>
                            </Link>
                            <span className={styles.divider}>·</span>
                            <span className={styles.views}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                                {portfolio.viewCount}
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.headerRight}>
                    {/* View Mode Toggle */}
                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.toggleBtn} ${viewMode === "carousel" ? styles.active : ""}`}
                            onClick={() => setViewMode("carousel")}
                            title="轮播模式"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="6" width="20" height="12" rx="2" />
                                <path d="M8 6v12M16 6v12" />
                            </svg>
                        </button>
                        <button
                            className={`${styles.toggleBtn} ${viewMode === "album" ? styles.active : ""}`}
                            onClick={() => setViewMode("album")}
                            title="画册模式"
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
            </div>

            {/* Content */}
            {viewMode === "carousel" ? (
                <div className={styles.carousel}>
                    {/* Main Image */}
                    <div
                        className={`${styles.mainView} ${isFullscreen ? styles.fullscreen : ""}`}
                        onClick={() => setIsFullscreen(!isFullscreen)}
                    >
                        {currentItem?.type === "VIDEO" ? (
                            <video
                                key={currentItem.id}
                                src={currentItem.url}
                                controls
                                autoPlay
                                className={styles.currentMedia}
                            />
                        ) : (
                            <div className={styles.imageWrapper}>
                                {currentItem && (
                                    <Image
                                        key={currentItem.id}
                                        src={currentItem.url}
                                        alt={currentItem.title || `Image ${currentIndex + 1}`}
                                        fill
                                        priority
                                        sizes="100vw"
                                        style={{ objectFit: "contain" }}
                                    />
                                )}
                            </div>
                        )}

                        {/* Navigation Arrows */}
                        {items.length > 1 && (
                            <>
                                <button
                                    className={`${styles.navBtn} ${styles.prevBtn}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        goToPrev();
                                    }}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                </button>
                                <button
                                    className={`${styles.navBtn} ${styles.nextBtn}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        goToNext();
                                    }}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </button>
                            </>
                        )}

                        {/* Counter */}
                        <div className={styles.counter}>
                            {currentIndex + 1} / {items.length}
                        </div>

                        {/* Fullscreen Button */}
                        <button
                            className={styles.fullscreenBtn}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsFullscreen(!isFullscreen);
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {isFullscreen ? (
                                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                                ) : (
                                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* Thumbnails */}
                    {items.length > 1 && (
                        <div className={styles.thumbnails}>
                            {items.map((item, index) => (
                                <button
                                    key={item.id}
                                    className={`${styles.thumbnail} ${currentIndex === index ? styles.active : ""
                                        }`}
                                    onClick={() => setCurrentIndex(index)}
                                >
                                    {item.type === "VIDEO" ? (
                                        <div className={styles.videoThumb}>
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5,3 19,12 5,21" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <Image
                                            src={item.url}
                                            alt={item.title || `Thumbnail ${index + 1}`}
                                            width={80}
                                            height={60}
                                            style={{ objectFit: "cover" }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className={styles.album}>
                    <div className={styles.albumGrid}>
                        {items.map((item, index) => (
                            <div
                                key={item.id}
                                className={styles.albumItem}
                                onClick={() => {
                                    setCurrentIndex(index);
                                    setViewMode("carousel");
                                }}
                            >
                                {item.type === "VIDEO" ? (
                                    <div className={styles.videoCard}>
                                        <video src={item.url} />
                                        <div className={styles.playIcon}>
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5,3 19,12 5,21" />
                                            </svg>
                                        </div>
                                    </div>
                                ) : (
                                    <Image
                                        src={item.url}
                                        alt={item.title || `Image ${index + 1}`}
                                        fill
                                        sizes="(max-width: 768px) 50vw, 33vw"
                                        style={{ objectFit: "cover" }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Description */}
            {portfolio.description && (
                <div className={styles.description}>
                    <div className="container">
                        <p>{portfolio.description}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
