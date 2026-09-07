import {type SanityDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {migratedDocument} from './documentIdMigration'

const SHA = 'a'.repeat(40)

function doc(fields: Record<string, unknown> & {_id: string; _type: string}): SanityDocument {
  return {
    _rev: 'rev1',
    _createdAt: '2026-08-01T00:00:00Z',
    _updatedAt: '2026-08-02T00:00:00Z',
    ...fields,
  }
}

describe('migratedDocument', () => {
  it('moves a tag to a dot-free id and repoints its weak commit reference', () => {
    const result = migratedDocument(
      doc({
        _id: 'gitTag-v6.10.1',
        _type: 'gitTag',
        tag: 'v6.10.1',
        sha: SHA,
        commit: {_type: 'reference', _ref: `gitCommit-${SHA}`, _weak: true},
        major: 6,
      }),
    )
    expect(result?.legacyId).toBe('gitTag-v6.10.1')
    expect(result?.document).toEqual({
      _id: 'git-tag-v6-10-1',
      _type: 'gitTag',
      tag: 'v6.10.1',
      sha: SHA,
      commit: {_type: 'reference', _ref: `git-commit-${SHA}`, _weak: true},
      major: 6,
    })
  })

  it('drops the system fields the API owns', () => {
    const result = migratedDocument(doc({_id: `gitCommit-${SHA}`, _type: 'gitCommit', sha: SHA}))
    expect(result?.document).toEqual({_id: `git-commit-${SHA}`, _type: 'gitCommit', sha: SHA})
  })

  it('rebuilds a run id from its fields (PR runs stay one document per PR)', () => {
    const main = migratedDocument(
      doc({
        _id: `benchRun-${SHA}-424242`,
        _type: 'benchRun',
        git: {sha: SHA, branch: 'main', commit: {_type: 'reference', _ref: `gitCommit-${SHA}`}},
        runner: {runId: '424242', os: 'linux'},
      }),
    )
    expect(main?.document._id).toBe(`bench-run-${SHA}-424242`)
    expect(main?.document.git).toEqual({
      sha: SHA,
      branch: 'main',
      commit: {_type: 'reference', _ref: `git-commit-${SHA}`, _weak: true},
    })

    const pr = migratedDocument(
      doc({_id: 'benchRun-pr-777', _type: 'benchRun', git: {sha: SHA, prNumber: 777}, runner: {}}),
    )
    expect(pr?.document._id).toBe('bench-run-pr-777')
  })

  it('strips a commit reference a run cannot have (no full sha) instead of keeping a legacy one', () => {
    const local = migratedDocument(
      doc({
        _id: 'benchRun-unknown-local',
        _type: 'benchRun',
        git: {sha: 'unknown', commit: {_type: 'reference', _ref: 'gitCommit-unknown'}},
        runner: {},
      }),
    )
    expect(local?.document._id).toBe('bench-run-unknown-local')
    expect(local?.document.git).toEqual({sha: 'unknown'})
  })

  it('keeps the uuid of a bisect session and derives an ack id from metric + branch', () => {
    const uuid = '4bfb578b-c6f2-4df6-9c03-d1d54c216764'
    expect(
      migratedDocument(doc({_id: `bisectSession-${uuid}`, _type: 'bisectSession', title: 't'}))
        ?.document._id,
    ).toBe(`bisect-session-${uuid}`)
    expect(
      migratedDocument(
        doc({
          _id: 'driftAck-bundle-initialJs-main',
          _type: 'driftAck',
          metricKey: 'bundle:initialJs',
          branch: 'main',
        }),
      )?.document._id,
    ).toBe('drift-ack-bundle-initialjs-main')
  })

  it('leaves documents alone when the id is already new or the deriving fields are missing', () => {
    expect(
      migratedDocument(doc({_id: `git-commit-${SHA}`, _type: 'gitCommit', sha: SHA})),
    ).toBeUndefined()
    expect(migratedDocument(doc({_id: 'gitTag-v6.10.1', _type: 'gitTag'}))).toBeUndefined()
    expect(migratedDocument(doc({_id: 'benchRun-x', _type: 'benchRun', git: {}}))).toBeUndefined()
    expect(migratedDocument(doc({_id: 'other-1', _type: 'other'}))).toBeUndefined()
  })
})
