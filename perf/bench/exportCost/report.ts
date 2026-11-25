import {type ExportCost} from './analyze'
import {type ExportCostReport} from './run'
import {STEP_LABELS, STEP_NAMES} from './steps'

const kB = (bytes: number) => `${(bytes / 1000).toFixed(1)} kB`
const signedKB = (bytes: number) => `${bytes > 0 ? '+' : ''}${kB(bytes)}`

/** `a to b` over repeated runs, or nothing for a single run or when every run agrees. */
export function runRange(values: number[] | undefined, format: (bytes: number) => string): string {
  if (!values || values.length < 2) return ''
  const min = Math.min(...values)
  const max = Math.max(...values)
  return min === max ? '' : `${format(min)} to ${format(max)}`
}

/** The step whose exclusive cost ranks an export: the larger of login and authenticated. */
export function peakBrotli(
  cost: ExportCost,
  field: 'exclusive' | 'leavesBuild' = 'exclusive',
): number {
  return Math.max(0, ...Object.values(cost.steps).map((step) => step[field].brotli))
}

function used(cost: ExportCost): string {
  const login = cost.steps.login?.used
  const authenticated = cost.steps.authenticated?.used
  if (login && authenticated) return 'login, auth'
  if (login) return 'login'
  if (authenticated) return 'auth'
  return 'no'
}

function stepCell(cost: ExportCost, step: 'login' | 'authenticated', field: 'brotli' | 'minified') {
  const value = cost.steps[step]?.exclusive[field]
  return value === undefined ? '–' : kB(value)
}

function leaves(cost: ExportCost, step: 'login' | 'authenticated') {
  const value = cost.steps[step]?.leavesBuild.brotli
  return value === undefined ? '–' : kB(value)
}

function exportRow(cost: ExportCost, withEntry: boolean): string {
  const name = `\`${cost.name}\`${cost.importedViaImportMap ? ' ¹' : ''}`
  const shared = Math.max(...Object.values(cost.steps).map((step) => step.sharedMinified))
  return [
    ...(withEntry ? [`\`${cost.entry === 'index' ? 'sanity' : `sanity/${cost.entry}`}\``] : []),
    name,
    cost.tag,
    stepCell(cost, 'login', 'brotli'),
    stepCell(cost, 'login', 'minified'),
    stepCell(cost, 'authenticated', 'brotli'),
    stepCell(cost, 'authenticated', 'minified'),
    `${leaves(cost, 'login')} / ${leaves(cost, 'authenticated')}`,
    kB(shared),
    used(cost),
  ].join(' | ')
}

const HEADER = [
  'Export',
  'Tag',
  'Excl. login (br)',
  'Excl. login (min)',
  'Excl. auth (br)',
  'Excl. auth (min)',
  'Leaves build, login / auth (br)',
  'Shared (min)',
  'Used by',
]

function table(costs: ExportCost[], withEntry: boolean): string[] {
  const header = withEntry ? ['Entry', ...HEADER] : HEADER
  return [
    `| ${header.join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...costs.map((cost) => `| ${exportRow(cost, withEntry)} |`),
  ]
}

export function formatReport(report: ExportCostReport, top: number): string {
  const lines: string[] = []
  lines.push(`# Export costs on the auto-updating boot path`, '')
  lines.push(
    `Commit \`${report.commit.slice(0, 10)}\` (${report.branch}), ${report.generatedAt}.`,
    '',
  )

  lines.push('## JS per step', '')
  if (report.repeat > 1) {
    lines.push(
      `Median of ${report.repeat} runs; the range column lists the lowest and highest CDN JS (br) when the runs differ.`,
      '',
    )
  }
  lines.push('| Step | CDN files | CDN JS (br) | CDN JS (min) | Studio JS (br) | Range (br) |')
  lines.push('| --- | --- | --- | --- | --- | --- |')
  for (const step of STEP_NAMES) {
    const totals = report.totals[step]
    if (!totals) continue
    lines.push(
      `| ${STEP_LABELS[step]} | ${totals.cdnFiles} | ${kB(totals.cdn.brotli)} | ${kB(totals.cdn.minified)} | ${kB(totals.studio.brotli)} | ${runRange(report.totalsRuns[step], kB) || '–'} |`,
    )
  }
  lines.push('')
  for (const step of ['login', 'authenticated'] as const) {
    const scope = report.scopes[step]
    if (!scope) continue
    lines.push(
      `${STEP_LABELS[step]} loads the entries ${scope.entries.map((entry) => `\`${entry}\``).join(', ')} and ${scope.lazyChunks.length} lazy chunks.`,
    )
  }
  lines.push('')

  lines.push(`## Top ${top} across the boot entries`, '')
  const ranked = report.costs.toSorted((a, b) => peakBrotli(b) - peakBrotli(a))
  lines.push(...table(ranked.slice(0, top), true), '')

  if (report.verifications.length > 0) {
    lines.push('## Verified by rebuilding without the export', '')
    lines.push(
      `Brotli bytes each step loads with the exports dropped from their entries, minus the baseline${report.repeat > 1 ? ` (median of ${report.repeat} runs each, with the range over the runs when they differ)` : ''}; in brackets, the static prediction from leaves-build to exclusive.`,
      '',
    )
    lines.push(
      '| Removed | Login, measured (predicted) | Back from login | Reload with auth | Errors |',
    )
    lines.push('| --- | --- | --- | --- | --- |')
    for (const verification of report.verifications) {
      const cell = (step: 'login' | 'afterLogin' | 'authenticated') => {
        const value = verification.delta[step]
        const predicted = verification.predicted[step]
        const range = predicted
          ? ` (${signedKB(-predicted.leavesBuild)} to ${signedKB(-predicted.exclusive)})`
          : ''
        const runs = runRange(verification.runs[step], signedKB)
        return value ? `${signedKB(value.brotli)}${runs ? ` [${runs}]` : ''}${range}` : 'failed'
      }
      const removed =
        verification.removed.length > 3
          ? `all ${verification.removed.length} above`
          : verification.removed
              .map(({entry, name}) => `\`${entry === 'index' ? 'sanity' : entry}\`: \`${name}\``)
              .join(', ')
      lines.push(
        `| ${removed} | ${cell('login')} | ${cell('afterLogin')} | ${cell('authenticated')} | ${verification.errors.map((error) => error.split('\n')[0]).join('; ')} |`,
      )
    }
    lines.push('')
  }

  const entries = [...new Set(report.costs.map((cost) => cost.entry))].toSorted()
  for (const entry of entries) {
    const costs = ranked.filter((cost) => cost.entry === entry)
    const name = entry === 'index' ? 'sanity' : `sanity/${entry}`
    lines.push(`## \`${name}\` (${report.entryExports[entry]} runtime exports)`, '')
    lines.push(...table(costs.slice(0, top), false), '')
  }

  lines.push(
    '¹ Imported by specifier from another CDN entry or the studio, so it cannot be dropped without moving that import too.',
    '',
    `Exclusive: bytes reached only by this export among everything the step loads, minified per module and compressed together (minified sums are ${(report.calibration > 0 ? 100 / report.calibration : 100).toFixed(0)}% of what the build ships). Leaves build: the part of exclusive that nothing else in the build reaches, which leaves the bundle with the export. Shared: the rest of its static closure outside the step's fixed set, also reached by other exports. Exclusive is an upper bound: rolldown co-locates modules in chunks by which entries reach them, so a module only one export reaches can still sit in a chunk the step loads for other bindings; the verification rebuilds measure what dropping an export actually saves. Used by: the studio, the entries' side effects or the lazy chunks a step loads reach the module that declares it.`,
    '',
  )
  return lines.join('\n')
}

/**
 * The exports to verify end to end, among those nothing imports by specifier: the `count`
 * costliest by exclusive bytes (the upper bound) and by bytes that leave the build (the lower
 * bound), since rolldown's chunking decides where between the two the real saving lands.
 */
export function pickVerifications(
  costs: ExportCost[],
  count: number,
  extra: string[],
): ExportCost[] {
  const candidates = costs.filter((cost) => !cost.importedViaImportMap)
  const top = (field: 'exclusive' | 'leavesBuild') =>
    candidates
      .filter((cost) => peakBrotli(cost, field) > 0)
      .toSorted((a, b) => peakBrotli(b, field) - peakBrotli(a, field))
      .slice(0, count)
  const picked = [...new Set([...top('exclusive'), ...top('leavesBuild')])]
  for (const key of extra) {
    const [entry, name] = key.includes(':') ? key.split(':') : ['index', key]
    const cost = costs.find((each) => each.entry === entry && each.name === name)
    if (!cost) throw new Error(`No runtime export ${name} on entry ${entry}`)
    if (!picked.includes(cost)) picked.push(cost)
  }
  return picked
}
