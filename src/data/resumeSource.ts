/**
 * resumeSource.ts — 动画简历的 Markdown 源文
 *
 * 关键设计：Markdown 由 resume.ts（简历事实源头）**派生生成**，而不是另写一份文案，
 * 保证页面与简历口径一致（见 Agent.md 同步规则）。
 * 动画简历页面会把它逐字「打」出来，再渲染成排版良好的简历。
 */

import { profile, skills, experiences, projects, openSources } from './resume'

/** 点击邮箱唤起邮件客户端，并预填主题与正文文案（真实链接只在最终 HTML 注入，不进打字稿） */
export const resumeMailto =
  `mailto:${profile.email}` +
  `?subject=${encodeURIComponent('关于您的动画简历')}` +
  `&body=${encodeURIComponent('你好，我是（请填您的称呼），看到您的动画简历很感兴趣，想和您聊聊～（可补充来意：合作 / 招聘 / 技术交流）')}`

/** 由 resume.ts 派生 Markdown 源码 */
export function buildResumeMarkdown(): string {
  const fm = [
    '---',
    `name: ${profile.name}`,
    `role: 前端工程师 / 前端主管`,
    `city: ${profile.city}`,
    `experience: ${profile.experienceYears} 年`,
    `phone: ${profile.phone}`,
    `email: ${profile.email}`,
    'intention:',
    ...profile.intention.map((v) => `  - ${v}`),
    '---',
  ].join('\n')

  const skillRows = skills
    .map((s) => `| ${s.title} | ${s.points.join(' / ')} |`)
    .join('\n')

  const expBlocks = experiences
    .map(
      (e) =>
        `## ${e.company} · ${e.role}\n\n\`${e.period}\`\n\n` +
        e.highlights.map((h) => `- ${h}`).join('\n'),
    )
    .join('\n')

  const projectBlocks = projects
    .map(
      (p) =>
        `## ${p.name} · ${p.role}\n\n` +
        `> ${p.desc}\n\n` +
        p.achievements.map((a) => `- ${a}`).join('\n') +
        (p.badges?.length ? `\n\n**亮点**：${p.badges.map((b) => `\`${b}\``).join(' · ')}` : '') +
        `\n\n**核心技术**：${p.tech.map((t) => `\`${t}\``).join(' ')}`,
    )
    .join('\n\n')

  // GitHub 图标（开源项目名上点击跳转源码仓库）
  const ghIcon = 'https://cdn.simpleicons.org/github/0984e3'

  const ossBlocks = openSources
    .map(
      (o) =>
        `## ${o.name} · ${o.role}${o.link ? ` [![GitHub](${ghIcon})](${o.link})` : ''}\n\n` +
        `${o.desc}\n\n` +
        `**核心技术**：${o.tech.map((t) => `\`${t}\``).join(' ')}`,
    )
    .join('\n\n')

  return [
    fm,
    '',
    `# 坚冰 · *本科·软件工程*  [✉️ ${profile.email}](mailto)`,
    '',
    `${profile.intention.join(' / ')} · ${profile.city} · ${profile.experienceYears} 年开发经验`,
    '',
    '# 个人简介',
    '',
    profile.summary,
    '',
    '# 专业技能',
    '',
    '| 方向 | 掌握要点 |',
    '| --- | --- |',
    skillRows,
    '',
    '# 工作经历',
    '',
    expBlocks,
    '',
    '# 项目经历',
    '',
    projectBlocks,
    '',
    '# 开源作品',
    '',
    ossBlocks,
    '',
  ].join('\n')
}

export const resumeMarkdown = buildResumeMarkdown()

/** 打字稿里的 (mailto) 只是短占位符；渲染成 HTML 后调用本函数替换为真实 mailto 链接 */
export function injectResumeMailto(html: string): string {
  return html.replace('href="mailto"', `href="${resumeMailto.replace(/&/g, '&amp;')}"`)
}
