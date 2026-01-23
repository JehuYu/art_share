import prisma from "@/lib/prisma";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import COS from "cos-nodejs-sdk-v5";
import { existsSync } from "fs";

/**
 * Upload a file to storage (Local or Tencent COS) based on system settings
 * @param fileBuffer The file content buffer
 * @param fileName The target filename
 * @param folder The folder path (e.g. "userId" or "avatars")
 * @param mimeType The file mime type
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    folder: string,
    mimeType: string,
    forceLocal: boolean = false
): Promise<string> {
    const settings = await prisma.systemSettings.findFirst();
    // Default to local if not validly configured
    const storageType = settings?.storageType || "local";
    const useCos = !forceLocal && storageType === "cos" &&
        !!settings?.cosSecretId &&
        !!settings?.cosSecretKey &&
        !!settings?.cosBucket &&
        !!settings?.cosRegion;

    if (useCos) {
        // Use Tencent COS
        const cos = new COS({
            SecretId: settings.cosSecretId!,
            SecretKey: settings.cosSecretKey!,
        });

        const key = `${folder}/${fileName}`;

        return new Promise((resolve, reject) => {
            cos.putObject({
                Bucket: settings.cosBucket!,
                Region: settings.cosRegion!,
                Key: key,
                Body: fileBuffer,
                ContentType: mimeType,
                CacheControl: "public, max-age=31536000", // Add 1 year cache
                ACL: "public-read", // Ensure file is publicly accessible
            }, (err, data) => {
                if (err) {
                    console.error("COS upload error:", err);
                    reject(err);
                } else {
                    // Ensure HTTPS
                    let url = data.Location;
                    if (!url.startsWith("http")) {
                        url = `https://${url}`;
                    }
                    resolve(url);
                }
            });
        });

    } else {
        // Use Local Storage
        // Store in public/uploads/{folder}
        const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

        // Ensure directory exists
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const filepath = path.join(uploadDir, fileName);
        await writeFile(filepath, fileBuffer);

        // Return relative URL
        return `/uploads/${folder}/${fileName}`;
    }
}

/**
 * Delete a file from storage
 * @param fileUrl The URL of the file to delete
 */
export async function deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    if (fileUrl.startsWith("/uploads") || fileUrl.startsWith("uploads/")) {
        // Local file
        try {
            // Remove leading slash if needed for path join
            const relativePath = fileUrl.startsWith("/") ? fileUrl.substring(1) : fileUrl;
            const filepath = path.join(process.cwd(), "public", relativePath);
            if (existsSync(filepath)) {
                await unlink(filepath);
            }
        } catch (e) {
            console.error("Local delete error:", e);
        }
    } else if (fileUrl.startsWith("http")) {
        // Cloud file (COS)
        try {
            const settings = await prisma.systemSettings.findFirst();
            if (settings?.cosSecretId && settings?.cosSecretKey && settings?.cosBucket && settings?.cosRegion) {
                const cos = new COS({
                    SecretId: settings.cosSecretId,
                    SecretKey: settings.cosSecretKey,
                });

                const urlObj = new URL(fileUrl);
                // Key is pathname without leading slash
                let key = urlObj.pathname;
                if (key.startsWith("/")) key = key.substring(1);

                await new Promise<void>((resolve, reject) => {
                    cos.deleteObject({
                        Bucket: settings.cosBucket!,
                        Region: settings.cosRegion!,
                        Key: key
                    }, (err) => {
                        if (err) {
                            console.error("COS delete error", err);
                            // Don't reject, just log, to allow flow to continue
                            resolve();
                        }
                        else resolve();
                    });
                });
            }
        } catch (e) {
            console.error("COS delete error:", e);
        }
    }
}
