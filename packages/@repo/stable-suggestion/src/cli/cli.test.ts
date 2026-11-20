import {describe, expect, test} from 'vitest'

import {type Evidence, type History, type Recommendation} from '../types'
import {parseAsOf} from './args'
import {UsageError} from './deps'
import {runCli} from './main'
import {matchesOneOf, toOutputLines} from './outputs'
import {createFakeCli, FAKE_NOW, HISTORY_PATH, readFile} from './testDeps'

const RUN_URL = 'https://example.invalid/run'
const WORKFLOW_URL = 'https://example.invalid/workflow'
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
    ;['collect', 'recommend', 'slack-route', 'backtest'].forEach((command) =>
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
    const fake = createFakeCli({env})
    await collectLive(fake)
    const code = await runCli(
      [
        'recommend',
        '/run/evidence.json',
        '--out-dir',
        '/out',
        '--run-url',
        RUN_URL,
        '--workflow-url',
        WORKFLOW_URL,
        ...extraArgs,
      ],
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
    expect(Object.keys(webhook).toSorted()).toEqual(['cli', 'headline', 'run_url', 'text'])
    expect(Object.keys(fallback)).toEqual(['text'])
    expect(webhook.run_url).toBe(WORKFLOW_URL)
    expect(webhook.text).toContain(`Full reasoning: ${RUN_URL}`)
    expect(webhook.text).toContain(`To promote: open ${WORKFLOW_URL}`)
    expect(fallback.text).toBe(
      `*${webhook.headline}*\n\n${webhook.text}\nFrom the CLI: \`${webhook.cli}\``,
    )
    expect(readFile(fake, '/out/summary.md')).toContain('@stable suggestion')
    const recommendation = JSON.parse(readFile(fake, '/out/recommendation.json')) as Recommendation
    expect(recommendation).toMatchObject({source: 'deterministic', fallbackReason: 'disabled'})
  })

  test('no API key falls back without calling the model', async () => {
    const {fake, code} = await recommend([])
    expect(code).toBe(0)
    const recommendation = JSON.parse(readFile(fake, '/out/recommendation.json')) as Recommendation
    expect(recommendation.fallbackReason).toBe('no-api-key')
  })

  test('a missing evidence argument exits 2', async () => {
    const fake = createFakeCli()
    expect(
      await runCli(
        ['recommend', '--out-dir', '/o', '--run-url', RUN_URL, '--workflow-url', WORKFLOW_URL],
        fake.deps,
      ),
    ).toBe(2)
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
        '--workflow-url',
        WORKFLOW_URL,
        '--no-llm',
      ],
      fake.deps,
    )
    expect(code).toBe(2)
  })
})

describe('GITHUB_OUTPUT validation', () => {
  test('refuses a value that fails its validator', () => {
    const entry = {name: 'route', value: 'none\nx=1', isValid: matchesOneOf(['none'])}
    expect(() => toOutputLines([entry])).toThrow(/route/)
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
