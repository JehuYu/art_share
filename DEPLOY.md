# Art Share 部署指南

## 🚀 快速部署

### 前提条件
- 服务器安装了 Docker 和 Docker Compose
- Git（用于拉取代码）

### 部署步骤

#### 1. 克隆代码
```bash
git clone <your-repo-url> art_share
cd art_share
```

#### 2. 配置环境变量
```bash
# 生成一个安全的 AUTH_SECRET
export AUTH_SECRET=$(openssl rand -base64 32)
echo "Your AUTH_SECRET: $AUTH_SECRET"
echo "Please save this secret!"
```

#### 3. 构建并启动
```bash
# 使用部署脚本（推荐）
chmod +x deploy.sh
./deploy.sh deploy

# 或者手动执行
docker build -t art_share:latest .
docker-compose -f docker-compose.prod.yml up -d
```

#### 4. 验证部署
```bash
# 检查健康状态
curl http://localhost:3000/api/health

# 或使用脚本
./deploy.sh health
```

---

## 📋 常用命令

### 使用部署脚本

```bash
./deploy.sh build    # 构建 Docker 镜像
./deploy.sh start    # 启动应用
./deploy.sh stop     # 停止应用
./deploy.sh restart  # 重启应用
./deploy.sh logs     # 查看日志
./deploy.sh health   # 健康检查
./deploy.sh backup   # 备份数据
./deploy.sh deploy   # 完整部署（构建+重启）
```

### 手动 Docker 命令

```bash
# 构建镜像
docker build -t art_share:latest .

# 启动
docker-compose -f docker-compose.prod.yml up -d

# 停止
docker-compose -f docker-compose.prod.yml down

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 进入容器
docker exec -it art_share /bin/sh
```

---

## 🔧 配置说明

### 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | 数据库路径 | `file:/app/prisma/dev.db` |
| `AUTH_SECRET` | JWT 密钥（必须更改！） | 使用 `openssl rand -base64 32` 生成 |
| `NODE_ENV` | 运行环境 | `production` |

### 端口配置

默认使用端口 `3000`。修改 `docker-compose.prod.yml` 中的端口映射：

```yaml
ports:
  - "80:3000"    # 使用 80 端口
  - "8080:3000"  # 使用 8080 端口
```

### 反向代理（Nginx）

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 上传文件大小限制
    client_max_body_size 100M;
}
```

---

## 💾 数据持久化

### 数据卷

Docker Compose 配置了两个数据卷：
- `art_share_data` - 数据库文件
- `art_share_uploads` - 用户上传的文件

### 备份

```bash
# 使用脚本备份
./deploy.sh backup

# 手动备份
docker cp art_share:/app/prisma/dev.db ./backup_$(date +%Y%m%d).db
docker cp art_share:/app/public/uploads ./backup_uploads_$(date +%Y%m%d)
```

### 恢复

```bash
# 恢复数据库
docker cp ./backup.db art_share:/app/prisma/dev.db

# 恢复上传文件
docker cp ./backup_uploads/. art_share:/app/public/uploads/
```

---

## 🔄 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并部署
./deploy.sh deploy
```

---

## 🔍 故障排查

### 查看日志
```bash
./deploy.sh logs
# 或
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### 检查容器状态
```bash
docker ps -a
docker inspect art_share
```

### 常见问题

1. **端口被占用**
   ```bash
   # 查找占用端口的进程
   netstat -tlnp | grep 3000
   # 或修改 docker-compose.yml 中的端口
   ```

2. **数据库初始化失败**
   ```bash
   # 删除旧数据重新初始化
   docker-compose down -v
   docker-compose up -d
   ```

3. **上传文件权限问题**
   ```bash
   docker exec -it art_share chmod -R 755 /app/public/uploads
   ```

---

## 📦 默认账号

首次部署后，系统会创建默认管理员账号：

- **邮箱**: `admin@artshare.com`
- **密码**: `admin123`

⚠️ **重要**: 请在首次登录后立即修改密码！

---

## 📞 技术支持

如有问题，请检查：
1. Docker 和 Docker Compose 是否正确安装
2. 端口 3000 是否可用
3. 环境变量是否正确配置
4. 日志中的错误信息
