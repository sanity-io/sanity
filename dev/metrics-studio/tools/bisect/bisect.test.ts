import {expect, test} from 'vitest'

import {
  type BisectCommit,
  buildChain,
  buildTimeline,
  deriveBisectState,
  type Mark,
  releasesContaining,
} from './bisect'

/**
 * chain(10) builds a linear history c0 (newest) … c9 (oldest): sha of c<i> is
 * the 40-char repeat of the index's hex digit, parent is the next index.
 */
function sha(index: number): string {
  return index.toString(16).repeat(40).slice(0, 40)
}

function chainOf(length: number, options: {urlless?: number[]} = {}): BisectCommit[] {
  return Array.from({length}, (_, index) => ({
    sha: sha(index),
    parentSha: index + 1 < length ? sha(index + 1) : undefined,
    subject: `commit ${index}`,
    committedAt: `2026-08-${String(20 - index).padStart(2, '0')}T12:00:00Z`,
    ...(options.urlless?.includes(index)
      ? {}
      : {testStudioUrl: `https://test-studio-${index}.sanity.dev`}),
  }))
}

function bySha(commits: BisectCommit[]): Map<string, BisectCommit> {
  return new Map(commits.map((commit) => [commit.sha, commit]))
}

// -- buildChain ---------------------------------------------------------------

test('builds the chain bad-first, good-last, following first parents', () => {
  const commits = chainOf(10)
  const result = buildChain(bySha(commits), sha(7), sha(2))
  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.chain.map((commit) => commit.sha)).toEqual([2, 3, 4, 5, 6, 7].map(sha))
})

test('rejects endpoints that are not synced', () => {
  const commits = chainOf(5)
  expect(buildChain(bySha(commits), sha(9), sha(1))).toEqual({ok: false, reason: 'good-not-synced'})
  expect(buildChain(bySha(commits), sha(3), sha(9))).toEqual({ok: false, reason: 'bad-not-synced'})
})

test('rejects identical endpoints', () => {
  const commits = chainOf(5)
  expect(buildChain(bySha(commits), sha(2), sha(2))).toEqual({ok: false, reason: 'same-commit'})
})

test('swapped endpoints (good newer than bad) fail as not-ancestor', () => {
  const commits = chainOf(10)
  // good=c2 is NEWER than bad=c7 — the walk from c7 goes older, never hits c2
  expect(buildChain(bySha(commits), sha(2), sha(7))).toEqual({ok: false, reason: 'not-ancestor'})
})

test('a gap in the synced set fails as not-ancestor', () => {
  // c2 missing from the sync (like a window gap): walk from c0 dead-ends at
  // c1 even though the good endpoint c4 is synced
  const commits = chainOf(5)
  const map = bySha(commits.filter((commit) => commit.sha !== sha(2)))
  expect(buildChain(map, sha(4), sha(0))).toEqual({ok: false, reason: 'not-ancestor'})
})

test('a parent cycle terminates instead of hanging', () => {
  const commits = chainOf(3)
  commits[2].parentSha = sha(0) // c2 → c0 cycle
  expect(buildChain(bySha(commits), sha(1), sha(0))).toEqual({ok: true, chain: commits.slice(0, 2)})
  commits[1].parentSha = sha(0) // c0 → c1 → c0
  expect(buildChain(bySha(commits), sha(2), sha(0))).toEqual({ok: false, reason: 'not-ancestor'})
})

// -- deriveBisectState --------------------------------------------------------

const marks = (...entries: [number, Mark['verdict']][]): Mark[] =>
  entries.map(([index, verdict]) => ({sha: sha(index), verdict}))

test('a fresh session tests the midpoint', () => {
  const chain = chainOf(11) // c0 bad … c10 good
  const state = deriveBisectState(chain, [])
  expect(state.kind).toBe('active')
  if (state.kind !== 'active') return
  expect(state.next.sha).toBe(sha(5))
  expect(state.unknownCount).toBe(9)
  expect(state.testableCount).toBe(9)
  expect(state.stepsLeft).toBe(Math.ceil(Math.log2(10)))
})

test('marking narrows the region on the right side', () => {
  const chain = chainOf(11)
  const afterGood = deriveBisectState(chain, marks([5, 'good']))
  if (afterGood.kind !== 'active') throw new Error(afterGood.kind)
  // good at c5 → unknown is c1..c4, midpoint between 0 and 5
  expect(afterGood.goodBound.sha).toBe(sha(5))
  expect(afterGood.unknownCount).toBe(4)
  // median of candidates c1..c4
  expect(afterGood.next.sha).toBe(sha(2))

  const afterBad = deriveBisectState(chain, marks([5, 'bad']))
  if (afterBad.kind !== 'active') throw new Error(afterBad.kind)
  expect(afterBad.badBound.sha).toBe(sha(5))
  expect(afterBad.unknownCount).toBe(4)
})

test('skipped and build-less commits are never proposed', () => {
  const chain = chainOf(5, {urlless: [2]}) // c2 has no preview build
  const state = deriveBisectState(chain, marks([1, 'skip'], [3, 'skip']))
  // unknown = c1..c3; c1+c3 skipped, c2 untestable → converged with 3 suspects
  expect(state.kind).toBe('converged')
  if (state.kind !== 'converged') return
  expect(state.firstBad.sha).toBe(sha(0))
  expect(state.lastGood.sha).toBe(sha(4))
  expect(state.suspects.map((suspect) => suspect.sha)).toEqual([1, 2, 3].map(sha))
})

test('a later mark on the same sha overrides the earlier one', () => {
  const chain = chainOf(7)
  const state = deriveBisectState(chain, marks([3, 'bad'], [3, 'good']))
  if (state.kind !== 'active') throw new Error(state.kind)
  expect(state.goodBound.sha).toBe(sha(3))
})

test('adjacent bounds converge with no suspects — the clean verdict', () => {
  const chain = chainOf(6)
  const state = deriveBisectState(chain, marks([2, 'bad'], [3, 'good']))
  expect(state).toMatchObject({kind: 'converged', suspects: []})
  if (state.kind !== 'converged') return
  expect(state.firstBad.sha).toBe(sha(2))
  expect(state.lastGood.sha).toBe(sha(3))
})

test('a good mark newer than a bad mark is inconsistent, not ignored', () => {
  const chain = chainOf(8)
  const state = deriveBisectState(chain, marks([5, 'bad'], [2, 'good']))
  expect(state.kind).toBe('inconsistent')
})

test('marks on shas outside the chain are ignored', () => {
  const chain = chainOf(5)
  const state = deriveBisectState(chain, [{sha: 'f'.repeat(40), verdict: 'bad'}])
  if (state.kind !== 'active') throw new Error(state.kind)
  expect(state.badBound.sha).toBe(sha(0))
})

test('candidateShas restricts what gets proposed, not the bounds', () => {
  const chain = chainOf(11)
  const releases = new Set([sha(3), sha(8)])
  const state = deriveBisectState(chain, [], {candidateShas: releases})
  if (state.kind !== 'active') throw new Error(state.kind)
  // median of the two eligible candidates
  expect(state.next.sha).toBe(sha(3))
  expect(state.testableCount).toBe(2)
  // marking the releases exhausts the candidates → converged with suspects
  const done = deriveBisectState(chain, marks([3, 'bad'], [8, 'good']), {candidateShas: releases})
  expect(done.kind).toBe('converged')
  if (done.kind !== 'converged') return
  expect(done.firstBad.sha).toBe(sha(3))
  expect(done.lastGood.sha).toBe(sha(8))
  expect(done.suspects.length).toBe(4) // c4..c7 — commits between the releases
})

test('a two-commit chain converges immediately', () => {
  const chain = chainOf(2)
  const state = deriveBisectState(chain, [])
  expect(state).toMatchObject({kind: 'converged', suspects: []})
})

// -- releasesContaining -------------------------------------------------------

test('finds the releases whose ancestry includes the commit, oldest first', () => {
  const chain = chainOf(10)
  const tags = [
    {tag: 'v2.0.0', sha: sha(2), taggedAt: '2026-08-18T00:00:00Z'}, // newest release
    {tag: 'v1.0.0', sha: sha(6), taggedAt: '2026-08-10T00:00:00Z'}, // older release
    {tag: 'v0.9.0', sha: 'f'.repeat(40), taggedAt: '2026-08-01T00:00:00Z'}, // off-mainline
  ]
  const map = bySha(chain)
  // c4 landed after v1.0.0 (c6) — only v2.0.0 contains it
  expect(releasesContaining(map, tags, sha(4)).map((t) => t.tag)).toEqual(['v2.0.0'])
  // c7 predates both releases — contained in both, oldest first
  expect(releasesContaining(map, tags, sha(7)).map((t) => t.tag)).toEqual(['v1.0.0', 'v2.0.0'])
  // c0 is newer than every tag — unreleased
  expect(releasesContaining(map, tags, sha(0))).toEqual([])
})

// -- buildTimeline ------------------------------------------------------------

function summarize(entries: ReturnType<typeof buildTimeline>): string[] {
  return entries.map((entry) =>
    entry.kind === 'gap'
      ? `gap:${entry.count}:${entry.zone}`
      : `${entry.role}:${entry.commit.sha[0]}`,
  )
}

test('a fresh timeline shows endpoints, you-are-here, and collapsed gaps', () => {
  const chain = chainOf(11) // c0 bad … c10 good, next = c5
  expect(summarize(buildTimeline(chain, []))).toEqual([
    'bad:0',
    'gap:4:unknown',
    'current:5',
    'gap:4:unknown',
    'good:a',
  ])
})

test('visited commits stay visible and gaps take the zone the bisect deduced', () => {
  const chain = chainOf(11)
  // good at c5 moves the good bound; next becomes c2
  expect(summarize(buildTimeline(chain, marks([5, 'good'])))).toEqual([
    'bad:0',
    'gap:1:unknown', // c1
    'current:2',
    'gap:2:unknown', // c3..c4
    'good:5',
    'gap:4:good', // c6..c9 — deduced working
    'good:a',
  ])
})

test('skipped commits are shown with their mark even inside the unknown region', () => {
  const chain = chainOf(7) // next would be c3
  const entries = buildTimeline(chain, marks([3, 'skip']))
  const skipEntry = entries.find((entry) => entry.kind === 'commit' && entry.commit.sha === sha(3))
  expect(skipEntry).toMatchObject({kind: 'commit', role: 'skip'})
})

test('a converged timeline has no you-are-here and keeps the bounds', () => {
  const chain = chainOf(6)
  const entries = buildTimeline(chain, marks([2, 'bad'], [3, 'good']))
  expect(summarize(entries)).toEqual([
    'bad:0',
    'gap:1:bad',
    'bad:2',
    'good:3',
    'gap:1:good',
    'good:5',
  ])
})

test('an inconsistent session has no timeline', () => {
  const chain = chainOf(8)
  expect(buildTimeline(chain, marks([5, 'bad'], [2, 'good']))).toEqual([])
})

test('gap compare spans use the commit past the gap as base', () => {
  const chain = chainOf(11)
  const [, gap] = buildTimeline(chain, [])
  // three-dot compare excludes the base, so the base must be OUTSIDE the
  // gap (c5) for all four gap commits (c1..c4) to appear in the diff
  expect(gap).toMatchObject({kind: 'gap', count: 4, newestSha: sha(1), baseSha: sha(5)})
})
