import {expect, test} from 'vitest'

import {type BisectCommit} from '../bisect/bisect'
import {baseVersionOf, changelogUrl, npmxUrl, regressionCountByTag} from './releaseInfo'

function sha(index: number): string {
  return index.toString(16).repeat(40).slice(0, 40)
}

function chainOf(length: number): BisectCommit[] {
  return Array.from({length}, (_, index) => ({
    sha: sha(index),
    parentSha: index + 1 < length ? sha(index + 1) : undefined,
    subject: `commit ${index}`,
    committedAt: `2026-08-${String(20 - index).padStart(2, '0')}T12:00:00Z`,
  }))
}

const bySha = (commits: BisectCommit[]) => new Map(commits.map((c) => [c.sha, c]))

test('changelogUrl encodes the base version the way release automation does', () => {
  // Verified live: sanity.io/changelog/studio-Ni4xMC4w is v6.10.1's changelog
  expect(changelogUrl('6.10.0')).toBe('https://www.sanity.io/changelog/studio-Ni4xMC4w')
})

test('npmxUrl points at the canonical version page', () => {
  expect(npmxUrl('6.10.1')).toBe('https://npmx.dev/package/sanity/v/6.10.1')
})

test('baseVersionOf walks first parents to the previous release', () => {
  const commits = chainOf(10)
  const tagBySha = new Map([
    [sha(1), 'v2.1.0'],
    [sha(5), 'v2.0.0'],
  ])
  expect(baseVersionOf(bySha(commits), tagBySha, {sha: sha(1)})).toBe('2.0.0')
  // oldest tag walks off the cutoff without finding a predecessor
  expect(baseVersionOf(bySha(commits), tagBySha, {sha: sha(5)})).toBeUndefined()
  // off-mainline tag can't even start the walk
  expect(baseVersionOf(bySha(commits), tagBySha, {sha: 'f'.repeat(40)})).toBeUndefined()
})

test('regressionCountByTag blames the introducing release', () => {
  const commits = chainOf(10)
  const tags = [
    {tag: 'v2.1.0', sha: sha(1), taggedAt: '2026-08-19T00:00:00Z'},
    {tag: 'v2.0.0', sha: sha(5), taggedAt: '2026-08-15T00:00:00Z'},
  ]
  // c3 first shipped in v2.1.0, c7 in v2.0.0, c0 is unreleased
  const counts = regressionCountByTag(bySha(commits), tags, [sha(3), sha(7), sha(3), sha(0)])
  expect(counts.get('v2.1.0')).toBe(2)
  expect(counts.get('v2.0.0')).toBe(1)
  expect(counts.size).toBe(2)
})
