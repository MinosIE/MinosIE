# 你好，我是坚冰（MinosIE）

> 坐标上海 · 2014 年入坑 GitHub · 全栈工程师（前端为主战场，后端能独立扛）
>
> 偏爱「小而完整」的东西：能在本机跑完的，就不上云；能零依赖的，就不引框架。

---

## 关于我

写了十来年前端的工程师，日常在浏览器、命令行和数据库之间来回横跳。

前端是主战场，但不满足于只做页面：接口、数据模型、部署、CLI 工具、跨端小程序也都在自己手里跑通过。一个需求从界面到落库到上线，我可以一个人闭环。

兴趣点比较固定，基本围绕四条线：

- **前端体验与可视化**：交互、动效、图表、三维，以及这些背后的性能账。
- **全栈交付**：React / Vue 前端 + Node 后端 + MySQL / Redis，需求到上线一条龙。
- **本地优先（Local-first）**：数据和文件不出本机，工具自己跑、自己控，不依赖第三方服务。
- **中文内容的呈现**：中文排版、中文字体体积、中文历史科普——中文互联网的细节值得被认真对待。

---

## 技术栈

### 前端

**框架** Vue 3 · React · Next.js（App Router / SSR）· Solid.js · Quasar

**状态与路由** Vue Router · React Router · MobX · Zustand / ahooks

**UI 与样式** · Ant Design · Ant Design Pro · TDesign · Element Plus · Tailwind CSS · Sass / Less

**可视化与动效** · Three.js · GSAP · Framer Motion · Lenis · Swiper · tsparticles · ECharts / Recharts · Fabric.js · Excalidraw

**构建** · Vite · Webpack · TypeScript · PostCSS

### 后端

**运行时与框架** · Node.js · Express · Fastify

**数据层** · MySQL（mysql2） · TypeORM · Redis（ioredis） · 腾讯云 COS

**工程能力** · REST API 设计 · JWT / Session 认证 · TOTP 两步验证（otplib） · 文件上传（multer） · 参数校验（joi） · 日志（winston） · 验证码 / 二维码

### 跨端与桌面

微信小程序（Taro / uni-app） · 微信云函数 · Tauri 桌面应用 · Chrome 扩展

### 工程化与自动化

pnpm / Turborepo Monorepo · GitHub Actions · GitHub Pages · Jest · Playwright · Puppeteer · ffmpeg · sharp

---

## 精选开源项目

| 项目                                                    | 说明                                                                                                                               |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| [**ClipBench**](https://github.com/MinosIE/ClipBench)   | 本地视频处理工具箱。Solid.js + Vite 前端 + ffmpeg 后端：压缩、去硬字幕、转码、裁剪、合并、水印、调速、音频提取，全程本机运行不上传 |
| [**Zitrange**](https://github.com/MinosIE/Zitrange)     | 中文字体分包 / 子集化。按 unicode-range 把 CJK 字体切成 woff2 分片并生成 `@font-face`，浏览器只下载用到的字                        |
| [**imgmin-cli**](https://github.com/MinosIE/imgmin-cli) | 命令行图片压缩 / 格式转换工具，基于 sharp，支持批量处理                                                                            |
| [**wanwu-hub**](https://github.com/MinosIE/wanwu-hub)   | 万物通识系列静态站 · [在线访问](https://minosie.github.io/wanwu-hub/)                                                              |
| [**pdf-handle**](https://github.com/MinosIE/pdf-handle) | PDF 处理小工具集                                                                                                                   |

以上大多是 MIT 开源，能跑在本地、不依赖后端是它们的共同点。觉得有用的话，欢迎点个 Star ⭐

---

## 全栈与跨端实践

除了上面的开源工具，日常也在做几类完整的业务系统，基本都是 Turborepo / pnpm Monorepo 组织的多端工程：

- **Web 前台 + 管理后台**：Next.js + React + Tailwind / Ant Design，SSR 与 SEO 一起考虑
- **Node API 服务**：Express / Fastify + TypeORM + MySQL + Redis，含鉴权、上传、日志、限流等一整套基础设施
- **小程序端**：Taro（React）与 uni-app（Vue）两条线都落地过，和主站共用 `@shared` 包
- **桌面与工具**：Tauri + Vue 的本地资产管理类应用，以及基于 Puppeteer 的自动化脚本
- **可视化**：Three.js 场景、数据大屏、图表与动效页面

---

## 一些偏好

- 工具能离线跑就离线跑，用户的文件不该被迫上传
- 静态站能不开框架就不开，少一层依赖少一层维护成本
- 前端优化先看真实体积，再谈方案——省下来的 KB 是实打实的
- README 先说清楚「它解决什么问题」，再谈怎么用

---

## 联系我

- GitHub：[@MinosIE](https://github.com/MinosIE)
- 邮箱：待补充（也可以在 Issues 里找到我）

如果你也在做本地优先的工具、中文排版相关的事，或者想聊聊前端工程化与全栈架构，欢迎随时来找我。
