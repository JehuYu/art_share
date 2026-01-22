"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./settings.module.css";

interface Settings {
    siteName: string;
    siteDescription: string;
    requireApproval: boolean;
    maxFileSize: number;
    storageType: string;
    localStoragePath: string;
    allowRegistration: boolean;
    exploreViewMode: string;
    exploreColumns: number;
    featuredViewMode: string;
    featuredColumns: number;
    featuredMaxRows: number;
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Settings>({
        siteName: "Art Share",
        siteDescription: "夏令营作品展示平台",
        requireApproval: true,
        maxFileSize: 52428800,
        storageType: "local",
        localStoragePath: "uploads",
        allowRegistration: true,
        exploreViewMode: "masonry",
        exploreColumns: 4,
        featuredViewMode: "masonry",
        featuredColumns: 4,
        featuredMaxRows: 2,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/admin/settings");
            const data = await res.json();
            if (data.settings) {
                setSettings(data.settings);
            }
        } catch {
            setError("获取设置失败");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (!res.ok) throw new Error("保存失败");

            setSuccess("设置已保存");
        } catch {
            setError("保存失败");
        } finally {
            setSaving(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        return (bytes / 1024 / 1024).toFixed(0);
    };

    const parseFileSize = (mb: string) => {
        return parseInt(mb) * 1024 * 1024;
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loading}>
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <Link href="/admin" className={styles.backLink}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        返回
                    </Link>
                    <h1 className="heading-2">系统设置</h1>
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

                {/* Settings Form */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Site Info */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>网站信息</h2>
                        <div className={styles.sectionContent}>
                            <div className="form-group">
                                <label className="label">网站名称</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={settings.siteName}
                                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">网站描述</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={settings.siteDescription}
                                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Content Settings */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>内容设置</h2>
                        <div className={styles.sectionContent}>
                            <div className={styles.toggleRow}>
                                <div>
                                    <h3>作品审核</h3>
                                    <p>开启后，用户发布的作品需要管理员审核通过才能公开展示</p>
                                </div>
                                <label className={styles.toggle}>
                                    <input
                                        type="checkbox"
                                        checked={settings.requireApproval}
                                        onChange={(e) => setSettings({ ...settings, requireApproval: e.target.checked })}
                                    />
                                    <span className={styles.toggleSlider}></span>
                                </label>
                            </div>

                            <div className={styles.toggleRow}>
                                <div>
                                    <h3>开放注册</h3>
                                    <p>关闭后，新用户将无法自行注册，需由管理员创建账号</p>
                                </div>
                                <label className={styles.toggle}>
                                    <input
                                        type="checkbox"
                                        checked={settings.allowRegistration}
                                        onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                                    />
                                    <span className={styles.toggleSlider}></span>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Storage Settings */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>存储设置</h2>
                        <div className={styles.sectionContent}>
                            <div className="form-group">
                                <label className="label">文件大小限制 (MB)</label>
                                <input
                                    type="number"
                                    className="input"
                                    min="1"
                                    max="500"
                                    value={formatFileSize(settings.maxFileSize)}
                                    onChange={(e) => setSettings({ ...settings, maxFileSize: parseFileSize(e.target.value) })}
                                />
                                <p className={styles.hint}>建议不超过 100MB，当前设置：{formatFileSize(settings.maxFileSize)} MB</p>
                            </div>

                            <div className="form-group">
                                <label className="label">存储方式</label>
                                <select
                                    className="input"
                                    value={settings.storageType}
                                    onChange={(e) => setSettings({ ...settings, storageType: e.target.value })}
                                >
                                    <option value="local">本地存储</option>
                                    <option value="cloud">云存储</option>
                                </select>
                            </div>

                            {settings.storageType === "local" && (
                                <div className="form-group">
                                    <label className="label">存储路径</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={settings.localStoragePath}
                                        onChange={(e) => setSettings({ ...settings, localStoragePath: e.target.value })}
                                    />
                                    <p className={styles.hint}>相对于 public 目录的路径</p>
                                </div>
                            )}

                            {settings.storageType === "cloud" && (
                                <div className={styles.cloudConfig}>
                                    <p className={styles.cloudHint}>
                                        云存储配置需要在服务器环境变量中设置相关密钥
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Display Settings */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>显示设置</h2>
                        <div className={styles.sectionContent}>
                            <div className="form-group">
                                <label className="label">首页精选作品 - 显示模式</label>
                                <select
                                    className="input"
                                    value={settings.featuredViewMode}
                                    onChange={(e) => setSettings({ ...settings, featuredViewMode: e.target.value })}
                                >
                                    <option value="masonry">瀑布流</option>
                                    <option value="grid">网格</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="label">首页精选作品 - 列数</label>
                                <select
                                    className="input"
                                    value={settings.featuredColumns}
                                    onChange={(e) => setSettings({ ...settings, featuredColumns: parseInt(e.target.value) })}
                                >
                                    <option value="2">2列</option>
                                    <option value="3">3列</option>
                                    <option value="4">4列</option>
                                    <option value="5">5列</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="label">首页精选作品 - 最大行数</label>
                                <select
                                    className="input"
                                    value={settings.featuredMaxRows}
                                    onChange={(e) => setSettings({ ...settings, featuredMaxRows: parseInt(e.target.value) })}
                                >
                                    <option value="1">1行</option>
                                    <option value="2">2行</option>
                                    <option value="3">3行</option>
                                    <option value="4">4行</option>
                                    <option value="5">5行</option>
                                </select>
                                <p className={styles.hint}>限制首页精选作品显示的最大行数</p>
                            </div>

                            <div className="form-group">
                                <label className="label">探索页面 - 显示模式</label>
                                <select
                                    className="input"
                                    value={settings.exploreViewMode}
                                    onChange={(e) => setSettings({ ...settings, exploreViewMode: e.target.value })}
                                >
                                    <option value="masonry">瀑布流</option>
                                    <option value="grid">网格</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="label">探索页面 - 列数</label>
                                <select
                                    className="input"
                                    value={settings.exploreColumns}
                                    onChange={(e) => setSettings({ ...settings, exploreColumns: parseInt(e.target.value) })}
                                >
                                    <option value="2">2列</option>
                                    <option value="3">3列</option>
                                    <option value="4">4列</option>
                                    <option value="5">5列</option>
                                </select>
                                <p className={styles.hint}>用户仍可在前端手动调整显示方式</p>
                            </div>
                        </div>
                    </section>

                    {/* Submit */}
                    <div className={styles.actions}>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                            {saving ? "保存中..." : "保存设置"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
