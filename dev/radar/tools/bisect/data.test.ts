import {expect, test} from 'vitest'

import {filterCommits, type GitCommitSlice} from './data'

function commit(sha: string, subject: string): GitCommitSlice {
  return {
    _id: `gitCommit-${sha}`,
    sha,
    parentSha: null,
    committedAt: '2026-08-20T12:00:00Z',
    subject,
    prNumber: null,
    authorName: null,
    authorEmail: null,
    authorLogin: null,
    authorAvatarUrl: null,
    testStudioUrl: null,
  }
}

const COMMITS = [
  commit('abc123' + '0'.repeat(34), 'feat(form): add array input'),
  commit('def456' + '0'.repeat(34), 'fix(core): Nested Object rendering'),
  commit('abcfff' + '0'.repeat(34), 'chore: bump deps'),
]

test('empty query returns the newest commits up to the limit', () => {
  expect(filterCommits(COMMITS, '', 2)).toHaveLength(2)
  expect(filterCommits(COMMITS, '  ')).toHaveLength(3)
})

test('matches sha prefixes case-insensitively', () => {
  expect(filterCommits(COMMITS, 'ABC').map((c) => c.sha.slice(0, 6))).toEqual(['abc123', 'abcfff'])
  expect(filterCommits(COMMITS, 'def4')).toHaveLength(1)
})

test('matches subject substrings case-insensitively', () => {
  expect(filterCommits(COMMITS, 'nested object')).toHaveLength(1)
  expect(filterCommits(COMMITS, 'array input')[0].sha.startsWith('abc123')).toBe(true)
  expect(filterCommits(COMMITS, 'no such thing')).toHaveLength(0)
})
