"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./new.module.css";

export default function NewPortfolioPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        title: "",
        description: "",
    });
    const [files, setFiles] = useState<File[]>([]);
    const [coverIndex, setCoverIndex] = useState(0);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);

    // Process files (shared by input and drag-drop)
    const processFiles = useCallback((selectedFiles: FileList | File[]) => {
        const fileArray = Array.from(selectedFiles);
        const validFiles = fileArray.filter(
            (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
        );

        setFiles((prev) => [...prev, ...validFiles]);

        // Generate previews
        validFiles.forEach((file) => {
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setPreviews((prev) => [...prev, e.target?.result as string]);
                };
                reader.readAsDataURL(file);
            } else {
                // Video placeholder
                setPreviews((prev) => [...prev, "VIDEO"]);
            }
        });
    }, []);

    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(e.target.files);
        }
    };

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        processFiles(e.dataTransfer.files);
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
        if (coverIndex === index) {
            setCoverIndex(0);
        } else if (coverIndex > index) {
            setCoverIndex(coverIndex - 1);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!formData.title.trim()) {
            setError("请输入作品集标题");
            setLoading(false);
            return;
        }

        try {
            // Create FormData for file upload
            const data = new FormData();
            data.append("title", formData.title);
            data.append("description", formData.description);
            data.append("coverIndex", coverIndex.toString());

            files.forEach((file) => {
                data.append("files", file);
            });

            const res = await fetch("/api/portfolios", {
                method: "POST",
                body: data,
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "创建失败");
            }

            router.push(`/dashboard/portfolios/${result.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "创建失败，请重试");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <Link href="/dashboard" className={styles.backLink}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        返回
                    </Link>
                    <h1 className="heading-2">创建作品集</h1>
                </div>

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

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGrid}>
                        {/* Left: Info */}
                        <div className={styles.formSection}>
                            <div className="form-group">
                                <label className="label" htmlFor="title">
                                    作品集标题 *
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    className="input"
                                    placeholder="输入作品集标题"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label className="label" htmlFor="description">
                                    描述
                                </label>
                                <textarea
                                    id="description"
                                    className={`input ${styles.textarea}`}
                                    placeholder="描述你的作品集..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    disabled={loading}
                                    rows={4}
                                />
                            </div>
                        </div>

                        {/* Right: Files */}
                        <div className={styles.formSection}>
                            <label className="label">上传作品（支持批量上传）</label>
                            <div
                                className={`${styles.uploadArea} ${isDragOver ? styles.dragOver : ""}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    id="files"
                                    className={styles.fileInput}
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={handleFilesChange}
                                    disabled={loading}
                                />
                                <label htmlFor="files" className={styles.uploadLabel}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17,8 12,3 7,8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    <span>{isDragOver ? "释放以上传文件" : "点击或拖拽批量上传图片/视频"}</span>
                                    <span className={styles.uploadHint}>支持 JPG、PNG、GIF、MP4 等格式，可一次选择多个文件</span>
                                </label>
                            </div>

                            {files.length > 0 && (
                                <div className={styles.fileList}>
                                    <p className={styles.fileListTitle}>
                                        已选择 {files.length} 个文件（点击设为封面）
                                    </p>
                                    <div className={styles.fileGrid}>
                                        {previews.map((preview, index) => (
                                            <div
                                                key={index}
                                                className={`${styles.fileItem} ${coverIndex === index ? styles.isCover : ""
                                                    }`}
                                                onClick={() => setCoverIndex(index)}
                                            >
                                                {preview === "VIDEO" ? (
                                                    <div className={styles.videoPlaceholder}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polygon points="5,3 19,12 5,21" />
                                                        </svg>
                                                        <span>视频</span>
                                                    </div>
                                                ) : (
                                                    <img src={preview} alt={`File ${index + 1}`} />
                                                )}
                                                {coverIndex === index && (
                                                    <div className={styles.coverBadge}>封面</div>
                                                )}
                                                <button
                                                    type="button"
                                                    className={styles.removeBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFile(index);
                                                    }}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <line x1="18" y1="6" x2="6" y2="18" />
                                                        <line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <Link href="/dashboard" className="btn btn-secondary">
                            取消
                        </Link>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !formData.title.trim()}
                        >
                            {loading ? "创建中..." : "创建作品集"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
