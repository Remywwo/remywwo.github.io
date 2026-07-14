<script setup lang="ts">
interface FormatOptions {
  normalizeHeadings: boolean
  normalizeLists: boolean
  normalizeSpacing: boolean
  compactBlankLines: boolean
}

const sampleText = '# 提示词优化助手 ## 角色定位 你是一名专业的提示词工程师，负责将用户提供的简单、模糊、混乱或不完整的需求，优化为结构清晰、约束明确、可直接交给大语言模型执行的高质量提示词。 --- ## 核心职责 你需要完成以下工作： 1. 理解用户真正想解决的问题，而不是只修改表面措辞。 2. 识别原始提示词中的歧义、信息缺失、目标冲突和无效约束。 3. 补充必要的角色、背景、目标、任务步骤、输入信息、输出格式和质量标准。 --- ## 输出格式 - 分析问题 - 优化后的提示词 - 使用建议'

const input = ref(sampleText)
const copied = ref(false)
const options = reactive<FormatOptions>({
  normalizeHeadings: true,
  normalizeLists: true,
  normalizeSpacing: true,
  compactBlankLines: true,
})

const output = computed(() => formatMarkdown(input.value, options))

function formatMarkdown(value: string, currentOptions: FormatOptions) {
  const normalized = restoreMarkdownLineBreaks(value)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => line.replace(/\s+$/g, ''))

  const lines: string[] = []
  let inCodeBlock = false

  for (const rawLine of normalized) {
    let line = rawLine.trim()

    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      lines.push(line)
      continue
    }

    if (inCodeBlock) {
      lines.push(rawLine)
      continue
    }

    if (isThematicBreak(line)) {
      lines.push(line)
      continue
    }

    if (currentOptions.normalizeHeadings)
      line = normalizeHeading(line)

    if (currentOptions.normalizeLists)
      line = normalizeList(line)

    if (currentOptions.normalizeSpacing)
      line = normalizeTextSpacing(line)

    lines.push(line)
  }

  const tableNormalized = normalizeMarkdownTables(lines)
  const spaced = ensureBlockSpacing(tableNormalized)
  const compacted = currentOptions.compactBlankLines ? compactBlankLines(spaced) : spaced

  return compacted.join('\n').trim()
}

function restoreMarkdownLineBreaks(value: string) {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*```([\w-]*)\s*/g, '\n\n```$1\n')
    .replace(/\s+---\s+/g, '\n\n---\n\n')
    .replace(/\|\s+(?=\|[^|\n]*\|)/g, '|\n')
    .replace(/\s+(#{1,6}\s*)/g, '\n\n$1')
    .replace(/\s+(>\s*)/g, '\n$1')
    .replace(/\s+([•·]\s*)/g, '\n$1')
    .replace(/\s+([-*]\s+)/g, '\n$1')
    .replace(/\s+(\d+[、.．]\s+)/g, '\n$1')
    .replace(/\s+([一二三四五六七八九十]+[、.．]\s*)/g, '\n$1')
}

function normalizeHeading(line: string) {
  let level = 0
  while (line[level] === '#')
    level += 1

  if (level === 0 || level > 6)
    return line

  let normalized = line
  if (line[level] && line[level] !== ' ' && line[level] !== '#')
    normalized = `${line.slice(0, level)} ${line.slice(level)}`

  if (normalized[level] !== ' ')
    return normalized

  const marker = normalized.slice(0, level)
  const content = normalized.slice(level + 1)
  const triggers = ['你', '我', '它', '这', '该', '用户', '收到', '根据', '只有', '变量', '推荐', '例如', '可以', '输出', '提示词', '产品', '内容', '任务', '识别']
  const splitIndex = triggers
    .map(trigger => content.indexOf(` ${trigger}`))
    .filter(index => index > 1 && index <= 24)
    .sort((a, b) => a - b)[0]

  if (!splitIndex)
    return normalized

  return `${marker} ${content.slice(0, splitIndex)}\n\n${content.slice(splitIndex + 1)}`
}

function normalizeList(line: string) {
  return line
    .replace(/^[•·]\s*/u, '- ')
    .replace(/^([*-])(\S)/u, '$1 $2')
    .replace(/^(\d+)[、.．]\s*/u, '$1. ')
    .replace(/^([一二三四五六七八九十]+)[、.．]\s*/u, (_, order: string) => `${chineseOrderToNumber(order)}. `)
}

function chineseOrderToNumber(order: string) {
  const map: Record<string, number> = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
  }

  if (order === '十')
    return 10
  if (order.startsWith('十'))
    return 10 + (map[order.slice(1)] || 0)
  if (order.endsWith('十'))
    return (map[order.slice(0, -1)] || 1) * 10
  if (order.includes('十')) {
    const [tens, ones] = order.split('十')
    return (map[tens] || 1) * 10 + (map[ones] || 0)
  }

  return map[order] || 1
}

function normalizeTextSpacing(line: string) {
  return line
    .replace(/([，。！？；：、])([A-Za-z0-9])/gu, '$1 $2')
    .replace(/([A-Za-z0-9])([\u4E00-\u9FFF])/gu, '$1 $2')
    .replace(/([\u4E00-\u9FFF])([A-Za-z0-9])/gu, '$1 $2')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([，。！？；：、])/gu, '$1')
}

function normalizeMarkdownTables(lines: string[]) {
  const result: string[] = []
  let tableBuffer: string[] = []
  let inCodeBlock = false

  function flushTableBuffer() {
    if (!tableBuffer.length)
      return

    if (tableBuffer.length >= 2)
      result.push(...formatTableRows(tableBuffer))
    else
      result.push(...tableBuffer)

    tableBuffer = []
  }

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      flushTableBuffer()
      inCodeBlock = !inCodeBlock
      result.push(line)
      continue
    }

    if (!inCodeBlock && isTableLine(line)) {
      tableBuffer.push(line)
      continue
    }

    flushTableBuffer()
    result.push(line)
  }

  flushTableBuffer()
  return result
}

function formatTableRows(lines: string[]) {
  const rows = lines.map(parseTableRow)
  const separatorIndex = rows.findIndex((row, index) => index > 0 && isTableSeparatorRow(row))
  const header = rows[0]
  const body = separatorIndex > 0 ? rows.filter((_, index) => index !== separatorIndex).slice(1) : rows.slice(1)
  const alignments = separatorIndex > 0 ? rows[separatorIndex].map(getTableColumnAlignment) : []
  const columnCount = Math.max(...rows.map(row => row.length))
  const normalizedHeader = normalizeTableRowCells(header, columnCount)
  const normalizedBody = body.map(row => normalizeTableRowCells(row, columnCount))
  const widths = normalizedHeader.map((cell, index) => {
    const bodyWidth = Math.max(0, ...normalizedBody.map(row => getTextLength(row[index])))
    return Math.max(3, getTextLength(cell), bodyWidth)
  })

  return [
    formatTableRow(normalizedHeader, widths),
    formatTableSeparator(widths, alignments),
    ...normalizedBody.map(row => formatTableRow(row, widths)),
  ]
}

function parseTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/u, '')
    .replace(/\|$/u, '')
    .split('|')
    .map(cell => cell.trim())
}

function normalizeTableRowCells(row: string[], columnCount: number) {
  return Array.from({ length: columnCount }, (_, index) => row[index] || '')
}

function formatTableRow(row: string[], widths: number[]) {
  return `| ${row.map((cell, index) => cell.padEnd(widths[index])).join(' | ')} |`
}

function formatTableSeparator(widths: number[], alignments: string[]) {
  return `| ${widths.map((width, index) => formatTableSeparatorCell(width, alignments[index])).join(' | ')} |`
}

function formatTableSeparatorCell(width: number, alignment = 'left') {
  if (width <= 3) {
    if (alignment === 'right')
      return '--:'
    if (alignment === 'center')
      return ':-:'
    return ':--'
  }

  if (alignment === 'right')
    return `${'-'.repeat(width - 1)}:`
  if (alignment === 'center')
    return `:${'-'.repeat(width - 2)}:`
  return `:${'-'.repeat(width - 1)}`
}

function getTableColumnAlignment(cell: string) {
  const trimmed = cell.trim()
  if (trimmed.startsWith(':') && trimmed.endsWith(':'))
    return 'center'
  if (trimmed.endsWith(':'))
    return 'right'
  return 'left'
}

function isTableSeparatorRow(row: string[]) {
  return row.length > 0 && row.every(cell => /^:?-{3,}:?$/u.test(cell.trim()))
}

function getTextLength(value: string) {
  return Array.from(value).length
}

function ensureBlockSpacing(lines: string[]) {
  const result: string[] = []

  lines.forEach((line, index) => {
    const previous = result[result.length - 1]
    const next = lines[index + 1]
    const isBlock = isMarkdownBlock(line)
    const currentIsTable = isTableLine(line)

    if (isBlock && previous && previous !== '' && !(currentIsTable && isTableLine(previous)))
      result.push('')

    result.push(line)

    if (isBlock && next && next !== '' && !isListLike(line) && !isListLike(next) && !(currentIsTable && isTableLine(next)))
      result.push('')
  })

  return result
}

function isMarkdownBlock(line: string) {
  return isThematicBreak(line) || isTableLine(line) || /^(?:#{1,6}\s|>\s|[-*]\s|\d+\.\s|```)/u.test(line)
}

function isListLike(line: string) {
  return /^(?:[-*]\s|\d+\.\s)/u.test(line)
}

function isThematicBreak(line: string) {
  return /^([-*_])(?:\s*\1){2,}$/u.test(line.trim())
}

function isTableLine(line: string) {
  const trimmed = line.trim()
  return trimmed.includes('|') && parseTableRow(trimmed).length >= 2
}

function compactBlankLines(lines: string[]) {
  return lines.filter((line, index) => !(line === '' && lines[index - 1] === ''))
}

async function copyOutput() {
  if (!output.value)
    return

  await navigator.clipboard.writeText(output.value)
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 1600)
}

function clearAll() {
  input.value = ''
}
</script>

<template>
  <section class="markdown-formatter">
    <header class="tool-header">
      <h1>Markdown 文案格式化</h1>
      <div class="tool-actions">
        <button type="button" class="ghost-button" @click="clearAll">
          <div i-ri-delete-bin-line />
          清空
        </button>
        <button type="button" class="primary-button" @click="copyOutput">
          <div :class="copied ? 'i-ri-check-line' : 'i-ri-clipboard-line'" />
          {{ copied ? '已复制' : '复制结果' }}
        </button>
      </div>
    </header>

    <div class="options-bar">
      <label>
        <input v-model="options.normalizeHeadings" type="checkbox">
        标题
      </label>
      <label>
        <input v-model="options.normalizeLists" type="checkbox">
        列表
      </label>
      <label>
        <input v-model="options.normalizeSpacing" type="checkbox">
        中英文空格
      </label>
      <label>
        <input v-model="options.compactBlankLines" type="checkbox">
        空行
      </label>
    </div>

    <div class="editor-grid">
      <section class="editor-pane input-pane">
        <div class="pane-head">
          <h2>原文</h2>
        </div>
        <textarea
          v-model="input"
          spellcheck="false"
          placeholder="粘贴需要整理的 Markdown 或普通文案"
        />
      </section>

      <section class="editor-pane output-pane">
        <div class="pane-head">
          <h2>结果</h2>
        </div>
        <textarea
          :value="output"
          readonly
          spellcheck="false"
          placeholder="格式化结果会显示在这里"
        />
      </section>
    </div>
  </section>
</template>

<style scoped>
.markdown-formatter {
  width: min(1180px, calc(100vw - 3rem));
  margin: 0 auto 4rem;
  color: var(--fg);
}

.tool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.tool-header h1 {
  margin: 0;
  color: var(--fg-deeper);
  font-size: clamp(2rem, 4vw, 3.5rem);
  line-height: 1.1;
}

.tool-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
}

.primary-button,
.ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 2.5rem;
  padding: 0 0.95rem;
  border-radius: 0.5rem;
  border: 1px solid var(--c-border);
  cursor: pointer;
  font-size: 0.9rem;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.primary-button:hover,
.ghost-button:hover {
  transform: translateY(-1px);
  border-color: var(--fg-light);
}

.primary-button {
  background: var(--fg-deeper);
  color: var(--c-bg);
}

.ghost-button {
  background: var(--c-bg-soft);
  color: var(--fg);
}

.options-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  border: 1px solid var(--c-border);
  border-radius: 0.5rem;
  background: var(--c-bg-soft);
}

.options-bar label {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 1.75rem;
  color: var(--fg);
  font-size: 0.9rem;
  cursor: pointer;
}

.options-bar input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--fg-deeper);
}

.editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
}

.editor-pane {
  min-width: 0;
  border: 1px solid var(--c-border);
  border-radius: 0.5rem;
  overflow: hidden;
}

.input-pane {
  background: #f8fafc;
}

.output-pane {
  background: #f7fdf8;
}

.dark .input-pane {
  background: #111827;
}

.dark .output-pane {
  background: #0f1f17;
}

.pane-head {
  display: flex;
  align-items: center;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--c-border);
  background: rgba(255, 255, 255, 0.62);
}

.dark .pane-head {
  background: rgba(0, 0, 0, 0.18);
}

.pane-head h2 {
  margin: 0;
  color: var(--fg-deeper);
  font-size: 0.95rem;
}

textarea {
  display: block;
  width: 100%;
  min-height: 56vh;
  padding: 1rem;
  border: 0;
  outline: 0;
  resize: vertical;
  background: transparent;
  color: var(--fg);
  font:
    0.95rem/1.7 ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    monospace;
}

textarea::placeholder {
  color: var(--fg-light);
  opacity: 0.65;
}

@media (max-width: 860px) {
  .markdown-formatter {
    width: min(100%, calc(100vw - 1.5rem));
  }

  .tool-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .tool-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .editor-grid {
    grid-template-columns: 1fr;
  }

  textarea {
    min-height: 44vh;
  }
}
</style>
