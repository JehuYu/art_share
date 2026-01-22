"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./settings.module.css";

interface User {
    id: string;
    name: string;
    email: string;
}

export default function UserSettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    // Form state
    const [name, setName] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const res = await fetch("/api/auth/me");
            if (!res.ok) {
                router.push("/login");
                return;
            }
            const data = await res.json();
            setUser(data.user);
            setName(data.user.name);
        } catch {
            router.push("/login");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch("/api/auth/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "更新失败");
            }

            setSuccess("个人信息已更新");
            setUser(user ? { ...user, name } : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "更新失败");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError("两次输入的密码不一致");
            return;
        }

        if (newPassword.length < 6) {
            setError("密码长度至少6个字符");
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch("/api/auth/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "修改密码失败");
            }

            setSuccess("密码已修改");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "修改密码失败");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
        } catch {
            setError("注销失败");
            setLoggingOut(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.loading}>
                        <div className="loading-spinner"></div>
                        <p>加载中...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <Link href="/dashboard" className={styles.backLink}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        返回仪表盘
                    </Link>
                    <h1 className="heading-2">账户设置</h1>
                </div>

                {/* Messages */}
                {error && (
                    <div className={styles.error}>
                        {error}
                        <button onClick={() => setError("")}>×</button>
                    </div>
                )}

                {success && (
                    <div className={styles.success}>
                        {success}
                        <button onClick={() => setSuccess("")}>×</button>
                    </div>
                )}

                <div className={styles.content}>
                    {/* Profile Section */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>个人信息</h2>
                        <form onSubmit={handleUpdateProfile} className={styles.form}>
                            <div className="form-group">
                                <label className="label">邮箱</label>
                                <input
                                    type="email"
                                    className="input"
                                    value={user?.email || ""}
                                    disabled
                                />
                                <p className={styles.hint}>邮箱不可修改</p>
                            </div>
                            <div className="form-group">
                                <label className="label">显示名称</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? "保存中..." : "保存"}
                            </button>
                        </form>
                    </section>

                    {/* Password Section */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>修改密码</h2>
                        <form onSubmit={handleChangePassword} className={styles.form}>
                            <div className="form-group">
                                <label className="label">当前密码</label>
                                <input
                                    type="password"
                                    className="input"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">新密码</label>
                                <input
                                    type="password"
                                    className="input"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">确认新密码</label>
                                <input
                                    type="password"
                                    className="input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? "修改中..." : "修改密码"}
                            </button>
                        </form>
                    </section>

                    {/* Logout Section */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>账户操作</h2>
                        <div className={styles.logoutSection}>
                            <p>退出当前账户登录</p>
                            <button
                                className={styles.logoutBtn}
                                onClick={handleLogout}
                                disabled={loggingOut}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16,17 21,12 16,7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                {loggingOut ? "注销中..." : "注销登录"}
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
