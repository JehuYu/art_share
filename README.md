# Art Share

> 🎨 夏令营作品展示平台

一个现代化的 Web 应用，用于展示和管理学生艺术作品，支持多用户管理、作品审核、轮播图展示等功能。

## ✨ 特性

- 🖼️ **作品展示** - 支持图片和视频，瀑布流/网格布局
- 👤 **多用户系统** - 用户注册、登录、个人中心
- ✅ **作品审核** - 管理员审核后才能公开展示
- 🎠 **轮播图管理** - 首页轮播图，支持链接作品集
- ⭐ **精选作品** - 管理员可设置精选，优先展示
- ☁️ **云存储支持** - 支持本地存储和腾讯云 COS
- 📱 **响应式设计** - 适配桌面和移动端
- 🐳 **容器化部署** - Docker 一键部署

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 pnpm

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd art_share

# 安装依赖
npm install

# 初始化数据库
npm run db:setup

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 默认账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@artshare.com | admin123 |

## 📖 文档

- [开发文档](./DEVELOPMENT.md) - 项目结构、数据库设计、API 接口、业务流程
- [部署文档](./DEPLOY.md) - Docker 部署、生产环境配置

## 🛠️ 常用命令

```bash
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run start      # 启动生产服务器
npm run db:push    # 推送数据库结构
npm run db:seed    # 初始化默认数据
npm run db:setup   # 完整数据库设置
```

## 📁 项目结构

```
art_share/
├── prisma/          # 数据库模型
├── public/          # 静态资源
├── src/
│   ├── app/         # 页面和 API 路由
│   ├── components/  # React 组件
│   ├── lib/         # 工具库
│   └── types/       # 类型定义
├── Dockerfile       # Docker 构建文件
└── docker-compose.yml
```

## 🔧 技术栈

- **前端**: Next.js 16, React 19, TypeScript, CSS Modules
- **后端**: Next.js API Routes, Prisma ORM
- **数据库**: SQLite
- **认证**: JWT + Cookie
- **存储**: 本地 / 腾讯云 COS
- **部署**: Docker

## 📄 License

MIT License
