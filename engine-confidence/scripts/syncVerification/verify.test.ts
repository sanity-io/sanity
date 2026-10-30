import {describe, expect, test} from 'vitest'

import {loadFixtureReport} from './__fixtures__/loadFixtureReport'
import {generatorReportProblems} from './generatorReport'
import {dryRunLines} from './verify'

describe('generatorReportProblems', () => {
  test('accepts the fixture report', () => {
    expect(generatorReportProblems(loadFixtureReport())).toEqual([])
  })

  test('names every malformed field', () => {
    const report = loadFixtureReport()
    const [failure] = report.failures
    const broken = {
      ...report,
      version: 2,
      failures: [
        {
          ...failure,
          signature: '',
          submissions: [{...failure.submissions[0], request: {kind: 'listen'}, injected: 'no'}],
        },
      ],
    }
    expect(generatorReportProblems(broken)).toEqual([
      'version must be 1',
      'failures[0].signature must be a non-empty string',
      'failures[0].submissions[0].injected must be a boolean',
      'failures[0].submissions[0].request.kind must be one of actions, mutations, outside',
    ])
  })
})

describe('dryRunLines', () => {
  test('lists what each failure would replay and skip', () => {
    const lines = dryRunLines(loadFixtureReport())
    expect(lines[0]).toBe('Report a669759627 (pair seam): 5 failure(s), 2 passing sample(s)')
    expect(lines).toContain('[sample 1] seed 12 run 80')
    expect(lines).toContain(
      '    replay #1 actions (1 action) -> POST data/actions; recorded 400 mutationError, model 400 mutationError',
    )
    expect(lines).toContain('    skip   #0 (injected)')
    expect(lines).toContain('    not verifiable: a dropped listener event')
  })
})
