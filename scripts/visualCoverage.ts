import {execFileSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {isAbsolute, join, posix, relative, sep} from 'node:path'
import process from 'node:process'
import {parseArgs} from 'node:util'

type EvidenceKind = 'story' | 'browser-test'
interface Evidence {
  file: string
  kind: EvidenceKind
}
interface PendingEvidence {
  pr: number
  file: string
}
interface Coverage {
  file: string
  coveredBy: Evidence[]
  pendingIn: PendingEvidence[]
}
type Status = 'covered' | 'pending' | 'uncovered'
type Format = 'text' | 'markdown' | 'json'
interface PullRequest {
  number: number
  headRefName: string
  files: {path: string}[]
}
interface AreaRow {
  area: string
  covered: number
  pending: number
  total: number
}

const FORMATS: readonly Format[] = ['text', 'markdown', 'json']
const UI_FILE = /^packages\/.+\/src\/.+\.(?:tsx|css\.ts)$/
const EXCLUDED_SEGMENT = /\/(?:__tests__|__fixtures__|__mocks__|__workshop__|test)\//
const EXCLUDED_SUFFIXES = [
  '.test.tsx',
  '.test.ts',
  '.stories.tsx',
  '.stories.ts',
  'Story.tsx',
  '.d.ts',
]
const RELATIVE_IMPORT = /\b(?:from|import)\s*\(?\s*['"](\.[^'"\n]*)['"]/g
const MARKDOWN_EVIDENCE_LIMIT = 3
const MAX_BUFFER = 64 * 1024 * 1024

const USAGE = `Usage: pnpm visual-coverage [options] [file ...]
       node scripts/visualCoverage.ts [options] [file ...]

Reports whether Studio UI files (packages/**/src/**/*.tsx, *.css.ts) are rendered by a
committed Storybook story (*.stories.tsx) or vitest browser test (*.browser.test.tsx),
directly or through a colocated *Story.tsx harness.

Modes
  file ...             Report the given files (repo-relative or absolute paths)
  --changed            Report files changed since the merge base with --base (default:
                       origin/main, or main when origin/main does not exist)
  (no files/--changed) Whole tree: coverage table per area

Options
  --base <ref>         Base ref for --changed
  --prs                Mark files as pending when an open PR adds a story for them (uses gh)
  --uncovered          Tree mode: also list every uncovered file
  --format <fmt>       text (default), markdown (PR comment), json (Coverage[])
  --help               Show this help`

function statusOf(coverage: Coverage): Status {
  if (coverage.coveredBy.length > 0) return 'covered'
  return coverage.pendingIn.length > 0 ? 'pending' : 'uncovered'
}

function isUiFile(file: string): boolean {
  if (!UI_FILE.test(file) || EXCLUDED_SEGMENT.test(file)) return false
  return !EXCLUDED_SUFFIXES.some((suffix) => file.endsWith(suffix))
}

function isStory(file: string): boolean {
  return file.endsWith('.stories.tsx') || file.endsWith('.stories.ts')
}

function isHarness(file: string): boolean {
  return file.endsWith('Story.tsx')
}

function isStyleModule(file: string): boolean {
  return file.endsWith('.css.ts') || file.endsWith('.styled.tsx')
}

function coveringKind(file: string): EvidenceKind | undefined {
  if (!file.startsWith('packages/')) return undefined
  if (isStory(file)) return 'story'
  return file.endsWith('.browser.test.tsx') ? 'browser-test' : undefined
}

function run(command: string, args: string[], cwd: string): string {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: MAX_BUFFER,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.trim().replace(/\s*\n\s*/g, '; ')
}

function readSource(root: string, file: string): string {
  try {
    return readFileSync(join(root, file), 'utf8')
  } catch {
    return ''
  }
}

function parseImports(source: string): string[] {
  return Array.from(source.matchAll(RELATIVE_IMPORT), (match) => match[1])
}

function resolveImport(importer: string, spec: string, files: ReadonlySet<string>) {
  const base = posix.join(posix.dirname(importer), spec).replace(/\.(?:jsx?|tsx?)$/, '')
  const candidates = [`${base}.tsx`, `${base}.ts`, `${base}/index.tsx`, `${base}/index.ts`, base]
  return candidates.find((candidate) => files.has(candidate))
}

function resolveImports(importer: string, source: string, files: ReadonlySet<string>): string[] {
  const targets: string[] = []
  for (const spec of parseImports(source)) {
    const target = resolveImport(importer, spec, files)
    if (target) targets.push(target)
  }
  return targets
}

type ImportReader = (file: string) => string[]

function createImportReader(root: string, files: ReadonlySet<string>): ImportReader {
  const cache = new Map<string, string[]>()
  return (file) => {
    let targets = cache.get(file)
    if (!targets) {
      targets = resolveImports(file, readSource(root, file), files)
      cache.set(file, targets)
    }
    return targets
  }
}

function targetsWithHarness(file: string, importsOf: ImportReader): Set<string> {
  const direct = importsOf(file)
  const targets = new Set(direct)
  for (const target of direct) {
    if (!isHarness(target)) continue
    for (const harnessTarget of importsOf(target)) targets.add(harnessTarget)
  }
  return targets
}

function uniqueSorted<T>(items: T[], key: (item: T) => string): T[] {
  const byKey = new Map(items.map((item) => [key(item), item]))
  return [...byKey.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, item]) => item)
}

function buildCoverage(
  root: string,
  files: ReadonlySet<string>,
  universe: string[],
  pending: ReadonlyMap<string, PendingEvidence[]>,
): Map<string, Coverage> {
  const importsOf = createImportReader(root, files)
  const coverage = new Map<string, Coverage>()
  for (const file of universe) {
    coverage.set(file, {file, coveredBy: [], pendingIn: [...(pending.get(file) ?? [])]})
  }

  for (const covering of files) {
    const kind = coveringKind(covering)
    if (!kind) continue
    for (const target of targetsWithHarness(covering, importsOf)) {
      coverage.get(target)?.coveredBy.push({file: covering, kind})
    }
  }

  // Styles are only visible through the component that applies them, so a style module
  // inherits the coverage of every file importing it. Repeat until stable because a
  // `.styled.tsx` module often sits between the component and its `.css.ts`.
  let changed = true
  while (changed) {
    changed = false
    for (const [file, importer] of coverage) {
      for (const target of importsOf(file)) {
        const styles = isStyleModule(target) ? coverage.get(target) : undefined
        if (!styles) continue
        const before = styles.coveredBy.length + styles.pendingIn.length
        styles.coveredBy = uniqueSorted([...styles.coveredBy, ...importer.coveredBy], evidenceKey)
        styles.pendingIn = uniqueSorted([...styles.pendingIn, ...importer.pendingIn], pendingKey)
        if (styles.coveredBy.length + styles.pendingIn.length !== before) changed = true
      }
    }
  }

  for (const entry of coverage.values()) {
    entry.coveredBy = uniqueSorted(entry.coveredBy, evidenceKey).sort(nearestSentinelFirst(entry))
    entry.pendingIn = uniqueSorted(entry.pendingIn, pendingKey)
  }
  return coverage
}

const evidenceKey = (e: Evidence): string => e.file
const pendingKey = (e: PendingEvidence): string => `${String(e.pr).padStart(8, '0')} ${e.file}`

// A component's own story sits next to it; a story that merely imports it lives elsewhere. Show
// stories before browser tests, then the evidence sharing the longest directory prefix.
function nearestSentinelFirst(coverage: Coverage): (a: Evidence, b: Evidence) => number {
  const dir = `${posix.dirname(coverage.file)}/`
  const sharedPrefix = (e: Evidence): number => {
    let i = 0
    while (i < dir.length && dir[i] === e.file[i]) i += 1
    return i
  }
  return (a, b) =>
    Number(b.kind === 'story') - Number(a.kind === 'story') ||
    sharedPrefix(b) - sharedPrefix(a) ||
    a.file.localeCompare(b.file)
}

function parseAddedLines(diff: string): Map<string, string[]> {
  const added = new Map<string, string[]>()
  let current: string[] | undefined
  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ ')) {
      current = line.startsWith('+++ b/') ? [] : undefined
      if (current) added.set(line.slice('+++ b/'.length).trimEnd(), current)
    } else if (current && line.startsWith('+')) {
      current.push(line.slice(1))
    }
  }
  return added
}

function loadPendingFromPrs(
  root: string,
  files: ReadonlySet<string>,
  universe: ReadonlySet<string>,
  currentBranch: string,
): Map<string, PendingEvidence[]> {
  const pending = new Map<string, PendingEvidence[]>()
  let prs: PullRequest[]
  try {
    const fields = 'number,title,headRefName,files'
    const args = ['pr', 'list', '--state', 'open', '--limit', '100', '--json', fields]
    prs = JSON.parse(run('gh', args, root)) as PullRequest[]
  } catch (error) {
    console.warn(`warning: gh pr list failed (${errorMessage(error)}); pending coverage omitted`)
    return pending
  }

  for (const pr of prs) {
    // The current branch's own PR is the report subject, not pending work elsewhere.
    if (pr.headRefName === currentBranch) continue
    const paths = pr.files.map((file) => file.path)
    if (!paths.some((path) => isStory(path) || isHarness(path))) continue

    let diff: string
    try {
      diff = run('gh', ['pr', 'diff', String(pr.number)], root)
    } catch (error) {
      console.warn(`warning: gh pr diff ${pr.number} failed (${errorMessage(error)}); skipped`)
      continue
    }

    const added = parseAddedLines(diff)
    const known = new Set([...files, ...paths])
    const importsOf: ImportReader = (file) => {
      const local = files.has(file) ? readSource(root, file) : ''
      return resolveImports(file, [...(added.get(file) ?? []), local].join('\n'), known)
    }
    for (const story of added.keys()) {
      // Edits to a committed story are already counted as coverage; only new stories are pending.
      if (!isStory(story) || files.has(story)) continue
      for (const target of targetsWithHarness(story, importsOf)) {
        if (!universe.has(target)) continue
        const list = pending.get(target) ?? []
        list.push({pr: pr.number, file: story})
        pending.set(target, list)
      }
    }
  }
  return pending
}

function summaryLine(items: Coverage[], noun: string): string {
  const counts: Record<Status, number> = {covered: 0, pending: 0, uncovered: 0}
  for (const item of items) counts[statusOf(item)] += 1
  return `${items.length} ${noun}: ${counts.covered} covered, ${counts.pending} pending, ${counts.uncovered} uncovered.`
}

function formatText(items: Coverage[], noun: string): string {
  const lines: string[] = []
  for (const item of items) {
    lines.push(`${statusOf(item)}  ${item.file}`)
    for (const e of item.coveredBy) lines.push(`  ${e.kind}  ${e.file}`)
    for (const e of item.pendingIn) lines.push(`  pending  #${e.pr} ${e.file}`)
  }
  lines.push(summaryLine(items, noun))
  return lines.join('\n')
}

function markdownEvidence(item: Coverage): string {
  const cells = item.coveredBy.map((e) =>
    e.kind === 'story' ? `\`${e.file}\`` : `\`${e.file}\` (browser test)`,
  )
  for (const e of item.pendingIn) cells.push(`#${e.pr} \`${e.file}\``)
  const shown = cells.slice(0, MARKDOWN_EVIDENCE_LIMIT)
  if (cells.length > shown.length) shown.push(`+${cells.length - shown.length} more`)
  return shown.join('<br>')
}

function formatMarkdown(items: Coverage[], noun: string): string {
  const heading = '### Visual regression coverage'
  if (items.length === 0) {
    return `${heading}\n\nNo changed UI files (\`packages/**/src/**/*.tsx\`, \`*.css.ts\`).`
  }
  const rows = items.map((item) => [`\`${item.file}\``, statusOf(item), markdownEvidence(item)])
  const table = renderTable(['File', 'Status', 'Evidence'], rows, 'markdown')
  const legend =
    'covered: a committed `*.stories.tsx` (snapshotted by the "sanity studio" Chromatic project) or `*.browser.test.tsx` (end state snapshotted by "sanity studio vitest") imports the file, directly or through its `*Story.tsx` harness. ' +
    'pending: an open PR adds such a story; do not open a duplicate. uncovered: no story or browser test renders this file. ' +
    'How to add one: `.agents/skills/sanity-visual-coverage/SKILL.md`.'
  return [heading, '', summaryLine(items, noun), '', table, '', legend].join('\n')
}

function renderTable(headers: string[], rows: string[][], format: Format): string {
  if (format === 'markdown') {
    const separator = headers.map((header) => '-'.repeat(header.length))
    return [headers, separator, ...rows].map((cells) => `| ${cells.join(' | ')} |`).join('\n')
  }
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((row) => row[i].length)))
  const line = (cells: string[]) =>
    cells.map((cell, i) => (i === 0 ? cell.padEnd(widths[i]) : cell.padStart(widths[i]))).join('  ')
  return [line(headers), ...rows.map(line)].join('\n')
}

function areaOf(file: string): string {
  const match = /^(packages\/(?:@[^/]+\/)?[^/]+\/src)\/(.+)$/.exec(file)
  if (!match) return posix.dirname(file)
  const [, packageSrc, rest] = match
  if (packageSrc !== 'packages/sanity/src') return packageSrc
  return [packageSrc, ...rest.split('/').slice(0, -1).slice(0, 2)].join('/')
}

function summarizeAreas(items: Coverage[]): AreaRow[] {
  const areas = new Map<string, AreaRow>()
  const totals: AreaRow = {area: 'total', covered: 0, pending: 0, total: 0}
  for (const item of items) {
    const area = areaOf(item.file)
    const row = areas.get(area) ?? {area, covered: 0, pending: 0, total: 0}
    areas.set(area, row)
    const status = statusOf(item)
    for (const target of [row, totals]) {
      if (status === 'covered') target.covered += 1
      if (status === 'pending') target.pending += 1
      target.total += 1
    }
  }
  return [...[...areas.values()].sort((a, b) => a.area.localeCompare(b.area)), totals]
}

function formatTree(items: Coverage[], prs: boolean, uncovered: boolean, format: Format): string {
  const headers = ['area', 'covered', ...(prs ? ['pending'] : []), 'total', '%']
  const rows = summarizeAreas(items).map((row) => [
    row.area,
    String(row.covered),
    ...(prs ? [String(row.pending)] : []),
    String(row.total),
    `${row.total ? Math.round((row.covered / row.total) * 100) : 0}%`,
  ])
  const output = [renderTable(headers, rows, format)]
  if (uncovered) {
    const missing = items.filter((item) => statusOf(item) === 'uncovered')
    output.push('', `${missing.length} uncovered files:`)
    for (const item of missing)
      output.push(format === 'markdown' ? `- \`${item.file}\`` : item.file)
  }
  return output.join('\n')
}

function refExists(root: string, ref: string): boolean {
  try {
    run('git', ['rev-parse', '--verify', '--quiet', ref], root)
    return true
  } catch {
    return false
  }
}

function changedFiles(root: string, base: string | undefined): string[] {
  const ref = base ?? (refExists(root, 'origin/main') ? 'origin/main' : 'main')
  const mergeBase = run('git', ['merge-base', ref, 'HEAD'], root).trim()
  const diff = run('git', ['diff', '--name-only', '--diff-filter=ACMR', mergeBase], root)
  return diff.split('\n').filter(Boolean)
}

function toRepoRelative(root: string, input: string): string {
  return isAbsolute(input) ? relative(root, input).split(sep).join('/') : posix.normalize(input)
}

function fail(message: string): never {
  console.error(`${message}\n\n${USAGE}`)
  process.exit(2)
}

function parseCli() {
  return parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      changed: {type: 'boolean', default: false},
      base: {type: 'string'},
      prs: {type: 'boolean', default: false},
      uncovered: {type: 'boolean', default: false},
      format: {type: 'string', default: 'text'},
      help: {type: 'boolean', default: false},
    },
  })
}

function main(): void {
  let cli: ReturnType<typeof parseCli>
  try {
    cli = parseCli()
  } catch (error) {
    fail(errorMessage(error))
  }
  const {values, positionals} = cli
  if (values.help) {
    console.log(USAGE)
    return
  }
  const format = FORMATS.find((candidate) => candidate === values.format)
  if (!format) fail(`Unknown format: ${values.format}`)

  const root = run('git', ['rev-parse', '--show-toplevel'], process.cwd()).trim()
  const files = new Set(run('git', ['ls-files', '-z'], root).split('\0').filter(Boolean))
  const universeList = [...files].filter(isUiFile).sort()
  const universe = new Set(universeList)
  // On pull_request events the checkout is a detached merge commit; the workflow's env names
  // the PR branch instead.
  const branch =
    process.env.GITHUB_HEAD_REF || run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], root).trim()
  const pending = values.prs
    ? loadPendingFromPrs(root, files, universe, branch)
    : new Map<string, PendingEvidence[]>()
  const coverage = buildCoverage(root, files, universeList, pending)

  const treeMode = positionals.length === 0 && !values.changed
  let selected = universeList
  if (!treeMode) {
    const requested = values.changed
      ? changedFiles(root, values.base)
      : positionals.map((input) => toRepoRelative(root, input))
    selected = [...new Set(requested.filter((file) => universe.has(file)))]
    const skipped = requested.length - selected.length
    if (skipped > 0) console.error(`skipped ${skipped} non-UI or missing files`)
  }
  const items = selected.flatMap((file) => coverage.get(file) ?? [])
  const noun = values.changed ? 'changed UI files' : 'UI files'

  if (format === 'json') {
    console.log(JSON.stringify(items, null, 2))
  } else if (treeMode) {
    console.log(formatTree(items, values.prs, values.uncovered, format))
  } else {
    console.log(format === 'markdown' ? formatMarkdown(items, noun) : formatText(items, noun))
  }
}

main()
