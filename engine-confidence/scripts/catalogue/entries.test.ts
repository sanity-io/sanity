import {readdirSync} from 'node:fs'
import path from 'node:path'

import {describe, expect, test} from 'vitest'

import {catalogueDirectory} from '../paths'
import {
  CATALOGUE_CHECK_PATH_PREFIXES,
  filesInPatch,
  filesInPatchFile,
  isActive,
  loadCatalogueEntries,
  sidecarProblems,
} from './entries'

const entries = loadCatalogueEntries(catalogueDirectory)

function isUnderCheckedPaths(file: string): boolean {
  return CATALOGUE_CHECK_PATH_PREFIXES.some((prefix) => file.startsWith(prefix))
}

describe('the committed catalogue', () => {
  test('has one sidecar per patch', () => {
    const fileNames = readdirSync(catalogueDirectory)
    const patchNames = fileNames.filter((name) => name.endsWith('.patch')).toSorted()
    const sidecarNames = fileNames.filter((name) => name.endsWith('.json')).toSorted()

    expect(patchNames.length).toBeGreaterThan(0)
    expect(patchNames.map((name) => name.replace('.patch', ''))).toEqual(
      sidecarNames.map((name) => name.replace('.json', '')),
    )
  })

  test.each(entries.map((entry) => [entry.metadata.id, entry] as const))(
    '%s has a valid sidecar whose id matches its file name',
    (_id, entry) => {
      expect(sidecarProblems(entry.metadata)).toEqual([])
      expect(path.basename(entry.patchPath).startsWith(`${entry.metadata.id}-`)).toBe(true)
    },
  )

  test('never reuses an id', () => {
    const ids = entries.map((entry) => entry.metadata.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  test.each(entries.map((entry) => [entry.metadata.id, entry] as const))(
    '%s lists exactly the files its patch touches',
    (_id, entry) => {
      expect(filesInPatchFile(entry.patchPath).toSorted()).toEqual(
        [...entry.metadata.filesTouched].toSorted(),
      )
    },
  )

  test.each(entries.map((entry) => [entry.metadata.id, entry] as const))(
    '%s only touches paths the pull request check watches',
    (_id, entry) => {
      const touched = [
        ...entry.metadata.filesTouched,
        ...(entry.witnessPatchPath === undefined ? [] : filesInPatchFile(entry.witnessPatchPath)),
      ]

      expect(touched.filter((file) => isUnderCheckedPaths(file) === false)).toEqual([])
    },
  )

  test('keeps a retired entry out of the active list', () => {
    expect(
      isActive({
        patchPath: 'x',
        metadata: {...entries[0].metadata, retiredOn: '2026-11-01', retiredReason: 'code removed'},
      }),
    ).toBe(false)
    expect(entries.every(isActive)).toBe(true)
  })
})

describe('sidecarProblems', () => {
  const valid = entries[0].metadata

  test('accepts a complete sidecar', () => {
    expect(sidecarProblems(valid)).toEqual([])
  })

  test('names every missing or malformed field', () => {
    const problems = sidecarProblems({
      ...valid,
      id: 'ENG-1-bad',
      severity: 'S9',
      filesTouched: [],
      notApplicableSuites: ['unit:nowhere'],
      title: '',
    })

    expect(problems).toEqual([
      'title must be a non-empty string',
      'id must look like ENG-001',
      'severity must be S1, S2 or S3',
      'filesTouched must list at least one file',
      'notApplicableSuites must be a list of known suite ids',
    ])
  })

  test('requires a reason when an entry is retired', () => {
    expect(sidecarProblems({...valid, retiredOn: '2026-11-01'})).toEqual([
      'retiredOn needs a retiredReason',
    ])
  })
})

describe('filesInPatch', () => {
  test('lists the destination file of each diff in the patch', () => {
    const patchText = [
      'diff --git a/packages/a.ts b/packages/a.ts',
      '--- a/packages/a.ts',
      '+++ b/packages/a.ts',
      '@@ -1 +1 @@',
      'diff --git a/packages/b.ts b/packages/b.ts',
      '--- a/packages/b.ts',
      '+++ b/packages/b.ts',
    ].join('\n')

    expect(filesInPatch(patchText)).toEqual(['packages/a.ts', 'packages/b.ts'])
  })
})
