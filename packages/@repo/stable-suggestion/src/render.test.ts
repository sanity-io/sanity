import {describe, expect, test} from 'vitest'

import {
  makeCandidate,
  makeEvaluation,
  makeEvidence,
  makeRecommendation,
  RUN_URL,
} from './__fixtures__/factories'
import {deterministicRecommendation} from './model'
import {
  CI_ALERTS_WEBHOOK_FIELDS,
  escapeSlack,
  renderShortlistText,
  renderSummaryMarkdown,
  SUGGESTION_WEBHOOK_FIELDS,
  toFallbackPayload,
  toWebhookPayload,
} from './render'

const RUN_LINK = `<${RUN_URL}|Open github workflow>`

describe('escapeSlack', () => {
  test('neutralises channel mentions', () => {
    expect(escapeSlack('<!channel> hello')).toBe('&lt;!channel&gt; hello')
  })

  test('neutralises link syntax', () => {
    expect(escapeSlack('<https://x|y>')).toBe('&lt;https://x|y&gt;')
  })

  test('escapes ampersands before angle brackets', () => {
    expect(escapeSlack('a & b &lt;')).toBe('a &amp; b &amp;lt;')
  })

  test('strips control characters but keeps newlines', () => {
    expect(escapeSlack('a\u0000b\u0007c\u001bd\u007fe\u0085f\ng')).toBe('abcdef\ng')
  })

  test('caps over-length text before escaping so entities stay whole', () => {
    const result = escapeSlack('<'.repeat(50), 10)
    expect(result).toBe(`${'&lt;'.repeat(9)}…`)
  })
})

describe('payload builders', () => {
  test('webhook payload has exactly the constant keys and the given run url', () => {
    const payload = toWebhookPayload('hello', RUN_URL)
    expect(Object.keys(payload).sort()).toEqual(Object.values(SUGGESTION_WEBHOOK_FIELDS).sort())
    expect(Object.keys(payload).sort()).toEqual(['run_url', 'text'])
    expect(payload.run_url).toBe(RUN_URL)
    expect(payload.text).toBe('hello')
  })

  test('fallback payload has exactly the text key', () => {
    const payload = toFallbackPayload('hello')
    expect(Object.keys(payload)).toEqual(Object.values(CI_ALERTS_WEBHOOK_FIELDS))
    expect(Object.keys(payload)).toEqual(['text'])
  })
})

describe('renderShortlistText', () => {
  const evidence = makeEvidence()

  test('promote', () => {
    expect(renderShortlistText(makeRecommendation(), evidence, RUN_URL)).toMatchSnapshot()
  })

  test('major transition banner', () => {
    const evaluation = makeEvaluation({eligible: ['7.0.0'], shortlist: ['7.0.0']})
    const recommendation = makeRecommendation({
      evaluation,
      shortlist: [{slot: 1, version: '7.0.0', reason: 'Soaked 3 days on the new major.'}],
      concerns: [],
    })
    const text = renderShortlistText(recommendation, evidence, RUN_URL)
    expect(text).toContain(':arrow_up: Major transition: stable is on 6.x and 7.x has shipped')
    expect(text).toMatchSnapshot()
  })

  test('no banner when every shortlisted version is on the stable major', () => {
    expect(renderShortlistText(makeRecommendation(), evidence, RUN_URL)).not.toContain(
      'Major transition',
    )
  })

  test('urgent banner for a patch of stable', () => {
    const patch = makeCandidate('6.15.1', {ageDays: 1.1, urgentReason: 'stable-patch'})
    const evaluation = makeEvaluation({
      candidates: [patch],
      eligible: ['6.15.1'],
      shortlist: ['6.15.1'],
    })
    const recommendation = makeRecommendation({
      evaluation,
      shortlist: [{slot: 1, version: '6.15.1', reason: 'Smallest jump off stable.'}],
      concerns: [],
    })
    const text = renderShortlistText(recommendation, evidence, RUN_URL)
    expect(text.startsWith(':rotating_light: Urgent: 6.15.1 is a patch of stable 6.15.0')).toBe(
      true,
    )
    expect(text).toContain('Recommended: 6.15.1')
    expect(text).toMatchSnapshot()
  })

  test('urgent banner for a broken stable names the regression', () => {
    const evaluation = makeEvaluation({
      stableAtRisk: [{code: 'regression', detail: 'Confirmed regression in range'}],
    })
    const text = renderShortlistText(makeRecommendation({evaluation}), evidence, RUN_URL)
    expect(text).toContain('Urgent: current stable 6.15.0 is affected by a confirmed regression')
    expect(text).toContain('Recommended: 6.23.0')
  })

  test('no urgent banner on a healthy stable', () => {
    expect(renderShortlistText(makeRecommendation(), evidence, RUN_URL)).not.toContain('Urgent')
  })

  test('split stable banner lists the packages and the heal command', () => {
    const evaluation = makeEvaluation({
      stableSplit: {
        sanityStable: '6.15.0',
        byPackage: {
          'sanity': '6.15.0',
          '@sanity/mutator': '6.14.1',
          '@sanity/util': null,
          'groq': '6.15.0',
        },
      },
    })
    const text = renderShortlistText(makeRecommendation({evaluation}), evidence, RUN_URL)
    expect(text).toContain(
      ':warning: stable is split across packages: sanity → 6.15.0, @sanity/mutator → 6.14.1, @sanity/util → none.',
    )
    expect(text).toContain('`gh workflow run tag-stable.yml -f version=6.15.0`')
    expect(text).toContain('does not block promotion')
    expect(text).toMatchSnapshot()
  })

  test('no split banner when the tags agree', () => {
    expect(renderShortlistText(makeRecommendation(), evidence, RUN_URL)).not.toContain('split')
  })

  test('notes when the latest rollback history is unavailable', () => {
    const degraded = makeEvidence({latestMoves: {status: 'unavailable', error: 'down'}})
    expect(renderShortlistText(makeRecommendation(), degraded, RUN_URL)).toContain(
      'Latest rollback history unavailable',
    )
  })

  test('hold', () => {
    const evaluation = makeEvaluation({eligible: [], shortlist: []})
    const recommendation = makeRecommendation({
      evaluation,
      decision: 'hold',
      shortlist: [],
      headline: 'Hold: wait for the soak window',
      rationale: 'Nothing has soaked long enough.',
      concerns: [],
    })
    expect(renderShortlistText(recommendation, evidence, RUN_URL)).toMatchSnapshot()
  })

  test('claude down', () => {
    const recommendation = deterministicRecommendation(makeEvaluation(), 'api-error')
    expect(renderShortlistText(recommendation, evidence, RUN_URL)).toMatchSnapshot()
  })

  test('radar down', () => {
    const radarEvidence = makeEvidence({
      regressions: {status: 'unavailable', error: 'timeout'},
      issues: {status: 'unavailable', error: 'timeout'},
      downloads: {status: 'unavailable', error: 'timeout'},
    })
    const evaluation = makeEvaluation({
      eligible: [],
      shortlist: [],
      candidates: [
        makeCandidate('6.23.0', {
          eligible: false,
          hard: [{code: 'regression-data-unavailable', detail: 'Radar unavailable'}],
        }),
      ],
    })
    const recommendation = deterministicRecommendation(evaluation, 'no-eligible-versions')
    expect(renderShortlistText(recommendation, radarEvidence, RUN_URL)).toMatchSnapshot()
  })

  test('stable at risk comes first', () => {
    const evaluation = makeEvaluation({
      stableAtRisk: [{code: 'regression', detail: 'Confirmed regression in range'}],
    })
    const text = renderShortlistText(makeRecommendation({evaluation}), evidence, RUN_URL)
    expect(text.startsWith(':rotating_light: Urgent: current stable 6.15.0 is affected')).toBe(true)
  })

  test('unavailable issues and downloads are stated explicitly', () => {
    const degraded = makeEvidence({
      issues: {status: 'unavailable', error: 'down'},
      downloads: {status: 'unavailable', error: 'down'},
    })
    const text = renderShortlistText(makeRecommendation(), degraded, RUN_URL)
    expect(text).toContain('issue reports unavailable')
    expect(text).toContain('downloads unavailable')
  })

  test('every model string is escaped and the text ends with the workflow link', () => {
    const hostile = '<!channel> <https://evil.example|click> & done'
    const recommendation = makeRecommendation({
      headline: hostile,
      rationale: hostile,
      shortlist: [{slot: 1, version: '6.23.0', reason: hostile}],
      concerns: [{version: '6.23.0', note: hostile}],
    })
    const text = renderShortlistText(recommendation, evidence, RUN_URL)
    expect(text).not.toContain('<!channel>')
    expect(text).not.toContain('<https://evil.example|click>')
    expect(text).toContain('&lt;!channel&gt;')
    expect(text.endsWith(RUN_LINK)).toBe(true)
  })

  test('a run url cannot break out of the link', () => {
    const text = renderShortlistText(makeRecommendation(), evidence, 'https://x.example/a|b>c d')
    expect(text.endsWith('<https://x.example/a%7Cb%3Ec%20d|Open github workflow>')).toBe(true)
  })
})

describe('renderSummaryMarkdown', () => {
  test('escapes hostile text and lists the shortlist', () => {
    const recommendation = makeRecommendation({headline: '<script>alert(1)</script> | `x`'})
    const markdown = renderSummaryMarkdown(recommendation, makeEvidence(), RUN_URL)
    expect(markdown).not.toContain('<script>')
    expect(markdown).toContain('1. **6.23.0**')
    expect(markdown).toContain(`[Open github workflow](${RUN_URL})`)
  })
})
