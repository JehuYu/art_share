"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./auth.module.css";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "登录失败");
            }

            // Refresh the page to update session
            router.push("/dashboard");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "登录失败，请重试");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.card}>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.logo}>
                            <div className={styles.logoIcon}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                    <path d="M2 17l10 5 10-5" />
                                    <path d="M2 12l10 5 10-5" />
                                </svg>
                            </div>
                        </div>
                        <h1 className={styles.title}>欢迎回来</h1>
                        <p className={styles.subtitle}>登录你的账号，继续探索精彩作品</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className={styles.error}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className="form-group">
                            <label className="label" htmlFor="email">
                                邮箱地址
                            </label>
                            <input
                                type="email"
                                id="email"
                                className="input"
                                placeholder="请输入邮箱"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label className="label" htmlFor="password">
                                密码
                            </label>
                            <input
                                type="password"
                                id="password"
                                className="input"
                                placeholder="请输入密码"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary btn-lg ${styles.submitBtn}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className={styles.spinner}></span>
                                    登录中...
                                </>
                            ) : (
                                "登录"
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className={styles.footer}>
                        <p>
                            还没有账号？{" "}
                            <Link href="/register" className={styles.link}>
                                立即注册
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className={styles.decor}>
                    <div className={styles.decorCircle}></div>
                    <div className={styles.decorCircle}></div>
                </div>
            </div>
        </div>
    );
}
