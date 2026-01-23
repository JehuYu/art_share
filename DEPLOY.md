# Art Share 部署指南

## Docker 部署

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+

### 一键部署

```bash
# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

访问 http://localhost:3000

### 默认账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@artshare.com | admin123 |

### 数据持久化

容器会自动创建以下目录：
- `./data/` - SQLite 数据库
- `./uploads/` - 上传文件

### 修改端口

编辑 `docker-compose.yml`:

```yaml
ports:
  - "8080:3000"  # 改为 8080 端口
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `AUTH_SECRET` | JWT 密钥 | art-share-secret-2026 |
| `DATABASE_URL` | 数据库路径 | file:/app/prisma/dev.db |

生产环境建议创建 `.env` 文件：

```bash
AUTH_SECRET=your-random-secret-key
```

---

## 手动部署

```bash
# 安装依赖
npm install

# 初始化数据库
npm run db:setup

# 构建
npm run build

# 启动
npm run start
```

---

## 备份恢复

```bash
# 备份
cp -r ./data ./uploads ./backup/

# 恢复
cp -r ./backup/data ./backup/uploads ./
docker-compose restart
```

---

## 常见问题

**Q: 重置管理员密码?**

```bash
docker-compose down
rm -rf ./data
docker-compose up -d
```

**Q: 查看容器状态?**

```bash
docker-compose ps
docker-compose logs art-share
```
