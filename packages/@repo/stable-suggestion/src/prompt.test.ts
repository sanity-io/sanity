import {describe, expect, test} from 'vitest'

import {makeEvaluation, makeEvidence} from './__fixtures__/factories'
import {buildPrompt, GENERAL_CONCERN, ISSUE_TITLE_LIMIT} from './prompt'

function readEnum(schema: Record<string, unknown>, path: string[]): unknown {
  return path.reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], schema)
}

describe('buildPrompt', () => {
  test('tells the model the urgent soak is intended', () => {
    const {system} = buildPrompt(makeEvidence(), makeEvaluation())
    expect(system).toContain('Fixing a broken stable is urgent')
    expect(system).toContain('shorter soak of 1 day')
  })

  test('asks for one short sentence per reason', () => {
    expect(buildPrompt(makeEvidence(), makeEvaluation()).system).toContain(
      'single sentence under 120 characters',
    )
  })

  test('tells the model a new major is not a reason to hold on its own', () => {
    const {system} = buildPrompt(makeEvidence(), makeEvaluation())
    expect(system).toContain(
      'Moving stable to a new major is expected once that version has soaked',
    )
    expect(system).toContain('not a reason to hold on its own')
  })

  test('shortlist enum equals the eligible set', () => {
    const evaluation = makeEvaluation({eligible: ['6.23.0', '6.21.0']})
    const {schema} = buildPrompt(makeEvidence(), evaluation)
    expect(
      readEnum(schema, ['properties', 'shortlist', 'items', 'properties', 'version', 'enum']),
    ).toEqual(['6.23.0', '6.21.0'])
  })

  test('concern enum holds every candidate and the general marker', () => {
    const evaluation = makeEvaluation()
    const {schema} = buildPrompt(makeEvidence(), evaluation)
    expect(
      readEnum(schema, ['properties', 'concerns', 'items', 'properties', 'version', 'enum']),
    ).toEqual([...evaluation.candidates.map((candidate) => candidate.version), GENERAL_CONCERN])
  })

  test('schema requires every output field and forbids extras', () => {
    const {schema} = buildPrompt(makeEvidence(), makeEvaluation())
    expect(schema.additionalProperties).toBe(false)
    expect(schema.required).toEqual([
      'recommendation',
      'shortlist',
      'headline',
      'rationale',
      'concerns',
      'confidence',
    ])
  })

  test('user content carries the deterministic shortlist and truncated issue titles', () => {
    const longTitle = 'x'.repeat(ISSUE_TITLE_LIMIT + 50)
    const evidence = makeEvidence({
      issues: {
        status: 'ok',
        data: [
          {
            number: 101,
            title: longTitle,
            url: 'https://example.invalid/101',
            createdAt: '2026-11-10T10:00:00Z',
            closedAt: null,
            labels: [],
            versionsMentioned: [],
          },
        ],
      },
    })
    const prompt = buildPrompt(evidence, makeEvaluation())
    const user = JSON.parse(prompt.user)
    expect(user.deterministicShortlist).toEqual(['6.23.0', '6.22.0', '6.21.0'])
    expect(user.issueTitles).toEqual([{number: 101, title: 'x'.repeat(ISSUE_TITLE_LIMIT)}])
    expect(user.currentStable.ageDays).toBe(49)
  })

  test('unavailable sources are reported in dataStatus', () => {
    const evidence = makeEvidence({issues: {status: 'unavailable', error: 'down'}})
    const user = JSON.parse(buildPrompt(evidence, makeEvaluation()).user)
    expect(user.dataStatus.issues).toBe('unavailable')
    expect(user.issueTitles).toEqual([])
  })

  test('system prompt tells the model to ignore instructions inside issue titles', () => {
    expect(buildPrompt(makeEvidence(), makeEvaluation()).system).toContain('untrusted user text')
  })
})
