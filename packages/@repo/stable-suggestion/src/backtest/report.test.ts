import {describe, expect, test} from 'vitest'

import {makeHistory} from '../__fixtures__/factories'
import {backtestDates} from './dates'
import {renderBacktestReport} from './report'
import {scoreBacktest} from './score'

describe('renderBacktestReport', () => {
  const dates = backtestDates('2026-09-01', '2026-09-15')
  const scored = scoreBacktest(
    dates.map((asOf) => ({
      asOf,
      currentStable: '6.7.0',
      eligibleCount: 0,
      shortlist: [],
      leakageOk: true,
      notes: ['a | b'],
    })),
    {},
    makeHistory(),
  )
  const report = renderBacktestReport(scored, {
    generatedAt: '2026-11-20T00:00:00Z',
    narratives: [{asOf: dates[0] ?? '', pick: '6.12.0', narrative: 'Picked the newest eligible.'}],
  })

  test('contains every section', () => {
    const headings = [
      '## Method',
      '## Pass/fail',
      '## Per-Tuesday results',
      '## P4 and P5 summary',
      '## LLM sample narratives',
      '## Known limitations',
    ]
    headings.forEach((heading) => expect(report).toContain(heading))
  })

  test('renders a table row per date', () => {
    dates.forEach((asOf) => expect(report).toContain(`| ${asOf} |`))
  })

  test('reports P1 to P3 results and escapes cell pipes', () => {
    expect(report).toContain(
      '| P1 every shortlisted version passes the independent hard rules | PASS',
    )
    expect(report).toContain('a \\| b')
  })

  test('includes narratives and limitations', () => {
    expect(report).toContain('Picked the newest eligible.')
    expect(report).toContain('Radar history only goes back to 2026-06-28')
  })

  test('says so when no samples ran', () => {
    expect(renderBacktestReport(scored)).toContain('No LLM samples were run.')
  })
})
