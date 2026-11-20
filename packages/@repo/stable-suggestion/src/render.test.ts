import {describe, expect, test} from 'vitest'

import {
  makeCandidate,
  makeEvaluation,
  makeEvidence,
  makeRecommendation,
  RUN_URL,
  WORKFLOW_URL,
} from './__fixtures__/factories'
import {deterministicRecommendation} from './model'
import {
  CI_ALERTS_WEBHOOK_FIELDS,
  escapeSlack,
  renderShortlist,
  shortenAtWord,
  renderSummaryMarkdown,
  SUGGESTION_WEBHOOK_FIELDS,
  toFallbackPayload,
  toWebhookPayload,
} from './render'

const LINKS = {runUrl: RUN_URL, workflowUrl: WORKFLOW_URL}

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
  test('webhook payload has exactly the constant keys and the given workflow url', () => {
    const payload = toWebhookPayload({headline: 'bold', text: 'hello', cli: 'gh x'}, WORKFLOW_URL)
    expect(Object.keys(payload).sort()).toEqual(Object.values(SUGGESTION_WEBHOOK_FIELDS).sort())
    expect(Object.keys(payload).sort()).toEqual(['cli', 'headline', 'run_url', 'text'])
    expect(payload.headline).toBe('bold')
    expect(payload.cli).toBe('gh x')
    expect(payload.run_url).toBe(WORKFLOW_URL)
    expect(payload.text).toBe('hello')
  })

  test('fallback payload has exactly the text key, with the headline in bold on its own line', () => {
    const payload = toFallbackPayload({headline: 'bold', text: 'hello', cli: 'gh x'})
    expect(Object.keys(payload)).toEqual(Object.values(CI_ALERTS_WEBHOOK_FIELDS))
    expect(payload).toEqual({text: '*bold*\n\nhello\nFrom the CLI: `gh x`'})
  })

  test('the webhook sends a dash when there is no command', () => {
    expect(toWebhookPayload({headline: 'h', text: 't', cli: null}, WORKFLOW_URL).cli).toBe('-')
    expect(toFallbackPayload({headline: 'h', text: 't', cli: null}).text).toBe('*h*\n\nt')
  })
})

describe('renderShortlistText', () => {
  const evidence = makeEvidence()
  const message = (recommendation = makeRecommendation(), source = evidence) =>
    renderShortlist(recommendation, source, LINKS)
  const render = (recommendation = makeRecommendation(), source = evidence) => {
    const {headline, text} = message(recommendation, source)
    return `${headline}\n${text}`
  }

  test('splits the headline from the text', () => {
    const {headline, text} = message()
    expect(headline).toBe('@stable shortlist after sanity 6.24.0 reached latest - recommend 6.23.0')
    expect(text.startsWith('Current stable: 6.15.0')).toBe(true)
    expect(text).not.toContain(headline)
  })

  test('the command is its own field and not part of the text', () => {
    const {text, cli} = message()
    expect(cli).toBe('gh workflow run tag-stable.yml -f version=6.23.0')
    expect(text).not.toContain('From the CLI')
  })

  test('the hold headline names the hold', () => {
    const evaluation = makeEvaluation({eligible: [], shortlist: []})
    const recommendation = makeRecommendation({evaluation, decision: 'hold', shortlist: []})
    expect(message(recommendation).headline).toBe(
      '@stable: hold after sanity 6.24.0 reached latest',
    )
    expect(message(recommendation).cli).toBeNull()
  })

  test('promote', () => {
    expect(render()).toMatchSnapshot()
  })

  test('is plain text without Slack markup', () => {
    const text = render()
    expect(text).not.toMatch(/[*`]/)
    expect(text).not.toMatch(/<https?:/)
  })

  test('lists candidates in reading order and ends with the instructions and the run url', () => {
    const lines = render().split('\n')
    expect(lines[0]).toBe('@stable shortlist after sanity 6.24.0 reached latest - recommend 6.23.0')
    expect(lines).toContain('1) 6.23.0 - Newest eligible version.')
    expect(lines).toContain('3) 6.21.0 - Fallback if the open reports are regressions.')
    expect(lines.at(-2)).toBe(
      `To promote: open ${WORKFLOW_URL}, click Run workflow, enter the version (for example 6.23.0). The result posts here.`,
    )
    expect(lines.at(-1)).toBe(`Full reasoning: ${RUN_URL}`)
  })

  test('caps a candidate reason at one short line', () => {
    const recommendation = makeRecommendation({
      shortlist: [{version: '6.23.0', reason: 'word '.repeat(100)}],
    })
    const line = render(recommendation)
      .split('\n')
      .find((candidate) => candidate.startsWith('1) '))
    expect(line?.length).toBeLessThanOrEqual(160)
  })

  test('cuts a long reason at a word boundary and marks the cut', () => {
    const recommendation = makeRecommendation({
      shortlist: [{version: '6.23.0', reason: `${'wordy '.repeat(40)}end`}],
    })
    const line = message(recommendation)
      .text.split('\n')
      .find((candidate) => candidate.startsWith('1) '))
    const reason = line?.slice('1) 6.23.0 - '.length) ?? ''
    expect(reason.length).toBeLessThanOrEqual(140)
    expect(reason.endsWith('wordy…')).toBe(true)
  })

  test('leaves the rationale and concerns to the run summary', () => {
    const text = render()
    expect(text).not.toContain('No confirmed regressions')
    expect(text).not.toContain('Two open bug reports')
  })

  test('major transition banner', () => {
    const evaluation = makeEvaluation({eligible: ['7.0.0'], shortlist: ['7.0.0']})
    const recommendation = makeRecommendation({
      evaluation,
      shortlist: [{version: '7.0.0', reason: 'Soaked 3 days on the new major.'}],
      concerns: [],
    })
    const text = render(recommendation)
    expect(text).toContain('Major transition: stable is on 6.x and 7.x has shipped')
    expect(text).toMatchSnapshot()
  })

  test('no banner when every shortlisted version is on the stable major', () => {
    expect(render()).not.toContain('Major transition')
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
      shortlist: [{version: '6.15.1', reason: 'Smallest jump off stable.'}],
      concerns: [],
    })
    const text = render(recommendation)
    expect(text).toContain('Urgent: 6.15.1 is a patch of stable 6.15.0')
    expect(text).toContain('Recommended: 6.15.1 (1 day soak applies).')
    expect(text).toMatchSnapshot()
  })

  test('urgent banner for a broken stable names the regression', () => {
    const evaluation = makeEvaluation({
      stableAtRisk: [{code: 'regression', detail: 'Confirmed regression in range'}],
    })
    const text = render(makeRecommendation({evaluation}))
    expect(text).toContain('Urgent: current stable 6.15.0 is affected by a confirmed regression')
    expect(text).toContain('Recommended: 6.23.0.')
  })

  test('does not claim the urgent soak for a recommendation that is not urgent', () => {
    const evaluation = makeEvaluation({
      stableAtRisk: [{code: 'regression', detail: 'Confirmed regression in range'}],
    })
    expect(render(makeRecommendation({evaluation}))).not.toContain('soak applies')
  })

  test('no urgent banner on a healthy stable', () => {
    expect(render()).not.toContain('Urgent')
  })

  test('split stable banner lists the packages', () => {
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
    const text = render(makeRecommendation({evaluation}))
    expect(text).toContain(
      'Stable is split across packages: sanity -> 6.15.0, @sanity/mutator -> 6.14.1, @sanity/util -> none.',
    )
    expect(text).toMatchSnapshot()
  })

  test('no split banner when the tags agree', () => {
    expect(render()).not.toContain('split')
  })

  test('names why a version is not eligible', () => {
    expect(render()).toContain('Not eligible: 6.24.0 (too new until 2026-11-24 17:42 UTC)')
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
    const text = render(recommendation)
    expect(text).not.toContain('To promote')
    expect(text).toMatchSnapshot()
  })

  test('claude down', () => {
    expect(render(deterministicRecommendation(makeEvaluation(), 'api-error'))).toMatchSnapshot()
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
    expect(render(recommendation, radarEvidence)).toMatchSnapshot()
  })

  test('stable at risk comes first among the banners', () => {
    const evaluation = makeEvaluation({
      stableAtRisk: [{code: 'regression', detail: 'Confirmed regression in range'}],
    })
    const banner = render(makeRecommendation({evaluation}))
      .split('\n')
      .find((line) => line.startsWith('Urgent'))
    expect(banner).toContain('current stable 6.15.0 is affected')
  })

  test('every model string is escaped', () => {
    const hostile = '<!channel> <https://evil.example|click> & done'
    const recommendation = makeRecommendation({
      headline: hostile,
      rationale: hostile,
      shortlist: [{version: '6.23.0', reason: hostile}],
      concerns: [{version: '6.23.0', note: hostile}],
    })
    const text = render(recommendation)
    expect(text).not.toContain('<!channel>')
    expect(text).not.toContain('<https://evil.example|click>')
    expect(text).toContain('&lt;!channel&gt;')
  })

  test('a url cannot break out of its line', () => {
    const {text} = renderShortlist(makeRecommendation(), evidence, {
      runUrl: 'https://x.example/a|b>c d',
      workflowUrl: WORKFLOW_URL,
    })
    expect(text.endsWith('Full reasoning: https://x.example/a%7Cb%3Ec%20d')).toBe(true)
  })
})

describe('renderSummaryMarkdown', () => {
  const summarise = (recommendation = makeRecommendation(), evidence = makeEvidence()) =>
    renderSummaryMarkdown(recommendation, evidence, LINKS)

  test('leads with how to promote and a version table', () => {
    const markdown = summarise()
    expect(markdown.startsWith('## @stable suggestion\n\n### How to promote\n')).toBe(true)
    expect(markdown).toContain(
      `Open ${WORKFLOW_URL}, click Run workflow, enter the version (for example 6.23.0).`,
    )
    expect(markdown).toContain(
      '| Version | Why |\n| --- | --- |\n| 6.23.0 | Newest eligible version. |',
    )
    expect(markdown.indexOf('### How to promote')).toBeLessThan(markdown.indexOf('### Reasoning'))
  })

  test('keeps the rationale and concerns for the summary', () => {
    const markdown = summarise()
    expect(markdown).toContain('No confirmed regressions in the eligible range.')
    expect(markdown).toContain('- 6.23.0: Two open bug reports mention it.')
  })

  test('escapes hostile text', () => {
    const markdown = summarise(makeRecommendation({headline: '<script>alert(1)</script> | `x`'}))
    expect(markdown).not.toContain('<script>')
  })

  test('says when no version is eligible', () => {
    const markdown = summarise(makeRecommendation({decision: 'hold', shortlist: []}))
    expect(markdown).toContain('No version is eligible yet.')
    expect(markdown).not.toContain('Open https')
  })

  test('notes when the latest rollback history is unavailable', () => {
    const degraded = makeEvidence({latestMoves: {status: 'unavailable', error: 'down'}})
    expect(summarise(makeRecommendation(), degraded)).toContain(
      'Latest rollback history unavailable',
    )
  })
})

describe('shortenAtWord', () => {
  test('keeps text that fits', () => {
    expect(shortenAtWord('short reason.', 20)).toBe('short reason.')
  })

  test('cuts at the last word boundary before the limit', () => {
    expect(shortenAtWord('alpha beta gamma delta', 14)).toBe('alpha beta…')
  })

  test('drops trailing punctuation before the ellipsis', () => {
    expect(shortenAtWord('alpha beta, gamma delta', 16)).toBe('alpha beta…')
  })

  test('falls back to a hard cut for a single long word', () => {
    expect(shortenAtWord('abcdefghijklmnop', 6)).toBe('abcde…')
  })
})
