/**
 * resume.ts — 简历数据层（强类型）
 *
 * 设计意图：
 * 1. 简历全部事实的「单一数据源」，页面内容（含派生的 Markdown）都由这里的类型约束驱动。
 * 2. 避免硬编码散落在组件里；改动简历内容只改本文件对应字段。
 *
 * 同步约定：修改简历「专业技能 / 项目经历」后，回到本文件更新对应字段，
 * 并同步 data/resumeSource.ts 的拼接逻辑（见 AGENTS.md 联动表）。
 */

/** 技能熟练度档位（对应简历「精通 / 熟悉」两档） */
export type Proficiency = "master" | "familiar";

/** 一条专业技能方向 */
export interface SkillGroup {
  /** 稳定 id，用作锚点 / 雷达轴 key */
  id: string;
  /** 方向名称 */
  title: string;
  /** 档位 */
  level: Proficiency;
  /** 雷达图分值 0-100（master 档整体偏高，仅用于可视化） */
  score: number;
  /** 该方向涵盖的具体技术点 */
  points: string[];
}

/** 个人信息 */
export interface Profile {
  name: string;
  phone: string;
  email: string;
  gender: string;
  age: number;
  experienceYears: number;
  intention: string[];
  city: string;
  summary: string;
}

/** 工作经历（时间线节点） */
export interface Experience {
  company: string;
  role: string;
  period: string;
  highlights: string[];
}

/** 项目经历 */
export interface Project {
  name: string;
  role: string;
  desc: string;
  /** 关键成果 / 改造点（bullet） */
  achievements: string[];
  /** 技术栈标签 */
  tech: string[];
  /** 亮点徽标，例如「Lighthouse 95」 */
  badges?: string[];
}

/** 开源 / 工具项目 */
export interface OpenSource {
  name: string;
  role: string;
  desc: string;
  tech: string[];
  link?: string;
}

/** 教育经历 */
export interface Education {
  school: string;
  degree: string;
  major: string;
}

export const profile: Profile = {
  name: "坚冰",
  phone: "15240235709",
  email: "417913012@qq.com",
  gender: "男",
  age: 36,
  experienceYears: 16,
  intention: ["前端全栈", "Agent 开发"],
  city: "上海",
  summary:
    "16 年前端开发经验，覆盖电商 / 金融 / 教育 / 汽车行业，曾带领 20 人前端团队，主导 20+ 项目从 0 到 1 交付。" +
    "前端覆盖 PC / H5 / 小程序 / Node.js / Tauri 桌面端及浏览器插件开发，在 AI 模型加持下可拓展至后端技术需求。" +
    "擅长通过敏捷 / MVP 模式统筹团队，保障项目按时高质量交付，可快速对接跨部门协作，为业务落地提供稳定的技术支撑。",
};

export const skills: SkillGroup[] = [
  {
    id: "framework",
    title: "前端框架",
    level: "master",
    score: 95,
    points: [
      "Vue 3 (Composition API)",
      "React 18 (Hooks)",
      "Svelte",
      "Solid（编译时框架）",
    ],
  },
  {
    id: "engineering",
    title: "前端工程化",
    level: "master",
    score: 92,
    points: [
      "Monorepo (pnpm workspace)",
      "CLI 工具开发",
      "Biome 代码规范统一",
      "私仓管理 (Verdaccio)",
    ],
  },
  {
    id: "language",
    title: "编程语言",
    level: "familiar",
    score: 80,
    points: [
      "TypeScript（编译器原理 / V8 优化）",
      "AssemblyScript",
      "Rust（Webpack 插件 / Loader）",
      "Java / Python",
    ],
  },
  {
    id: "architecture",
    title: "架构设计",
    level: "familiar",
    score: 82,
    points: [
      "IOC 容器与函数式编程",
      "SOLID 设计原则",
      "SPA / MPA",
      "同构渲染 (SSR / SSG)",
    ],
  },
  {
    id: "microfrontend",
    title: "微前端",
    level: "familiar",
    score: 78,
    points: [
      "Module Federation",
      "Single-spa / Qiankun",
      "iframe 隔离",
      "Web Components / 路由集成",
    ],
  },
  {
    id: "performance",
    title: "性能优化",
    level: "familiar",
    score: 85,
    points: [
      "性能监控 SDK (LCP / CLS / FID)",
      "CSS GPU 加速",
      "页面加载性能体系",
    ],
  },
  {
    id: "efficiency",
    title: "工程提效",
    level: "familiar",
    score: 83,
    points: [
      "AI 自动生成类型定义",
      "Vue ↔ React 代码转换",
      "AI CodeReview",
      "D2C（设计稿转代码）",
    ],
  },
  {
    id: "agent",
    title: "AI Agent",
    level: "familiar",
    score: 88,
    points: [
      "MCP Server 开发",
      "N8N / Flowise 编排",
      "RAG 知识库",
      "本地 LLM 部署 (Ollama)",
    ],
  },
];

export const experiences: Experience[] = [
  {
    company: "上海傲文网络技术有限公司",
    role: "前端主管",
    period: "2022.09 - 至今",
    highlights: [
      "主导多个项目从原生 JS 到 Vue3 + Vite + TypeScript 的架构升级",
      "代码规范从 ESLint 迁移至 Biome，CI 耗时降低 95%",
      "搭建自动化发布流水线，发布时间从 20 分钟降至 2 分钟",
      "封装 30+ 通用业务组件，覆盖表单 / 列表 / 弹窗，复用率超 70%",
      "通过图片压缩 + 性能 SDK 将页面 LCP 优化 80%+",
      "带领 20 人前端团队，建立技术分享与 CodeReview 机制",
    ],
  },
];

export const projects: Project[] = [
  {
    name: "某汽车官网",
    role: "前端开发",
    desc: "接手供应商遗留项目，负责官网车型 / 权益 / 参数展示、预约试驾数据提交等核心模块的全面改造。",
    achievements: [
      "组件化重构：组件复用率提升至 90%，开发与维护成本显著下降",
      "性能优化：页面加载从 5s 降至 1s 以内，Lighthouse 评分达 95",
      "GEO 优化：AI 可引用性 / E-E-A-T / 技术基础 / 结构化数据四维评分由 25 提升至 71",
      "工程化改造：部署时间从 20 分钟缩短至 5 分钟",
    ],
    tech: [
      "vue3",
      "vite",
      "vite-ssg",
      "vite-plugin-pages",
      "vite-plugin-vue-layouts",
    ],
    badges: ["Lighthouse 评分 95", "LCP 提速 80%", "复用率 90%"],
  },
  {
    name: "微信群聊监控工具",
    role: "独立全栈开发",
    desc: "面向车友社群的舆情监控工具，独立完成前后端设计、开发与部署运维。",
    achievements: [
      "实时群消息监控：敏感词命中即触发邮件推送运营处置，被动巡查转主动预警",
      "第三方页面巡检：Puppeteer 无头浏览器轮询业务依赖页面，异常自动告警",
      "工程保障：PM2 守护 7×24 常驻进程，Prisma 持久化，敏感词去重防刷",
      "业务成果：监控 100+ 车友群，配置 50+ 敏感词，节省运营约 90% 舆情巡查投入",
    ],
    tech: ["vue3", "vite", "node.js", "pm2", "puppeteer", "chatlog", "prisma"],
    badges: ["监控 100+ 群", "节省 90% 投入"],
  },
  {
    name: "AI 助手 Chrome 插件",
    role: "前端开发",
    desc: "公司统一采购大模型 Token，通过浏览器插件分发给内容团队，并扩展微信推文编辑能力。",
    achievements: [
      "插件基建：Vue 3 + TypeScript + @crxjs/vite-plugin，集成多模型对话与 Prompt 模板库",
      "微信推文编辑：内置 PrismJS 代码高亮，AI 写作与排版一体化",
      "MCP 升级：演进为 MCP Client，经 SSE 连接内部 3 个业务 MCP Server（CRM / 数仓 / 工单）",
      "业务成果：覆盖 10+ 内容运营，AI 辅助写作 100+ 次 / 天，推文编辑由半天缩短至 20 分钟",
    ],
    tech: [
      "typescript",
      "vue3",
      "vite",
      "@crxjs/vite-plugin",
      "@modelcontextprotocol/sdk",
      "prismjs",
      "sass",
    ],
    badges: ["100+ 次/天", "MCP Client"],
  },
  {
    name: "前端工程化体系",
    role: "体系搭建者",
    desc: "主导团队前端工程化体系建设：从零散项目配置到统一的工具链、规范、发布流水线与私有包治理。",
    achievements: [
      "架构升级：主导多个项目从原生 JS 迁移到 Vue 3 + Vite + TypeScript，统一构建与编译目标",
      "规范统一：代码规范从 ESLint + Prettier 迁移至 Biome（Rust 实现，单命令替代两套工具），CI 耗时降低 95%",
      "发布流水线：搭建自动化发布流水线，发布时间从 20 分钟降至 2 分钟",
      "基建治理：pnpm workspace Monorepo + Verdaccio 私仓，统一内部组件与工具包的发布与版本管理",
      "研发提效：自研 wd-cli，以一行命令拉起符合规范的项目（规范配置 + Git Hooks + 接口封装 + 组件库）",
    ],
    tech: [
      "pnpm workspace",
      "Biome",
      "Vite",
      "TypeScript",
      "Verdaccio",
      "Git Hooks",
      "CLI",
    ],
    badges: ["CI 提速 95%", "发布提速 90%"],
  },
  {
    name: "通用组件库与设计体系",
    role: "组件库负责人",
    desc: "面向团队沉淀通用业务组件库与前端设计规范，统一交互与视觉标准，减少业务侧重复开发。",
    achievements: [
      "组件沉淀：封装 30+ 通用业务组件，覆盖表单 / 列表 / 弹窗等高频业务场景",
      "复用成效：组件跨项目复用率超 70%，显著降低重复开发与维护成本",
      "规范沉淀：形成统一的交互与视觉规范，作为业务侧组件选型与实现的默认依据",
      "发布治理：通过 Verdaccio 私仓统一组件包的版本发布与升级",
    ],
    tech: ["Vue 3", "TypeScript", "组件库", "Verdaccio", "pnpm workspace"],
    badges: ["30+ 组件", "复用率 70%+"],
  },
  {
    name: "MCP 平台与 AI 服务端集成",
    role: "AI 能力建设者",
    desc: "把 AI 从「单点问答」扩展为「能调用真实业务能力」的服务端集成，用 MCP 打通内部业务系统并保证数据不出域。",
    achievements: [
      "架构升级：插件端演进为 MCP Client，经 SSE 长连接内部 3 个业务 MCP Server",
      "工具封装：将 CRM（客户 / 商机）、数仓（指标查询）、工单（创建 / 流转）三套业务接口封装为 MCP 工具",
      "检索增强：RAG 知识库检索增强结合 Ollama 本地 LLM 部署，敏感数据不出域",
      "流程编排：基于 N8N / Flowise 编排多流程自动化，串联多个业务环节",
    ],
    tech: [
      "@modelcontextprotocol/sdk",
      "MCP Server",
      "SSE",
      "RAG",
      "Ollama",
      "N8N",
      "TypeScript",
    ],
    badges: ["3 个 MCP Server", "数据不出域"],
  },
];

export const openSources: OpenSource[] = [
  {
    name: "Zitrange",
    role: "独立作者",
    desc: "中文字体子集化（TypeScript）。按 unicode-range 将 CJK 字体切分为 woff2 分片并生成 @font-face，浏览器按需加载，解决中文 webfont 体积过大痛点；纯本地运行。",
    tech: ["TypeScript", "woff2", "unicode-range", "@font-face"],
    link: "https://github.com/MinosIE/Zitrange",
  },
  {
    name: "imgmin-cli",
    role: "独立作者",
    desc: "图片压缩 CLI（基于 sharp）。支持 WebP / AVIF 现代格式，零配置批量递归处理、并发加速、智能文件名管理，内置 Web UI 拖拽模式，配套单元测试与端到端测试。",
    tech: ["Node.js", "sharp", "WebP", "AVIF", "E2E"],
    link: "https://github.com/MinosIE/imgmin-cli",
  },
  {
    name: "ClipBench",
    role: "独立作者",
    desc: "本地视频处理工具箱（Flask + ffmpeg + SolidJS）。提供去字幕 / 压缩 / 拆分 / 截图 / 转码 / 裁剪 / 合并 / 旋转 / 水印 / 调速 / 音频提取 11 个功能，去字幕支持 inpaint 等 4 种模式；全部本地处理、数据零上传。",
    tech: ["Flask", "ffmpeg", "SolidJS", "跨平台"],
    link: "https://github.com/MinosIE/ClipBench",
  },
  {
    name: "pdf-handle",
    role: "独立作者",
    desc: "本地 PDF 多功能处理工具（Python + Flask + PyMuPDF）。提供压缩 / 转 Word / 提取图片 / 合并 / 拆分 / 提取文字 / 转图片（200 DPI PNG）/ 旋转 8 项能力，纯浏览器界面操作、无需 Node.js；文件本地处理不上传服务器，暂存 2 小时自动清理。",
    tech: ["Python", "Flask", "PyMuPDF", "pdf2docx", "MIT"],
    link: "https://github.com/MinosIE/pdf-handle",
  },
];

export const educations: Education[] = [
  { school: "扬州大学", degree: "本科", major: "软件工程" },
  { school: "南京交通职业技术学院", degree: "专科", major: "计算机网络" },
];
