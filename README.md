# NavHub · 极简导航网站

前后端分离的导航网站，支持标签/文件夹分类、网站介绍、使用详情管理，极简风格 + 毛玻璃效果。

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | React + Vite + TypeScript + Tailwind CSS | shadcn/ui 组件库 |
| 后端 | Express.js | RESTful API |
| 数据库 | SQLite (本地) / PostgreSQL (生产) | 通过 DATABASE_URL 自动切换 |

## 功能

- 文件夹分类 + 多标签标记（分离独立）
- 网站名称、介绍、地址、使用详情
- 卡片式展示 + 毛玻璃效果 + 动态渐变背景
- 文件夹/标签筛选视图切换 + 关键词搜索
- 添加/编辑/删除网站和标签/文件夹（CRUD）
- JWT 认证系统（Ctrl+Shift+K 打开登录）
- 响应式布局

---

## 本地开发

### 1. 启动后端

```bash
cd backend
npm install
npm run seed    # 初始化示例数据（仅首次）
npm run dev     # 启动开发服务器 http://localhost:3001
```

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev     # 启动开发服务器 http://localhost:5173
```

---

## 部署指南（免费 + 数据持久化）

### 架构总览

```
用户浏览器
    │
    ▼ (自定义域名 / 平台自带域名)
Cloudflare Pages (前端静态托管 + CDN + SSL)
    │
    ▼ (API 请求)
Render Web Service (后端 API)
    │
    ▼
Supabase PostgreSQL (持久化数据库)
```

---

### 第一步：创建 Supabase 数据库（数据持久化）

**Supabase 免费 500MB PostgreSQL 数据库，数据永久保存。**

1. 注册 Supabase：https://supabase.com → 用 GitHub 登录
2. 创建新项目：
   - Organization: 选默认
   - Project Name: `navhub`
   - Database Password: 设一个密码并记录
   - Region: 选 `Southeast Asia (Singapore)` 或离你最近的
   - Plan: Free
3. 获取连接字符串：
   - 进入项目 → Settings → Database → Connection string
   - 选择 **URI** 模式
   - 复制 `postgres://postgres.XXXX:XXXX@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
   - ⚠️ 将密码中的特殊字符做 URL 编码（如 `@` → `%40`，`#` → `%23`）
4. 保存好这个连接字符串，后面要用

> Supabase 免费版限制：500MB 存储，项目暂停 7 天无活动后可一键恢复。

---

### 第二步：部署后端到 Render（免费）

1. 注册 Render：https://render.com → 用 GitHub 登录
2. 创建 Web Service：
   - Dashboard → "New +" → "Web Service"
   - 连接 GitHub 仓库 `CX98/navhub`
   - 配置：
     - **Name**: `navhub-api`
     - **Root Directory**: `backend`
     - **Runtime**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`
     - **Plan**: Free
   - 环境变量（Environment Variables）：
     - `DATABASE_URL` = 第一步获得的 Supabase 连接字符串
     - `JWT_SECRET` = 任意随机字符串（如 `navhub-secret-2026`）
     - `PORT` = `3001`
3. 点击 "Create Web Service"，等待部署完成
4. 初始化数据：部署成功后，进入 Render Shell 运行 `node seed.js`
5. 验证：访问 `https://navhub-api.onrender.com/api/health`
   - 应返回 `{"status":"ok","db":"postgresql"}`

> Render 免费版会在 15 分钟无访问后休眠，首次唤醒需约 30 秒。

---

### 第三步：部署前端到 Cloudflare Pages（免费）

1. 注册 Cloudflare：https://dash.cloudflare.com/sign-up
2. 创建 Pages 项目：
   - Workers & Pages → Create application → Pages → Connect to Git
   - 连接 GitHub 仓库 `CX98/navhub`
   - 配置：
     - **Project name**: `navhub`
     - **Production branch**: `main`
     - **Build command**: `cd frontend && npm install && npm run build`
     - **Build output directory**: `frontend/dist`
   - 环境变量：
     - `VITE_API_BASE` = `https://navhub-api.onrender.com/api`
3. 点击 "Save and Deploy"
4. 等待构建完成，访问 `https://navhub.pages.dev`

---

### 第四步：申请免费域名（可选）

#### 方案 A：使用平台自带域名（最简单）

- Cloudflare Pages: `navhub.pages.dev` ← 直接可用
- 如需自定义域名，在 Pages 项目 → Custom domains 中添加

#### 方案 B：us.kg（快速，免费）

1. 注册 https://register.us.kg/
2. 申请 `your-name.us.kg` 域名（通常 1 小时内审批）
3. 在 Cloudflare Pages → Custom domains 中绑定

#### 方案 C：eu.org（完全免费，审批较慢）

1. 注册 https://nic.eu.org/
2. 申请 `your-name.eu.org` 域名
3. Name Server 填 Cloudflare 的
4. 审批需 1~30 天

---

## 登录信息

- 默认用户名：`cxj`
- 默认密码：`chenxiaojun@2026`
- 登录方式：按 `Ctrl+Shift+K` 打开登录弹窗

---

## 项目结构

```
nav-site/
├── frontend/              # 前端 React 应用
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/        # shadcn/ui 基础组件
│   │   │   ├── CategoryFilter.tsx    # 文件夹/标签筛选
│   │   │   ├── LoginDialog.tsx       # 登录弹窗
│   │   │   ├── ManageDialog.tsx      # 标签/文件夹管理
│   │   │   ├── SiteCard.tsx          # 网站卡片
│   │   │   ├── SiteDetailDialog.tsx  # 网站详情
│   │   │   └── SiteFormDialog.tsx    # 添加/编辑表单
│   │   ├── hooks/         # useAuth, useNavData
│   │   ├── lib/           # API 客户端
│   │   ├── types/         # TypeScript 类型
│   │   ├── App.tsx        # 主应用
│   │   └── index.css      # 毛玻璃 + 渐变背景
│   └── .env.production    # 生产环境变量
├── backend/               # 后端 Express API
│   ├── server.js          # Express 服务器
│   ├── db.js              # 数据库自动选择入口
│   ├── db-sqlite.js       # SQLite 适配器
│   ├── db-postgres.js     # PostgreSQL 适配器
│   ├── auth.js            # JWT 认证
│   ├── seed.js            # 数据初始化
│   └── data/              # SQLite 数据库文件（本地开发）
├── render.yaml            # Render 部署配置
└── README.md
```

## API 接口

| 方法 | 路径 | 说明 | 认证 |
|---|---|---|---|
| POST | `/api/auth/login` | 登录获取 token | 否 |
| GET | `/api/auth/verify` | 校验 token | 否 |
| GET | `/api/folders` | 获取所有文件夹 | 否 |
| POST | `/api/folders` | 创建文件夹 | 是 |
| PUT | `/api/folders/:id` | 更新文件夹 | 是 |
| DELETE | `/api/folders/:id` | 删除文件夹 | 是 |
| GET | `/api/tags` | 获取所有标签 | 否 |
| POST | `/api/tags` | 创建标签 | 是 |
| PUT | `/api/tags/:id` | 更新标签 | 是 |
| DELETE | `/api/tags/:id` | 删除标签 | 是 |
| GET | `/api/sites` | 获取网站列表 | 否 |
| POST | `/api/sites` | 创建网站 | 是 |
| PUT | `/api/sites/:id` | 更新网站 | 是 |
| DELETE | `/api/sites/:id` | 删除网站 | 是 |
| GET | `/api/health` | 健康检查 | 否 |

## 免费方案总结

| 服务 | 免费额度 | 推荐用途 |
|---|---|---|
| **Cloudflare Pages** | 无限带宽 + CDN + SSL | 前端托管 |
| **Render** | 750 小时/月 | 后端 API |
| **Supabase** | 500MB PostgreSQL | 持久化数据库 |
| **us.kg** | 完全免费域名 | 自定义域名 |

## License

MIT
