<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, nextTick } from 'vue'
import Prism from 'prismjs'
import 'prismjs/components/prism-css'
import { compile } from '../utils/markdown'
import { resumeMarkdown, injectResumeMailto } from '../data/resumeSource'

/**
 * 动画简历：忠实复刻 jirengu「会动的简历」（github.com/jirengu-inc/animating-resume）
 * —— 深色背景上，左侧一块 3D 倾斜的代码编辑器逐字「打」出简历的 CSS（Prism 语法高亮），
 * 右侧先逐字显示 Markdown，到节点后实时渲染成排版良好的 HTML，最终定稿。
 * 内容取自 resumeSource（与简历事实口径一致）。
 * 注意：本页刻意不受 prefers-reduced-motion 影响、始终播放打字动画（与原版一致），
 * 用户可随时点「跳过」。
 *
 * 动画改进（迪士尼十二原则取向）：
 *  - Timing/Slow-In-Out：用 requestAnimationFrame 时间累积驱动，按字符类型变速
 *    （标点/换行略停、空格快），节奏更从容、可读；
 *  - 高亮拆分：已完成行高亮缓存 + 当前行单独渲染，消除每字重解析整段高亮的 O(n²)；
 *  - 样式增量注入：按顶层规则块追加为独立 <style>，浏览器只解析新增块，不再随文档变长整表重解析；
 *  - 仅顶层块闭合时停顿（嵌套 } 不再触发），避免 SEG2 里成片静止；
 *  - Anticipation/Follow-Through：开场预备停顿、段落间呼吸、定稿 slow-out 收尾；
 *  - Appeal：光标加入轻微呼吸（scale）动效。
 */
/** 去掉 frontmatter，只保留真正的简历正文 */
function stripFrontmatter(md: string): string {
  const m = md.match(/^---\n[\s\S]*?\n---\n?/)
  const body = m ? md.slice(m[0].length) : md
  return body.replace(/^\n+/, '')
}

const fullMarkdown = stripFrontmatter(resumeMarkdown)

/** 三段 CSS：基础(含开场白+高亮配色) → 注释 → 简历美化（均用 .anim-resume 前缀作用域） */
const SEG0 = `/*
* 大家好，我是坚冰
* 资深前端工程师 · 前端工程化 / AI 工具链
* 受 jirengu「会动的简历」启发，我也来写一份会动的简历
*/

/* 先用 CSS 变量统一管理配色与尺寸，整体换肤只需改这一处 */
:root {
  --bg: #002b36;
  --fg: #dedede;
  --side: 2.5vh;
  --speed: 1s;
  --tok-selector: #859900;
  --tok-property: #bb8900;
  --tok-function: #2aa198;
  --tok-comment: #6a9955;
}

/* 给所有元素加上属性过渡，让逐条注入的样式平滑落位 */
.anim-app * {
  transition: all var(--speed);
}

/* 白色背景太单调了，我们来点背景 */
.anim-app {
  color: var(--fg); background: var(--bg);
}

/* 文字离边框太近了 */
.styleEditor {
  padding: .5em;
  border: 1px solid;
  margin: .5em;
  overflow: auto;
  box-sizing: border-box;
  width: 45vw; height: calc(100vh - var(--side) * 2);
}

/* 代码高亮（用 & 嵌套选择符，纯原生 CSS 写法） */
.token {
  &.selector { color: var(--tok-selector); }
  &.property { color: var(--tok-property); }
  &.punctuation { color: yellow; }
  &.function { color: var(--tok-function); }
  &.comment { color: var(--tok-comment); font-style: italic; }
}

/* 加点 3D 效果呗 */
.anim-app {
  perspective: 1000px;
}
.styleEditor {
  position: fixed; left: var(--side); top: var(--side);
  margin: 0;
  -webkit-transition: transform var(--speed) ease;
  transition: transform var(--speed) ease;
  -webkit-transform: rotateY(10deg) translateZ(-100px) ;
          transform: rotateY(10deg) translateZ(-100px) ;
}

/* 接下来我给自己准备一个编辑器 */
.resumeEditor {
  position: fixed; right: var(--side); top: var(--side);
  margin: 0;
  padding: .5em;
  box-sizing: border-box;
  width: 48vw; height: calc(100vh - var(--side) * 2);
  border: 1px solid;
  background: white; color: #222;
  overflow: auto;
}

/* 好了，我开始写简历了 */
`
const SEG1 = `/* 这份简历现在是 Markdown 格式
 * 对 HR 不太友好，我把它翻译成漂亮的 HTML
 */
`
const SEG2 = `/* 再给 HTML 加点样式 —— 变量 · 嵌套 · calc · 颜色函数，让简历更有生命力 */
.resumeEditor {
  padding: 2.2em 2em;
}
.anim-resume {
  /* 主题色变量：一处定义、处处复用，方便整体换肤 */
  --brand: #0984e3;
  --green: #00b894;
  --purple: #6c5ce7;
  --orange: #e17055;
  --pink: #e84393;
  --teal: #00cec9;
  /* 颜色函数：由主色派生「加深文字色」与「半透明底色」 */
  --brand-deep: color-mix(in srgb, var(--brand), #000 18%);
  --brand-soft: color-mix(in srgb, var(--brand) 12%, transparent);
  /* 简单计算：统一图标与文字的间距 */
  --icon-gap: calc(.45em + 1px);

  font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #2d3436;
  line-height: 1.75;
  font-size: 15px;

  /* 分区标题（h2）：彩色左边框 + 浅色渐变底 + emoji 小图标 */
  h2 {
    display: flex;
    align-items: center;
    gap: var(--icon-gap);
    border: 0;
    border-left: 5px solid var(--brand);
    padding: calc(.28em + 1px) calc(.6em + 1px);
    margin: 1.5em 0 .7em;
    background: linear-gradient(90deg, var(--brand-soft), transparent);
    border-radius: 0 8px 8px 0;
    font-size: 1.25em;

    /* 姓名（第一个 h2）：覆盖上面的通用样式，大字号 + 主色强调 */
    &:first-of-type {
      font-size: calc(2em + 1px);
      margin: 0 0 .15em;
      color: var(--brand);
      letter-spacing: .5px;
      display: block;
      border-left: 0;
      padding: 0;
      background: none;
      /* 姓名标题内的邮箱链接：明显小于姓名，并弱化区分 */
      a {
        font-size: .42em;
        font-weight: 500;
        letter-spacing: 0;
        color: var(--brand-deep);
        opacity: .85;
        vertical-align: middle;
        margin-left: .4em;
        text-decoration: underline;
        text-underline-offset: .2em;
      }
      /* 姓名标题内的学历（em）：明显小于姓名，弱化区分 */
      em {
        font-size: .55em;
        font-style: normal;
        font-weight: 500;
        letter-spacing: 0;
        color: var(--brand-deep);
        opacity: .9;
        vertical-align: middle;
      }
    }
    /* 依次为各分区配主题色与图标（文字色由颜色函数自动加深） */
    &:nth-of-type(2) { border-left-color: var(--green); color: color-mix(in srgb, var(--green), #000 20%); }
    &:nth-of-type(2)::before { content: '📝'; }
    &:nth-of-type(3) { border-left-color: var(--purple); color: color-mix(in srgb, var(--purple), #000 20%); }
    &:nth-of-type(3)::before { content: '🛠️'; }
    &:nth-of-type(4) { border-left-color: var(--orange); color: color-mix(in srgb, var(--orange), #000 20%); }
    &:nth-of-type(4)::before { content: '💼'; }
    &:nth-of-type(5) { border-left-color: var(--brand); color: var(--brand-deep); }
    &:nth-of-type(5)::before { content: '🚀'; }
    &:nth-of-type(6) { border-left-color: var(--pink); color: color-mix(in srgb, var(--pink), #000 20%); }
    &:nth-of-type(6)::before { content: '🌟'; }
    &:nth-of-type(7) { border-left-color: var(--teal); color: color-mix(in srgb, var(--teal), #000 20%); }
    &:nth-of-type(7)::before { content: '🎓'; }
  }

  /* 项目 / 经历子标题（h3）：主色 + 箭头图标 */
  h3 {
    display: flex;
    align-items: center;
    gap: .35em;
    margin: 1.1em 0 .5em;
    font-size: 1.06em;
    color: #2d3436;
  }
  h3::before { content: '▸'; color: var(--brand); font-weight: 700; }

  /* 列表：彩色圆点 + 舒适间距（间距用 calc 统一） */
  ul, ol {
    list-style: none;
    padding-left: 0;
  }
  ul > li {
    position: relative;
    padding-left: calc(1.4em + 2px);
    margin: .35em 0;
  }
  ul > li::before {
    content: '●';
    position: absolute;
    left: 0;
    color: var(--green);
    font-size: .8em;
    top: .2em;
  }
  ol { counter-reset: section; }
  ol li {
    position: relative;
    padding-left: calc(1.6em + 2px);
    margin: .35em 0;
  }
  ol li::before {
    counter-increment: section;
    content: counters(section, ".");
    position: absolute;
    left: 0;
    color: var(--brand);
    font-weight: 700;
  }

  /* 引用块：彩色左边框 + 颜色函数派生的浅紫底 */
  blockquote {
    margin: 1em 0;
    padding: .6em 1em;
    border-left: 4px solid var(--purple);
    background: color-mix(in srgb, var(--purple) 8%, transparent);
    border-radius: 0 8px 8px 0;
    color: #4b4b4b;
  }

  /* 链接：主色 + 小箭头图标 */
  a {
    color: var(--brand);
    text-decoration: none;
    border-bottom: 1px dashed var(--brand);
  }
  a::after { content: ' ↗'; font-size: .85em; opacity: .7; }

  /* 开源项目名上的 GitHub 图标：仅作图标跳转，去掉下划线与 ↗；行内 flex 让图标与文案垂直居中 */
  .gh-link { display: inline-flex; align-items: center; border-bottom: 0; }
  .gh-link::after { content: none; }
  .gh-icon { width: 1.1em; height: 1.1em; }

  /* 行内 code / 技术栈标签：变量驱动的彩色药丸 */
  code {
    background: var(--brand-soft);
    color: var(--brand-deep);
    padding: 2px 8px;
    border-radius: 999px;
    font-size: .88em;
    font-family: 'SFMono-Regular', Consolas, monospace;
  }

  /* 表格：变量拼出的渐变表头 + 斑马纹 + 圆角阴影 */
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
    font-size: .92em;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,.08);
  }
  th, td {
    border: 1px solid #e6e9ed;
    padding: .5em .7em;
    text-align: left;
  }
  th {
    background: linear-gradient(90deg, var(--brand), var(--green));
    color: #fff;
    font-weight: 600;
  }
  tbody tr:nth-child(even) { background: #f7fafc; }

  strong { color: var(--orange); }
}

/* 移动端：上下堆叠，呼应原版 Mobile.vue */
@media (max-width: 760px) {
  .styleEditor {
    position: static; width: auto; height: 42vh;
    transform: none;
  }
  .resumeEditor {
    position: static; width: auto; height: 52vh; margin: .5em;
  }
  .anim-app {
    perspective: none;
  }
}

/* ✨ 动画完成 · 简历呈现完毕
 * 左侧代码逐字生成，右侧简历实时渲染并美化。
 * 感谢观看，欢迎交流～ */
`

type Phase = { kind: 'style' | 'md' | 'html'; text: string }
const phases: Phase[] = [
  { kind: 'style', text: SEG0 },
  { kind: 'md', text: fullMarkdown },
  { kind: 'style', text: SEG1 },
  { kind: 'html', text: '' },
  { kind: 'style', text: SEG2 },
]

// 右侧实时渲染：随 Markdown 逐字打出，增量编译成 HTML（不再显示原始源码）。
// 打字阶段在末尾追加光标；SEG2 阶段注入的 CSS 会同步让这份简历变美。
const liveHtml = computed(() => {
  const html = injectResumeMailto(compile(currentMarkdown.value).html)
  return playing.value && activePane.value === 'md'
    ? `${html}<span class="cursor dark"></span>`
    : html
})

const currentMarkdown = ref('')
const highlightedStyle = ref('') // 增量高亮结果（已完成行缓存 + 当前行实时高亮）
const playing = ref(true)
const done = ref(false)
const activePane = ref<'style' | 'md'>('style')

const stylePane = ref<HTMLElement | null>(null)
const resumePane = ref<HTMLElement | null>(null)

// 增量高亮内部状态：
//  展示：已完成行高亮缓存（hlPrefix）与正在输入的当前行（highlightedCurrent）
//  拆成两段 —— 逐字高亮只重渲染体积很小的当前行，避免每字重解析整段高亮（O(n²)）
let hlPrefix = ''
let hlLastRaw = ''
//  增量注入：顶层规则块累积到独立 <style> 节点，浏览器只解析新增块，不再整表重解析
let topDepth = 0       // 顶层 { } 配平（CSS 内无字符串含 {}，可安全全局计数）
let blockRaw = ''      // 当前顶层块原始文本（含选择器）
let pending = ''       // 顶层、块外累积的文本（选择器前缀 / 顶层注释），遇到 { 时并入 blockRaw
let blockOpen = false  // 是否处于某个顶层块内
let blockJustClosed = false
let styleNodes: HTMLStyleElement[] = []

const highlightedCurrent = ref('')

/** 把一整块顶层规则追加为独立 <style> 节点（仅解析该块，避免整表重解析） */
function flushBlock(raw: string) {
  const node = document.createElement('style')
  node.setAttribute('data-anim-resume', '')
  node.textContent = raw
  document.head.appendChild(node)
  styleNodes.push(node)
}

/** 清空所有动画注入的样式节点 */
function clearStyleNodes() {
  for (const n of styleNodes) n.remove()
  styleNodes = []
}

/** 跳过 / 收尾：一次性注入完整 CSS（覆盖增量节点，保证最终态完整） */
function applyFullStyle() {
  clearStyleNodes()
  const node = document.createElement('style')
  node.setAttribute('data-anim-resume', '')
  node.textContent = SEG0 + SEG1 + SEG2
  document.head.appendChild(node)
  styleNodes = [node]
}

/** 迪士尼式节奏：按字符类型变速，制造缓入缓出与可读停顿 */
function delayFor(ch: string): number {
  if (ch === '\n') return 110 // 段落呼吸
  if ('，。、；：！？.,;:!?'.includes(ch)) return 75 // 标点稍停
  if (ch === ' ') return 28 // 空格快
  if ('{}();'.includes(ch)) return 40 // 语法符号略快
  return 55 // 普通字符（原下限 18ms 过快，现 55ms 起步更从容）
}

// —— RAF 时间累积驱动：天然对齐帧率，主线程繁忙也不掉节奏 ——
let rafId = 0
let acc = 0
let lastTs = 0
let delay = 650 // 开场预备（Anticipation）
let blockPause = 0 // 规则块结束（}）后的一次性停顿，让过渡动画播完

let phaseIdx = 0
let charIdx = 0

function appendStyle(ch: string) {
  const opening = ch === '{'
  const closing = ch === '}'
  if (opening) topDepth++
  else if (closing && topDepth > 0) topDepth--

  // 字符落入「当前顶层块」或「块外待定区」；块外待定区会在遇到 { 时并入块
  if (blockOpen) blockRaw += ch
  else pending += ch

  // 新的顶层块开始：把此前待定区累积的选择器前缀（含注释）整体并入，避免漏掉 :root 等选择器
  if (opening && topDepth === 1) {
    blockRaw = pending
    pending = ''
    blockOpen = true
  }

  if (ch === '\n') {
    if (hlLastRaw.length) {
      // 每行定稿后补一个 \n，确保下一行立即另起一行
      hlPrefix += Prism.highlight(hlLastRaw, Prism.languages.css, 'css') + '\n'
      hlLastRaw = ''
    } else {
      hlPrefix += '\n' // 保留空行
    }
    // 仅顶层块写完后停顿，等 transition 过渡播完；嵌套 } 不再触发，避免 SEG2 里成片静止
    if (blockJustClosed) {
      blockPause = 1000
      blockJustClosed = false
    }
    highlightedStyle.value = hlPrefix // 已完成行缓存，行尾才整体刷新
    highlightedCurrent.value = '' // 当前行已并入缓存，清空避免与缓存短暂重复（闪一下）
  } else {
    hlLastRaw += ch
    // 仅高亮+重渲染「当前正在输入」的这一行（体积小），避免每字重解析整段高亮
    highlightedCurrent.value = Prism.highlight(hlLastRaw, Prism.languages.css, 'css')
    // 顶层块收尾：把整块追加为独立 <style>，浏览器只解析新增块，不再整表重解析
    if (closing && topDepth === 0 && blockOpen) {
      flushBlock(blockRaw)
      blockRaw = ''
      blockOpen = false
      blockJustClosed = true
    }
  }
}

function scrollIfNeeded(_ch: string) {
  // 每次输入都跟随滚动到底，保证最新打出的内容始终可见
  scrollActive()
}

function scrollActive() {
  const el = activePane.value === 'style' ? stylePane.value : resumePane.value
  if (el) el.scrollTop = el.scrollHeight
}

function advance() {
  if (phaseIdx >= phases.length) {
    finish()
    return
  }
  const ph = phases[phaseIdx]
  if (ph.kind === 'html') {
    activePane.value = 'md'
    phaseIdx++
    delay = 1300 // 段间停顿（Anticipation）
    return
  }
  activePane.value = ph.kind
  if (charIdx < ph.text.length) {
    const ch = ph.text[charIdx]
    if (ph.kind === 'style') appendStyle(ch)
    else currentMarkdown.value += ch
    charIdx++
    scrollIfNeeded(ch)
    delay = delayFor(ch)
    // 规则块写完后的一次性停顿优先于常规字符延迟
    if (ch === '\n' && blockPause) {
      delay = blockPause
      blockPause = 0
    }
  } else {
    phaseIdx++
    charIdx = 0
    delay = 1300 // 段（SEG0/md/SEG1/SEG2）间停顿（Anticipation）
  }
}

function frame(ts: number) {
  if (!playing.value) return
  if (!lastTs) lastTs = ts
  acc += ts - lastTs
  lastTs = ts
  // 允许一帧内补打少量字符（应对偶发卡顿），限幅避免突进
  let budget = 0
  while (acc >= delay && budget < 3) {
    acc -= delay
    advance()
    budget++
    if (phaseIdx >= phases.length || !playing.value) return
  }
  if (acc > delay) acc = 0 // 丢弃标签页隐藏等造成的大积压
  scrollActive() // 每帧跟随滚动，确保内容溢出时最新打出的行始终在可视区
  rafId = requestAnimationFrame(frame)
}

function finish() {
  stopRaf()
  applyFullStyle() // 保证最终样式完整（覆盖增量节点）
  currentMarkdown.value = fullMarkdown
  highlightedStyle.value = Prism.highlight(SEG0 + SEG1 + SEG2, Prism.languages.css, 'css')
  highlightedCurrent.value = ''
  playing.value = false
  done.value = true // 触发 .is-done：光标 slow-out 收尾
  nextTick(scrollActive)
}

function stopRaf() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
  lastTs = 0
  acc = 0
}

/** 跳过动画：直接呈现最终态 */
function skip() {
  if (done.value) return
  stopRaf()
  applyFullStyle() // 一次性注入完整 CSS
  currentMarkdown.value = fullMarkdown
  highlightedStyle.value = Prism.highlight(SEG0 + SEG1 + SEG2, Prism.languages.css, 'css')
  highlightedCurrent.value = ''
  phaseIdx = phases.length
  done.value = true
  playing.value = false
  nextTick(scrollActive)
}

/** 重播：从头再打一遍 */
function replay() {
  stopRaf()
  clearStyleNodes()
  currentMarkdown.value = ''
  highlightedStyle.value = ''
  highlightedCurrent.value = ''
  hlPrefix = ''
  hlLastRaw = ''
  topDepth = 0
  blockRaw = ''
  pending = ''
  blockOpen = false
  blockJustClosed = false
  phaseIdx = 0
  charIdx = 0
  done.value = false
  playing.value = true
  delay = 650
  blockPause = 0
  lastTs = 0
  acc = 0
  rafId = requestAnimationFrame(frame)
}

function onScreenClick() {
  if (playing.value) skip()
}

onMounted(() => {
  rafId = requestAnimationFrame(frame)
})

onUnmounted(() => {
  stopRaf()
  clearStyleNodes()
})
</script>

<template>
  <div class="anim-app" :class="{ 'is-done': done }" @click="onScreenClick">
    <!-- 左侧：3D 倾斜的样式编辑器，逐字打出并 Prism 高亮 -->
    <section ref="stylePane" class="styleEditor">
      <pre class="code"><span class="hl" v-html="highlightedStyle"></span><span class="hl" v-html="highlightedCurrent"></span><span
        v-if="playing && activePane === 'style'"
        class="cursor"
      ></span></pre>
    </section>

    <!-- 右侧：先逐字显示 Markdown，再渲染成简历 -->
    <section ref="resumePane" class="resumeEditor">
      <!-- 右侧：随 Markdown 逐字打出实时渲染成简历（SEG2 阶段 CSS 注入后同步变美） -->
      <div class="anim-resume" v-html="liveHtml"></div>
    </section>

    <!-- 工具栏 -->
    <div class="toolbar" @click.stop>
      <button v-if="playing" class="tb" @click="skip">跳过</button>
      <button v-else class="tb" @click="replay">↻ 重播</button>
    </div>
  </div>
</template>

<style scoped>
.anim-app {
  position: fixed;
  inset: 0;
  z-index: 60; /* 盖住站点导航，获得与原版一致的整屏体验 */
  overflow: hidden;
  font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  /* 背景初始为白（见文件末尾非 scoped 规则），待打字 CSS 注入后再过渡为深色 */
  transition: background-color .4s ease, color .4s ease;
  /* 开场 Anticipation：轻微缩放淡入 */
  animation: ar-intro .55s cubic-bezier(.22, 1, .36, 1);
}
@keyframes ar-intro {
  from { opacity: 0; transform: scale(.985); }
  to { opacity: 1; transform: none; }
}

/* 左：代码编辑器基础。transform 过渡放这里兜底，保证打字注入 3D 倾斜时平滑翻入
   （注入的 SEG0 也带 transition，但 base 优先级更高，确保动画一定触发） */
.styleEditor {
  transition: transform 1s cubic-bezier(.22, 1, .36, 1);
}

/* 左：代码编辑器内的代码字体（定位 / 3D 倾斜由 SEG0 打字 CSS 实时生成） */
.code {
  margin: 0;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 右：Markdown 打字态等宽字体（定位/背景由 SEG0 / SEG2 打字 CSS 实时生成） */
.md {
  margin: 0;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.cursor {
  display: inline-block;
  width: 7px;
  height: 1.05em;
  background: rgb(42, 161, 152);
  vertical-align: text-bottom;
  margin-left: 1px;
  transform-origin: bottom;
  /* 闪烁 + 轻微呼吸（Disney Appeal） */
  animation: ar-blink 1.05s steps(1) infinite, ar-breathe 2.1s ease-in-out infinite;
}
.cursor.dark {
  background: #0a8f6f;
}
@keyframes ar-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
@keyframes ar-breathe {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(.62); }
}

/* 定稿 Slow-Out：光标柔和淡出收尾 */
.is-done .cursor {
  animation: none;
  opacity: 0;
  transition: opacity .45s ease;
}

.toolbar {
  position: absolute;
  top: 14px;
  right: 18px;
  z-index: 70;
  display: flex;
  gap: 8px;
}
.tb {
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 43, 54, 0.7);
  color: #cfe;
  font-size: 0.76rem;
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.tb:hover {
  background: rgba(10, 143, 111, 0.9);
  border-color: transparent;
  color: #fff;
}
</style>

<!-- 非 scoped：让动画简历初始为纯白，待打字生成的 CSS 注入 .anim-app 背景后，
     由 .anim-app 自身的 background-color 过渡（见上方 scoped 规则）平滑变为深色 -->
<style>
.anim-app {
  background: #fff;
}
</style>
