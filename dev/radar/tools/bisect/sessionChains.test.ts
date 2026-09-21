import {expect, test} from 'vitest'

import {type ChainSession, mergeChainVerdict, resolveSessionChains} from './sessionChains'

function session(
  id: string,
  overrides: Omit<Partial<ChainSession>, 'result'> & {
    result?: Partial<NonNullable<ChainSession['result']>>
  } = {},
): ChainSession {
  const {result, ...rest} = overrides
  return {
    _id: id,
    refines: null,
    createdAt: `2026-09-0${id.length}T00:00:00Z`,
    description: null,
    result: result
      ? {
          firstBadSha: null,
          regression: null,
          note: null,
          severity: null,
          linearIssue: null,
          fixedIn: null,
          ...result,
        }
      : null,
    ...rest,
  }
}

const ids = (chain: {sessions: ChainSession[]}) => chain.sessions.map((s) => s._id)

test('a refinement joins its parent’s chain instead of starting one', () => {
  const releases = session('a', {result: {firstBadSha: 'rel', regression: true}})
  const commits = session('ab', {refines: 'a', result: {firstBadSha: 'c3'}})
  const chains = resolveSessionChains([commits, releases])
  expect(chains.map(ids)).toEqual([['a', 'ab']])
  expect(chains[0].leaf._id).toBe('ab')
})

test('a refinement whose parent is gone stands on its own', () => {
  const orphan = session('b', {refines: 'deleted'})
  expect(resolveSessionChains([orphan]).map(ids)).toEqual([['b']])
})

test('among several refinements a converged one wins, then the newest', () => {
  const root = session('a')
  const older = session('ab', {refines: 'a', createdAt: '2026-09-01T00:00:00Z'})
  const newer = session('ac', {refines: 'a', createdAt: '2026-09-02T00:00:00Z'})
  expect(resolveSessionChains([root, older, newer]).map(ids)).toEqual([['a', 'ac']])

  const olderConverged = session('ab', {
    refines: 'a',
    createdAt: '2026-09-01T00:00:00Z',
    result: {firstBadSha: 'c1'},
  })
  const chains = resolveSessionChains([root, olderConverged, newer])
  expect(chains.map(ids)).toEqual([['a', 'ab']])
  // the abandoned branch is neither in the chain nor a root of its own
  expect(chains).toHaveLength(1)
})

test('a self-reference or cycle cannot loop', () => {
  const self = session('a', {refines: 'a'})
  expect(resolveSessionChains([self]).map(ids)).toEqual([['a']])
  const x = session('x', {refines: 'y'})
  const y = session('y', {refines: 'x'})
  // neither is a root (both parents exist), so a cycle simply yields nothing
  expect(resolveSessionChains([x, y])).toEqual([])
})

test('the chain’s verdict is the deepest converged one, annotations the deepest set, severity the worst', () => {
  const releases = session('a', {
    description: 'Editor freezes on paste',
    result: {
      firstBadSha: 'release-sha',
      regression: true,
      severity: 'critical',
      linearIssue: 'SAPP-1',
      fixedIn: 'v6.10.0',
    },
  })
  const commits = session('ab', {refines: 'a', result: {firstBadSha: 'c3', severity: 'minor'}})
  const inProgress = session('abc', {refines: 'ab', result: {severity: 'bogus'}})
  const [chain] = resolveSessionChains([releases, commits, inProgress])
  expect(ids(chain)).toEqual(['a', 'ab', 'abc'])
  // severity is the worst rated anywhere in the chain (root says critical,
  // the refinement minor); the unknown value on the leaf is ignored
  expect(mergeChainVerdict(chain)).toEqual({
    firstBadSha: 'c3',
    verdictSessionId: 'ab',
    regression: true,
    description: 'Editor freezes on paste',
    note: undefined,
    severity: 'critical',
    linearIssue: 'SAPP-1',
    fixedIn: 'v6.10.0',
  })
})

test('the verdict note is merged like the other annotations, deepest set wins', () => {
  const root = session('a', {result: {firstBadSha: 'x', note: 'root note'}})
  const leaf = session('ab', {refines: 'a', result: {firstBadSha: 'y', note: 'leaf note'}})
  expect(mergeChainVerdict(resolveSessionChains([root, leaf])[0]).note).toBe('leaf note')
  const quietLeaf = session('ab', {refines: 'a', result: {firstBadSha: 'y'}})
  expect(mergeChainVerdict(resolveSessionChains([root, quietLeaf])[0]).note).toBe('root note')
  const nothing = session('a')
  expect(mergeChainVerdict(resolveSessionChains([nothing])[0])).toEqual({
    firstBadSha: undefined,
    verdictSessionId: undefined,
    regression: false,
    description: undefined,
    note: undefined,
    severity: undefined,
    linearIssue: undefined,
    fixedIn: undefined,
  })
})

test('worstSeverity ranks unrated as worst and minor as least', async () => {
  const {worstSeverity} = await import('./severity')
  expect(worstSeverity([])).toBeUndefined()
  expect(worstSeverity(['minor'])).toBe('minor')
  expect(worstSeverity(['minor', 'major'])).toBe('major')
  expect(worstSeverity(['major', 'critical', 'minor'])).toBe('critical')
  expect(worstSeverity(['minor', null])).toBe('critical')
  expect(worstSeverity(['minor', 'bogus'])).toBe('critical')
})
