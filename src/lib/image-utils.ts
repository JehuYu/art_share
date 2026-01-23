import sharp from "sharp";
import { mkdir, readFile, writeFile, unlink, readdir, stat, access } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// 图片尺寸配置
export const IMAGE_SIZES = {
    thumbnail: { width: 400, height: 400 },   // 缩略图
    medium: { width: 800, height: 800 },      // 中等尺寸
    large: { width: 1600, height: 1600 },     // 大图
} as const;

// 支持的图片格式
const SUPPORTED_FORMATS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

/**
 * 检查文件是否是图片
 */
export function isImageFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return SUPPORTED_FORMATS.includes(ext);
}

/**
 * 生成缩略图路径
 */
export function getThumbnailPath(originalPath: string, size: keyof typeof IMAGE_SIZES = "thumbnail"): string {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const name = path.basename(originalPath, ext);
    return path.join(dir, `${name}_${size}${ext}`);
}

/**
 * 生成优化后的图片（WebP 格式）
 */
export async function generateOptimizedImage(
    inputPath: string,
    outputPath: string,
    options: {
        width?: number;
        height?: number;
        quality?: number;
        format?: "webp" | "jpeg" | "png";
    } = {}
): Promise<boolean> {
    try {
        const { width, height, quality = 80, format = "webp" } = options;

        let pipeline = sharp(inputPath);

        // 调整尺寸（保持宽高比）
        if (width || height) {
            pipeline = pipeline.resize(width, height, {
                fit: "inside",
                withoutEnlargement: true,
            });
        }

        // 根据格式输出
        if (format === "webp") {
            pipeline = pipeline.webp({ quality });
        } else if (format === "jpeg") {
            pipeline = pipeline.jpeg({ quality, progressive: true });
        } else if (format === "png") {
            pipeline = pipeline.png({ compressionLevel: 9 });
        }

        // 确保输出目录存在
        await mkdir(path.dirname(outputPath), { recursive: true });

        await pipeline.toFile(outputPath);
        return true;
    } catch (error) {
        console.error("Generate optimized image error:", error);
        return false;
    }
}

/**
 * 为上传的图片生成缩略图
 */
export async function generateThumbnail(
    inputPath: string,
    size: keyof typeof IMAGE_SIZES = "thumbnail"
): Promise<string | null> {
    try {
        if (!isImageFile(inputPath)) {
            return null;
        }

        const dimensions = IMAGE_SIZES[size];
        const dir = path.dirname(inputPath);
        const ext = path.extname(inputPath);
        const name = path.basename(inputPath, ext);

        // 输出为 WebP 格式以节省空间
        const outputPath = path.join(dir, `${name}_${size}.webp`);

        const success = await generateOptimizedImage(inputPath, outputPath, {
            width: dimensions.width,
            height: dimensions.height,
            quality: 80,
            format: "webp",
        });

        if (success) {
            // 返回相对路径（用于 URL）
            const relativePath = outputPath.replace(path.join(process.cwd(), "public"), "");
            return relativePath.replace(/\\/g, "/");
        }

        return null;
    } catch (error) {
        console.error("Generate thumbnail error:", error);
        return null;
    }
}

/**
 * 从 Buffer 生成缩略图 Buffer
 */
export async function generateThumbnailFromBuffer(
    buffer: Buffer,
    size: keyof typeof IMAGE_SIZES = "thumbnail"
): Promise<Buffer | null> {
    try {
        const dimensions = IMAGE_SIZES[size];

        return await sharp(buffer)
            .resize(dimensions.width, dimensions.height, {
                fit: "inside",
                withoutEnlargement: true,
            })
            .webp({ quality: 80 })
            .toBuffer();
    } catch (error) {
        console.error("Generate thumbnail buffer error:", error);
        return null;
    }
}

/**
 * 删除文件及其缩略图
 */
export async function deleteFileWithThumbnails(filePath: string): Promise<boolean> {
    try {
        const fullPath = path.join(process.cwd(), "public", filePath);

        // 删除原文件
        if (existsSync(fullPath)) {
            await unlink(fullPath);
        }

        // 删除所有尺寸的缩略图
        for (const size of Object.keys(IMAGE_SIZES) as (keyof typeof IMAGE_SIZES)[]) {
            const dir = path.dirname(fullPath);
            const ext = path.extname(fullPath);
            const name = path.basename(fullPath, ext);

            // 尝试删除 WebP 缩略图
            const thumbPath = path.join(dir, `${name}_${size}.webp`);
            if (existsSync(thumbPath)) {
                await unlink(thumbPath);
            }

            // 也尝试删除同格式的缩略图
            const thumbPathOriginalFormat = path.join(dir, `${name}_${size}${ext}`);
            if (existsSync(thumbPathOriginalFormat)) {
                await unlink(thumbPathOriginalFormat);
            }
        }

        return true;
    } catch (error) {
        console.error("Delete file with thumbnails error:", error);
        return false;
    }
}

/**
 * 删除用户目录下的所有文件
 */
export async function deleteUserUploadDirectory(userId: string): Promise<boolean> {
    try {
        const userDir = path.join(process.cwd(), "public", "uploads", userId);

        if (!existsSync(userDir)) {
            return true;
        }

        // 递归删除目录内容
        await deleteDirectoryRecursive(userDir);
        return true;
    } catch (error) {
        console.error("Delete user upload directory error:", error);
        return false;
    }
}

/**
 * 递归删除目录
 */
async function deleteDirectoryRecursive(dirPath: string): Promise<void> {
    try {
        const entries = await readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                await deleteDirectoryRecursive(fullPath);
            } else {
                await unlink(fullPath);
            }
        }

        // 删除空目录
        const { rmdir } = await import("fs/promises");
        await rmdir(dirPath);
    } catch (error) {
        console.error("Delete directory recursive error:", error);
    }
}

/**
 * 清理孤立的上传文件（不在数据库中引用的文件）
 */
export async function cleanupOrphanedFiles(validUrls: string[]): Promise<{
    deleted: string[];
    errors: string[];
}> {
    const deleted: string[] = [];
    const errors: string[] = [];

    try {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");

        if (!existsSync(uploadsDir)) {
            return { deleted, errors };
        }

        // 获取所有有效 URL 的文件名集合
        const validFiles = new Set(
            validUrls.map(url => {
                // 从 URL 提取文件路径
                const filePath = url.replace(/^\/uploads\//, "");
                return filePath;
            })
        );

        // 扫描 uploads 目录
        await scanAndCleanDirectory(uploadsDir, "", validFiles, deleted, errors);

    } catch (error) {
        console.error("Cleanup orphaned files error:", error);
        errors.push(`扫描失败: ${error}`);
    }

    return { deleted, errors };
}

/**
 * 扫描并清理目录
 */
async function scanAndCleanDirectory(
    baseDir: string,
    relativePath: string,
    validFiles: Set<string>,
    deleted: string[],
    errors: string[]
): Promise<void> {
    const currentDir = path.join(baseDir, relativePath);

    try {
        const entries = await readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
                // 递归扫描子目录
                await scanAndCleanDirectory(baseDir, entryRelativePath, validFiles, deleted, errors);

                // 检查目录是否为空，如果为空则删除
                const remainingEntries = await readdir(fullPath);
                if (remainingEntries.length === 0) {
                    const { rmdir } = await import("fs/promises");
                    await rmdir(fullPath);
                }
            } else {
                // 检查文件是否在有效列表中
                // 跳过缩略图文件（它们会在原文件被删除时一起删除）
                const isThumbnail = /_(?:thumbnail|medium|large)\.(webp|jpg|jpeg|png)$/i.test(entry.name);

                if (!isThumbnail && !validFiles.has(entryRelativePath)) {
                    try {
                        // 删除文件及其缩略图
                        await deleteFileWithThumbnails(`/uploads/${entryRelativePath}`);
                        deleted.push(entryRelativePath);
                    } catch (err) {
                        errors.push(`删除失败 ${entryRelativePath}: ${err}`);
                    }
                }
            }
        }
    } catch (error) {
        errors.push(`扫描目录失败 ${relativePath}: ${error}`);
    }
}

/**
 * 获取目录大小
 */
export async function getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    try {
        if (!existsSync(dirPath)) {
            return 0;
        }

        const entries = await readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                totalSize += await getDirectorySize(fullPath);
            } else {
                const fileStat = await stat(fullPath);
                totalSize += fileStat.size;
            }
        }
    } catch (error) {
        console.error("Get directory size error:", error);
    }

    return totalSize;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";

    const units = ["B", "KB", "MB", "GB", "TB"];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}
