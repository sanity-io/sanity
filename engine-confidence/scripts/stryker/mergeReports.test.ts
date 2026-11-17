import {readFileSync} from 'node:fs'
import path from 'node:path'

import {describe, expect, test} from 'vitest'

import {mergeStrykerReports, type TargetReport} from './mergeReports'
import {type StrykerReport} from './report'

function fixture(name: string): StrykerReport {
  return JSON.parse(
    readFileSync(path.join(import.meta.dirname, '..', '__fixtures__', name), 'utf8'),
  ) as StrykerReport
}

const sanityReport: TargetReport = {
  target: 'sanity',
  packageDir: 'packages/sanity',
  report: fixture('sanity-trimmed.stryker.json'),
}
const mutatorReport: TargetReport = {
  target: 'mutator',
  packageDir: 'packages/@sanity/mutator',
  report: fixture('mutator-trimmed.stryker.json'),
}

describe('mergeStrykerReports', () => {
  test('prefixes every file with its package directory and keys each file', () => {
    const files = mergeStrykerReports([sanityReport, mutatorReport])

    expect(files.map((file) => [file._key, file.target, file.path])).toEqual([
      ['file-0', 'sanity', 'packages/sanity/src/core/form/patch/PatchChannel.ts'],
      ['file-1', 'sanity', 'packages/sanity/src/core/store/document/document-pair/memoizedPair.ts'],
      ['file-2', 'mutator', 'packages/@sanity/mutator/src/util.ts'],
      ['file-3', 'mutator', 'packages/@sanity/mutator/src/patch/UnsetPatch.ts'],
    ])
  })

  test('counts statuses per file', () => {
    const files = mergeStrykerReports([sanityReport, mutatorReport])
    const countsByPath = Object.fromEntries(files.map((file) => [file.path, file.counts]))

    expect(countsByPath['packages/sanity/src/core/form/patch/PatchChannel.ts']).toMatchObject({
      killed: 0,
      survived: 0,
      noCoverage: 16,
    })
    expect(
      countsByPath['packages/sanity/src/core/store/document/document-pair/memoizedPair.ts'],
    ).toMatchObject({killed: 8, survived: 2, noCoverage: 1})
  })

  test('makes absolute file names relative to the report project root', () => {
    const absoluteReport: TargetReport = {
      ...mutatorReport,
      report: {
        ...mutatorReport.report,
        files: Object.fromEntries(
          Object.entries(mutatorReport.report.files).map(([fileName, fileReport]) => [
            path.join('/repo/packages/@sanity/mutator', fileName),
            fileReport,
          ]),
        ),
      },
    }

    expect(mergeStrykerReports([absoluteReport]).map((file) => file.path)).toEqual([
      'packages/@sanity/mutator/src/util.ts',
      'packages/@sanity/mutator/src/patch/UnsetPatch.ts',
    ])
  })

  test('fails when a file is mutated in two reports', () => {
    expect(() => mergeStrykerReports([mutatorReport, mutatorReport])).toThrow(
      /more than one Stryker report: packages\/@sanity\/mutator\/src\/util\.ts/,
    )
  })

  test('fails on a mutant that is still pending', () => {
    const pendingReport: TargetReport = {
      ...mutatorReport,
      report: {
        files: {'src/util.ts': {mutants: [{id: '0', mutatorName: 'Block', status: 'Pending'}]}},
      },
    }

    expect(() => mergeStrykerReports([pendingReport])).toThrow(/pending/)
  })
})
