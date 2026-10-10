# AGENTS.md

> 面向 AI Agent 的项目开发指南。最后更新：2026-10-09 · 适用分支：`main`
> 维护约定：改动架构 / 数据字段 / 部署配置后，必须同步更新本文件对应小节。
> 本文件无框架托管区块（非 Next.js 项目），可自由编辑。

---

## 0. 快速上手（30 秒版）

- **项目一句话**：MinosIE（坚冰）的 GitHub 个人主页仓库，正文是一份「会动的简历」——深色屏上左侧逐字打出 CSS，右侧先逐字写出 Markdown 简历源码、再渲染成 HTML 并注入样式完成美化，纯静态单页，部署在 GitHub Pages。
- **技术栈**：Vue 3.4.38 · TypeScript 5.5.4 · Vite 5.4.3 · @vitejs/plugin-vue 5.1.3 · prismjs 1.29（css 语法）+ 自研 Markdown 解析器。
- **命令**（均来自 `package.json`）：

  ```bash
  npm install        # 装依赖
  npm run dev        # 本地开发
  npm run build      # vue-tsc --noEmit && vite build（CI 与本地校验都用它）
  npm run preview    # 预览 dist
  npx vue-tsc --noEmit   # 单独类型检查（无 typecheck 脚本，别臆造）
  ```

- **改代码前必读**：→ [第 3 节 AI Agent 开发指导](#3-ai-agent-开发指导-)

---

## 1. 项目全局认知

### 1.1 定位

单页静态站点，无路由、无后端、无状态管理、无 UI 组件库。产物就是 `index.html` + 一份 JS + 一份 CSS。一切围绕「打字动画 + 简历呈现」这一个目标，任何引入多页面 / SSR / 组件库的改动都属于过度设计。

### 1.2 目录地图

```
MinosIE/
├── index.html                  # 唯一 HTML 入口；<title> 写死「你好，我是坚冰（MinosIE）」
├── vite.config.ts              # 仅 plugin-vue + base: '/MinosIE/'（Pages 子路径必需）
├── tsconfig.json / .node.json  # strict + noUnusedLocals/Parameters/ImplicitReturns
├── .github/workflows/deploy.yml# Pages 流水线：npm ci → build → upload-pages-artifact
├── .gitignore                  # 忽略 node_modules / dist / .vite / .env* / .DS_Store
├── README.md                   # 对外个人介绍（GitHub profile 展示）
└── src/
    ├── main.ts                 # createApp(App).mount('#app')，仅此 4 行
    ├── App.vue                 # 只挂载 <AnimatedResume />，无 props / 无事件
    ├── env.d.ts                # vite/client 类型 + *.vue 模块声明（勿删）
    ├── pages/AnimatedResume.vue# ★ 全部逻辑：动画引擎 + 三段 CSS + 页面样式
    ├── data/resume.ts          # ★ 简历事实源头（强类型，含所有导出数据）
    ├── data/resumeSource.ts    # 由 resume.ts 派生 Markdown 正文
    └── utils/markdown.ts       # 自研 Markdown 解析/渲染 + Prism CSS 行高亮
```

### 1.3 分层与数据流

```
resume.ts（事实数据源，强类型 Profile/SkillGroup/Project...）
      │  import
      ▼
resumeSource.ts  buildResumeMarkdown() → resumeMarkdown
      │  resumeMarkdown  （frontmatter + 正文 Markdown）
      ▼
AnimatedResume.vue
      ├── stripFrontmatter()        → fullMarkdown
      ├── compile(fullMarkdown).html → renderedHtml（最终静态 HTML，来自 markdown.ts）
      └── phases[] 打字队列（见下）

播放时序：
SEG0 CSS → Markdown 全文 → SEG1 CSS → 切 HTML 渲染 → SEG2 CSS → 定稿
 style      md               style      html(空串)      style
```

`phases: Phase[]` 定义在 `AnimatedResume.vue:297`，`kind` 为 `'style' | 'md' | 'html'`，由单个 `requestAnimationFrame` 循环（`frame()`）按字符推进；`style` 阶段每完成一个顶层规则块就 `flushBlock()` 追加一个独立 `<style>` 节点。

### 1.4 核心模块职责

| 模块 | 路径 | 负责 | 不负责 |
|---|---|---|---|
| 入口 | `src/main.ts` | 挂载 Vue 应用 | 任何业务逻辑 |
| 根组件 | `src/App.vue` | 挂载 `AnimatedResume` | 布局、路由、事件编排 |
| 动画引擎 | `src/pages/AnimatedResume.vue` | 打字队列、节奏控制、CSS 增量注入、工具栏（跳过 / 重播） | 简历内容本身、Markdown 语法解析 |
| 数据层 | `src/data/resume.ts` | 简历全部事实与类型定义 | 渲染、动画、样式 |
| 派生层 | `src/data/resumeSource.ts` | 把结构化数据拼成 Markdown | 决定页面视觉与语法支持范围 |
| Markdown | `src/utils/markdown.ts` | 自研解析 / 渲染 / 行内样式、Prism 行高亮 | 动画、数据获取 |

### 1.5 关键设计原则（可验证）

1. **单一数据源**：简历内容只写在 `resume.ts`，页面文案由它派生，禁止在组件里散落硬编码。
2. **样式作用域化**：注入的 CSS 一律用 `.anim-app` / `.anim-resume` / `.styleEditor` 前缀限定，避免污染全局。
3. **零 Markdown 依赖**：`utils/markdown.ts` 是手写的，只覆盖简历用得到的语法（标题、段落、列表、引用、代码块、表格、行内 code、hr、图片链接），新增语法要自己实现，不要顺手装 markdown-it。
4. **强制动画**：页面刻意*不*响应 `prefers-reduced-motion`，始终播放打字（与原版 jirengu 一致），用户用「跳过」中断。
5. **构建即校验**：`npm run build` 内含 `vue-tsc --noEmit`，类型与未使用变量错误会直接让 CI 红。

---

## 2. 开发规则

### 2.1 代码组织

- 页面（`pages/`）承载交互与视图；`data/` 只放纯数据；`utils/` 只放无副作用的纯函数。
- 新增派生内容（如新的 Markdown 板块）写在 `data/resumeSource.ts`，不要在组件里拼字符串。

### 2.2 命名

- 组件文件 PascalCase（`AnimatedResume.vue`）；工具 / 数据文件 camelCase（`resumeSource.ts`）。
- 常量全大写下划线（`SEG0`、`SEG1`、`SEG2`）；类型 PascalCase（`Profile`、`SkillGroup`）。
- CSS 类名沿用既有风格：小写驼峰或短横线均可，但必须与 `.anim-app` / `.anim-resume` 前缀体系共存。

### 2.3 单文件结构（`AnimatedResume.vue` 既定顺序，勿打乱）

```
<script setup lang="ts">   // 引擎 → 状态 → 工具函数 → 生命周期
<template>                 // 左 styleEditor / 右 resumeEditor / toolbar
<style scoped>             // 页面框架、光标、工具栏
<style>                    // 非 scoped：仅保留 .anim-app 初始白底规则
```

### 2.4 API / 数据模型规范

- 所有简历类型集中在 `src/data/resume.ts`，修改字段必须同步更新 `buildResumeMarkdown()` 的拼接逻辑。
- 渲染远端 / 用户内容必须走 `markdown.ts` 的 `escapeHtml()`，`v-html` 的入参只能是本地编译产物。

### 2.5 错误处理与日志

- 项目无全局错误兜底、无运行时日志：不要引入 log 库，也不要为「可能的异常」加 try/catch，保持现状。
- 出错优先在浏览器控制台核对 DOM 注入节点（`.anim-app` 下的动态 `<style>`）。

### 2.6 测试要求

- 无测试框架、无 lint。**必跑的唯一校验**是 `npm run build`（含类型检查）。提交前必须本地跑通。

---

## 3. AI Agent 开发指导 ★最高优先级★

### 3.1 改动前必须确认

- [ ] 这次改的是**内容**（→ `data/resume.ts`）、**动画**（→ `AnimatedResume.vue`）、还是**部署**（→ `vite.config.ts` / workflow）？三者改动面完全不同。
- [ ] 是否触碰 Markdown 语法？（→ 需同时改 `utils/markdown.ts` 的解析与渲染，两处缺一不可）
- [ ] 是否新增 / 删除了导出或变量？（→ `noUnusedLocals` 会直接让构建失败）

### 3.2 禁止随意修改的文件

| 文件 / 片段 | 原因 |
|---|---|
| `package-lock.json` | CI 用 `npm ci`，锁文件与 `package.json` 不一致会直接安装失败 |
| `dist/`、`.vite/` | 构建产物，已被 `.gitignore` 排除 |
| `vite.config.ts` 的 `base: '/MinosIE/'` | 站点在 `https://minosie.github.io/MinosIE/` 子路径下，去掉后所有资源 404 |
| `.github/workflows/deploy.yml` 的 `permissions` / `concurrency` | Pages 上传依赖 `pages: write` + `id-token: write`；去赛道会导致并发部署互相覆盖 |
| `src/env.d.ts` | `*.vue` 模块声明缺失会让所有 SFC 导入报类型错 |
| `markdown.ts` 的 `escapeHtml` | 唯一的 XSS 防线，`v-html` 依赖它 |

### 3.3 强依赖关系（改动联动表）

| 改什么 | 必须同步改 | 漏了的后果 |
|---|---|---|
| 简历内容（姓名 / 公司 / 项目 / 技能） | `data/resume.ts` → `data/resumeSource.ts` 拼接逻辑（共 2 处） | 页面不显示新内容，或排版错乱 |
| 姓名 | `resume.ts` profile.name + `resumeSource.ts:68` 硬编码 `'# 王玉兴'` + `AnimatedResume.vue` SEG0 开场白 + `index.html` `<title>`（共 4 处） | 名字前后不一致 |
| 简历分区（`# 个人简介` 等一级 / 二级标题）增删或换序 | `AnimatedResume.vue` SEG2 里 `h2:nth-of-type(n)` 的主题色与 emoji 图标（共 n 处） | 分区配色与图标错位到别的标题上 |
| Markdown 语法支持 | `utils/markdown.ts` 的 `parseMarkdown`（块级）+ `parseInline`/`renderInline`（行内）+ `renderBlocks`（共 3 处） | 打字阶段不报错但最终 HTML 缺内容 |
| 主题配色 | SEG2 内 `.anim-resume` 的 CSS 变量 + SEG0 内 `.anim-app` 的 `--bg`/`--fg`（共 2 处） | 动画背景与最终态不同色 |
| 左右双栏布局 / 断点 | SEG2 末尾 `@media (max-width: 760px)`（窄屏改为上下堆叠、左右 `position: static`），与 SEG0 里 `.styleEditor` / `.resumeEditor` 的 `position: fixed` + `vw` 宽（共 2 处） | 手机端双栏挤成一团、3D 倾斜不撤销 |
| 组件 props / 事件增删 | `App.vue` 的挂载处（`emit`/props 必须与之一致） | TS strict 下直接构建失败 |

> 历史实例：移除 `AnimatedResume.vue` 的 `defineEmits` 后，必须同时删掉 `App.vue` 里的 `@back="onBack"` 与 `onBack` 函数，否则 `noUnusedLocals` 让 `npm run build` 红。

### 3.4 常见错误模式

| 现象 | 根因 | 正确做法 |
|---|---|---|
| Pages 页面白屏，控制台报 `/assets/...` 404 | 动过 `vite.config.ts` 的 `base` | 保持 `base: '/MinosIE/'` |
| workflow 全绿但站点没更新 | 仓库 Settings → Pages → Source 不是 **GitHub Actions** | 在仓库设置里改成 GitHub Actions（首次需人工操作一次） |
| `npm run build` 报 unused variable | strict 的 `noUnusedLocals`/`noUnusedParameters` | 删干净残余变量与 import，而不是加 `@ts-ignore` |
| 改了 `resume.ts` 页面没变化 | 漏改 `resumeSource.ts` 的拼接（派生链路未覆盖该字段） | 走 `resumeSource.ts` 的 `buildResumeMarkdown()` 出口 |
| 表格 / 行内 code 显示成纯文本 | `markdown.ts` 解析与渲染两处只改了一处 | 解析（`parse*`）与渲染（`render*`）成对修改 |

### 3.5 推荐开发流程

1. 判断改动面：内容 / 动画 / 部署（见 3.1）。
2. 按 3.3 联动表列出全部待改文件（**先在脑子里过一遍 N 处**）。
3. 改代码，遵守 2.3 的单文件结构顺序。
4. `npm run build` 必须本地跑通。
5. `npm run dev` 眼过一遍：播放动画 → 点「跳过」→ 点「↻ 重播」两条路径都要正常。
6. 提交（commit 风格沿用仓库既有前缀：`docs:` / `chore:` / `feat:` / `fix:`）。

### 3.6 Debug 排查顺序

1. `npm run build` → 先排除类型 / 未使用变量。
2. 看控制台 DOM：`.anim-app` 下应有随打字递增的 `<style>` 节点；没有说明 `flushBlock()` 链路断了。
3. 内容是空的 → 往上查：`renderedHtml`（`compile`）→ `fullMarkdown` → `resumeMarkdown`（`resumeSource.ts`）→ `resume.ts`。
4. 打字在错误位置卡住 → 看 `phases[]` 的 `kind` 与 `advance()` / `delayFor()` 的节奏参数。
5. 样式不生效 → 检查是否被 `.anim-app` / `.anim-resume` 前缀要求挡住，或被非 scoped `<style>` 的白底规则覆盖。

### 3.7 回归清单（每次改完必过）

- [ ] `npm run build` 通过
- [ ] 首次加载动画完整播放到定稿
- [ ] 「跳过」能直达最终态
- [ ] 「↻ 重播」能原地重新播放，且**不刷新页面**（`replay()` 内部重置状态，不是 `location.reload()`）
- [ ] 注入的 CSS 未污染 `<body>` 全局样式

---

## 4. 文档索引

| 文档 | 路径 | 用途 | 重要度 | 何时查看 |
|---|---|---|---|---|
| 个人介绍 | `README.md` | 对外 profile 文案 | 🟡 | 改对外口径时 |
| 部署流水线 | `.github/workflows/deploy.yml` | Pages 构建发布流程 | 🔴 | 动 CI / 发布失败时 |
| 构建配置 | `vite.config.ts` | base 路径与插件 | 🔴 | 改资源路径 / 加 Vite 插件时 |
| 数据字典 | `src/data/resume.ts` | 简历全部字段与类型 | 🔴 | 改简历内容前 |
| 派生规则 | `src/data/resumeSource.ts` | 数据 → Markdown 拼接 | 🔴 | 内容改了页面没变时 |
| Markdown 引擎 | `src/utils/markdown.ts` | 自研解析 / 渲染与导出函数 | 🟡 | 加语法 / 渲染异常时 |
| 引擎说明 | `src/pages/AnimatedResume.vue` 文件头注释（1–24 行） | 动画设计意图与 Twelve Principles 取舍 | 🟡 | 调动画节奏前 |

> 注：`src/data/resume.ts` 头部注释提到的 `docs/王玉兴-前端工程师.docx` 与 `Agent.md` 在本仓库**并不存在**，按本文件执行即可。

---

## 5. 当前项目状态

### 5.1 已完成

- 动画简历单页：打字 → CSS 注入 → Markdown → HTML 渲染 → 定稿，全链路完成
- 工具栏：播放中「跳过」/ 结束「↻ 重播」（原地重置，非 reload）
- `.gitignore` 与 GitHub Pages 部署流水线（`.github/workflows/deploy.yml`）

### 5.2 开发中 / 未完成

- 简历数据与「坚冰 MinosIE」身份口径尚未统一（见 5.4）

### 5.3 技术债务

| 位置 | 问题 | 影响 |
|---|---|---|
| `src/data/resume.ts` | `sections`、`metrics`、`codeDemos`、`architectures` 四个导出**无任何消费方**（自 `aboutMe` 同类项目带入） | 死代码；`noUnusedLocals` 只管局部变量，导出不受约束，故不报错 |
| `src/data/resumeSource.ts` | `# 王玉兴`（68 行）与 `role: 前端工程师 / 前端主管`（16 行）为硬编码，未从 `profile` 派生 | 违反单一数据源原则，改名需多处找 |
| `src/data/resume.ts` 头注释 | 指向不存在的 docx 与 `Agent.md` | 误导 Agent（本文件已写明） |
| 全局 | 无 lint、无测试、无 CI 质量关卡 | 只有 `npm run build` 一道防线 |

### 5.4 已知问题

1. **身份不一致**：`README.md` 与 `index.html` 是「坚冰 / MinosIE」，而 `resume.ts` 的 `profile.name` 为「王玉兴」、`experienceYears: 16`，SEG0 开场白也写死「大家好，我是王玉兴」。**对外发布前必须统一口径**，否则简历与主页不是一个身份。
2. **`prefers-reduced-motion` 未响应**：有意为之（与原版一致），但无障碍诉求下属于已知取舍。

---

## 6. 变更记录（本文件）

- 2026-10-09：初版生成。基于 `index.html`、`package.json`、`vite.config.ts`、`tsconfig*.json`、`.github/workflows/deploy.yml`、`src/**` 实际代码取证；同步记录 5.3 / 5.4 中发现的未消费导出与身份口径不一致问题。
