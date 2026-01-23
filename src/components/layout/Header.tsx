"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Header.module.css";

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<{ name: string; role: string } | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        // Fetch current user session
        fetch("/api/auth/session")
            .then((res) => res.json())
            .then((data) => {
                console.log("[Header] Session check result:", data);
                if (data?.user) {
                    setUser({ name: data.user.name, role: data.user.role });
                }
            })
            .catch((err) => {
                console.error("[Header] Session check failed:", err);
            });
    }, []); // Remove pathname dependency into allow caching session check

    const isActive = (path: string) => pathname === path;

    return (
        <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
            <div className={styles.container}>
                {/* Logo */}
                <Link href="/" className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span className={styles.logoText}>Art Share</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className={styles.nav}>
                    <Link
                        href="/"
                        className={`${styles.navLink} ${isActive("/") ? styles.active : ""}`}
                    >
                        首页
                    </Link>
                    <Link
                        href="/explore"
                        className={`${styles.navLink} ${isActive("/explore") ? styles.active : ""}`}
                    >
                        探索
                    </Link>
                </nav>

                {/* Auth Buttons / User Menu */}
                <div className={styles.actions}>
                    {user ? (
                        <div className={styles.userMenu}>
                            <Link href="/dashboard" className={styles.userButton}>
                                <div className={styles.avatar}>
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="hide-mobile">{user.name}</span>
                            </Link>
                            {user.role === "ADMIN" && (
                                <Link href="/admin" className={`btn btn-ghost btn-sm ${styles.adminLink}`}>
                                    管理后台
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className={styles.authButtons}>
                            <Link href="/login" className="btn btn-ghost">
                                登录
                            </Link>
                            <Link href="/register" className="btn btn-primary">
                                注册
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        className={styles.mobileToggle}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span className={isMobileMenuOpen ? styles.open : ""}></span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className={styles.mobileMenu}>
                    <nav className={styles.mobileNav}>
                        <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                            首页
                        </Link>
                        <Link href="/explore" onClick={() => setIsMobileMenuOpen(false)}>
                            探索
                        </Link>
                        {user ? (
                            <>
                                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                                    个人中心
                                </Link>
                                {user.role === "ADMIN" && (
                                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                                        管理后台
                                    </Link>
                                )}
                            </>
                        ) : (
                            <>
                                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                    登录
                                </Link>
                                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                                    注册
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
