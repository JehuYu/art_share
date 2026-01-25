# 数据库迁移指南 (SQLite -> PostgreSQL)

## 版本说明
v0.2.0

## 前言
本项目开发阶段默认使用 `SQLite`。在生产环境或需要支持更高并发时，建议迁移到 `PostgreSQL`。
以下是将 Art Share 项目从 SQLite 迁移到 PostgreSQL 的详细步骤。

---

## 步骤 1：准备 PostgreSQL 数据库

1. 确保已安装 PostgreSQL（建议 v14+）。
2. 创建一个新的空数据库，例如 `art_share`。
   ```sql
   CREATE DATABASE art_share;
   ```
3. 获取数据库连接字符串，例如：
   ```
   postgresql://user:password@localhost:5432/art_share?schema=public
   ```

---

## 步骤 2：更新环境配置

修改 `.env` 文件，更新 `DATABASE_URL`：

```bash
# 旧配置 (SQLite)
# DATABASE_URL="file:./dev.db"

# 新配置 (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/art_share?schema=public"
```

---

## 步骤 3：修改 Prisma Schema

打开 `prisma/schema.prisma`，将 provider 修改为 `postgresql`：

```prisma
datasource db {
  provider = "postgresql" // 之前是 "sqlite"
  url      = env("DATABASE_URL")
}
```

注意：由于 SQLite 和 PostgreSQL 对部分数据类型的处理不同（如 `String` 长度限制），Prisma 会自动处理大部分映射，但如果使用了 SQLite 特有的功能可能需要手动调整。本项目目前的 schema 是通用的。

---

## 步骤 4：生成新的迁移文件

运行以下命令初始化 PostgreSQL 数据库结构：

```bash
# 1. 重新生成 Prisma Client
npx prisma generate

# 2. 创建初始迁移
npx prisma migrate dev --name init_postgres
```

此命令会在 `prisma/migrations` 下创建针对 PostgreSQL 的 SQL 文件，并在数据库中创建表。

---

## 步骤 5：数据迁移（可选）

如果需要保留旧的 SQLite 数据，可以使用以下脚本进行转换和导入。由于 SQLite 只是本地文件，没有直接的 "dump to postgres" 工具，推荐使用脚本迁移。

### 简单的迁移脚本示例 (scripts/migrate-data.ts)

```typescript
// 这是一个概念验证脚本，实际使用时请根据数据量进行调整
import { PrismaClient as SqliteClient } from '@prisma/client-sqlite'; // 需要另行配置
import { PrismaClient as PgClient } from '@prisma/client';

// 注意：此方法较复杂，因为需要同时存在两个 Prisma Client。
// 推荐的方法是：先导出数据为 JSON，然后在新库中通过 seed 脚本导入。
```

**推荐的数据迁移方案：**

1. **导出数据 (在切换 .env 之前)**
   你可以编写一个临时的 API 或脚本，读取所有数据并保存为 `backup.json`。

2. **导入数据 (切换环境后)**
   修改 `prisma/seed.ts`，使其从 `backup.json` 读取数据并插入到新数据库。

---

## 步骤 6：验证与部署

1. 启动应用：
   ```bash
   npm run dev
   ```
2. 检查日志确认连接成功。
3. 如果使用了 Redis，请确保 Redis 服务也在运行。

## 常见问题

**Q: 此迁移会影响现有的上传文件吗？**
A: 不会。文件存储在 `public/uploads` 或 Tencent COS，与数据库类型无关。只要文件路径保持不变，迁移数据库后文件依然可以正常访问。

**Q: 如何在 Docker 中使用 Postgres？**
A: 在 `docker-compose.yml` 中添加 postgres 服务，并将 app 服务的 `DATABASE_URL` 指向它。
