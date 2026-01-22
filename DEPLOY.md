
# 部署指南 (Deployment Guide)

本项目配置了 Docker 支持，可以轻松部署到任何 Linux 服务器（如 Ubuntu, CentOS, Debian）。

## 1. 准备工作

确保你的服务器已安装 Docker 和 Docker Compose。

```bash
# Ubuntu 安装 Docker 示例
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
```

## 2. 部署步骤

### 方法 A：使用 Docker（推荐）

1. **上传代码**：
   将项目代码上传到服务器，或者在服务器上 `git clone` 你的仓库。

2. **准备目录和权限**：
   由于容器内部使用非 root 用户 (UID 1001) 运行，你需要确保挂载的数据目录具有正确的权限。

   ```bash
   # 进入项目目录
   cd art_share

   # 创建必要的目录
   mkdir -p public/uploads
   mkdir -p prisma

   # 设置权限 (1001 是容器内 nextjs 用户的 ID)
   sudo chown -R 1001:1001 public/uploads
   sudo chown -R 1001:1001 prisma
   ```

   **注意**：
   - **全新部署（推荐）**：请**不要**上传本地的 `prisma/dev.db` 文件。服务器会在首次启动时自动创建一个空的数据库。
   - **保留数据**：如果你确实想保留本地开发的数据，可以将本地的 `prisma/dev.db` 文件上传到服务器的 `prisma/` 目录。

3. **配置环境变量**：
   修改 `docker-compose.yml` 中的环境变量，特别是 `AUTH_SECRET`，请务必修改为一个安全的随机字符串。

4. **启动服务**：

   ```bash
   sudo docker-compose up -d --build
   ```
   *根据服务器性能，首次构建可能需要几分钟。*

5. **初始化完成**：
   容器启动时会自动检测并执行数据库迁移和初始化（包含创建管理员账号）。
   
   你可以通过查看日志来确认：
   ```bash
   sudo docker-compose logs -f
   ```
   如果看到 "Starting Next.js server..."，说明服务已就绪。

6. **访问**：
   访问 `http://你的服务器IP:3000`。
   
   **默认账号**: `admin@artshare.com`
   **默认密码**: `admin123`

### 方法 B：传统 Node.js 部署

如果你不想使用 Docker，可以直接在服务器上运行 Node.js。

1. **安装环境**：
   需要在服务器上安装 Node.js 18+ 和 NPM。

2. **构建和运行**：
   ```bash
   # 安装依赖
   npm install --production=false # 也可以安装全部依赖用于 build
   
   # 初始化数据库
   npx prisma generate
   npx prisma db push

   # 构建
   npm run build

   # 启动 (可以使用 pm2 保持后台运行)
   npm install -g pm2
   pm2 start npm --name "art-share" -- start
   ```

## 3. Nginx 反向代理（可选但推荐）

为了使用域名（如 `artshare.com`）和 HTTPS，建议配置 Nginx 反向代理。

Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 防止上传大文件超时
    client_max_body_size 50M;
}
```
