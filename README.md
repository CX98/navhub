# NavHub · 极简导航网站

一个采用前后端分离架构的导航网站，支持标签分类、网站介绍、使用详情管理，界面采用极简风格 + 毛玻璃效果。

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | React + Vite + TypeScript + Tailwind CSS | shadcn/ui 组件库 |
| 后端 | Express.js + better-sqlite3 | RESTful API |
| 数据库 | SQLite | 轻量级，零配置 |

## 功能

- 网站标签/文件夹分类管理
- 网站名称、介绍、地址、使用详情
- 卡片式展示 + 毛玻璃效果
- 标签筛选 + 关键词搜索
- 添加 / 编辑 / 删除网站（CRUD）
- 响应式布局，支持移动端

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

### 3. 构建

```bash
cd frontend
npm run build   # 产物在 dist/ 目录
```

---

## 免费部署指南

### 架构总览

```
用户浏览器
    │
    ▼ (自定义域名: your-name.eu.org)
Cloudflare Pages (前端静态托管 + CDN + SSL)
    │
    ▼ (API 请求)
Render Web Service (后端 API)
    │
    ▼
SQLite 数据库 (文件存储)
```

### 第一步：部署后端到 Render（免费）

Render 提供 750 小时/月的免费 Web Service，支持 Node.js。

1. **注册 Render 账号**
   - 访问 https://render.com
   - 用 GitHub 账号登录

2. **推送代码到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/navhub.git
   git push -u origin main
   ```

3. **在 Render 创建 Web Service**
   - 点击 "New +" → "Web Service"
   - 连接你的 GitHub 仓库
   - 配置：
     - **Name**: `navhub-api`
     - **Root Directory**: `backend`
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`
     - **Plan**: Free
   - 添加环境变量：
     - `PORT` = `3001`（Render 会自动分配端口，代码已适配）
   - 点击 "Create Web Service"

4. **初始化数据**
   - 部署成功后，在 Render 的 Shell 中运行：
     ```bash
     node seed.js
     ```

5. **验证**
   - 访问 `https://navhub-api.onrender.com/api/health`
   - 应返回 `{"status":"ok"}`

> **注意**: Render 免费版会在 15 分钟无访问后休眠，首次唤醒需约 30 秒。SQLite 文件在每次重新部署时会重置（非持久化），如需持久化数据，建议使用 Render 免费 PostgreSQL 或 Supabase（见下文"数据持久化方案"）。

### 第二步：部署前端到 Cloudflare Pages（免费）

Cloudflare Pages 提供无限带宽、免费 SSL、全球 CDN，无需信用卡。

1. **注册 Cloudflare 账号**
   - 访问 https://dash.cloudflare.com/sign-up

2. **创建 Pages 项目**
   - 进入 "Workers & Pages" → "Create application" → "Pages"
   - 连接你的 GitHub 仓库
   - 配置：
     - **Project name**: `navhub`
     - **Production branch**: `main`
     - **Build output directory**: `frontend/dist`
     - **Build command**: `cd frontend && npm install && npm run build`
   - 添加环境变量：
     - `VITE_API_BASE` = `https://navhub-api.onrender.com/api`（你的 Render 后端地址）

3. **部署**
   - 点击 "Save and Deploy"
   - 等待构建完成
   - 访问 `https://navhub.pages.dev` 查看效果

> **替代方案**: 也可以用 Vercel 部署前端（100GB 带宽/月，免费 SSL），流程类似。

### 第三步：申请免费域名

#### 方案 A：eu.org（推荐，完全免费）

eu.org 自 1996 年运营至今，提供 `your-name.eu.org` 二级域名，完全免费。

1. **注册**
   - 访问 https://nic.eu.org/
   - 点击 "Sign up"，填写邮箱、密码
   - 去邮箱验证

2. **申请域名**
   - 登录后点击 "New Domain"
   - 填写你想要的域名（如 `navhub.eu.org`）
   - Name Server 先填 Cloudflare 的（见下方）

3. **在 Cloudflare 添加站点**
   - Cloudflare Dashboard → "Add a Site"
   - 输入你的域名 `navhub.eu.org`
   - 选择 "Free" 计划
   - 获取 Cloudflare 的 Name Server 地址（如 `xxx.ns.cloudflare.com`）
   - 回到 eu.org 填入这两个 Name Server

4. **等待审批**
   - eu.org 审批需 1~30 天
   - 通过后域名即可使用

5. **配置 Cloudflare Pages 自定义域名**
   - Cloudflare Pages → 你的项目 → "Custom domains" → "Set up a domain"
   - 输入 `navhub.eu.org`
   - Cloudflare 自动配置 DNS 和 SSL

#### 方案 B：us.kg（更快，免费）

- 访问 https://register.us.kg/
- 注册账号，申请 `your-name.us.kg` 域名
- 审批更快（通常 1 小时内）
- 同样可托管到 Cloudflare

#### 方案 C：js.org（仅限 JS 项目）

- 适合 JavaScript 相关项目
- 在 GitHub 仓库添加 CNAME 文件
- 向 https://github.com/js-org/js.org 提交 PR
- 获得如 `navhub.js.org` 的域名

#### 方案 D：使用平台自带域名（最简单）

- Cloudflare Pages: `navhub.pages.dev`
- Vercel: `navhub.vercel.app`
- 直接使用，无需额外申请

---

## 数据持久化方案

Render 免费版的文件系统是非持久化的，每次重新部署 SQLite 数据会丢失。以下是解决方案：

### 方案 1：Supabase 免费 PostgreSQL（推荐）

1. 注册 https://supabase.com（免费 500MB 数据库）
2. 创建项目，获取连接字符串
3. 修改后端使用 PostgreSQL 替代 SQLite
4. 添加环境变量 `DATABASE_URL`

### 方案 2：Render 免费 PostgreSQL

1. Render Dashboard → "New" → "PostgreSQL"
2. 免费版：1GB 存储，**30 天后过期**（需定期重建）
3. 获取 Internal Database URL
4. 修改后端连接 PostgreSQL

### 方案 3：保持 SQLite + 接受限制

- 适合演示和个人使用
- 每次重新部署后运行 `node seed.js` 重新填充数据
- 日常运行期间数据不会丢失（仅部署时重置）

---

## 项目结构

```
nav-site/
├── frontend/              # 前端 React 应用
│   ├── src/
│   │   ├── components/    # UI 组件
│   │   │   ├── ui/       # shadcn/ui 基础组件（40+）
│   │   │   ├── SiteCard.tsx       # 网站卡片
│   │   │   ├── TagFilter.tsx     # 标签筛选栏
│   │   │   ├── SiteDetailDialog.tsx  # 网站详情弹窗
│   │   │   └── SiteFormDialog.tsx   # 添加/编辑表单
│   │   ├── hooks/        # 自定义 Hook
│   │   ├── lib/          # API 客户端
│   │   ├── types/        # TypeScript 类型
│   │   ├── App.tsx       # 主应用
│   │   └── index.css     # 全局样式（毛玻璃效果）
│   ├── .env              # 开发环境变量
│   └── .env.production   # 生产环境变量
├── backend/               # 后端 Express API
│   ├── server.js          # Express 服务器
│   ├── db.js              # SQLite 数据库
│   ├── seed.js            # 数据初始化脚本
│   └── data/              # 数据库文件（自动生成）
├── render.yaml            # Render 部署配置
└── README.md              # 本文件
```

## API 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/tags` | 获取所有标签 |
| POST | `/api/tags` | 创建标签 |
| PUT | `/api/tags/:id` | 更新标签 |
| DELETE | `/api/tags/:id` | 删除标签 |
| GET | `/api/sites` | 获取网站列表（支持 ?tag_id=&search=） |
| GET | `/api/sites/:id` | 获取单个网站详情 |
| POST | `/api/sites` | 创建网站 |
| PUT | `/api/sites/:id` | 更新网站 |
| DELETE | `/api/sites/:id` | 删除网站 |
| GET | `/api/health` | 健康检查 |
| GET | `/api/stats` | 统计数据 |

---

## 免费方案对比总结

| 服务 | 免费额度 | 限制 | 推荐用途 |
|---|---|---|---|
| **Cloudflare Pages** | 无限带宽，无限请求 | 500 次构建/月 | 前端托管 |
| **Vercel** | 100GB 带宽/月 | Hobby 计划限制 | 前端托管 |
| **Render** | 750 小时/月 | 15 分钟休眠，非持久存储 | 后端 API |
| **eu.org** | 完全免费 | 审批 1~30 天 | 免费域名 |
| **us.kg** | 完全免费 | 审批较快 | 免费域名 |
| **Supabase** | 500MB 数据库 | 500MB 存储 | 持久化数据库 |

## License

MIT
