/**
 * markdown.ts — 自研 Markdown → AST → HTML 渲染管线
 *
 * 不依赖任何第三方 Markdown 库，完整实现：
 * 1. Lexer：逐行扫描切分块级结构（frontmatter / 标题 / 列表 / 表格 / 引用 / 代码块 / 分隔线）
 * 2. Parser：块内解析行内语法（**粗体** / *斜体* / `行内码` / [链接](href)）
 * 3. Renderer：AST → HTML
 *
 * 每个块节点都记录 `line`（1-based 源码行号），
 * 便于把 AST 节点与源码位置关联（动画简历等场景复用）。
 */

/* ============================================================
 * 类型定义
 * ============================================================ */

export type Inline =
  | { kind: 'text'; value: string }
  | { kind: 'strong'; value: string }
  | { kind: 'em'; value: string }
  | { kind: 'code'; value: string }
  | { kind: 'link'; value: string; href: string; image?: { alt: string; src: string } }
  | { kind: 'image'; alt: string; src: string }

export interface FrontmatterBlock {
  kind: 'frontmatter'
  line: number
  data: Record<string, string[]>
}
export interface HeadingBlock {
  kind: 'heading'
  line: number
  level: number
  text: string
}
export interface ParagraphBlock {
  kind: 'paragraph'
  line: number
  text: string
}
export interface ListBlock {
  kind: 'list'
  line: number
  ordered: boolean
  items: string[]
}
export interface QuoteBlock {
  kind: 'quote'
  line: number
  text: string
}
export interface CodeBlock {
  kind: 'code'
  line: number
  lang: string
  value: string
}
export interface TableBlock {
  kind: 'table'
  line: number
  head: string[]
  rows: string[][]
}
export interface HrBlock {
  kind: 'hr'
  line: number
}

export type Block =
  | FrontmatterBlock
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | QuoteBlock
  | CodeBlock
  | TableBlock
  | HrBlock

export interface ParseResult {
  blocks: Block[]
  /** 统计信息，用于「渲染管线」可视化 */
  stats: {
    chars: number
    lines: number
    blocks: number
    inlines: number
    /** 解析 + 渲染总耗时（ms） */
    ms: number
  }
}

/* ============================================================
 * 工具
 * ============================================================ */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((s) => s.trim())
}

/* ============================================================
 * Lexer + Parser：Markdown → AST
 * ============================================================ */

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0

  /* --- frontmatter：文件开头的 --- ... --- --- */
  if (lines[0]?.trim() === '---') {
    const data: Record<string, string[]> = {}
    let curKey: string | null = null
    i = 1
    while (i < lines.length && lines[i].trim() !== '---') {
      const line = lines[i]
      const item = /^\s+-\s+(.*)$/.exec(line)
      const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
      if (item && curKey) {
        data[curKey].push(item[1].trim())
      } else if (kv) {
        curKey = kv[1]
        data[curKey] = kv[2].trim() ? [kv[2].trim()] : []
      }
      i++
    }
    i++ // 跳过结束的 ---
    blocks.push({ kind: 'frontmatter', line: 1, data })
  }

  /* --- 块级扫描 --- */
  while (i < lines.length) {
    const raw = lines[i]
    const line = raw.trim()

    if (!line) {
      i++
      continue
    }

    /* 围栏代码块 */
    const fence = /^```(\w*)\s*$/.exec(line)
    if (fence) {
      const startLine = i + 1
      const buf: string[] = []
      i++
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        buf.push(lines[i])
        i++
      }
      i++ // 跳过结束围栏
      blocks.push({ kind: 'code', line: startLine, lang: fence[1] || 'text', value: buf.join('\n') })
      continue
    }

    /* 标题 */
    const h = /^(#{1,6})\s+(.*)$/.exec(line)
    if (h) {
      blocks.push({ kind: 'heading', line: i + 1, level: h[1].length, text: h[2].trim() })
      i++
      continue
    }

    /* 分隔线 */
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      blocks.push({ kind: 'hr', line: i + 1 })
      i++
      continue
    }

    /* 引用 */
    if (/^>\s?/.test(line)) {
      const startLine = i + 1
      const buf: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        buf.push(lines[i].trim().replace(/^>\s?/, ''))
        i++
      }
      blocks.push({ kind: 'quote', line: startLine, text: buf.join(' ') })
      continue
    }

    /* 表格：`| a | b |` + 分隔行 */
    if (/^\|/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|?$/.test(lines[i + 1].trim())) {
      const startLine = i + 1
      const head = splitRow(line)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && /^\|/.test(lines[i].trim())) {
        rows.push(splitRow(lines[i]))
        i++
      }
      blocks.push({ kind: 'table', line: startLine, head, rows })
      continue
    }

    /* 列表（连续行合并为一个列表节点） */
    if (/^([-*+]|\d+\.)\s+/.test(line)) {
      const startLine = i + 1
      const ordered = /^\d+\./.test(line)
      const items: string[] = []
      while (i < lines.length && /^([-*+]|\d+\.)\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^([-*+]|\d+\.)\s+/, ''))
        i++
      }
      blocks.push({ kind: 'list', line: startLine, ordered, items })
      continue
    }

    /* 段落（连续非空行合并） */
    const startLine = i + 1
    const buf: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s|[-*+]\s|\d+\.\s|>|\||```|-{3,}$)/.test(lines[i].trim())
    ) {
      buf.push(lines[i].trim())
      i++
    }
    if (buf.length) blocks.push({ kind: 'paragraph', line: startLine, text: buf.join(' ') })
  }

  return blocks
}

/* ============================================================
 * 行内解析
 * ============================================================ */

const INLINE_RE =
  /(\*\*[^*]+\*\*)|(`[^`]+`)|(\[(?:[^\[\]]|!\[[^\]]*\]\([^)]+\))*\]\([^)]+\))|(!\[[^\]]*\]\([^)]+\))|(\*[^*\n]+\*)/g

export function parseInline(src: string): Inline[] {
  const out: Inline[] = []
  let last = 0
  let m: RegExpExecArray | null
  INLINE_RE.lastIndex = 0
  while ((m = INLINE_RE.exec(src))) {
    if (m.index > last) out.push({ kind: 'text', value: src.slice(last, m.index) })
    const t = m[0]
    if (t.startsWith('**')) out.push({ kind: 'strong', value: t.slice(2, -2) })
    else if (t.startsWith('`')) out.push({ kind: 'code', value: t.slice(1, -1) })
    else if (t.startsWith('!')) {
      const im = /!\[([^\]]*)\]\(([^)]+)\)/.exec(t)
      if (im) out.push({ kind: 'image', alt: im[1], src: im[2] })
      else out.push({ kind: 'text', value: t })
    } else if (t.startsWith('[')) {
      const lm = /\[((?:[^\[\]]|!\[[^\]]*\]\([^)]+\))*)\]\(([^)]+)\)/.exec(t)
      if (lm) {
        const inner = lm[1]
        const href = lm[2]
        if (inner.startsWith('!')) {
          const im = /!\[([^\]]*)\]\(([^)]+)\)/.exec(inner)
          if (im) out.push({ kind: 'link', value: '', href, image: { alt: im[1], src: im[2] } })
          else out.push({ kind: 'link', value: inner, href })
        } else out.push({ kind: 'link', value: inner, href })
      } else out.push({ kind: 'text', value: t })
    } else out.push({ kind: 'em', value: t.slice(1, -1) })
    last = m.index + t.length
  }
  if (last < src.length) out.push({ kind: 'text', value: src.slice(last) })
  return out
}

export function renderInline(src: string): string {
  return parseInline(src)
    .map((n) => {
      switch (n.kind) {
        case 'text':
          return escapeHtml(n.value)
        case 'strong':
          return `<strong>${escapeHtml(n.value)}</strong>`
        case 'em':
          return `<em>${escapeHtml(n.value)}</em>`
        case 'code':
          return `<code>${escapeHtml(n.value)}</code>`
        case 'image':
          return `<img class="gh-icon" src="${escapeHtml(n.src)}" alt="${escapeHtml(n.alt)}" width="18" height="18">`
        case 'link':
          if (n.image) {
            return `<a class="gh-link" href="${escapeHtml(n.href)}" target="_blank" rel="noopener noreferrer"><img class="gh-icon" src="${escapeHtml(n.image.src)}" alt="${escapeHtml(n.image.alt)}" width="18" height="18"></a>`
          }
          return `<a href="${escapeHtml(n.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(n.value)}</a>`
      }
    })
    .join('')
}

/* ============================================================
 * Renderer：AST → HTML
 * ============================================================ */

export function renderBlocks(blocks: Block[]): string {
  return blocks
    .map((b) => {
      const ln = ` data-line="${b.line}"`
      switch (b.kind) {
        case 'frontmatter': {
          const rows = Object.entries(b.data)
            .map(([k, v]) => {
              const key = `<span class="fm-k">${escapeHtml(k)}</span>`
              const val =
                v.length > 1
                  ? `<ul class="fm-list">${v.map((x) => `<li>${renderInline(x)}</li>`).join('')}</ul>`
                  : `<span class="fm-v">${renderInline(v[0] ?? '')}</span>`
              return `<div class="fm-row">${key}${val}</div>`
            })
            .join('')
          return `<div class="cv-frontmatter"${ln}>${rows}</div>`
        }
        case 'heading': {
          const lv = Math.min(b.level + 1, 6)
          return `<h${lv} class="cv-h cv-h${b.level}"${ln}>${renderInline(b.text)}</h${lv}>`
        }
        case 'paragraph':
          return `<p${ln}>${renderInline(b.text)}</p>`
        case 'list': {
          const tag = b.ordered ? 'ol' : 'ul'
          return `<${tag}${ln}>${b.items.map((it) => `<li>${renderInline(it)}</li>`).join('')}</${tag}>`
        }
        case 'quote':
          return `<blockquote${ln}>${renderInline(b.text)}</blockquote>`
        case 'code':
          return `<pre class="cv-code"${ln}><code>${escapeHtml(b.value)}</code></pre>`
        case 'hr':
          return `<hr${ln}>`
        case 'table':
          return (
            `<table${ln}>` +
            `<thead><tr>${b.head.map((h) => `<th>${renderInline(h)}</th>`).join('')}</tr></thead>` +
            `<tbody>${b.rows
              .map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join('')}</tr>`)
              .join('')}</tbody>` +
            `</table>`
          )
      }
    })
    .join('\n')
}

/** 统计 AST 节点总数（块 + 行内） */
export function countNodes(blocks: Block[]): number {
  let n = 0
  for (const b of blocks) {
    n++
    if (b.kind === 'list') n += b.items.length
    else if (b.kind === 'table') n += b.rows.length
    else if (b.kind !== 'frontmatter' && b.kind !== 'hr' && b.kind !== 'code') {
      n += parseInline((b as { text: string }).text).length
    }
  }
  return n
}

/** 一次完成 解析 + 渲染，并返回统计信息（用于管线可视化） */
export function compile(src: string): ParseResult & { html: string } {
  const t0 = performance.now()
  const blocks = parseMarkdown(src)
  const html = renderBlocks(blocks)
  const ms = performance.now() - t0
  return {
    blocks,
    html,
    stats: {
      chars: src.length,
      lines: src.split('\n').length,
      blocks: blocks.length,
      inlines: countNodes(blocks),
      ms,
    },
  }
}

/* ============================================================
 * 编辑器语法高亮（供高亮层使用）
 * ============================================================ */

/** 高亮单行源码，返回 HTML */
export function highlightLine(line: string, inFrontmatter: boolean): string {
  const esc = escapeHtml(line)
  if (inFrontmatter) return `<span class="tk-fm">${esc}</span>`
  if (/^```/.test(line)) return `<span class="tk-code">${esc}</span>`
  if (/^#{1,6}\s/.test(line)) {
    const m = /^(#{1,6}\s+)(.*)$/.exec(line)
    return `<span class="tk-hash">${m![1]}</span><span class="tk-heading">${escapeHtml(m![2])}</span>`
  }
  if (/^(-{3,}|\*{3,})$/.test(line)) return `<span class="tk-hr">${esc}</span>`
  if (/^\s*\|/.test(line)) return `<span class="tk-table">${inlineHighlight(esc)}</span>`
  const listMark = /^(\s*)([-*+]|\d+\.)(\s)/.exec(line)
  const prefix = listMark
    ? `<span class="tk-list">${listMark[2]}</span>`
    : /^&gt;\s?/.test(esc)
      ? `<span class="tk-quote">${esc.slice(0, 2)}</span>`
      : ''
  const rest = listMark ? escapeHtml(line.slice(listMark[0].length)) : prefix ? escapeHtml(line.replace(/^>\s?/, '')) : esc
  return prefix + inlineHighlight(rest)
}

function inlineHighlight(escaped: string): string {
  return escaped
    .replace(/(\*\*[^*]+\*\*)/g, '<span class="tk-strong">$1</span>')
    .replace(/(`[^`]+`)/g, '<span class="tk-code">$1</span>')
    .replace(/(\[[^\]]+\]\([^)]+\))/g, '<span class="tk-link">$1</span>')
}
