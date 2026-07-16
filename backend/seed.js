import db from "./db.js";

// Clear existing data
await db.seedClear();

// ==================== Folders ====================
const folders = [
  { name: "开发", color: "#6366f1", icon: "code", order: 1 },
  { name: "设计", color: "#ec4899", icon: "palette", order: 2 },
  { name: "AI", color: "#f59e0b", icon: "brain", order: 3 },
  { name: "学习", color: "#10b981", icon: "graduation-cap", order: 4 },
  { name: "效率", color: "#3b82f6", icon: "zap", order: 5 },
  { name: "社区", color: "#8b5cf6", icon: "users", order: 6 },
];

const folderMap = await db.seedFolders(folders);

// ==================== Tags ====================
const tags = [
  { name: "Git", color: "#f97316", order: 1 },
  { name: "编辑器", color: "#22c55e", order: 2 },
  { name: "前端", color: "#3b82f6", order: 3 },
  { name: "后端", color: "#8b5cf6", order: 4 },
  { name: "UI设计", color: "#ec4899", order: 5 },
  { name: "图片", color: "#f59e0b", order: 6 },
  { name: "图标", color: "#14b8a6", order: 7 },
  { name: "对话AI", color: "#6366f1", order: 8 },
  { name: "图像AI", color: "#ef4444", order: 9 },
  { name: "文档", color: "#a855f7", order: 10 },
  { name: "编程课", color: "#10b981", order: 11 },
  { name: "笔记", color: "#3b82f6", order: 12 },
  { name: "白板", color: "#f97316", order: 13 },
  { name: "开源", color: "#64748b", order: 14 },
  { name: "资讯", color: "#0ea5e9", order: 15 },
];

const tagMap = await db.seedTags(tags);

// ==================== Sites ====================
const sites = [
  {
    title: "GitHub",
    description: "全球最大的代码托管平台，支持 Git 版本控制。",
    url: "https://github.com",
    usage_guide: "注册账号后创建仓库，使用 git push 上传代码。支持公开/私有仓库、Pull Request 协作开发。",
    folder: "开发",
    tagNames: ["Git", "开源"],
  },
  {
    title: "VS Code",
    description: "微软出品的免费开源代码编辑器，插件生态丰富。",
    url: "https://code.visualstudio.com",
    usage_guide: "下载安装后通过扩展市场安装语言插件。常用快捷键：Ctrl+P 快速打开文件，Ctrl+Shift+P 命令面板。",
    folder: "开发",
    tagNames: ["编辑器", "前端", "后端"],
  },
  {
    title: "Stack Overflow",
    description: "全球最大的程序员问答社区。",
    url: "https://stackoverflow.com",
    usage_guide: "搜索问题或提问。回答需提供最小可复现代码。积累 Reputation 可解锁更多权限。",
    folder: "开发",
    tagNames: ["前端", "后端", "资讯"],
  },
  {
    title: "Figma",
    description: "在线协作 UI 设计工具，支持实时多人编辑。",
    url: "https://www.figma.com",
    usage_guide: "注册后创建设计文件，邀请团队成员协作。支持组件库、自动布局、原型交互等功能。",
    folder: "设计",
    tagNames: ["UI设计"],
  },
  {
    title: "Unsplash",
    description: "免费高清图片素材库，可商用。",
    url: "https://unsplash.com",
    usage_guide: "搜索关键词找到图片，点击下载即可使用。无需 attribution，但建议标注摄影师。",
    folder: "设计",
    tagNames: ["图片"],
  },
  {
    title: "Iconfont",
    description: "阿里巴巴矢量图标库，提供海量免费图标。",
    url: "https://www.iconfont.cn",
    usage_guide: "搜索图标后加入购物车，选择下载 SVG/PNG 或生成在线字体链接引入项目。",
    folder: "设计",
    tagNames: ["图标", "前端"],
  },
  {
    title: "ChatGPT",
    description: "OpenAI 推出的 AI 对话助手，支持多语言交互。",
    url: "https://chat.openai.com",
    usage_guide: "注册账号后即可对话。支持代码生成、文本翻译、问答等。Plus 订阅可使用 GPT-4。",
    folder: "AI",
    tagNames: ["对话AI"],
  },
  {
    title: "Midjourney",
    description: "AI 图像生成工具，通过文字描述生成高质量图片。",
    url: "https://www.midjourney.com",
    usage_guide: "通过 Discord 加入频道，使用 /imagine 命令输入提示词生成图片。支持多种艺术风格。",
    folder: "AI",
    tagNames: ["图像AI"],
  },
  {
    title: "MDN Web Docs",
    description: "Mozilla 出品的 Web 开发权威文档。",
    url: "https://developer.mozilla.org",
    usage_guide: "左侧导航按技术分类浏览。搜索框支持精确查找 API 文档。提供交互式示例。",
    folder: "学习",
    tagNames: ["文档", "前端"],
  },
  {
    title: "freeCodeCamp",
    description: "免费编程学习平台，涵盖前端到后端全栈课程。",
    url: "https://www.freecodecamp.org",
    usage_guide: "注册后按课程路径学习，完成项目获得认证。支持中文界面。全部内容免费。",
    folder: "学习",
    tagNames: ["编程课", "前端", "后端"],
  },
  {
    title: "Notion",
    description: "一体化笔记、文档和项目管理工具。",
    url: "https://www.notion.so",
    usage_guide: "创建 Workspace 后添加页面。支持数据库、看板、日历等多种视图。免费版支持无限页面。",
    folder: "效率",
    tagNames: ["笔记"],
  },
  {
    title: "Excalidraw",
    description: "免费在线手绘风格白板工具。",
    url: "https://excalidraw.com",
    usage_guide: "直接打开即用，无需注册。选择形状工具绘制，支持实时协作和导出 PNG/SVG。",
    folder: "效率",
    tagNames: ["白板"],
  },
  {
    title: "Hacker News",
    description: "Y Combinator 旗下科技新闻社区。",
    url: "https://news.ycombinator.com",
    usage_guide: "浏览首页热门科技资讯，可提交链接和参与讨论。评论质量高，适合了解行业动态。",
    folder: "社区",
    tagNames: ["资讯", "开源"],
  },
  {
    title: "Product Hunt",
    description: "发现最新科技产品和工具的平台。",
    url: "https://www.producthunt.com",
    usage_guide: "每日浏览新产品，可投票和评论。支持按分类筛选，是寻找灵感的好地方。",
    folder: "社区",
    tagNames: ["资讯"],
  },
];

await db.seedSites(sites, folderMap, tagMap);

console.log(`Seeded ${folders.length} folders, ${tags.length} tags, and ${sites.length} sites.`);
