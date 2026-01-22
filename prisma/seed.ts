import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

    // Create admin user
    const adminPassword = await hash("admin123", 12);
    const admin = await prisma.user.upsert({
        where: { email: "admin@artshare.com" },
        update: {},
        create: {
            email: "admin@artshare.com",
            name: "管理员",
            password: adminPassword,
            role: "ADMIN",
        },
    });
    console.log(`Created admin user: ${admin.email}`);

    // Create demo user
    const userPassword = await hash("user123", 12);
    const user = await prisma.user.upsert({
        where: { email: "user@artshare.com" },
        update: {},
        create: {
            email: "user@artshare.com",
            name: "演示用户",
            password: userPassword,
            role: "USER",
        },
    });
    console.log(`Created demo user: ${user.email}`);

    // Create default system settings
    await prisma.systemSettings.upsert({
        where: { id: "default" },
        update: {},
        create: {
            id: "default",
            siteName: "Art Share",
            siteDescription: "夏令营作品展示平台",
            requireApproval: true,
            maxFileSize: 52428800, // 50MB
            storageType: "local",
            localStoragePath: "uploads",
            allowRegistration: true,
        },
    });
    console.log("Created default system settings");

    console.log("Seeding completed!");
    console.log("\n=== 默认账号 ===");
    console.log("管理员: admin@artshare.com / admin123");
    console.log("普通用户: user@artshare.com / user123");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
