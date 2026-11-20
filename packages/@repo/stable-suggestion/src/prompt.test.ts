import {describe, expect, test} from 'vitest'

import {makeEvaluation, makeEvidence} from './__fixtures__/factories'
import {ISSUE_TITLE_LIMIT} from './config'
import {EVIDENCE_SECTIONS} from './evidenceSections'
import {buildPrompt, GENERAL_CONCERN, loadSystemPrompt} from './prompt'

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
    expect(user.issues.titles).toEqual([{number: 101, title: 'x'.repeat(ISSUE_TITLE_LIMIT)}])
    expect(user.currentStable.ageDays).toBe(49)
  })

  test('unavailable sources are reported in dataStatus', () => {
    const evidence = makeEvidence({issues: {status: 'unavailable', error: 'down'}})
    const user = JSON.parse(buildPrompt(evidence, makeEvaluation()).user)
    expect(user.dataStatus.issues).toBe('unavailable')
    expect(user.issues.titles).toEqual([])
  })

  test('system prompt tells the model to ignore instructions inside issue titles', () => {
    expect(buildPrompt(makeEvidence(), makeEvaluation()).system).toContain('untrusted user text')
  })

  test('user content matches the snapshot', () => {
    const evaluation = makeEvaluation({
      openIssuesInRange: [
        {
          number: 101,
          title: 'Example issue title',
          url: 'https://example.invalid/101',
          versions: ['6.22.0', '6.23.0'],
          createdAt: '2026-11-10T10:00:00Z',
        },
      ],
    })
    expect(JSON.parse(buildPrompt(makeEvidence(), evaluation).user)).toMatchSnapshot()
  })
})

describe('loadSystemPrompt', () => {
  test('loads the prompt file and fills its placeholders', () => {
    const system = loadSystemPrompt()
    expect(system.length).toBeGreaterThan(0)
    expect(system).not.toContain('{{')
    expect(system).toContain('which already-published sanity version')
    expect(system).toContain('1 to 3 versions')
  })
})

describe('EVIDENCE_SECTIONS', () => {
  const evaluation = makeEvaluation()

  test('every section contributes its key to the user content', () => {
    const user = JSON.parse(buildPrompt(makeEvidence(), evaluation).user)
    EVIDENCE_SECTIONS.forEach((section) => expect(user).toHaveProperty(section.key))
  })

  test('section keys are unique', () => {
    const keys = EVIDENCE_SECTIONS.map((section) => section.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  test('removing a section removes its key from the user content', () => {
    const sections = EVIDENCE_SECTIONS.filter((section) => section.key !== 'sqrl')
    const user = JSON.parse(buildPrompt(makeEvidence(), evaluation, sections).user)
    expect(user).not.toHaveProperty('sqrl')
    expect(user).toHaveProperty('soak')
  })

  test('sections appear in array order', () => {
    const reversed = EVIDENCE_SECTIONS.toReversed()
    const user = JSON.parse(buildPrompt(makeEvidence(), evaluation, reversed).user)
    expect(Object.keys(user).slice(-reversed.length)).toEqual(
      reversed.map((section) => section.key),
    )
  })

  test('the issuesInRange section carries truncated titles and versions', () => {
    const longTitle = 'y'.repeat(ISSUE_TITLE_LIMIT + 10)
    const withIssue = makeEvaluation({
      openIssuesInRange: [
        {
          number: 7,
          title: longTitle,
          url: 'https://example.invalid/7',
          versions: ['6.23.0'],
          createdAt: '2026-11-10T10:00:00Z',
        },
      ],
    })
    const user = JSON.parse(buildPrompt(makeEvidence(), withIssue).user)
    expect(user.issuesInRange).toEqual([
      {number: 7, title: 'y'.repeat(ISSUE_TITLE_LIMIT), versions: ['6.23.0']},
    ])
  })
})
