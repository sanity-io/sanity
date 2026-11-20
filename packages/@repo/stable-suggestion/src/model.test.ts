import {afterEach, describe, expect, test, vi} from 'vitest'

import {makeEvaluation, makeEvidence} from './__fixtures__/factories'
import {MODEL_ENV_VAR, SHORTLIST_SIZE, TEXT_LIMITS} from './config'
import {
  askModel,
  deterministicRecommendation,
  toRecommendation,
  type ModelAnswer,
  type ModelClient,
} from './model'
import {buildPrompt} from './prompt'

const MODEL = 'test-model'

function answered(output: unknown, stopReason: string | null = 'end_turn'): ModelAnswer {
  const text = typeof output === 'string' ? output : JSON.stringify(output)
  return {status: 'answered', stopReason, text}
}

function validOutput(overrides: Record<string, unknown> = {}) {
  return {
    recommendation: 'promote',
    shortlist: [
      {version: '6.22.0', reason: 'Has the longest soak.'},
      {version: '6.23.0', reason: 'Newest.'},
    ],
    headline: 'Promote 6.22.0',
    rationale: 'Because soak.',
    concerns: [{version: '6.23.0', note: 'Open report.'}],
    confidence: 'high',
    ...overrides,
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('toRecommendation', () => {
  const evaluation = makeEvaluation()

  test('strips bare URLs from model text', () => {
    const output = validOutput({
      rationale: 'See https://evil.example/x for details',
      headline: 'Go to http://evil.example now',
    })
    const result = toRecommendation(answered(output), evaluation, MODEL)
    expect(result.rationale).toBe('See  for details')
    expect(result.headline).not.toContain('evil.example')
  })

  test('accepts a valid answer and numbers the slots', () => {
    const result = toRecommendation(answered(validOutput()), evaluation, MODEL)
    expect(result).toMatchObject({
      source: 'model',
      fallbackReason: null,
      model: MODEL,
      decision: 'promote',
      confidence: 'high',
      headline: 'Promote 6.22.0',
    })
    expect(result.shortlist).toEqual([
      {slot: 1, version: '6.22.0', reason: 'Has the longest soak.'},
      {slot: 2, version: '6.23.0', reason: 'Newest.'},
    ])
  })

  test('falls back when a shortlisted version is outside the eligible set', () => {
    const output = validOutput({shortlist: [{version: '6.24.0', reason: 'Too new.'}]})
    const result = toRecommendation(answered(output), evaluation, MODEL)
    expect(result).toMatchObject({source: 'deterministic', fallbackReason: 'outside-eligible-set'})
    expect(result.shortlist.map((entry) => entry.version)).toEqual(evaluation.shortlist)
  })

  test('dedupes repeated versions keeping the first', () => {
    const output = validOutput({
      shortlist: [
        {version: '6.23.0', reason: 'first'},
        {version: '6.23.0', reason: 'second'},
        {version: '6.22.0', reason: 'other'},
      ],
    })
    const result = toRecommendation(answered(output), evaluation, MODEL)
    expect(result.shortlist).toEqual([
      {slot: 1, version: '6.23.0', reason: 'first'},
      {slot: 2, version: '6.22.0', reason: 'other'},
    ])
  })

  test('keeps only the first SHORTLIST_SIZE entries', () => {
    const wide = makeEvaluation({
      eligible: ['6.23.0', '6.22.0', '6.21.0', '6.20.0'],
      shortlist: ['6.23.0', '6.22.0', '6.21.0'],
    })
    const output = validOutput({
      shortlist: wide.eligible.map((version) => ({version, reason: 'ok'})),
    })
    const result = toRecommendation(answered(output), wide, MODEL)
    expect(result.shortlist).toHaveLength(SHORTLIST_SIZE)
    expect(result.shortlist.map((entry) => entry.slot)).toEqual([1, 2, 3])
  })

  test('hold keeps the model shortlist', () => {
    const result = toRecommendation(
      answered(validOutput({recommendation: 'hold'})),
      evaluation,
      MODEL,
    )
    expect(result).toMatchObject({source: 'model', decision: 'hold'})
    expect(result.shortlist.map((entry) => entry.version)).toEqual(['6.22.0', '6.23.0'])
  })

  test('hold without a shortlist uses the deterministic one', () => {
    const result = toRecommendation(
      answered(validOutput({recommendation: 'hold', shortlist: []})),
      evaluation,
      MODEL,
    )
    expect(result).toMatchObject({source: 'model', decision: 'hold'})
    expect(result.shortlist.map((entry) => entry.version)).toEqual(evaluation.shortlist)
  })

  test('promote with an empty shortlist falls back', () => {
    const result = toRecommendation(answered(validOutput({shortlist: []})), evaluation, MODEL)
    expect(result).toMatchObject({source: 'deterministic', fallbackReason: 'empty-shortlist'})
  })

  test('refusal falls back', () => {
    const result = toRecommendation(answered(validOutput(), 'refusal'), evaluation, MODEL)
    expect(result.fallbackReason).toBe('refusal')
  })

  test('max_tokens falls back as truncated', () => {
    const result = toRecommendation(answered('{"recommendation"', 'max_tokens'), evaluation, MODEL)
    expect(result.fallbackReason).toBe('truncated')
  })

  test('invalid json falls back', () => {
    expect(toRecommendation(answered('not json'), evaluation, MODEL).fallbackReason).toBe(
      'invalid-json',
    )
  })

  test('a wrong shape falls back as invalid json', () => {
    const result = toRecommendation(
      answered(validOutput({confidence: 'certain'})),
      evaluation,
      MODEL,
    )
    expect(result.fallbackReason).toBe('invalid-json')
  })

  test('empty eligible set is deterministic with its own reason', () => {
    const empty = makeEvaluation({eligible: [], shortlist: []})
    const result = toRecommendation(answered(validOutput()), empty, MODEL)
    expect(result).toMatchObject({
      source: 'deterministic',
      fallbackReason: 'no-eligible-versions',
      decision: 'hold',
      shortlist: [],
    })
  })

  test('strips control characters, caps lengths and drops unknown concern versions', () => {
    const output = validOutput({
      headline: `Head\u0000line${'h'.repeat(500)}`,
      rationale: `Line one\nLine\u0007 two ${'r'.repeat(3000)}`,
      shortlist: [{version: '6.23.0', reason: `reason\u001b${'a'.repeat(1000)}`}],
      concerns: [
        {version: '9.9.9', note: 'unknown'},
        {version: 'general', note: `note${'n'.repeat(1000)}`},
      ],
    })
    const result = toRecommendation(answered(output), evaluation, MODEL)
    expect(result.headline.startsWith('Headline')).toBe(true)
    expect(result.headline).toHaveLength(TEXT_LIMITS.headline)
    expect(result.rationale).toContain('Line one\nLine two')
    expect(result.rationale).toHaveLength(TEXT_LIMITS.rationale)
    expect(result.shortlist[0]?.reason).toHaveLength(TEXT_LIMITS.reason)
    expect(result.shortlist[0]?.reason.startsWith('reasonaaa')).toBe(true)
    expect(result.concerns).toHaveLength(1)
    expect(result.concerns[0]?.note).toHaveLength(TEXT_LIMITS.note)
  })

  test('a failed answer maps to its reason', () => {
    const result = toRecommendation({status: 'failed', reason: 'api-error'}, evaluation, MODEL)
    expect(result).toMatchObject({source: 'deterministic', fallbackReason: 'api-error'})
  })
})

describe('deterministicRecommendation', () => {
  test('promotes the top of the deterministic shortlist', () => {
    const result = deterministicRecommendation(makeEvaluation(), 'no-api-key')
    expect(result).toMatchObject({
      decision: 'promote',
      source: 'deterministic',
      fallbackReason: 'no-api-key',
      model: null,
      confidence: null,
      headline: 'Promote 6.23.0',
    })
    expect(result.shortlist.map((entry) => entry.slot)).toEqual([1, 2, 3])
  })

  test('holds when nothing is eligible and names the blocking reasons', () => {
    const blocked = makeEvaluation({eligible: [], shortlist: []})
    const result = deterministicRecommendation(blocked, 'disabled')
    expect(result.decision).toBe('hold')
    expect(result.rationale).toContain('too-new x1')
  })
})

describe('askModel', () => {
  const prompt = buildPrompt(makeEvidence(), makeEvaluation())

  test('sends the configured model, effort and json schema, and joins text blocks', async () => {
    vi.stubEnv(MODEL_ENV_VAR, 'override-model')
    const create = vi.fn<ModelClient['messages']['create']>(async () => ({
      content: [{type: 'thinking'}, {type: 'text', text: '{"a":'}, {type: 'text', text: '1}'}],
      stop_reason: 'end_turn',
    }))
    const answer = await askModel({messages: {create}}, prompt)
    expect(answer).toEqual({status: 'answered', stopReason: 'end_turn', text: '{"a":1}'})
    const [params, options] = create.mock.calls[0] ?? []
    expect(params).toMatchObject({
      model: 'override-model',
      system: prompt.system,
      output_config: {effort: 'medium', format: {type: 'json_schema', schema: prompt.schema}},
    })
    expect(options).toEqual({timeout: 120_000, maxRetries: 2})
  })

  test('maps a thrown error to api-error without rethrowing', async () => {
    const create = vi.fn<ModelClient['messages']['create']>(async () => {
      throw new Error('boom')
    })
    const answer = await askModel({messages: {create}}, prompt)
    expect(answer).toEqual({status: 'failed', reason: 'api-error'})
    expect(toRecommendation(answer, makeEvaluation(), MODEL).fallbackReason).toBe('api-error')
  })
})
