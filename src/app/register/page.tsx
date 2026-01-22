"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./auth.module.css";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("两次输入的密码不一致");
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("密码长度至少6位");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "注册失败");
            }

            // Redirect to login page
            router.push("/login?registered=true");
        } catch (err) {
            setError(err instanceof Error ? err.message : "注册失败，请重试");
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
                        <h1 className={styles.title}>创建账号</h1>
                        <p className={styles.subtitle}>加入我们，开始分享你的创意作品</p>
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
                            <label className="label" htmlFor="name">
                                用户名
                            </label>
                            <input
                                type="text"
                                id="name"
                                className="input"
                                placeholder="请输入用户名"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>

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
                                placeholder="请输入密码（至少6位）"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                disabled={loading}
                                minLength={6}
                            />
                        </div>

                        <div className="form-group">
                            <label className="label" htmlFor="confirmPassword">
                                确认密码
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                className="input"
                                placeholder="请再次输入密码"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                                    注册中...
                                </>
                            ) : (
                                "创建账号"
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className={styles.footer}>
                        <p>
                            已有账号？{" "}
                            <Link href="/login" className={styles.link}>
                                立即登录
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
