import {describe, expect, it} from 'vitest'

import {
  assembleSyncDocuments,
  commitDocument,
  commitDocumentId,
  parseCommitRecords,
  parseConventionalSubject,
  parsePrNumber,
  parseTagRefs,
  tagDocument,
} from './gitHistory'

const FS = '\x1f'
const RS = '\x1e'

const SHA_A = 'a'.repeat(40)
const SHA_B = 'b'.repeat(40)
const SHA_C = 'c'.repeat(40)
const SHA_D = 'd'.repeat(40)

function commitRecord(subject: string, sha = SHA_A, parents = SHA_C): string {
  return [
    sha,
    'Ada Lovelace',
    'ada@example.com',
    '2026-08-20T10:10:34+01:00',
    '2026-08-20T11:10:34+02:00',
    subject,
    parents,
  ].join(FS)
}

describe('parseCommitRecords', () => {
  it('parses git log output into commit infos', () => {
    const raw = `${commitRecord('feat(form): add thing (#123)')}${RS}\n${commitRecord('plain subject', SHA_B)}${RS}\n`
    expect(parseCommitRecords(raw)).toEqual([
      {
        sha: SHA_A,
        authorName: 'Ada Lovelace',
        authorEmail: 'ada@example.com',
        authoredAt: '2026-08-20T10:10:34+01:00',
        committedAt: '2026-08-20T11:10:34+02:00',
        subject: 'feat(form): add thing (#123)',
        parentSha: SHA_C,
      },
      expect.objectContaining({sha: SHA_B, subject: 'plain subject'}),
    ])
  })

  it('takes the first parent of a merge commit and omits parentSha on a root commit', () => {
    const merge = parseCommitRecords(`${commitRecord('merge', SHA_A, `${SHA_C} ${SHA_D}`)}${RS}`)
    expect(merge[0].parentSha).toBe(SHA_C)
    const root = parseCommitRecords(`${commitRecord('initial commit', SHA_A, '')}${RS}`)
    expect(root[0]).not.toHaveProperty('parentSha')
  })

  it('keeps subjects containing pipes and parens intact', () => {
    const raw = `${commitRecord('fix(x): handle `a | b` case (really) (#9)')}${RS}`
    expect(parseCommitRecords(raw)[0].subject).toBe('fix(x): handle `a | b` case (really) (#9)')
  })

  it('returns no records for empty output', () => {
    expect(parseCommitRecords('')).toEqual([])
    expect(parseCommitRecords('\n')).toEqual([])
  })

  it('throws on a record with the wrong field count instead of mis-attributing', () => {
    const raw = `${SHA_A}${FS}only-three${FS}fields${RS}`
    expect(() => parseCommitRecords(raw)).toThrow(/Malformed commit record \(3 fields/)
  })
})

describe('parseConventionalSubject', () => {
  it('parses type, scope and breaking marker', () => {
    expect(parseConventionalSubject('feat(form): add array input')).toEqual({
      commitType: 'feat',
      scope: 'form',
    })
    expect(parseConventionalSubject('feat(sanity)!: drop node 18')).toEqual({
      commitType: 'feat',
      scope: 'sanity',
      breaking: true,
    })
    expect(parseConventionalSubject('chore: bump deps')).toEqual({commitType: 'chore'})
  })

  it('returns {} for non-conforming subjects (about half the history)', () => {
    expect(parseConventionalSubject('Merge pull request #100 from sanity-io/x')).toEqual({})
    expect(parseConventionalSubject('Revert "feat(form): add array input"')).toEqual({})
    expect(parseConventionalSubject('[form] add array input')).toEqual({})
    // Colon without the required following space
    expect(parseConventionalSubject('fix:no space')).toEqual({})
  })
})

describe('parsePrNumber', () => {
  it('parses the trailing squash-merge PR number', () => {
    expect(parsePrNumber('feat(form): add thing (#14197)')).toBe(14197)
    expect(parsePrNumber('feat(form): add thing (#14197) ')).toBe(14197)
  })

  it('ignores mid-subject references and bare numbers', () => {
    expect(parsePrNumber('fix(#123): odd scope')).toBeUndefined()
    expect(parsePrNumber('revert (#123) then more words')).toBeUndefined()
    expect(parsePrNumber('fix issue #123')).toBeUndefined()
    expect(parsePrNumber('no pr here')).toBeUndefined()
  })
})

function tagLine(tag: string, dereferencedSha: string, objectSha: string): string {
  return [tag, '2026-08-18T15:10:53Z', dereferencedSha, objectSha].join(FS)
}

describe('parseTagRefs', () => {
  it('parses annotated release tags via the dereferenced sha', () => {
    expect(parseTagRefs(tagLine('v6.10.0', SHA_A, SHA_B))).toEqual([
      {tag: 'v6.10.0', taggedAt: '2026-08-18T15:10:53Z', sha: SHA_A, major: 6, minor: 10, patch: 0},
    ])
  })

  it('falls back to the object sha for lightweight tags', () => {
    expect(parseTagRefs(tagLine('v5.31.2', '', SHA_B))[0].sha).toBe(SHA_B)
  })

  it('parses prerelease identifiers', () => {
    expect(parseTagRefs(tagLine('v6.0.0-rc.1', SHA_A, SHA_B))[0]).toMatchObject({
      major: 6,
      minor: 0,
      patch: 0,
      prerelease: 'rc.1',
    })
  })

  it('filters junk refs and pre-cutoff majors', () => {
    const raw = [
      tagLine('backup/graceful-errors-rebase2', '', SHA_B),
      tagLine('test-tag', '', SHA_B),
      tagLine('sanity-v3.86.0', SHA_A, SHA_B),
      tagLine('v3.86.0', SHA_A, SHA_B),
      tagLine('v4.10.1', SHA_A, SHA_B),
      tagLine('v0.144.3', SHA_A, SHA_B),
      tagLine('v6.10.1', SHA_A, SHA_B),
    ].join('\n')
    expect(parseTagRefs(raw).map((t) => t.tag)).toEqual(['v6.10.1'])
  })

  it('throws on a structurally broken record', () => {
    expect(() => parseTagRefs(`v6.10.1${FS}2026-08-18`)).toThrow(/Malformed tag record \(2 fields/)
  })
})

describe('commitDocument', () => {
  it('builds a deterministic id and merges parsed fields', () => {
    const doc = commitDocument({
      sha: SHA_A,
      parentSha: SHA_C,
      authorName: 'Ada Lovelace',
      authorEmail: 'ada@example.com',
      authoredAt: '2026-08-20T10:10:34+01:00',
      committedAt: '2026-08-20T11:10:34+02:00',
      subject: 'feat(form)!: add thing (#123)',
    })
    expect(doc).toEqual({
      _id: `gitCommit-${SHA_A}`,
      _type: 'gitCommit',
      schemaVersion: 1,
      sha: SHA_A,
      parentSha: SHA_C,
      authorName: 'Ada Lovelace',
      authorEmail: 'ada@example.com',
      authoredAt: '2026-08-20T10:10:34+01:00',
      committedAt: '2026-08-20T11:10:34+02:00',
      subject: 'feat(form)!: add thing (#123)',
      commitType: 'feat',
      scope: 'form',
      breaking: true,
      prNumber: 123,
    })
  })

  it('omits optional fields for non-conforming subjects', () => {
    const doc = commitDocument({
      sha: SHA_A,
      authorName: 'Ada Lovelace',
      authorEmail: 'ada@example.com',
      authoredAt: '2026-08-20T10:10:34+01:00',
      committedAt: '2026-08-20T11:10:34+02:00',
      subject: 'Update README',
    })
    expect(doc).not.toHaveProperty('commitType')
    expect(doc).not.toHaveProperty('scope')
    expect(doc).not.toHaveProperty('breaking')
    expect(doc).not.toHaveProperty('prNumber')
    expect(doc).not.toHaveProperty('parentSha')
  })
})

describe('tagDocument', () => {
  it('builds a deterministic id and a weak reference matching the commit doc id', () => {
    const doc = tagDocument({
      tag: 'v6.10.1',
      taggedAt: '2026-08-18T21:56:56Z',
      sha: SHA_A,
      major: 6,
      minor: 10,
      patch: 1,
    })
    expect(doc._id).toBe('gitTag-v6.10.1')
    expect(doc.commit).toEqual({_type: 'reference', _ref: commitDocumentId(SHA_A), _weak: true})
    expect(doc).toMatchObject({tag: 'v6.10.1', sha: SHA_A, major: 6, minor: 10, patch: 1})
    expect(doc).not.toHaveProperty('prerelease')
  })
})

describe('assembleSyncDocuments', () => {
  const commit = (sha: string) =>
    commitDocument({
      sha,
      authorName: 'Ada Lovelace',
      authorEmail: 'ada@example.com',
      authoredAt: '2026-08-20T10:10:34+01:00',
      committedAt: '2026-08-20T11:10:34+02:00',
      subject: 'fix: thing',
    })
  const tag = tagDocument({
    tag: 'v6.0.0',
    taggedAt: '2026-08-18T00:00:00Z',
    sha: SHA_C,
    major: 6,
    minor: 0,
    patch: 0,
  })

  it('omits commits whose GitHub lookup did not run — writing them would erase enrichment', () => {
    const result = assembleSyncDocuments({
      commits: [commit(SHA_A), commit(SHA_B)],
      tags: [],
      github: {
        info: new Map([[SHA_A, {testStudioUrl: 'https://a.sanity.dev', authorLogin: 'ada'}]]),
        queriedShas: new Set([SHA_A]), // SHA_B's batch failed
      },
    })
    expect(result.commitCount).toBe(1)
    expect(result.skippedCommitCount).toBe(1)
    expect(result.urlCount).toBe(1)
    expect(result.documents[0]).toMatchObject({
      sha: SHA_A,
      testStudioUrl: 'https://a.sanity.dev',
      authorLogin: 'ada',
    })
  })

  it('writes queried commits without enrichment as-is (legit absence, not erasure)', () => {
    const result = assembleSyncDocuments({
      commits: [commit(SHA_A)],
      tags: [],
      github: {info: new Map(), queriedShas: new Set([SHA_A])},
    })
    expect(result.commitCount).toBe(1)
    expect(result.documents[0]).not.toHaveProperty('testStudioUrl')
  })

  it('skips ALL tags when npmInfo is absent — a plain upsert would clobber npm enrichment', () => {
    const result = assembleSyncDocuments({
      commits: [],
      tags: [tag],
      github: {info: new Map(), queriedShas: new Set()},
    })
    expect(result.tagCount).toBe(0)
    expect(result.documents).toEqual([])
  })

  it('writes tags with npm enrichment on npm runs', () => {
    const result = assembleSyncDocuments({
      commits: [],
      tags: [tag],
      github: {info: new Map(), queriedShas: new Set()},
      npmInfo: new Map([['v6.0.0', {distTags: ['latest'], weeklyDownloads: 7}]]),
    })
    expect(result.tagCount).toBe(1)
    expect(result.documents[0]).toMatchObject({tag: 'v6.0.0', npm: {distTags: ['latest']}})
  })
})
