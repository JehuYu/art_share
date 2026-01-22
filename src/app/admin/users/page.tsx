"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./users.module.css";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    _count: {
        portfolios: number;
    };
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [importData, setImportData] = useState("");
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "USER" });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            setUsers(data.users || []);
        } catch {
            setError("获取用户列表失败");
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "添加失败");
            }

            setSuccess("用户添加成功");
            setShowAddModal(false);
            setNewUser({ name: "", email: "", password: "", role: "USER" });
            fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "添加失败");
        }
    };

    const handleImport = async () => {
        setError("");
        setSuccess("");

        try {
            const res = await fetch("/api/admin/users/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: importData }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "导入失败");
            }

            setSuccess(`成功导入 ${result.count} 个用户`);
            setShowImportModal(false);
            setImportData("");
            fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "导入失败");
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm("确定要删除此用户吗？此操作不可撤销。")) return;

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("删除失败");
            }

            setSuccess("用户已删除");
            fetchUsers();
        } catch {
            setError("删除失败");
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });

            if (!res.ok) {
                throw new Error("更新失败");
            }

            fetchUsers();
        } catch {
            setError("更新角色失败");
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <Link href="/admin" className={styles.backLink}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            返回
                        </Link>
                        <h1 className="heading-2">用户管理</h1>
                    </div>
                    <div className={styles.actions}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowImportModal(true)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7,10 12,15 17,10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            批量导入
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowAddModal(true)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            添加用户
                        </button>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className={styles.error}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        {error}
                        <button onClick={() => setError("")}>×</button>
                    </div>
                )}

                {success && (
                    <div className={styles.success}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22,4 12,14.01 9,11.01" />
                        </svg>
                        {success}
                        <button onClick={() => setSuccess("")}>×</button>
                    </div>
                )}

                {/* Table */}
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>用户名</th>
                                <th>邮箱</th>
                                <th>角色</th>
                                <th>作品数</th>
                                <th>注册时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className={styles.loading}>
                                        <div className="loading-spinner"></div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className={styles.empty}>暂无用户</td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className={styles.userCell}>
                                                <div className={styles.avatar}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                {user.name}
                                            </div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>
                                            <select
                                                className={styles.roleSelect}
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            >
                                                <option value="USER">普通用户</option>
                                                <option value="ADMIN">管理员</option>
                                            </select>
                                        </td>
                                        <td>{user._count.portfolios}</td>
                                        <td>{new Date(user.createdAt).toLocaleDateString("zh-CN")}</td>
                                        <td>
                                            <button
                                                className={styles.deleteBtn}
                                                onClick={() => handleDelete(user.id)}
                                                title="删除用户"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Add User Modal */}
                {showAddModal && (
                    <>
                        <div className="overlay" onClick={() => setShowAddModal(false)} />
                        <div className="modal">
                            <div className="modal-header">
                                <h3>添加用户</h3>
                                <button onClick={() => setShowAddModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleAddUser}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="label">用户名</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">邮箱</label>
                                        <input
                                            type="email"
                                            className="input"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">密码</label>
                                        <input
                                            type="password"
                                            className="input"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">角色</label>
                                        <select
                                            className="input"
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                        >
                                            <option value="USER">普通用户</option>
                                            <option value="ADMIN">管理员</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                                        取消
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        添加
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}

                {/* Import Modal */}
                {showImportModal && (
                    <>
                        <div className="overlay" onClick={() => setShowImportModal(false)} />
                        <div className="modal">
                            <div className="modal-header">
                                <h3>批量导入用户</h3>
                                <button onClick={() => setShowImportModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <p className={styles.importHint}>
                                    请输入CSV格式数据，每行一个用户：<br />
                                    <code>用户名,邮箱,密码</code>
                                </p>
                                <textarea
                                    className={`input ${styles.importTextarea}`}
                                    placeholder="张三,zhangsan@example.com,password123&#10;李四,lisi@example.com,password456"
                                    value={importData}
                                    onChange={(e) => setImportData(e.target.value)}
                                    rows={10}
                                />
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowImportModal(false)}>
                                    取消
                                </button>
                                <button className="btn btn-primary" onClick={handleImport}>
                                    导入
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
