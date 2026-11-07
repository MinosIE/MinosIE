/**
 * resume.ts — 简历数据层（强类型）
 *
 * 设计意图：
 * 1. 简历全部事实的「单一数据源」，页面内容（含派生的 Markdown）都由这里的类型约束驱动。
 * 2. 避免硬编码散落在组件里；改动简历内容只改本文件对应字段。
 *
 * 公开版本约定（本仓库部署在 GitHub Pages，源码与产物均对外可见）：
 * - 不写真实姓名 / 手机号 / 邮箱 / 年龄 / 性别 / 学校名 / 雇主名 / 客户品牌名。
 * - 组织规模与业务规模只做定性或量级描述，避免与公司、客户形成可关联的组合。
 * - 技术栈、技术性能指标、个人开源作品可保留；模糊处理是「降精度」，不新增任何事实。
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

/** 个人信息（公开版只保留展示所需字段，不含任何联系方式与身份信息） */
export interface Profile {
  name: string;
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

/** 教育经历（公开版隐去校名） */
export interface Education {
  school: string;
  degree: string;
  major: string;
}

export const profile: Profile = {
  name: "坚冰",
  experienceYears: 10,
  intention: ["前端全栈", "Agent 开发"],
  city: "上海",
  summary:
    "10 年以上研发经验，覆盖电商 / 金融 / 教育 / 汽车等行业，曾带领前端团队，主导多个项目从 0 到 1 交付。主攻前端：覆盖 PC / H5 / 小程序 / 桌面端 / 浏览器插件及前端工程化；兼顾后端：具备 Node.js 全栈开发能力，熟悉 Redis / 消息队列 / 微服务 / 可观测等后端体系，能基于 Java / Go 承接高并发业务（秒杀扣减、异步削峰、容器化部署）。擅长通过敏捷 / MVP 模式统筹团队，保障项目按时高质量交付，可快速对接跨部门协作。",
};

export const skills: SkillGroup[] = [
  {
    id: "framework",
    title: "框架与工程化",
    level: "master",
    score: 93,
    points: [
      "Vue 3 (Composition API)",
      "React 18 (Hooks)",
      "Module Federation / 微前端 (Qiankun)",
      "Monorepo (pnpm workspace) + CLI 脚手架",
      "Biome 代码规范统一",
      "CI / CD 流水线（灰度发布）",
      "AI 提效：CodeReview / D2C / 类型生成",
    ],
  },
  {
    id: "backend",
    title: "后端 / 全栈",
    level: "familiar",
    score: 84,
    points: [
      "Node.js（Koa / Express）+ Prisma + MySQL",
      "Java（Spring Boot）/ Go（goroutine 高并发）",
      "Redis（缓存 / 分布式锁 / Lua 原子扣减）",
      "Kafka 消息队列（削峰 / 异步落库）",
      "高并发（秒杀限流 / 幂等 / 防超卖）",
      "Spring Cloud 微服务（Nacos / Gateway）+ 分布式事务 Seata / TCC / Saga",
      "架构设计：IOC / SOLID、分层与领域建模、服务边界划分",
    ],
  },
  {
    id: "performance",
    title: "性能优化",
    level: "familiar",
    score: 85,
    points: [
      "前端性能：监控 SDK (LCP / CLS / FID)、CSS GPU 加速、页面加载性能体系",
      "接口与慢查询优化：索引 / 覆盖索引、深分页游标、读写分离",
      "缓存策略：多级缓存、命中率与击穿 / 雪崩防护",
      "JVM / GC 与并发调优、异步化削峰",
    ],
  },
  {
    id: "interaction",
    title: "交互与体验",
    level: "familiar",
    score: 82,
    points: [
      "CSS 动效 / 过渡 / 微交互（滚动叙事、状态反馈）",
      "表单与操作体验：防重复点击、实时校验与余额 / 库存反馈",
      "Canvas / 可视化",
      "编辑体验：推文排版 + 代码高亮一体化（AI 助手插件）",
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
      "Agent 对接后端业务系统（MCP 工具 / API 集成）",
    ],
  },
];

export const experiences: Experience[] = [
  {
    company: "上海某网络技术公司",
    role: "前端主管",
    period: "2022.09 - 至今",
    highlights: [
      "主导多个项目从原生 JS 到 Vue3 + Vite + TypeScript 的架构升级",
      "代码规范从 ESLint 迁移至 Biome，CI 耗时降低 95%",
      "搭建自动化发布流水线，发布时间从 20 分钟降至 2 分钟",
      "沉淀通用业务组件与设计规范，提升跨项目复用",
      "通过图片压缩 + 性能 SDK 将页面 LCP 优化 80%+",
      "带领前端团队，建立技术分享与 CodeReview 机制",
    ],
  },
];

export const projects: Project[] = [
  {
    name: "某车企官网",
    role: "前端开发",
    desc: "接手遗留项目，负责官网车型 / 权益 / 参数展示、预约试驾提交等核心模块的全面改造。",
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
    badges: ["Lighthouse 95", "加载提速 80%", "复用率 90%"],
  },
  {
    name: "社群舆情监控工具",
    role: "独立全栈开发",
    desc: "面向社群运营的舆情监控工具，独立完成前后端设计、开发与部署运维。",
    achievements: [
      "实时消息监控：关键词命中即触发邮件告警，被动巡查转主动预警",
      "页面巡检：无头浏览器定时轮询依赖页面，异常自动告警",
      "工程保障：常驻进程守护、配置与告警持久化、命中去重防刷",
      "业务成效：覆盖大量业务社群，节省大部分日常巡查投入",
    ],
    tech: ["vue3", "vite", "node.js", "pm2", "puppeteer", "chatlog", "prisma"],
    badges: ["多群实时监控", "主动预警"],
  },
  {
    name: "营销活动平台",
    role: "全栈开发",
    desc: "面向多业务线的营销活动平台（抽奖 / 积分秒杀），独立负责前后端，沉淀可复用的「安全扣减 + 最终一致 + 限流降级」能力。",
    achievements: [
      "高并发骨架：Redis + Lua 原子扣减 + 分布式锁 / 乐观锁防超发；限流熔断；本地消息表 + MQ + 死信队列 + 定时对账保证最终一致",
      "概率与一致性：防预测随机数、概率合计校验、并发抢同一奖品加锁；热点缓存防雪崩",
      "外部积分对接：以兑换单号幂等预扣冻结 → 确认 / 回滚，双重防超扣；超时按单号查状态而非盲重试",
      "前端交互：防重复点击 + 实时余额 / 库存反馈；CDN 抗峰值；签名 / 防重放 / 数据权限校验",
    ],
    tech: [
      "vue3",
      "vite",
      "typescript",
      "h5",
      "java",
      "spring boot",
      "redis",
      "mysql",
      "mybatis",
      "kafka",
      "sentinel",
      "nginx",
    ],
    badges: ["Redis + Lua 原子扣减", "最终一致对账兜底"],
  },
  {
    name: "中后台管理系统（RBAC 权限 + 复杂业务）",
    role: "全栈开发",
    desc: "运营 / 管理后台（全栈）：前端 + 按域拆分的微服务；重点在权限正确性、数据隔离、查询性能与分布式事务一致性。",
    achievements: [
      "RBAC 四层权限模型（用户-角色-权限-菜单）+ 接口级鉴权 + 按钮级权限；数据权限按组织 / 角色行级过滤",
      "微服务：注册 / 配置中心、网关统一鉴权限流、服务调用、Seata 分布式事务、链路追踪",
      "复杂查询性能：多表动态 SQL、复合 / 覆盖索引、深分页游标、分库分表 + 读写分离；事务传播与最终一致",
      "安全与导出：越权 / XSS / SQL 注入防护 + 审计留痕；异步导出防 OOM 与幂等限流",
    ],
    tech: [
      "vue3",
      "vite",
      "typescript",
      "element plus",
      "java",
      "spring boot",
      "spring cloud",
      "spring security",
      "mybatis",
      "mysql",
      "redis",
      "kafka",
      "easyexcel",
      "nacos",
      "gateway",
      "openfeign",
      "seata",
      "skywalking",
    ],
    badges: ["RBAC 权限模型", "微服务 / 分布式事务"],
  },
  {
    name: "AI 助手浏览器插件",
    role: "前端开发",
    desc: "团队统一接入大模型能力，通过浏览器插件分发给内容团队，并扩展图文内容编辑能力。",
    achievements: [
      "插件基建：Vue 3 + TypeScript + @crxjs/vite-plugin，集成多模型对话与 Prompt 模板库",
      "图文编辑：内置代码高亮，AI 写作与排版一体化",
      "MCP 升级：演进为 MCP Client，经 SSE 连接多个业务 MCP Server",
      "业务成效：服务内容团队，AI 辅助日常写作，单篇编辑耗时大幅缩短",
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
    badges: ["MCP Client", "多模型对话"],
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
      "研发提效：自研 CLI 脚手架，以一行命令拉起符合规范的项目（规范配置 + Git Hooks + 接口封装 + 组件库）",
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
    name: "MCP 平台与 AI 服务端集成",
    role: "AI 能力建设者",
    desc: "把 AI 从「单点问答」扩展为「能调用真实业务能力」的服务端集成，用 MCP 打通多个业务系统并保证数据不出域。",
    achievements: [
      "架构升级：插件端演进为 MCP Client，经 SSE 长连接多个业务 MCP Server",
      "工具封装：将多套业务接口（客户 / 指标 / 流程）封装为 MCP 工具",
      "检索增强：RAG 知识库结合本地 LLM 部署，敏感数据不出域",
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
    badges: ["多个 MCP Server", "数据不出域"],
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
  { school: "某本科院校", degree: "本科", major: "软件工程" },
  { school: "某专科院校", degree: "专科", major: "计算机网络" },
];
