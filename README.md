<div align="center">

## 🚄 Train Design Editor

## 基于 AI 大模型的参数化工程设计平台

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)


</div>

## 📖 目录

- [项目简介](#-项目简介)
- [核心特性](#-核心特性)
- [系统架构](#-系统架构)
- [技术栈](#-技术栈)
- [项目结构](#-项目结构)
- [快速开始](#-快速开始)
- [开发指南](#-开发指南)
- [部署指南](#-部署指南)
- [API 文档](#-api-文档)
- [常见问题](#-常见问题)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

## 🎯 项目简介

Train Design Editor 是一个面向工程设计人员的智能化参数编辑平台，通过自然语言交互实现高铁车头的快速设计迭代。系统集成阿里云通义千问大模型，支持将设计师的自然语言描述转换为精确的工程参数，并实时生成工程制图。

### 适用场景

- 🎨 **概念设计阶段**：快速生成多个设计方案
- 🔧 **参数优化**：基于自然语言微调设计参数
- 📊 **设计评审**：保存完整的设计迭代历史
- 🤝 **团队协作**：多会话管理，支持不同设计方案并行

## ✨ 核心特性

### 🤖 AI 驱动的参数解析

- **自然语言理解**：支持中文口语化描述（如"把车头加长 2 米"）
- **智能参数映射**：自动识别几何尺寸、位置、角度等 30+ 参数
- **相对/绝对调整**：支持增量修改和绝对值设置
- **单位自动转换**：米/毫米自动识别转换

### 🎨 图像生成与编辑

- **工程制图生成**：基于 Qwen-Image-Edit-Max 模型
- **多视图保持**：自动保留正视图和侧视图
- **渐进式编辑**：基于上一次结果连续调整
- **历史记录管理**：完整保存每次修改的图像和参数

### 👥 用户与会话管理

- **本地认证系统**：用户名/密码登录，bcrypt 加密
- **多会话支持**：每个用户可创建多个独立设计会话
- **活跃会话切换**：快速在不同方案间切换
- **参数快照**：每次编辑自动保存参数状态

### 📊 实时状态追踪

- **异步任务管理**：图像生成不阻塞用户操作
- **状态实时更新**：pending → processing → completed/failed
- **错误追踪**：详细记录失败原因便于调试

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ React Pages  │  │   UI State   │  │  tRPC Client │      │
│  │  (Wouter)    │  │ (TanStack)   │  │  (Superjson) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────────┬─────────────────────────────┘
                                │ HTTP + WebSocket (HMR)
┌───────────────────────────────┴─────────────────────────────┐
│                     Application Server                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Vite Dev Server (Dev Mode)             │   │
│  │          ├─ HMR           ├─ Static Assets           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Express + tRPC Middleware                │   │
│  │  ├─ /api/trpc/*         (tRPC Procedures)            │   │
│  │  ├─ Session Auth        (JWT + Cookie)               │   │
│  │  └─ Error Handling      (Global Handler)             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Business Logic                      │   │
│  │  ├─ Auth Router         (Login/Register/Logout)      │   │
│  │  ├─ Design Router       (Params/Edit/History)        │   │
│  │  ├─ Session Router      (Create/Switch/List)         │   │
│  │  └─ System Router       (Health/Metrics)             │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼────────┐   ┌─────────▼──────────┐   ┌───────▼───────┐
│   MySQL DB     │   │  Aliyun Qwen API   │   │  File Storage │
│  (TDSQL-C)     │   │                    │   │   (Optional)  │
│                │   │ ├─ Qwen-Plus       │   │               │
│ ├─ users       │   │ │  (NLP Parser)    │   │ ├─ Images     │
│ ├─ design_     │   │ └─ Qwen-Image-Edit │   │ └─ Backups    │
│ │  parameters  │   │    (Image Gen)     │   │               │
│ ├─ design_     │   │                    │   │               │
│ │  sessions    │   └────────────────────┘   └───────────────┘
│ └─ edit_       │
│    history     │
└────────────────┘
```

### 数据流说明

#### 1. 认证流程
```
Client → /api/trpc/auth.login
         → bcrypt.compare(password)
         → jwt.sign({userId, name})
         → Set-Cookie: app_session_id
         ← {success: true, user}
```

#### 2. 设计编辑流程
```
Client → /api/trpc/design.submitEdit
         → parseParametersWithQwen(userInput)  [Qwen-Plus NLP]
         → calculateRelativeChanges()
         → createEditHistory(status: processing)
         ← {historyId, parsedChanges}
         
Async  → generateEditPrompt(changes)
       → editImageWithQwen(prompt, baseImage)  [Qwen-Image-Edit]
       → updateEditHistory(imageUrl, status: completed)
       → updateDesignParameters(newParams)
```

## 🛠️ 技术栈

### 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 19.x | UI 框架 |
| **TypeScript** | 5.9.x | 类型系统 |
| **Vite** | 7.x | 构建工具 + 开发服务器 |
| **TailwindCSS** | 4.x | 原子化 CSS 框架 |
| **Wouter** | 3.x | 轻量级路由 (3KB) |
| **TanStack Query** | 5.x | 服务端状态管理 |
| **tRPC** | 11.x | 类型安全 RPC |
| **Radix UI** | Latest | 无障碍 UI 组件库 |
| **Sonner** | Latest | Toast 通知 |

### 后端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| **Node.js** | 20+ | 运行时环境 |
| **Express** | 4.x | Web 服务器框架 |
| **tRPC** | 11.x | API 层 (类型安全) |
| **Drizzle ORM** | Latest | 数据库 ORM |
| **MySQL** | 8.0 | 关系型数据库 |
| **Jose** | Latest | JWT 签名/验证 |
| **bcrypt** | Latest | 密码哈希 |
| **Axios** | Latest | HTTP 客户端 |

### 开发工具

| 工具 | 版本 | 用途 |
|------|------|------|
| **pnpm** | 10.x | 包管理器 |
| **tsx** | Latest | TypeScript 执行器 |
| **Vitest** | Latest | 单元测试框架 |
| **Prettier** | Latest | 代码格式化 |
| **ESBuild** | Latest | 生产构建 |

### 云服务

- **数据库**：腾讯云 TDSQL-C MySQL 8.0
- **AI 模型**：阿里云通义千问
  - Qwen-Plus：自然语言参数解析
  - Qwen-Image-Edit-Max：工程图像编辑

## 📁 项目结构

```
train-design-editor/
├── client/                          # 前端应用
│   ├── public/                      # 静态资源
│   │   └── favicon.ico
│   ├── src/
│   │   ├── _core/                   # 核心模块
│   │   │   └── hooks/
│   │   │       └── useAuth.ts       # 认证钩子
│   │   ├── components/              # UI 组件
│   │   │   ├── ui/                  # Radix UI 封装
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   └── ...              # 30+ UI 组件
│   │   │   ├── DashboardLayout.tsx  # 布局组件
│   │   │   ├── ErrorBoundary.tsx    # 错误边界
│   │   │   └── Map.tsx              # 地图组件
│   │   ├── contexts/                # React Context
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/                   # 自定义 Hooks
│   │   │   ├── useComposition.ts
│   │   │   └── useMobile.tsx
│   │   ├── lib/                     # 工具库
│   │   │   ├── trpc.ts              # tRPC 客户端
│   │   │   └── utils.ts             # 通用工具
│   │   ├── pages/                   # 页面组件
│   │   │   ├── Home.tsx             # 主设计页面
│   │   │   ├── Login.tsx            # 登录页
│   │   │   ├── Register.tsx         # 注册页
│   │   │   └── NotFound.tsx         # 404 页面
│   │   ├── App.tsx                  # 根组件
│   │   ├── const.ts                 # 常量定义
│   │   ├── index.css                # 全局样式
│   │   └── main.tsx                 # 入口文件
│   └── index.html                   # HTML 模板
│
├── server/                          # 后端服务
│   ├── _core/                       # 核心模块
│   │   ├── context.ts               # tRPC Context
│   │   ├── cookies.ts               # Cookie 配置
│   │   ├── env.ts                   # 环境变量
│   │   ├── index.ts                 # 服务器入口 ⭐
│   │   ├── sdk.ts                   # 认证 SDK
│   │   ├── systemRouter.ts          # 系统路由
│   │   ├── trpc.ts                  # tRPC 配置
│   │   └── vite.ts                  # Vite 中间件
│   ├── aliyun.ts                    # 阿里云 API 封装 ⭐
│   ├── aliyun.test.ts               # AI 功能测试
│   ├── auth.ts                      # 认证逻辑 ⭐
│   ├── db.ts                        # 数据库操作 ⭐
│   ├── routers.ts                   # 业务路由 ⭐
│   └── storage.ts                   # 文件存储
│
├── drizzle/                         # 数据库 Schema
│   ├── schema.ts                    # 表定义 ⭐
│   ├── relations.ts                 # 关系定义
│   └── meta/                        # 迁移元数据
│       └── _journal.json
│
├── shared/                          # 前后端共享代码
│   ├── const.ts                     # 共享常量
│   ├── types.ts                     # 共享类型
│   └── _core/
│       └── errors.ts                # 错误类定义
│
├── patches/                         # pnpm patch 补丁
│   └── wouter@3.7.1.patch
│
├── .github/                         # GitHub 配置
│   └── workflows/
│       └── ci.yml                   # CI/CD 流程
│
├── .env                             # 环境变量 (本地，不提交)
├── .env.example                     # 环境变量模板
├── .env.production                  # 生产环境配置
├── .gitignore                       # Git 忽略规则
├── components.json                  # Shadcn UI 配置
├── drizzle.config.ts                # Drizzle ORM 配置
├── manual-init.sql                  # 数据库初始化 SQL
├── package.json                     # 项目配置 ⭐
├── pnpm-lock.yaml                   # 依赖锁定文件
├── tsconfig.json                    # TypeScript 配置
├── vite.config.ts                   # Vite 配置 ⭐
├── vitest.config.ts                 # 测试配置
└── README.md                        # 项目文档 ⭐

⭐ = 核心文件
```

### 关键文件说明

| 文件 | 职责 | 重要程度 |
|------|------|----------|
| `server/_core/index.ts` | Express 服务器入口，集成 Vite/tRPC | ⭐⭐⭐⭐⭐ |
| `server/routers.ts` | 所有 tRPC 业务路由定义 | ⭐⭐⭐⭐⭐ |
| `server/aliyun.ts` | 阿里云 AI 模型调用封装 | ⭐⭐⭐⭐⭐ |
| `server/db.ts` | 数据库 CRUD 操作 | ⭐⭐⭐⭐⭐ |
| `drizzle/schema.ts` | 数据库表结构定义 | ⭐⭐⭐⭐⭐ |
| `client/src/pages/Home.tsx` | 主设计交互页面 | ⭐⭐⭐⭐⭐ |
| `vite.config.ts` | Vite 构建配置，包含代理 | ⭐⭐⭐⭐ |
| `package.json` | 依赖和脚本定义 | ⭐⭐⭐⭐ |

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 20.0.0
- **pnpm**: >= 10.0.0
- **MySQL**: >= 8.0
- **操作系统**: Windows / macOS / Linux

### 1. 克隆项目

```bash
git clone https://github.com/your-org/train-design-editor.git
cd train-design-editor
```

### 2. 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 3. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填写必要配置：

```env
# 数据库配置
DATABASE_URL=mysql://username:password@host:port/database_name

# JWT 密钥（生成方式见下方）
JWT_SECRET=your-64-character-random-string

# 阿里云 API（通义千问）
ALIYUN_IMAGE_API_KEY=your-dashscope-api-key
BUILT_IN_FORGE_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# 基础图片 URL（工程图底图）
BASE_IMAGE_URL=https://your-domain.com/base-train-design.png

# 运行环境
NODE_ENV=development
```

**生成安全的 JWT_SECRET**：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. 初始化数据库

**方式一：使用 Drizzle 自动迁移**

```bash
pnpm run db:push
```

**方式二：手动执行 SQL**

```bash
# 使用 MySQL 客户端
mysql -h your-host -P port -u username -p < manual-init.sql
```

### 5. 启动开发服务器

#### 单终端模式（开发环境）

```bash
pnpm run dev
```

访问 `http://localhost:3000`

#### 双终端模式（前后端分离）

**终端 1 - 后端 API 服务器**：
```bash
cd train-design-editor
NODE_ENV=production npx tsx watch server/_core/index.ts
```
后端运行在 `http://localhost:3000`

**终端 2 - 前端 Vite 开发服务器**：
```bash
cd train-design-editor
npx vite --port 5173
```
前端运行在 `http://localhost:5173`（API 请求会自动代理到 3000 端口）

### 6. 创建账号并登录

1. 访问 `http://localhost:5173/register`
2. 填写用户名、密码（密码 >= 6 位）
3. 注册成功后自动跳转到主页
4. 开始设计！

## 💻 开发指南

### 开发模式特性

- ✅ **热模块替换 (HMR)**：修改代码即时生效
- ✅ **TypeScript 类型检查**：实时错误提示
- ✅ **自动重启**：后端代码修改自动重载
- ✅ **Source Map**：精准定位源代码位置

### 代码规范

项目使用 Prettier 进行代码格式化：

```bash
# 格式化所有代码
pnpm run format

# 类型检查
pnpm run check
```

### 数据库迁移

#### 修改 Schema

1. 编辑 `drizzle/schema.ts`
2. 生成迁移文件：
   ```bash
   pnpm run db:push
   ```

#### 查看数据库结构

```bash
# 连接到 MySQL
mysql -h host -P port -u username -p

# 查看表结构
USE train_design;
SHOW TABLES;
DESCRIBE users;
DESCRIBE design_parameters;
DESCRIBE design_sessions;
DESCRIBE edit_history;
```

### 测试

```bash
# 运行单元测试
pnpm run test

# 监听模式
pnpm run test -- --watch

# 覆盖率报告
pnpm run test -- --coverage
```

### 调试技巧

#### 前端调试

使用浏览器开发者工具：
- **React DevTools**：查看组件树和状态
- **Network**：监控 API 请求
- **Console**：查看日志输出

#### 后端调试

```typescript
// 在代码中添加调试日志
console.log('[Debug]', data);

// 或使用 VS Code 断点调试
// launch.json 已配置好
```

## 🌐 部署指南

### 部署前检查清单

- [ ] 环境变量已正确配置
- [ ] 数据库已创建并初始化
- [ ] JWT_SECRET 使用强随机字符串
- [ ] 阿里云 API Key 有效
- [ ] 基础图片 URL 可访问

### 构建生产版本

```bash
# 1. 安装依赖
pnpm install --prod

# 2. 构建前端和后端
pnpm run build
```

构建产物：
- `dist/public/` - 前端静态文件
- `dist/index.js` - 后端服务器

### 启动生产服务器

```bash
# 设置生产环境变量
export NODE_ENV=production

# 启动服务器
pnpm start
```

服务器将监听 `PORT` 环境变量（默认 3000）。

### 推荐部署平台

#### 1. Render (推荐)

**优势**：
- ✅ 免费层可用
- ✅ 自动 HTTPS
- ✅ 持续部署
- ✅ 简单配置

**配置步骤**：

1. 在 Render 创建 Web Service
2. 连接 GitHub 仓库
3. 配置环境变量（见下方）
4. 设置构建命令：`pnpm install && pnpm run build`
5. 设置启动命令：`pnpm start`

#### 2. Railway

**优势**：
- ✅ $5 免费额度
- ✅ 自动 HTTPS
- ✅ 简洁界面

**配置步骤**：

1. 连接 GitHub 仓库
2. 添加 MySQL 插件
3. 配置环境变量
4. 自动部署

#### 3. VPS 部署（Linux）

使用 PM2 进行进程管理：

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start dist/index.js --name train-editor

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs train-editor
```

### 生产环境变量

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-production-secret-key
ALIYUN_IMAGE_API_KEY=your-api-key
BASE_IMAGE_URL=https://your-cdn.com/base-image.png
```

### 健康检查

访问 `/api/trpc/system.health` 查看服务状态：

```bash
curl https://your-domain.com/api/trpc/system.health
```

响应示例：
```json
{
  "status": "healthy",
  "timestamp": "2026-02-12T12:00:00.000Z",
  "database": "connected"
}
```

## 📚 API 文档

### tRPC 路由结构

```typescript
appRouter
├── system          # 系统路由
│   ├── health      # 健康检查
│   └── metrics     # 性能指标
│
├── auth            # 认证路由
│   ├── me          # 获取当前用户
│   ├── register    # 用户注册
│   ├── login       # 用户登录
│   └── logout      # 退出登录
│
└── design          # 设计路由
    ├── getParameters       # 获取设计参数
    ├── getHistory          # 获取编辑历史
    ├── getSessions         # 获取所有会话
    ├── getActiveSession    # 获取活跃会话
    ├── createSession       # 创建新会话
    ├── setActiveSession    # 切换活跃会话
    ├── getHistoryItem      # 获取单条历史
    ├── submitEdit          # 提交编辑请求 ⭐
    └── getBaseImage        # 获取基础图片
```

### 核心 API 示例

#### 1. 用户注册

```typescript
// Request
trpc.auth.register.mutate({
  username: "designer01",
  password: "securePassword123",
  name: "张工",
  email: "zhang@example.com"
})

// Response
{
  success: true,
  user: {
    id: 1,
    username: "designer01",
    name: "张工",
    email: "zhang@example.com",
    role: "user",
    createdAt: "2026-02-12T10:00:00.000Z"
  }
}
```

#### 2. 提交设计编辑

```typescript
// Request
trpc.design.submitEdit.mutate({
  userInput: "把车头长度改为11米,车窗向后移动300mm"
})

// Response
{
  success: true,
  historyId: 42,
  parsedChanges: {
    trainHeadLength: 11000,
    wiperPosition: "+300"
  }
}

// 异步生成图片后，历史记录会更新状态
```

#### 3. 获取编辑历史

```typescript
// Request
trpc.design.getHistory.useQuery({
  limit: 20,
  sessionId: 5  // 可选
})

// Response
[
  {
    id: 42,
    userId: 1,
    sessionId: 5,
    userInput: "把车头长度改为11米,车窗向后移动300mm",
    parsedChanges: "{\"trainHeadLength\":11000,\"wiperPosition\":\"+300\"}",
    generatedImageUrl: "https://dashscope.aliyuncs.com/...",
    status: "completed",
    parametersSnapshot: "{...}",
    createdAt: "2026-02-12T10:30:00.000Z"
  },
  // ...更多历史记录
]
```

### 支持的设计参数

| 参数名 | 中文描述 | 单位 | 默认值 |
|--------|----------|------|--------|
| `trainHeadLength` | 车头长度 | mm | 10500 |
| `trainHeadHeight` | 车头高度 | mm | 3850 |
| `maxWidth` | 最大宽度 | mm | 3360 |
| `maxHeight` | 最大高度 | mm | 3850 |
| `windowWidth` | 车窗宽度 | mm | 1200 |
| `windowHeight` | 车窗高度 | mm | 800 |
| `chassisHeight` | 底盘离地高度 | mm | 1500 |
| `wiperPosition` | 雨刮器前后位置 | mm | 2200 |
| `couplerHeight` | 车钩高度位置 | mm | 1000 |
| `streamlineCurvature` | 流线型曲率 | 度 | 72 |
| ... | ... | ... | ... |

完整参数列表见 `drizzle/schema.ts` → `designParameters` 表定义。

## ❓ 常见问题

### Q1: 如何生成 JWT_SECRET？

```bash
# 使用 Node.js 生成 64 字符随机字符串
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Q2: 数据库连接失败？

**检查清单**：
- [ ] DATABASE_URL 格式正确：`mysql://user:password@host:port/database`
- [ ] 数据库服务器已启动
- [ ] 防火墙允许端口访问
- [ ] 用户名密码正确
- [ ] 数据库已创建

**测试连接**：
```bash
mysql -h host -P port -u username -p
```

### Q3: 阿里云 API 调用失败？

**常见原因**：
- API Key 无效或已过期
- 账户余额不足
- 请求频率超限

**验证 API Key**：
```bash
curl -X POST https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-plus","input":{"messages":[{"role":"user","content":"测试"}]}}'
```

### Q4: 图像生成失败？

**可能原因**：
- 基础图片 URL 不可访问
- 阿里云 API 超时（图像生成需要 30-180 秒）
- 提示词过于复杂

**调试方法**：
```bash
# 查看服务器日志
pm2 logs train-editor

# 检查历史记录中的 errorMessage 字段
```

### Q5: 如何在生产环境启用 HTTPS？

**推荐方案**：使用反向代理

**Nginx 配置示例**：
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Q6: 如何备份数据库？

```bash
# 备份所有数据
mysqldump -h host -P port -u username -p train_design > backup.sql

# 仅备份结构
mysqldump -h host -P port -u username -p --no-data train_design > schema.sql

# 恢复数据
mysql -h host -P port -u username -p train_design < backup.sql
```

### Q7: 如何升级依赖？

```bash
# 查看可更新的包
pnpm outdated

# 交互式更新
pnpm update -i

# 更新所有补丁版本
pnpm update

# 更新特定包
pnpm update react react-dom
```

## 🤝 贡献指南

我们欢迎任何形式的贡献！无论是新功能、Bug 修复、文档改进还是问题反馈。

### 贡献流程

1. **Fork 本仓库**
2. **创建特性分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **提交变更**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
4. **推送到分支**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **提交 Pull Request**

### Commit 规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 重构
- `perf:` 性能优化
- `test:` 测试相关
- `chore:` 构建/工具链更新

### 代码审查标准

- ✅ 通过 TypeScript 类型检查
- ✅ 遵循 Prettier 代码风格
- ✅ 新功能包含测试用例
- ✅ 更新相关文档
- ✅ Commit 信息清晰

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

```
MIT License

Copyright (c) 2026 Train Design Editor Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 致谢

感谢以下开源项目和服务：

- [React](https://reactjs.org/) - 现代化 UI 框架
- [tRPC](https://trpc.io/) - 类型安全的 RPC 框架
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Vite](https://vitejs.dev/) - 极速构建工具
- [TailwindCSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Radix UI](https://www.radix-ui.com/) - 无障碍组件基元
- [阿里云通义千问](https://tongyi.aliyun.com/) - AI 大模型服务
- [腾讯云 TDSQL](https://cloud.tencent.com/product/tdsql-c) - 云数据库服务

---

<div align="center">

**Built with ❤️ by Train Design Editor Team**

[GitHub](https://github.com/your-org/train-design-editor) | [Issues](https://github.com/your-org/train-design-editor/issues) | [Documentation](https://docs.example.com)

</div>
│   └── public/
├── server/              # 后端 Express 服务器
│   ├── _core/           # 核心功能
│   └── routers.ts       # API 路由
├── drizzle/             # 数据库 Schema 和迁移
├── shared/              # 前后端共享代码
└── ...
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT

---

