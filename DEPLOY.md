# Art Share 部署指南

## Docker 部署 (推荐)

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+

### 快速部署

```bash
# 1. 创建环境变量文件
cp .env.example .env

# 2. 编辑 .env 配置
# 重要: 请修改 AUTH_SECRET 为随机字符串
nano .env

# 3. 构建并启动
docker-compose -f docker-compose.prod.yml up -d --build

# 4. 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 环境变量配置

```bash
# .env

# 数据库 (SQLite, 容器内路径)
DATABASE_URL="file:/app/data/prod.db"

# JWT 密钥 (生产环境必须更改!)
AUTH_SECRET="your-random-secret-key-here"

# 可选: 腾讯云 COS 配置
# 在管理后台系统设置中配置
```

### 数据持久化

Docker 部署会自动挂载以下目录:

- `/app/data/` - SQLite 数据库文件
- `/app/public/uploads/` - 本地上传文件

### 端口配置

默认端口: `3000`

修改端口请编辑 `docker-compose.prod.yml`:

```yaml
ports:
  - "8080:3000"  # 将外部端口改为 8080
```

---

## 手动部署

### 环境要求

- Node.js 18+
- npm 或 pnpm

### 步骤

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env

# 3. 初始化数据库
npm run db:setup

# 4. 构建
npm run build

# 5. 启动
npm run start
```

### 使用 PM2 管理进程

```bash
# 安装 PM2
npm install -g pm2

# 启动
pm2 start npm --name "art-share" -- start

# 保存配置
pm2 save
pm2 startup
```

---

## Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

---

## 云存储配置

### 腾讯云 COS

1. 登录管理后台 `/admin/settings`
2. 存储类型选择 "腾讯云 COS"
3. 填写配置:
   - Bucket 名称
   - 区域 (如 ap-shanghai)
   - SecretId
   - SecretKey

> 注意: COS Bucket 需开启公共读取权限

---

## 常见问题

### Q: 忘记管理员密码?

运行数据库重置:

```bash
npm run db:seed
```

默认密码将重置为 `admin123`

### Q: 上传文件失败?

检查:
1. 文件大小是否超过限制 (默认 50MB)
2. 磁盘空间是否充足
3. 目录权限是否正确

### Q: Docker 容器无法启动?

```bash
# 查看日志
docker-compose logs

# 重新构建
docker-compose build --no-cache
```

---

## 备份恢复

### 备份

```bash
# Docker 部署
docker cp art-share:/app/data/prod.db ./backup/
docker cp art-share:/app/public/uploads ./backup/

# 手动部署
cp -r ./dev.db ./public/uploads ./backup/
```

### 恢复

```bash
# 将备份文件复制回原位置
# 重启应用
docker-compose restart
```

---

## 更新升级

```bash
# 拉取最新代码
git pull

# Docker 部署
docker-compose -f docker-compose.prod.yml up -d --build

# 手动部署
npm install
npm run db:push  # 如有数据库变更
npm run build
pm2 restart art-share
```
