import {spawnSync} from 'node:child_process'
import {mkdtempSync, writeFileSync} from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {describe, expect, test} from 'vitest'

import {runDocumentProblems} from './runDocument'
import {parseRunDocument} from './store'

const validDocument = {
  _id: 'engine-confidence-run-2026-w42',
  _type: 'engineConfidenceRun',
  schemaVersion: 1,
  isoWeek: '2026-W42',
  startedAt: '2026-10-15T03:00:00.000Z',
  headline: {measuresUsed: []},
}

describe('runDocumentProblems', () => {
  test('accepts a document filed under its own ISO week', () => {
    expect(runDocumentProblems(validDocument as never)).toEqual([])
  })

  test('rejects a document with the wrong type or schema version', () => {
    const problems = runDocumentProblems({
      ...validDocument,
      _type: 'benchRun',
      schemaVersion: 2,
    } as never)

    expect(problems).toEqual([
      '_type must be engineConfidenceRun, got benchRun',
      'schemaVersion must be 1',
    ])
  })

  test('rejects an _id that is not derived from the ISO week', () => {
    const problems = runDocumentProblems({
      ...validDocument,
      _id: 'engine-confidence-run-latest',
    } as never)

    expect(problems).toEqual([
      '_id must be engine-confidence-run-2026-w42, got engine-confidence-run-latest',
    ])
  })

  test('rejects an isoWeek that disagrees with startedAt', () => {
    const problems = runDocumentProblems({...validDocument, isoWeek: '2026-W41'} as never)

    expect(problems).toContain('isoWeek must be 2026-W42 for startedAt 2026-10-15T03:00:00.000Z')
  })
})

describe('parseRunDocument', () => {
  test('returns a valid document', () => {
    expect(parseRunDocument(JSON.stringify(validDocument))._id).toBe(validDocument._id)
  })

  test('throws with every problem listed', () => {
    expect(() => parseRunDocument(JSON.stringify({...validDocument, schemaVersion: 9}))).toThrow(
      /schemaVersion must be 1/,
    )
  })
})

describe('store --dry-run', () => {
  test('prints the id and the document without needing a token', () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'engine-confidence-store-'))
    const documentPath = path.join(directory, 'run.json')
    writeFileSync(documentPath, JSON.stringify(validDocument))

    const result = spawnSync(
      process.execPath,
      ['--conditions=monorepo', '--import', 'tsx', 'scripts/store.ts', documentPath, '--dry-run'],
      {
        cwd: path.join(import.meta.dirname, '..'),
        encoding: 'utf8',
        env: {...process.env, RADAR_SANITY_WRITE_TOKEN: ''},
      },
    )

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Would store engine-confidence-run-2026-w42')
    expect(result.stdout).toContain('"isoWeek": "2026-W42"')
  })

  test('exits 1 for an invalid document', () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'engine-confidence-store-'))
    const documentPath = path.join(directory, 'run.json')
    writeFileSync(documentPath, JSON.stringify({...validDocument, _id: 'wrong'}))

    const result = spawnSync(
      process.execPath,
      ['--conditions=monorepo', '--import', 'tsx', 'scripts/store.ts', documentPath, '--dry-run'],
      {cwd: path.join(import.meta.dirname, '..'), encoding: 'utf8'},
    )

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('_id must be engine-confidence-run-2026-w42')
  })
})
