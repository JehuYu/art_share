"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Carousel.module.css";

interface Album {
    id: string;
    title: string;
    description?: string | null;
    cover: string;
    link?: string | null;
}

interface CarouselProps {
    albums: Album[];
    autoPlayInterval?: number;
}

export default function Carousel({ albums, autoPlayInterval = 5000 }: CarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % albums.length);
    }, [albums.length]);

    const goToPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + albums.length) % albums.length);
    }, [albums.length]);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    useEffect(() => {
        if (!isAutoPlaying || albums.length <= 1) return;

        const timer = setInterval(goToNext, autoPlayInterval);
        return () => clearInterval(timer);
    }, [isAutoPlaying, albums.length, autoPlayInterval, goToNext]);

    if (albums.length === 0) {
        return (
            <div className={styles.emptyCarousel}>
                <div className={styles.emptyContent}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="M21 15l-5-5L5 21" />
                    </svg>
                    <p>暂无轮播内容</p>
                </div>
            </div>
        );
    }

    const currentAlbum = albums[currentIndex];

    return (
        <div className={styles.carousel}>
            {/* Slides */}
            <div className={styles.slides}>
                {albums.map((album, index) => (
                    <div
                        key={album.id}
                        className={`${styles.slide} ${index === currentIndex ? styles.active : ""}`}
                    >
                        <div className={styles.imageWrapper}>
                            {album.cover && album.cover.trim() !== "" ? (
                                <img
                                    src={album.cover}
                                    alt={album.title}
                                    className={styles.carouselImage}
                                    loading={index === 0 ? "eager" : "lazy"}
                                />
                            ) : (
                                <div className={styles.placeholderBg} />
                            )}
                            <div className={styles.overlay} />
                        </div>
                        <div className={styles.content}>
                            <h2 className={styles.title}>{album.title}</h2>
                            {album.description && (
                                <p className={styles.description}>{album.description}</p>
                            )}
                            {album.link && (
                                <Link href={album.link} className={`btn btn-primary ${styles.cta}`}>
                                    查看详情
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            {albums.length > 1 && (
                <>
                    <button
                        className={`${styles.navButton} ${styles.prev}`}
                        onClick={goToPrev}
                        aria-label="Previous slide"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <button
                        className={`${styles.navButton} ${styles.next}`}
                        onClick={goToNext}
                        aria-label="Next slide"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {albums.length > 1 && (
                <div className={styles.dots}>
                    {albums.map((_, index) => (
                        <button
                            key={index}
                            className={`${styles.dot} ${index === currentIndex ? styles.active : ""}`}
                            onClick={() => goToSlide(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Progress Bar */}
            {isAutoPlaying && albums.length > 1 && (
                <div className={styles.progressBar}>
                    <div
                        className={styles.progress}
                        style={{ animationDuration: `${autoPlayInterval}ms` }}
                        key={currentIndex}
                    />
                </div>
            )}
        </div>
    );
}
