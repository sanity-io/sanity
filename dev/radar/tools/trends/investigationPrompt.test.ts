import {describe, expect, test} from 'vitest'

import {type TrendPoint, type TrendSeries} from './data'
import {buildInvestigationPrompt} from './investigationPrompt'

const FROM_SHA = 'a'.repeat(40)
const TO_SHA = 'b'.repeat(40)

function makeSeries(overrides: Partial<TrendSeries> = {}): TrendSeries {
  return {
    key: 'interaction:singleString:latency p50',
    title: 'singleString · latency p50',
    unit: 'ms',
    description: 'Median keystroke latency while typing.',
    goal: 'lower',
    group: 'responsiveness',
    sourceFile: 'perf/bench/scenarios/singleString.ts',
    lines: [],
    ...overrides,
  }
}

function makePoint(overrides: Partial<TrendPoint> = {}): TrendPoint {
  return {
    date: new Date('2026-08-18T03:00:00Z'),
    value: 180,
    p75: 210,
    p90: 260,
    sha: TO_SHA,
    runId: 'benchRun-current',
    ...overrides,
  }
}

const previous = makePoint({
  date: new Date('2026-08-17T03:00:00Z'),
  value: 120,
  sha: FROM_SHA,
  runId: 'benchRun-previous',
})

describe('buildInvestigationPrompt', () => {
  test('carries the full signal: metric, values, delta, commits, compare range', () => {
    const prompt = buildInvestigationPrompt(
      makeSeries(),
      makePoint({prNumber: 14181, ciRunId: '123456', ciRunAttempt: 2}),
      previous,
    )
    expect(prompt).toContain('singleString · latency p50 — Median keystroke latency while typing.')
    expect(prompt).toContain('Lower is better.')
    expect(prompt).toContain('(2026-08-18): median (p50) 180ms (p75 210ms, p90 260ms)')
    expect(prompt).toContain(`https://github.com/sanity-io/sanity/commit/${TO_SHA}`)
    expect(prompt).toContain('https://github.com/sanity-io/sanity/pull/14181')
    expect(prompt).toContain('https://github.com/sanity-io/sanity/actions/runs/123456/attempts/2')
    expect(prompt).toContain('median (p50) 120ms at aaaaaaa — this run is +60ms (+50.0%)')
    expect(prompt).toContain(`https://github.com/sanity-io/sanity/compare/${FROM_SHA}...${TO_SHA}`)
    expect(prompt).toContain(
      `https://github.com/sanity-io/sanity/blob/${TO_SHA}/perf/bench/scenarios/singleString.ts`,
    )
    expect(prompt).toContain('benchRun document: benchRun-current')
  })

  test('assembles the A/B dispatch command with both full shas', () => {
    const prompt = buildInvestigationPrompt(makeSeries(), makePoint(), previous)
    expect(prompt).toContain(`gh workflow run bench.yml -f ab_from=${FROM_SHA} -f ab_to=${TO_SHA}`)
  })

  test('derives the local repro command from the series key', () => {
    expect(buildInvestigationPrompt(makeSeries(), makePoint(), previous)).toContain(
      'pnpm build:bench && pnpm bench run --scenario singleString',
    )
    expect(
      buildInvestigationPrompt(
        makeSeries({key: 'pageload:article:LCP', title: 'article · LCP'}),
        makePoint(),
        previous,
      ),
    ).toContain('pnpm bench run --mode pageload --scenario article')
    // INP carries the pageload *kind* only for dashboard grouping — its
    // harness is a mode of its own
    expect(
      buildInvestigationPrompt(
        makeSeries({key: 'pageload:article:INP', title: 'article · INP'}),
        makePoint(),
        previous,
      ),
    ).toContain('pnpm bench run --mode inp --scenario article')
  })

  test('omits what the point does not have: PR, CI run, scenario source, repro', () => {
    const prompt = buildInvestigationPrompt(
      makeSeries({
        key: 'bundle:initialJs',
        title: 'bundle · entry chunk (gzip)',
        unit: 'bytes',
        sourceFile: undefined,
        lineLabel: 'size per run',
      }),
      makePoint({value: 900 * 1024, p75: undefined, p90: undefined}),
      {...previous, value: 800 * 1024},
    )
    expect(prompt).not.toContain('- PR:')
    expect(prompt).not.toContain('- CI run:')
    expect(prompt).not.toContain('Scenario source')
    expect(prompt).not.toContain('--scenario')
    // The bundle series' lineLabel replaces the default 'median (p50)' claim
    expect(prompt).toContain('size per run 900.0 KB')
    expect(prompt).toContain('+100.0 KB (+12.5%)')
  })

  test('flags a low-confidence INP', () => {
    const prompt = buildInvestigationPrompt(
      makeSeries({key: 'pageload:article:INP', title: 'article · INP'}),
      makePoint({interactions: 12}),
      previous,
    )
    expect(prompt).toContain('only 12 interactions')
  })

  test('formats a decrease with a minus and no double sign', () => {
    const prompt = buildInvestigationPrompt(
      makeSeries(),
      makePoint({value: 90, p75: undefined, p90: undefined}),
      previous,
    )
    expect(prompt).toContain('this run is -30ms (-25.0%)')
  })
})
