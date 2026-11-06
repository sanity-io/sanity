import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'

import {afterEach, beforeEach, describe, expect, test} from 'vitest'

import {loadFixtureReport} from './__fixtures__/loadFixtureReport'
import {readPairs} from './readPairs'

const report = loadFixtureReport()

describe('readPairs', () => {
  let directory = ''

  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), 'read-pairs-'))
  })

  afterEach(() => {
    rmSync(directory, {recursive: true, force: true})
  })

  function write(name: string, content: unknown): string {
    const filePath = path.join(directory, name)
    writeFileSync(filePath, typeof content === 'string' ? content : JSON.stringify(content))
    return filePath
  }

  const verdicts = {version: 1, commit: report.commit, seam: report.seam, verdicts: []}

  test('reads every readable pair', () => {
    const {pairs, errors} = readPairs([
      write('report-a.json', report),
      write('verdicts-a.json', verdicts),
      write('report-b.json', report),
      write('verdicts-b.json', verdicts),
    ])
    expect(pairs).toHaveLength(2)
    expect(errors).toEqual([])
  })

  test('reports a missing verdicts file as an error and keeps the other pairs', () => {
    const {pairs, errors} = readPairs([
      write('report-a.json', report),
      path.join(directory, 'verdicts-missing.json'),
      write('report-b.json', report),
      write('verdicts-b.json', verdicts),
    ])
    expect(pairs).toHaveLength(1)
    expect(errors).toEqual([
      expect.objectContaining({
        action: 'error',
        signature: 'verdicts-missing.json',
        seam: report.seam,
        reason: expect.stringContaining('could not read the verdicts file'),
      }),
    ])
  })

  test('reports an unparsable verdicts file as an error', () => {
    const {pairs, errors} = readPairs([
      write('report-a.json', report),
      write('verdicts-a.json', '{not json'),
    ])
    expect(pairs).toEqual([])
    expect(errors).toHaveLength(1)
    expect(errors[0].reason).toContain('could not read the verdicts file')
  })

  test('reports an unreadable report as an error without a seam', () => {
    const {pairs, errors} = readPairs([
      write('report-a.json', 'garbage'),
      write('verdicts-a.json', verdicts),
    ])
    expect(pairs).toEqual([])
    expect(errors).toEqual([expect.objectContaining({signature: 'report-a.json', action: 'error'})])
    expect(errors[0].seam).toBeUndefined()
  })
})
