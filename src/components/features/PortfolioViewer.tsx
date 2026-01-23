"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

/**
 * 获取显示用的图片 URL
 * @param item 作品项目
 * @param useOriginal 是否使用原图（当前查看的图片应该使用原图）
 */
function getImageUrl(item: PortfolioItem, useOriginal: boolean = false): string {
    if (useOriginal) {
        return item.url; // 当前查看的图片使用原图
    }
    // 其他图片优先使用缩略图
    return item.thumbnail || item.url;
}

export default function PortfolioViewer({ portfolio }: PortfolioViewerProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("carousel");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

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

    // Auto-play functionality
    const startAutoPlay = useCallback(() => {
        if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        setIsAutoPlaying(true);
        autoPlayRef.current = setInterval(() => {
            goToNext();
        }, 3000); // 3 seconds interval
    }, [goToNext]);

    const stopAutoPlay = useCallback(() => {
        if (autoPlayRef.current) {
            clearInterval(autoPlayRef.current);
            autoPlayRef.current = null;
        }
        setIsAutoPlaying(false);
    }, []);

    const toggleAutoPlay = useCallback(() => {
        if (isAutoPlaying) {
            stopAutoPlay();
        } else {
            startAutoPlay();
        }
    }, [isAutoPlaying, startAutoPlay, stopAutoPlay]);

    // Clean up auto-play on unmount
    useEffect(() => {
        return () => {
            if (autoPlayRef.current) {
                clearInterval(autoPlayRef.current);
            }
        };
    }, []);

    // Stop auto-play when switching to album view
    useEffect(() => {
        if (viewMode === "album" && isAutoPlaying) {
            stopAutoPlay();
        }
    }, [viewMode, isAutoPlaying, stopAutoPlay]);

    // 预加载相邻图片的原图（提升用户体验）
    useEffect(() => {
        if (items.length <= 1) return;

        // 预加载前一张和后一张的原图
        const prevIndex = (currentIndex - 1 + items.length) % items.length;
        const nextIndex = (currentIndex + 1) % items.length;

        const imagesToPreload = [items[prevIndex], items[nextIndex]].filter(
            (item) => item && item.type === "IMAGE"
        );

        imagesToPreload.forEach((item) => {
            const img = new window.Image();
            img.src = item.url; // 预加载原图
        });
    }, [currentIndex, items]);

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
                                            unoptimized
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
                    {/* Auto-play Button - Only show in carousel mode */}
                    {viewMode === "carousel" && items.length > 1 && (
                        <button
                            className={`${styles.autoPlayBtn} ${isAutoPlaying ? styles.active : ""}`}
                            onClick={toggleAutoPlay}
                            title={isAutoPlaying ? "停止自动播放" : "开始自动播放"}
                        >
                            {isAutoPlaying ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="6" y="4" width="4" height="16" rx="1" />
                                    <rect x="14" y="4" width="4" height="16" rx="1" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5,3 19,12 5,21" />
                                </svg>
                            )}
                            <span>{isAutoPlaying ? "停止" : "自动播放"}</span>
                        </button>
                    )}

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
                        {/* Blurred Background */}
                        {currentItem && (
                            <div
                                className={styles.blurredBackground}
                                style={{
                                    backgroundImage: `url(${currentItem.type === "IMAGE" ? currentItem.url : currentItem.thumbnail || ""})`,
                                }}
                            />
                        )}

                        {/* Viewer Controls - Top Floating */}
                        <div className={styles.viewerHeader} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.counter}>
                                {currentIndex + 1} / {portfolio.items.length}
                            </div>
                        </div>

                        {currentItem?.type === "VIDEO" ? (
                            <div className={styles.imageWrapper}>
                                <video
                                    key={currentItem.id}
                                    src={currentItem.url}
                                    controls
                                    autoPlay
                                    className={styles.currentMedia}
                                />
                            </div>
                        ) : (
                            <div className={styles.imageWrapper}>
                                {currentItem && (
                                    <Image
                                        key={currentItem.id}
                                        src={currentItem.url}
                                        alt={currentItem.title || `Image ${currentIndex + 1}`}
                                        fill
                                        style={{ objectFit: "contain" }}
                                        className={styles.currentMedia}
                                        unoptimized
                                        priority
                                    />
                                )}
                            </div>
                        )}

                        {/* Floating Navigation Arrows within mainView */}
                        {items.length > 1 && (
                            <>
                                <button
                                    className={`${styles.navButton} ${styles.prev}`}
                                    onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                                    aria-label="Previous image"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                </button>
                                <button
                                    className={`${styles.navButton} ${styles.next}`}
                                    onClick={(e) => { e.stopPropagation(); goToNext(); }}
                                    aria-label="Next image"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </button>
                            </>
                        )}
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

                    {/* Floating Thumbnails filmstrip */}
                    {items.length > 1 && (
                        <div className={styles.thumbnailsContainer}>
                            <div className={styles.thumbnails}>
                                {items.map((item, index) => (
                                    <button
                                        key={item.id}
                                        className={`${styles.thumbnail} ${currentIndex === index ? styles.active : ""}`}
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
                                                src={getImageUrl(item, false)}
                                                alt={item.title || `Thumbnail ${index + 1}`}
                                                width={60}
                                                height={45}
                                                style={{ objectFit: "cover" }}
                                                unoptimized
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
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
                                        src={getImageUrl(item, false)}
                                        alt={item.title || `Image ${index + 1}`}
                                        fill
                                        sizes="(max-width: 768px) 50vw, 33vw"
                                        style={{ objectFit: "cover" }}
                                        unoptimized
                                        loading="lazy"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Description as an overlay/collapsed section */}
            {
                portfolio.description && (
                    <div className={styles.description}>
                        <div className={styles.descriptionContent}>
                            <p>{portfolio.description}</p>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
