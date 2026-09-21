import {expect, test} from 'vitest'

import {type BisectCommit} from '../bisect/bisect'
import {
  baseTagOf,
  bisectSessionPath,
  baseVersionOf,
  changelogUrl,
  compareTagsSemverDesc,
  groupDeprecatedRuns,
  groupTagsByMajor,
  majorOf,
  npmxUrl,
  regressionsByTag,
} from './releaseInfo'

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
  // baseTagOf is the same walk but keeps the tag name (AddRegressionDialog
  // uses it to find the base TagSlice by name)
  expect(baseTagOf(bySha(commits), tagBySha, {sha: sha(1)})).toBe('v2.0.0')
  // oldest tag walks off the cutoff without finding a predecessor
  expect(baseVersionOf(bySha(commits), tagBySha, {sha: sha(5)})).toBeUndefined()
  // off-mainline tag can't even start the walk
  expect(baseVersionOf(bySha(commits), tagBySha, {sha: 'f'.repeat(40)})).toBeUndefined()
})

const ids = <T extends {id: string}>(items: T[] | undefined) => items?.map((item) => item.id) ?? []

test('regressionsByTag blames the introducing release and marks every later one as inherited', () => {
  const commits = chainOf(10)
  const tags = [
    {tag: 'v2.2.0', sha: sha(0), taggedAt: '2026-08-20T00:00:00Z'},
    {tag: 'v2.1.0', sha: sha(1), taggedAt: '2026-08-19T00:00:00Z'},
    {tag: 'v2.0.0', sha: sha(5), taggedAt: '2026-08-15T00:00:00Z'},
  ]
  const items = [
    {id: 'a', firstBadSha: sha(3)},
    {id: 'b', firstBadSha: sha(7)},
    {id: 'c', firstBadSha: sha(3)},
  ]
  const grouped = regressionsByTag(bySha(commits), tags, items)
  // c7 first shipped in v2.0.0 and is unfixed: every release since carries it
  expect(ids(grouped.get('v2.0.0')?.introduced)).toEqual(['b'])
  expect(ids(grouped.get('v2.0.0')?.inherited)).toEqual([])
  // c3 first shipped in v2.1.0 (input order kept)
  expect(ids(grouped.get('v2.1.0')?.introduced)).toEqual(['a', 'c'])
  expect(ids(grouped.get('v2.1.0')?.inherited)).toEqual(['b'])
  expect(ids(grouped.get('v2.2.0')?.introduced)).toEqual([])
  expect(ids(grouped.get('v2.2.0')?.inherited)).toEqual(['a', 'b', 'c'])
  expect(grouped.get('v2.2.0')?.fixed).toEqual([])
})

test('regressionsByTag drops unreleased regressions', () => {
  const commits = chainOf(10)
  const tags = [{tag: 'v2.0.0', sha: sha(5), taggedAt: '2026-08-15T00:00:00Z'}]
  // c0 is newer than every tag
  expect(regressionsByTag(bySha(commits), tags, [{id: 'x', firstBadSha: sha(0)}]).size).toBe(0)
})

test('regressionsByTag ends the inherited span at the fixing release', () => {
  const commits = chainOf(10)
  const tags = [
    {tag: 'v2.3.0', sha: sha(0), taggedAt: '2026-08-20T00:00:00Z'},
    {tag: 'v2.2.0', sha: sha(1), taggedAt: '2026-08-19T00:00:00Z'},
    {tag: 'v2.1.0', sha: sha(3), taggedAt: '2026-08-17T00:00:00Z'},
    {tag: 'v2.0.0', sha: sha(5), taggedAt: '2026-08-15T00:00:00Z'},
  ]
  const items = [{id: 'a', firstBadSha: sha(7), fixedIn: 'v2.2.0'}]
  const grouped = regressionsByTag(bySha(commits), tags, items)
  expect(ids(grouped.get('v2.0.0')?.introduced)).toEqual(['a'])
  expect(ids(grouped.get('v2.1.0')?.inherited)).toEqual(['a'])
  // the fixing release neither inherits it nor gets the blame
  expect(ids(grouped.get('v2.2.0')?.inherited)).toEqual([])
  expect(ids(grouped.get('v2.2.0')?.introduced)).toEqual([])
  expect(ids(grouped.get('v2.2.0')?.fixed)).toEqual(['a'])
  expect(grouped.get('v2.3.0')).toBeUndefined()
})

test('regressionsByTag decides "fixed" by ancestry, falling back to semver off the chain', () => {
  const commits = chainOf(10)
  // v2.1.1 is a maintenance patch cut off-mainline: it sorts above v2.1.0
  // but does not descend from the fix that shipped in v2.1.0 — by ancestry
  // it is neither containing nor fixed, so it is absent, not "inherited"
  const onChain = [
    {tag: 'v2.2.0', sha: sha(0), taggedAt: '2026-08-20T00:00:00Z'},
    {tag: 'v2.1.1', sha: 'f'.repeat(40), taggedAt: '2026-08-19T00:00:00Z'},
    {tag: 'v2.1.0', sha: sha(3), taggedAt: '2026-08-17T00:00:00Z'},
    {tag: 'v2.0.0', sha: sha(5), taggedAt: '2026-08-15T00:00:00Z'},
  ]
  const item = {id: 'a', firstBadSha: sha(7), fixedIn: 'v2.1.0'}
  const grouped = regressionsByTag(bySha(commits), onChain, [item])
  expect(ids(grouped.get('v2.0.0')?.introduced)).toEqual(['a'])
  expect(ids(grouped.get('v2.1.0')?.fixed)).toEqual(['a'])
  expect(grouped.get('v2.1.1')).toBeUndefined()
  expect(grouped.get('v2.2.0')).toBeUndefined()

  // The fix tag itself is off the synced chain: no ancestry to walk, so
  // every release at or above it by semver counts as fixed
  const offChain = [
    {tag: 'v2.2.0', sha: sha(0), taggedAt: '2026-08-20T00:00:00Z'},
    {tag: 'v2.1.0', sha: 'f'.repeat(40), taggedAt: '2026-08-17T00:00:00Z'},
    {tag: 'v2.0.1', sha: sha(3), taggedAt: '2026-08-16T00:00:00Z'},
    {tag: 'v2.0.0', sha: sha(5), taggedAt: '2026-08-15T00:00:00Z'},
  ]
  const fallback = regressionsByTag(bySha(commits), offChain, [item])
  expect(ids(fallback.get('v2.0.0')?.introduced)).toEqual(['a'])
  expect(ids(fallback.get('v2.0.1')?.inherited)).toEqual(['a'])
  expect(ids(fallback.get('v2.1.0')?.fixed)).toEqual(['a'])
  expect(fallback.get('v2.2.0')).toBeUndefined()
})

test('regressionsByTag keeps the blame when the recorded fix predates the introduction', () => {
  const commits = chainOf(10)
  const tags = [
    {tag: 'v2.1.0', sha: sha(1), taggedAt: '2026-08-19T00:00:00Z'},
    {tag: 'v2.0.0', sha: sha(5), taggedAt: '2026-08-15T00:00:00Z'},
  ]
  // Nonsense data (fixed before it existed) must not erase the introduction
  const grouped = regressionsByTag(bySha(commits), tags, [
    {id: 'a', firstBadSha: sha(3), fixedIn: 'v2.0.0'},
  ])
  expect(ids(grouped.get('v2.1.0')?.introduced)).toEqual(['a'])
  expect(ids(grouped.get('v2.0.0')?.fixed)).toEqual(['a'])
})

test('compareTagsSemverDesc orders newest version first, prereleases below their release', () => {
  const tags = [
    'v6.10.1',
    'v7.0.0-rc.1',
    'v7.0.0',
    'v6.9.12',
    'v7.0.0-rc.10',
    'v7.0.0-rc.2',
    'v6.10.0',
    'v7.1.0',
    'v7.0.0-beta.1',
  ]
  expect([...tags].sort(compareTagsSemverDesc)).toEqual([
    'v7.1.0',
    'v7.0.0',
    'v7.0.0-rc.10',
    'v7.0.0-rc.2',
    'v7.0.0-rc.1',
    'v7.0.0-beta.1',
    'v6.10.1',
    'v6.10.0',
    'v6.9.12',
  ])
})

test('compareTagsSemverDesc is stable for equal tags and pushes junk to the end', () => {
  expect(compareTagsSemverDesc('v6.10.1', '6.10.1')).toBe(0)
  expect(['junk', 'v6.10.1', 'other'].sort(compareTagsSemverDesc)).toEqual([
    'v6.10.1',
    'other',
    'junk',
  ])
})

test('compareTagsSemverDesc compares prerelease identifiers in code-point order, not locale order', () => {
  // SemVer: non-numeric identifiers sort lexically in ASCII order, so
  // "RC" < "alpha" and alpha has the higher precedence — a locale-aware
  // compare would put alpha below RC
  expect(['v7.0.0-RC', 'v7.0.0-alpha'].sort(compareTagsSemverDesc)).toEqual([
    'v7.0.0-alpha',
    'v7.0.0-RC',
  ])
})

test('groupTagsByMajor splits a semver-sorted list into contiguous release lines', () => {
  const tags = ['v7.0.0', 'v7.0.0-rc.1', 'v6.10.1', 'v6.0.0', 'v5.31.2', 'junk'].map((tag) => ({
    tag,
  }))
  expect(groupTagsByMajor(tags).map((line) => [line.major, line.tags.map((t) => t.tag)])).toEqual([
    [7, ['v7.0.0', 'v7.0.0-rc.1']],
    [6, ['v6.10.1', 'v6.0.0']],
    [5, ['v5.31.2']],
    [undefined, ['junk']],
  ])
  expect(groupTagsByMajor([])).toEqual([])
  expect(majorOf('v6.10.1')).toBe(6)
  expect(majorOf('nope')).toBeUndefined()
})

test('groupDeprecatedRuns folds neighbours sharing a deprecation message, leaves the rest alone', () => {
  const t = (tag: string, deprecated: string | null = null) => ({tag, npm: {deprecated}})
  const tags = [
    t('v6.11.0'),
    t('v6.10.2', 'upgrade to 6.11.0'),
    t('v6.10.1', 'upgrade to 6.11.0'),
    t('v6.10.0', 'upgrade to 6.11.0'),
    t('v6.9.2', 'data loss, use 6.9.3'),
    t('v6.9.1'),
    t('v6.9.0', 'old'),
    t('v6.8.0', 'older'),
  ]
  const entries = groupDeprecatedRuns(tags)
  expect(
    entries.map((entry) =>
      entry.kind === 'run' ? ['run', entry.message, entry.tags.map((x) => x.tag)] : entry.tag.tag,
    ),
  ).toEqual([
    'v6.11.0',
    ['run', 'upgrade to 6.11.0', ['v6.10.2', 'v6.10.1', 'v6.10.0']],
    'v6.9.2', // deprecated alone — a plain entry
    'v6.9.1',
    'v6.9.0', // two deprecated neighbours with different messages stay apart
    'v6.8.0',
  ])
  expect(groupDeprecatedRuns([])).toEqual([])
  // a tag with no npm data at all
  expect(groupDeprecatedRuns([{tag: 'v1.0.0', npm: null}])).toEqual([
    {kind: 'tag', tag: {tag: 'v1.0.0', npm: null}},
  ])
})

test('bisectSessionPath swaps the tool segment and keeps the workspace base path', () => {
  expect(bisectSessionPath('/releases', 'bisect-session-1')).toBe(
    '/bisect?session=bisect-session-1',
  )
  expect(bisectSessionPath('/studio/releases', 'bisect-session-1')).toBe(
    '/studio/bisect?session=bisect-session-1',
  )
  expect(bisectSessionPath('/releases/', 'a b')).toBe('/bisect?session=a%20b')
})
