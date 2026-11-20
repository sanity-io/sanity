import {KNOWN_BAD_RANGE, SOAK_DAYS} from '../config'
import {type IsoDate} from '../types'
import {type BacktestRow, type BacktestScore} from './score'

export interface LlmNarrative {
  asOf: IsoDate
  pick: string
  narrative: string
}

export interface ReportOptions {
  generatedAt?: IsoDate
  narratives?: LlmNarrative[]
}

const KNOWN_LIMITATIONS = [
  'Deprecation timing is unknown in as-of mode, so the deprecated rule is not applied to past dates.',
  'A regression is treated as known from the `_updatedAt` of its Radar document. This is conservative and can only delay knowledge.',
  'No historical per-version downloads exist, so the adoption flag is not evaluated for past dates.',
  'Radar history only goes back to 2026-06-28, so SQRL and bisect evidence is absent before that.',
]

function escapeCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ')
}

function passLabel(pass: boolean): string {
  return pass ? 'PASS' : 'FAIL'
}

function listOrDash(values: string[]): string {
  return values.length > 0 ? values.join(', ') : '-'
}

function renderRow(row: BacktestRow): string {
  const exposure =
    row.exposedVersions.length > 0
      ? `${row.exposure} (${row.exposedVersions.join(', ')})`
      : row.exposure
  const cells = [
    row.asOf,
    row.currentStable,
    String(row.eligibleCount),
    listOrDash(row.shortlist),
    row.modelPick ?? '-',
    row.humanPromotion?.version ?? '-',
    exposure,
    row.leakageOk ? 'ok' : 'LEAK',
    row.notes.join('; ') || '-',
  ]
  return `| ${cells.map(escapeCell).join(' | ')} |`
}

function renderPassFail(score: BacktestScore): string[] {
  const {p1, p2, p3} = score
  return [
    '| Check | Result | Detail |',
    '| --- | --- | --- |',
    `| P1 every shortlisted version passes the independent hard rules | ${passLabel(p1.pass)} | ${p1.violations.length} violation(s) |`,
    `| P2 as-of evidence equals evidence truncated at the date | ${passLabel(p2.pass)} | ${p2.failingDates.length} failing date(s) |`,
    `| P3 ${p3.version} never shortlisted on or after ${p3.cutoff} | ${passLabel(p3.pass)} | ${p3.violations.length} violation(s) |`,
    ...p1.violations.map(
      (violation) =>
        `| P1 violation | FAIL | ${violation.asOf} ${violation.version}: ${violation.reasons.join(', ')} |`,
    ),
    ...p2.failingDates.map((asOf) => `| P2 violation | FAIL | ${asOf} |`),
    ...p3.violations.map((asOf) => `| P3 violation | FAIL | ${asOf} |`),
  ]
}

function renderSummaries(score: BacktestScore): string[] {
  const {p4, p5} = score
  const exposureLines = p4.exposures.map(
    (exposure) =>
      `- ${exposure.asOf}: ${exposure.versions.join(', ')} (${exposure.classification})`,
  )
  return [
    `### P4 exposure to the known bad range ${KNOWN_BAD_RANGE.from} to ${KNOWN_BAD_RANGE.to}`,
    '',
    `Dates with no exposure: ${p4.none}. Unknowable at the time: ${p4.unknowable}. Knowable at the time: ${p4.knowable}.`,
    '',
    ...(exposureLines.length > 0 ? [...exposureLines, ''] : []),
    '### P5 agreement with human promotions',
    '',
    `Dates with a human promotion in the following ${SOAK_DAYS} days: ${p5.datesWithHumanPromotion}.`,
    `Promoted version was on the shortlist: ${p5.onShortlist} of ${p5.datesWithHumanPromotion}.`,
    `Promoted version was the top shortlist pick: ${p5.topPick} of ${p5.datesWithHumanPromotion}.`,
    `Model pick matched the human promotion: ${p5.modelPickMatches} of ${p5.modelPickSamples} sampled dates.`,
  ]
}

function renderNarratives(narratives: LlmNarrative[]): string[] {
  if (narratives.length === 0) {
    return ['No LLM samples were run.']
  }
  return narratives.flatMap((entry) => [
    `### ${entry.asOf} (pick ${entry.pick})`,
    '',
    entry.narrative,
    '',
  ])
}

export function renderBacktestReport(score: BacktestScore, options: ReportOptions = {}): string {
  const first = score.rows[0]?.asOf
  const last = score.rows.at(-1)?.asOf
  const range = first && last ? `${first} to ${last}` : 'no dates'
  const sections = [
    '# Stable promotion backtest',
    '',
    options.generatedAt ? `Generated ${options.generatedAt}. Range ${range}.` : `Range ${range}.`,
    '',
    '## Method',
    '',
    `For every Tuesday at 18:00 UTC in the range, evidence is rebuilt as it was at that instant, the rules engine shortlists versions, and an independent checker re-derives the hard rules from the same evidence. A version needs ${SOAK_DAYS} days on npm, must be the newest patch of its minor, must exist for every published package, and must not be covered by a regression known at the time.`,
    '',
    '## Pass/fail',
    '',
    ...renderPassFail(score),
    '',
    '## Per-Tuesday results',
    '',
    '| As-of | Stable | Eligible | Shortlist | Model pick | Human promotion | Exposure | Leakage | Notes |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...score.rows.map(renderRow),
    '',
    '## P4 and P5 summary',
    '',
    ...renderSummaries(score),
    '',
    '## LLM sample narratives',
    '',
    ...renderNarratives(options.narratives ?? []),
    '',
    '## Known limitations',
    '',
    ...KNOWN_LIMITATIONS.map((limitation) => `- ${limitation}`),
    '',
  ]
  return sections.join('\n')
}
