# Art Share 项目开发文档

> **夏令营作品展示平台** - 一个用于展示和管理学生艺术作品的 Web 应用

## 目录

1. [技术栈](#技术栈)
2. [项目结构](#项目结构)
3. [数据库设计](#数据库设计)
4. [API 接口](#api-接口)
5. [页面路由](#页面路由)
6. [核心模块](#核心模块)
7. [业务流程](#业务流程)
8. [本地开发](#本地开发)
9. [部署说明](#部署说明)

---

## 技术栈

| 类别 | 技术 |
|------|------|
| **前端框架** | Next.js 16 (App Router) |
| **UI 框架** | React 19 + CSS Modules |
| **类型系统** | TypeScript 5 |
| **数据库** | SQLite + Prisma ORM |
| **认证** | JWT (jose) + Cookie |
| **文件存储** | 本地存储 / 腾讯云 COS |
| **图像处理** | Sharp |
| **容器化** | Docker + Docker Compose |

---

## 项目结构

```
art_share/
├── prisma/                     # 数据库
│   ├── schema.prisma           # 数据模型定义
│   └── seed.ts                 # 初始化数据脚本
├── public/                     # 静态资源
│   └── uploads/                # 本地上传文件存储
├── src/
│   ├── app/                    # 页面路由 (App Router)
│   │   ├── api/               # API 路由
│   │   │   ├── admin/         # 管理员 API
│   │   │   ├── auth/          # 认证 API
│   │   │   ├── portfolios/    # 作品集 API
│   │   │   ├── settings/      # 设置 API
│   │   │   └── uploads/       # 文件服务 API
│   │   ├── admin/             # 管理后台页面
│   │   ├── dashboard/         # 用户中心页面
│   │   ├── explore/           # 探索页面
│   │   ├── login/             # 登录页面
│   │   ├── register/          # 注册页面
│   │   ├── portfolio/         # 作品集详情页
│   │   ├── page.tsx           # 首页
│   │   ├── layout.tsx         # 根布局
│   │   └── globals.css        # 全局样式
│   ├── components/             # 公共组件
│   │   ├── features/          # 功能组件
│   │   │   ├── Carousel.tsx   # 轮播图组件
│   │   │   ├── MasonryGrid.tsx # 瀑布流网格组件
│   │   │   └── PortfolioViewer.tsx # 作品集查看器
│   │   └── layout/            # 布局组件
│   │       └── Header.tsx     # 顶部导航栏
│   ├── lib/                    # 工具库
│   │   ├── auth-utils.ts      # 认证工具
│   │   ├── auth.ts            # 认证配置
│   │   ├── cache.ts           # 缓存工具
│   │   ├── image-utils.ts     # 图像处理工具
│   │   ├── prisma.ts          # Prisma 客户端
│   │   └── storage.ts         # 文件存储工具
│   └── types/                  # 类型定义
├── .env                        # 环境变量
├── docker-compose.yml          # Docker 开发配置
├── docker-compose.prod.yml     # Docker 生产配置
├── Dockerfile                  # Docker 构建文件
└── package.json                # 项目依赖
```

---

## 数据库设计

### ER 关系图

```
┌─────────────┐     1:N     ┌─────────────┐     1:N     ┌─────────────────┐
│    User     │ ─────────── │  Portfolio  │ ─────────── │  PortfolioItem  │
└─────────────┘             └─────────────┘             └─────────────────┘
                                   │
                                   │ 1:1
                                   ▼
                         ┌───────────────────┐
                         │ FeaturedPortfolio │
                         └───────────────────┘

┌─────────────┐           ┌─────────────────┐
│    Album    │           │ SystemSettings  │
└─────────────┘           └─────────────────┘
```

### 数据表详解

#### 1. User (用户表)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | String (cuid) | 主键 |
| `email` | String | 邮箱 (唯一) |
| `password` | String | 加密密码 (bcrypt) |
| `name` | String | 用户名 |
| `avatar` | String? | 头像 URL |
| `role` | String | 角色: `USER` / `ADMIN` |
| `createdAt` | DateTime | 创建时间 |
| `updatedAt` | DateTime | 更新时间 |

#### 2. Portfolio (作品集表)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | String (cuid) | 主键 |
| `title` | String | 标题 |
| `description` | String? | 描述 |
| `cover` | String? | 封面图 URL |
| `userId` | String | 所属用户 ID (外键) |
| `status` | String | 状态: `PENDING` / `APPROVED` / `REJECTED` |
| `isPublic` | Boolean | 是否公开 (需审核通过后才能公开) |
| `viewCount` | Int | 浏览次数 |
| `createdAt` | DateTime | 创建时间 |
| `updatedAt` | DateTime | 更新时间 |

#### 3. PortfolioItem (作品项目表)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | String (cuid) | 主键 |
| `type` | String | 类型: `IMAGE` / `VIDEO` |
| `url` | String | 文件 URL |
| `thumbnail` | String? | 缩略图 URL |
| `title` | String? | 标题 |
| `originalName` | String? | 原始文件名 |
| `order` | Int | 排序顺序 |
| `portfolioId` | String | 所属作品集 ID (外键) |
| `createdAt` | DateTime | 创建时间 |

#### 4. Album (轮播图表)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | String (cuid) | 主键 |
| `title` | String | 标题 |
| `description` | String? | 描述 |
| `cover` | String | 封面图 URL |
| `link` | String? | 点击跳转链接 (如 `/portfolio/xxx`) |
| `order` | Int | 排序顺序 |
| `isActive` | Boolean | 是否启用 |
| `createdAt` | DateTime | 创建时间 |
| `updatedAt` | DateTime | 更新时间 |

#### 5. FeaturedPortfolio (精选作品表)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | String (cuid) | 主键 |
| `portfolioId` | String | 作品集 ID (唯一外键) |
| `order` | Int | 排序顺序 |
| `createdAt` | DateTime | 创建时间 |

#### 6. SystemSettings (系统设置表)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | String | 主键 (固定为 "default") |
| `siteName` | String | 站点名称 |
| `siteDescription` | String? | 站点描述 |
| `requireApproval` | Boolean | 是否需要审核 |
| `maxFileSize` | Int | 最大文件大小 (字节) |
| `storageType` | String | 存储类型: `local` / `cos` |
| `cosBucket` | String? | COS 存储桶 |
| `cosRegion` | String? | COS 区域 |
| `cosSecretId` | String? | COS SecretId |
| `cosSecretKey` | String? | COS SecretKey |
| `allowRegistration` | Boolean | 是否允许注册 |
| `exploreViewMode` | String | 探索页视图模式 |
| `exploreColumns` | Int | 探索页列数 |
| `featuredViewMode` | String | 首页精选视图模式 |
| `featuredColumns` | Int | 首页精选列数 |
| `featuredMaxRows` | Int | 首页精选最大行数 |

---

## API 接口

### 认证相关 `/api/auth/`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/logout` | 用户登出 |
| GET | `/api/auth/session` | 获取当前会话 |
| GET | `/api/auth/me` | 获取当前用户信息 |
| PATCH | `/api/auth/profile` | 更新个人资料 |
| POST | `/api/auth/password` | 修改密码 |

### 作品集相关 `/api/portfolios/`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/portfolios` | 获取作品集列表 |
| POST | `/api/portfolios` | 创建作品集 |
| GET | `/api/portfolios/[id]` | 获取作品集详情 |
| PATCH | `/api/portfolios/[id]` | 更新作品集 |
| DELETE | `/api/portfolios/[id]` | 删除作品集 |
| POST | `/api/portfolios/[id]/items` | 上传作品项目 |
| DELETE | `/api/portfolios/[id]/items/[itemId]` | 删除作品项目 |

### 管理员相关 `/api/admin/`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/stats` | 获取统计数据 |
| GET | `/api/admin/users` | 获取用户列表 |
| POST | `/api/admin/users` | 创建用户 |
| DELETE | `/api/admin/users/[id]` | 删除用户 |
| POST | `/api/admin/users/import` | 批量导入用户 |
| GET | `/api/admin/portfolios` | 获取作品集列表 (管理) |
| GET | `/api/admin/portfolios/approved` | 获取已审核作品 |
| PATCH | `/api/admin/portfolios/bulk` | 批量审核作品 |
| PATCH | `/api/admin/portfolios/[id]` | 更新作品集 |
| DELETE | `/api/admin/portfolios/[id]` | 删除作品集 |
| GET | `/api/admin/albums` | 获取轮播图列表 |
| POST | `/api/admin/albums` | 创建轮播图 |
| PATCH | `/api/admin/albums/[id]` | 更新轮播图 |
| DELETE | `/api/admin/albums/[id]` | 删除轮播图 |
| GET | `/api/admin/featured` | 获取精选作品 |
| POST | `/api/admin/featured` | 添加精选 |
| DELETE | `/api/admin/featured/[id]` | 移除精选 |
| GET | `/api/admin/settings` | 获取系统设置 |
| PATCH | `/api/admin/settings` | 更新系统设置 |

### 其他

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/settings` | 获取公开设置 |
| GET | `/api/uploads/[...path]` | 文件服务 (本地存储) |
| GET | `/api/health` | 健康检查 |

---

## 页面路由

### 公开页面

| 路径 | 说明 |
|------|------|
| `/` | 首页 (轮播图 + 精选作品) |
| `/explore` | 探索页 (所有公开作品) |
| `/portfolio/[id]` | 作品集详情页 |
| `/login` | 登录页 |
| `/register` | 注册页 |

### 用户中心 `/dashboard/`

| 路径 | 说明 |
|------|------|
| `/dashboard` | 用户主页 (我的作品集) |
| `/dashboard/portfolios/new` | 创建作品集 |
| `/dashboard/portfolios/[id]` | 编辑作品集 |
| `/dashboard/settings` | 个人设置 |

### 管理后台 `/admin/` (需 ADMIN 权限)

| 路径 | 说明 |
|------|------|
| `/admin` | 管理首页 (统计概览) |
| `/admin/portfolios` | 作品集管理 (审核) |
| `/admin/users` | 用户管理 |
| `/admin/albums` | 轮播图管理 |
| `/admin/settings` | 系统设置 |
| `/admin/manage` | 精选管理 |

---

## 核心模块

### 1. 认证模块 (`/lib/auth-utils.ts`)

使用 JWT 存储在 Cookie 中进行认证：

```typescript
// 获取当前登录用户
const user = await getAuthUser();
// 返回: { id, name, email, role } | null
```

### 2. 文件存储模块 (`/lib/storage.ts`)

支持本地存储和腾讯云 COS：

```typescript
// 上传文件
const url = await uploadFile(buffer, filename, folder, mimeType);

// 删除文件
await deleteFile(fileUrl);
```

### 3. 图像处理模块 (`/lib/image-utils.ts`)

使用 Sharp 处理图像：

```typescript
// 生成缩略图
const thumbBuffer = await generateThumbnailFromBuffer(imageBuffer);
```

### 4. 核心组件

| 组件 | 说明 |
|------|------|
| `Carousel` | 首页轮播图，支持自动播放、左右切换 |
| `MasonryGrid` | 瀑布流/网格布局，展示作品集 |
| `PortfolioViewer` | 作品集查看器，支持轮播和画册模式 |
| `Header` | 顶部导航栏，响应式设计 |

---

## 业务流程

### 1. 用户注册/登录流程

```
用户注册 → 创建账户 → 自动登录 → 跳转用户中心
           ↓
用户登录 → 验证密码 → 生成 JWT → 写入 Cookie → 跳转首页
```

### 2. 作品发布流程

```
创建作品集 → 上传图片/视频 → 等待审核 (status=PENDING)
                              ↓
                    管理员审核通过 (status=APPROVED)
                              ↓
                    用户设置公开 (isPublic=true)
                              ↓
                         作品展示在首页/探索页
```

### 3. 轮播图管理流程

```
管理员创建轮播图 → 选择已审核作品集 → 自动填充封面和链接
                    ↓
          修改作品集 → 自动同步轮播图信息
                    ↓
          删除作品集 → 阻止删除 (需先移除轮播)
```

### 4. 精选作品管理

```
管理员在精选管理页面 → 从已审核作品中选择 → 添加到精选
                              ↓
                   首页优先展示精选作品
```

---

## 本地开发

### 环境要求

- Node.js 18+
- npm 或 pnpm

### 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库
npm run db:setup

# 3. 启动开发服务器
npm run dev
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run db:push` | 推送数据库结构 |
| `npm run db:seed` | 初始化默认数据 |
| `npm run db:setup` | 完整数据库设置 |

### 环境变量 (`.env`)

```bash
# 数据库连接
DATABASE_URL="file:./dev.db"

# JWT 密钥 (生产环境请更改)
AUTH_SECRET="your-secret-key"
```

### 默认账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@artshare.com | admin123 |

---

## 部署说明

### Docker 部署

```bash
# 构建并启动
docker-compose -f docker-compose.prod.yml up -d

# 查看日志
docker-compose logs -f
```

### 关键配置

1. **存储配置**: 在管理后台 `/admin/settings` 配置 COS 或使用本地存储
2. **审核开关**: 可开启/关闭作品审核功能
3. **注册开关**: 可开启/关闭用户自主注册

详细部署说明请参考 [DEPLOY.md](./DEPLOY.md)

---

## 扩展开发

### 添加新的 API

1. 在 `src/app/api/` 下创建路由文件
2. 使用 `getAuthUser()` 进行认证
3. 使用 `prisma` 访问数据库

```typescript
// src/app/api/example/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";

export async function GET() {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    // ... 业务逻辑
}
```

### 添加新的页面

1. 在 `src/app/` 下创建页面目录
2. 创建 `page.tsx` 和对应的 CSS Module

### 修改数据库

1. 编辑 `prisma/schema.prisma`
2. 运行 `npm run db:push` 推送更改
3. 如需初始数据，更新 `prisma/seed.ts`

---

*文档更新时间: 2026-01-23*
