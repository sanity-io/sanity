import {describe, expect, test} from 'vitest'

import {type Evidence, type History, type Recommendation} from '../types'
import {parseAsOf} from './args'
import {UsageError} from './deps'
import {runCli} from './main'
import {toOutputLines} from './outputs'
import {toRecommendOutputs} from './recommend'
import {createFakeCli, FAKE_NOW, HISTORY_PATH, readFile} from './testDeps'

const RUN_URL = 'https://example.invalid/run'
const OUTPUT_PATH = '/tmp/github-output'

async function collectLive(fake = createFakeCli()) {
  const code = await runCli(
    ['collect', '--history', HISTORY_PATH, '--out', '/run/evidence.json'],
    fake.deps,
  )
  return {fake, code}
}

describe('usage', () => {
  test('--help prints the commands and exits 0', async () => {
    const fake = createFakeCli()
    expect(await runCli(['--help'], fake.deps)).toBe(0)
    const text = fake.stdout.join('\n')
    ;['collect', 'recommend', 'slack-route', 'verify', 'result', 'backtest'].forEach((command) =>
      expect(text).toContain(command),
    )
  })

  test('an unknown command exits 2', async () => {
    expect(await runCli(['nope'], createFakeCli().deps)).toBe(2)
  })

  test('an unknown option exits 2', async () => {
    expect(await runCli(['collect', '--bogus', 'x'], createFakeCli().deps)).toBe(2)
  })

  test('a missing required option exits 2', async () => {
    expect(await runCli(['collect'], createFakeCli().deps)).toBe(2)
  })
})

describe('--as-of validation', () => {
  const now = new Date(FAKE_NOW)

  test('accepts a past instant and normalises it', () => {
    expect(parseAsOf('2026-11-17T18:00:00.000Z', now)).toBe('2026-11-17T18:00:00Z')
  })

  test.each(['not-a-date', '2026-11-21T00:00:00Z', '2024-12-31T00:00:00Z'])(
    'rejects %s',
    (value) => {
      expect(() => parseAsOf(value, now)).toThrow(UsageError)
    },
  )

  test('collect exits 2 for an invalid --as-of', async () => {
    const fake = createFakeCli()
    const code = await runCli(
      [
        'collect',
        '--as-of',
        '2030-01-01T00:00:00Z',
        '--history',
        HISTORY_PATH,
        '--out',
        '/run/e.json',
      ],
      fake.deps,
    )
    expect(code).toBe(2)
    expect(fake.files.has('/run/e.json')).toBe(false)
  })
})

describe('collect', () => {
  test('live mode writes evidence with the live stable and latest', async () => {
    const {fake, code} = await collectLive()
    expect(code).toBe(0)
    const evidence = JSON.parse(readFile(fake, '/run/evidence.json')) as Evidence
    expect(evidence).toMatchObject({mode: 'live', currentStable: '6.15.0', latest: '6.24.0'})
  })

  test('as-of mode resolves stable from the promotion history', async () => {
    const fake = createFakeCli()
    const code = await runCli(
      [
        'collect',
        '--as-of',
        '2026-09-30T18:00:00Z',
        '--history',
        HISTORY_PATH,
        '--out',
        '/run/e.json',
      ],
      fake.deps,
    )
    expect(code).toBe(0)
    const evidence = JSON.parse(readFile(fake, '/run/e.json')) as Evidence
    expect(evidence).toMatchObject({mode: 'as-of', currentStable: '6.15.0'})
  })

  test('a failing history load exits 1', async () => {
    const fake = createFakeCli()
    fake.deps.loadHistory = async () => {
      throw new Error('npm is down')
    }
    expect(await runCli(['collect', '--out', '/run/e.json'], fake.deps)).toBe(1)
    expect(fake.stderr.join('\n')).toContain('npm is down')
  })
})

describe('recommend', () => {
  async function recommend(extraArgs: string[] = ['--no-llm'], env: Record<string, string> = {}) {
    const fake = createFakeCli({env: {GITHUB_OUTPUT: OUTPUT_PATH, ...env}})
    await collectLive(fake)
    const code = await runCli(
      ['recommend', '/run/evidence.json', '--out-dir', '/out', '--run-url', RUN_URL, ...extraArgs],
      fake.deps,
    )
    return {fake, code}
  }

  test('--no-llm writes the four files with the exact payload keys', async () => {
    const {fake, code} = await recommend()
    expect(code).toBe(0)
    const webhook = JSON.parse(readFile(fake, '/out/slack-webhook.json')) as Record<string, string>
    const fallback = JSON.parse(readFile(fake, '/out/slack-fallback.json')) as Record<
      string,
      string
    >
    expect(Object.keys(webhook).toSorted()).toEqual(['run_url', 'text'])
    expect(Object.keys(fallback)).toEqual(['text'])
    expect(webhook.run_url).toBe(RUN_URL)
    expect(webhook.text).toContain(`<${RUN_URL}|Open github workflow>`)
    expect(fallback.text).toBe(webhook.text)
    expect(readFile(fake, '/out/summary.md')).toContain('@stable suggestion')
    const recommendation = JSON.parse(readFile(fake, '/out/recommendation.json')) as Recommendation
    expect(recommendation).toMatchObject({source: 'deterministic', fallbackReason: 'disabled'})
  })

  test('writes validated GITHUB_OUTPUT lines', async () => {
    const {fake} = await recommend()
    const lines = readFile(fake, OUTPUT_PATH).trim().split('\n')
    expect(lines).toEqual([
      'baseline=6.15.0',
      'slot-count=3',
      'slot-1=6.23.0',
      'slot-2=6.22.0',
      'slot-3=6.21.0',
      'decision=promote',
    ])
  })

  test('no API key falls back without calling the model', async () => {
    const {fake, code} = await recommend([])
    expect(code).toBe(0)
    const recommendation = JSON.parse(readFile(fake, '/out/recommendation.json')) as Recommendation
    expect(recommendation.fallbackReason).toBe('no-api-key')
  })

  test('a missing evidence argument exits 2', async () => {
    const fake = createFakeCli()
    expect(await runCli(['recommend', '--out-dir', '/o', '--run-url', RUN_URL], fake.deps)).toBe(2)
  })

  test('a non-URL --run-url exits 2', async () => {
    const fake = createFakeCli()
    await collectLive(fake)
    const code = await runCli(
      [
        'recommend',
        '/run/evidence.json',
        '--out-dir',
        '/o',
        '--run-url',
        'javascript:alert(1)',
        '--no-llm',
      ],
      fake.deps,
    )
    expect(code).toBe(2)
  })
})

describe('GITHUB_OUTPUT validation', () => {
  function recommendationWith(overrides: Partial<Recommendation>): Recommendation {
    return {
      evaluation: {currentStable: '6.15.0'},
      decision: 'hold',
      shortlist: [],
      ...overrides,
    } as Recommendation
  }

  test('leaves unfilled slots empty', () => {
    const lines = toOutputLines(toRecommendOutputs(recommendationWith({})))
    expect(lines).toContain('slot-1=')
    expect(lines).toContain('slot-count=0')
  })

  test('refuses a baseline that is not plain semver', () => {
    const recommendation = recommendationWith({
      evaluation: {currentStable: '6.15.0\nrun=evil'} as Recommendation['evaluation'],
    })
    expect(() => toOutputLines(toRecommendOutputs(recommendation))).toThrow(/baseline/)
  })

  test('refuses a shortlist version with a newline', () => {
    const recommendation = recommendationWith({
      shortlist: [{slot: 1, version: '6.23.0\nx=1', reason: ''}],
    })
    expect(() => toOutputLines(toRecommendOutputs(recommendation))).toThrow(/slot-1/)
  })
})

describe('slack-route', () => {
  test.each([
    ['true', 'true', 'webhook-trigger'],
    ['true', 'false', 'webhook-trigger'],
    ['false', 'true', 'incoming-webhook'],
    ['false', 'false', 'none'],
  ])('suggestion=%s ci-alerts=%s -> %s', async (suggestion, ciAlerts, route) => {
    const fake = createFakeCli({
      env: {
        GITHUB_OUTPUT: OUTPUT_PATH,
        HAS_SUGGESTION_WEBHOOK: suggestion,
        HAS_CI_ALERTS_WEBHOOK: ciAlerts,
      },
    })
    expect(await runCli(['slack-route'], fake.deps)).toBe(0)
    expect(readFile(fake, OUTPUT_PATH)).toBe(`route=${route}\n`)
  })
})

describe('verify', () => {
  const base = ['verify', '--slot', '1', '--history', HISTORY_PATH]

  test('exits 0 when everything is clear', async () => {
    const fake = createFakeCli()
    const args = [...base, '--version', '6.23.0', '--expected-stable', '6.15.0']
    expect(await runCli(args, fake.deps)).toBe(0)
  })

  test('stable moved', async () => {
    const fake = createFakeCli({env: {GITHUB_OUTPUT: OUTPUT_PATH}})
    const args = [...base, '--version', '6.23.0', '--expected-stable', '6.14.1']
    expect(await runCli(args, fake.deps)).toBe(1)
    expect(readFile(fake, OUTPUT_PATH)).toBe('reason=stable-moved\n')
  })

  test('not eligible', async () => {
    const fake = createFakeCli({env: {GITHUB_OUTPUT: OUTPUT_PATH}})
    const args = [...base, '--version', '6.24.0', '--expected-stable', '6.15.0']
    expect(await runCli(args, fake.deps)).toBe(1)
    expect(readFile(fake, OUTPUT_PATH)).toBe('reason=not-eligible\n')
  })

  test('a version above the live latest is not eligible', async () => {
    const fake = createFakeCli({env: {GITHUB_OUTPUT: OUTPUT_PATH}})
    const recorded = JSON.parse(readFile(fake, HISTORY_PATH)) as History
    fake.files.set(
      HISTORY_PATH,
      JSON.stringify({...recorded, liveDistTags: {latest: '6.22.0', stable: '6.15.0'}}),
    )
    const args = [...base, '--version', '6.23.0', '--expected-stable', '6.15.0']
    expect(await runCli(args, fake.deps)).toBe(1)
    expect(readFile(fake, OUTPUT_PATH)).toBe('reason=not-eligible\n')
  })

  test('data unavailable when the history cannot be loaded', async () => {
    const fake = createFakeCli({env: {GITHUB_OUTPUT: OUTPUT_PATH}})
    fake.deps.loadHistory = async () => {
      throw new Error('npm is down')
    }
    const args = ['verify', '--slot', '1', '--version', '6.23.0', '--expected-stable', '6.15.0']
    expect(await runCli(args, fake.deps)).toBe(1)
    expect(readFile(fake, OUTPUT_PATH)).toBe('reason=data-unavailable\n')
  })

  test('approvals must be exactly this slot', async () => {
    const approval = (slots: number[]) => ({
      login: 'reviewer',
      comment: '',
      state: 'approved' as const,
      slots,
    })
    const args = [...base, '--version', '6.23.0', '--expected-stable', '6.15.0', '--run-id', '99']
    const ok = createFakeCli({approvals: [approval([1])]})
    expect(await runCli(args, ok.deps)).toBe(0)
    const multiple = createFakeCli({
      env: {GITHUB_OUTPUT: OUTPUT_PATH},
      approvals: [approval([1, 2])],
    })
    expect(await runCli(args, multiple.deps)).toBe(1)
    expect(readFile(multiple, OUTPUT_PATH)).toBe('reason=multiple-slots-approved\n')
    const other = createFakeCli({env: {GITHUB_OUTPUT: OUTPUT_PATH}, approvals: [approval([2])]})
    expect(await runCli(args, other.deps)).toBe(1)
    expect(readFile(other, OUTPUT_PATH)).toBe('reason=slot-not-approved\n')
  })

  test('fails closed when approvals cannot be fetched', async () => {
    const fake = createFakeCli({env: {GITHUB_OUTPUT: OUTPUT_PATH}, approvals: new Error('403')})
    const args = [...base, '--version', '6.23.0', '--expected-stable', '6.15.0', '--run-id', '99']
    expect(await runCli(args, fake.deps)).toBe(1)
    expect(readFile(fake, OUTPUT_PATH)).toBe('reason=slot-not-approved\n')
  })

  test('rejects a version that is not plain semver', async () => {
    const fake = createFakeCli()
    const args = [...base, '--version', '6.23.0;rm', '--expected-stable', '6.15.0']
    expect(await runCli(args, fake.deps)).toBe(2)
  })
})

describe('result', () => {
  const args = [
    'result',
    '--slot',
    '1',
    '--slot-count',
    '3',
    '--version',
    '6.23.0',
    '--previous',
    '6.15.0',
    '--outcome',
    'promoted',
    '--run-id',
    '99',
    '--run-url',
    RUN_URL,
    '--out-dir',
    '/out',
  ]

  test('names the approver and writes both payloads', async () => {
    const fake = createFakeCli({
      approvals: [{login: 'reviewer', comment: 'ship <!channel>', state: 'approved', slots: [1]}],
    })
    expect(await runCli(args, fake.deps)).toBe(0)
    const webhook = JSON.parse(readFile(fake, '/out/slack-webhook.json')) as Record<string, string>
    expect(Object.keys(webhook).toSorted()).toEqual(['run_url', 'text'])
    expect(webhook.text).toContain('@reviewer')
    expect(webhook.text).toContain('&lt;!channel&gt;')
    expect(Object.keys(JSON.parse(readFile(fake, '/out/slack-fallback.json')))).toEqual(['text'])
  })

  test('uses approver unknown when approvals cannot be fetched', async () => {
    const fake = createFakeCli({approvals: new Error('403')})
    expect(await runCli(args, fake.deps)).toBe(0)
    expect(readFile(fake, '/out/slack-webhook.json')).toContain('@unknown')
  })

  test('rejects an invalid outcome', async () => {
    const fake = createFakeCli()
    const bad = args.map((value) => (value === 'promoted' ? 'exploded' : value))
    expect(await runCli(bad, fake.deps)).toBe(2)
  })
})

describe('backtest', () => {
  test('writes a report and json for a short window from a recorded history', async () => {
    const fake = createFakeCli()
    const code = await runCli(
      [
        'backtest',
        '--from',
        '2026-09-08',
        '--to',
        '2026-09-30',
        '--history',
        HISTORY_PATH,
        '--out',
        '/run/backtest.md',
        '--json',
        '/run/backtest.json',
      ],
      fake.deps,
    )
    expect(code).toBe(0)
    expect(readFile(fake, '/run/backtest.md')).toContain('# Stable promotion backtest')
    const parsed = JSON.parse(readFile(fake, '/run/backtest.json')) as {
      score: {rows: unknown[]; p2: {pass: boolean}}
    }
    expect(parsed.score.rows).toHaveLength(4)
    expect(parsed.score.p2.pass).toBe(true)
  })

  test('an --llm-sample date outside the range exits 2', async () => {
    const fake = createFakeCli()
    const code = await runCli(
      [
        'backtest',
        '--from',
        '2026-09-08',
        '--to',
        '2026-09-30',
        '--history',
        HISTORY_PATH,
        '--out',
        '/r.md',
        '--llm-sample',
        '2026-01-01',
      ],
      fake.deps,
    )
    expect(code).toBe(2)
  })

  test('llm samples are skipped without an API key', async () => {
    const fake = createFakeCli()
    const code = await runCli(
      [
        'backtest',
        '--from',
        '2026-09-08',
        '--to',
        '2026-09-30',
        '--history',
        HISTORY_PATH,
        '--out',
        '/r.md',
        '--llm-sample',
        '2026-09-15',
      ],
      fake.deps,
    )
    expect(code).toBe(0)
    expect(fake.stdout.join('\n')).toContain('LLM samples skipped')
  })
})
