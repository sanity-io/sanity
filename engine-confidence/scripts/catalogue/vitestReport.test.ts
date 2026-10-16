import {describe, expect, test} from 'vitest'

import {
  failingTestsOf,
  namePatternFor,
  newFailuresOf,
  uniqueFilesOf,
  type VitestJsonReport,
} from './vitestReport'

const report: VitestJsonReport = {
  testResults: [
    {
      name: '/repo/packages/sanity/src/a.test.ts',
      status: 'failed',
      assertionResults: [
        {status: 'passed', title: 'works', ancestorTitles: ['a'], fullName: 'a works'},
        {status: 'failed', title: 'breaks (1.5)', ancestorTitles: ['a', 'nested'], fullName: 'x'},
      ],
    },
    {name: '/repo/packages/sanity/src/b.test.ts', status: 'failed', assertionResults: []},
    {name: '/repo/packages/sanity/src/c.test.ts', status: 'passed', assertionResults: []},
  ],
}

describe('failingTestsOf', () => {
  test('lists failed assertions with repo-relative files and ` > ` names', () => {
    const failing = failingTestsOf(report, '/repo')

    expect(failing[0]).toEqual({
      file: 'packages/sanity/src/a.test.ts',
      name: 'a > nested > breaks (1.5)',
      id: 'packages/sanity/src/a.test.ts > a > nested > breaks (1.5)',
    })
  })

  test('reports a file that failed without any assertion as failing to run', () => {
    expect(failingTestsOf(report, '/repo')[1]).toMatchObject({
      file: 'packages/sanity/src/b.test.ts',
      name: '(file failed to run)',
    })
  })
})

describe('newFailuresOf', () => {
  test('keeps only failures missing from the baseline', () => {
    const current = failingTestsOf(report, '/repo')
    const baseline = [current[0]]

    expect(newFailuresOf(current, baseline).map((failure) => failure.file)).toEqual([
      'packages/sanity/src/b.test.ts',
    ])
  })
})

describe('namePatternFor', () => {
  test('builds a regex that matches the escaped test names', () => {
    const pattern = namePatternFor(failingTestsOf(report, '/repo').slice(0, 1))

    expect(pattern).toBeDefined()
    expect(new RegExp(pattern ?? '').test('a > nested > breaks (1.5)')).toBe(true)
    expect(new RegExp(pattern ?? '').test('a > nested > breaks (1x5)')).toBe(false)
  })

  test('has no pattern when a failure is a whole file', () => {
    expect(namePatternFor(failingTestsOf(report, '/repo'))).toBeUndefined()
  })
})

describe('uniqueFilesOf', () => {
  test('lists each file once', () => {
    const failing = failingTestsOf(report, '/repo')

    expect(uniqueFilesOf([...failing, ...failing])).toEqual([
      'packages/sanity/src/a.test.ts',
      'packages/sanity/src/b.test.ts',
    ])
  })
})
