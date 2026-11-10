import {readFileSync} from 'node:fs'
import path from 'node:path'

import {describe, expect, test} from 'vitest'

import {
  dryRunTestCount,
  reusedMutantsFromLog,
  type StrykerMutant,
  type StrykerReport,
  zeroTestSurvivorsOf,
} from './report'

function reportWithMutants(mutants: StrykerMutant[]): StrykerReport {
  return {files: {'src/example.ts': {mutants}}}
}

describe('zeroTestSurvivorsOf', () => {
  test('flags a survivor that tests cover but that ran no test', () => {
    const survivors = zeroTestSurvivorsOf(
      reportWithMutants([
        {
          id: '7',
          mutatorName: 'ConditionalExpression',
          status: 'Survived',
          coveredBy: ['1', '2'],
          testsCompleted: 0,
          location: {start: {line: 12, column: 1}, end: {line: 12, column: 9}},
        },
      ]),
    )

    expect(survivors).toEqual([
      {file: 'src/example.ts', mutantId: '7', mutatorName: 'ConditionalExpression', line: 12},
    ])
  })

  test('accepts a survivor that ran its tests', () => {
    const survivors = zeroTestSurvivorsOf(
      reportWithMutants([
        {
          id: '1',
          mutatorName: 'StringLiteral',
          status: 'Survived',
          coveredBy: ['3'],
          testsCompleted: 1,
        },
      ]),
    )

    expect(survivors).toEqual([])
  })

  test('ignores mutants no test covers and mutants that were killed', () => {
    const survivors = zeroTestSurvivorsOf(
      reportWithMutants([
        {id: '1', mutatorName: 'Block', status: 'NoCoverage', coveredBy: [], testsCompleted: 0},
        {id: '2', mutatorName: 'Block', status: 'Killed', coveredBy: ['3'], testsCompleted: 0},
        {id: '3', mutatorName: 'Block', status: 'Survived', coveredBy: [], testsCompleted: 0},
      ]),
    )

    expect(survivors).toEqual([])
  })
})

describe('dryRunTestCount', () => {
  test('counts the tests across every test file of the report', () => {
    const report = JSON.parse(
      readFileSync(
        path.join(import.meta.dirname, '..', '__fixtures__', 'sanity-trimmed.stryker.json'),
        'utf8',
      ),
    ) as StrykerReport

    expect(dryRunTestCount(report)).toBe(11)
    expect(dryRunTestCount({files: {}})).toBe(0)
  })
})

describe('reusedMutantsFromLog', () => {
  test('reads the reused count through ANSI colour codes', () => {
    const log = 'Result:\t\t\u001B[93m1544\u001B[39m of 1606 mutant result(s) are reused.'

    expect(reusedMutantsFromLog(log)).toBe(1544)
  })

  test('is 0 when the log has no reuse line', () => {
    expect(reusedMutantsFromLog('Initial test run succeeded. Ran 396 tests')).toBe(0)
  })
})
