/**
 * The bisect engine — pure functions, no I/O, no React (the Bisect tool's
 * components stay thin; this module carries the semantics and the tests).
 *
 * The chain is the exact first-parent walk from the bad endpoint back to the
 * good one (`gitCommit.parentSha`), not a `committedAt` sort — committer
 * dates have tie/rebase hazards; ancestry doesn't. `chain[0]` is the bad
 * endpoint, `chain[chain.length - 1]` the good one, so "newer" always means
 * "lower index".
 *
 * Marks are an append-only log; the LAST mark per sha wins, so undo is
 * "remove the tail entry" and a re-mark simply overrides. The endpoints act
 * as implicit marks. A commit can only be tested if a preview build exists
 * (`testStudioUrl`) and it wasn't skipped — untestable commits inside the
 * final range are reported as suspects rather than silently blamed.
 */

export interface BisectCommit {
  sha: string
  parentSha?: string
  subject: string
  authorName?: string
  authorEmail?: string
  authorLogin?: string
  authorAvatarUrl?: string
  committedAt: string
  prNumber?: number
  testStudioUrl?: string
}

export type Verdict = 'good' | 'bad' | 'skip'

export interface Mark {
  sha: string
  verdict: Verdict
}

export type ChainResult =
  | {ok: true; chain: BisectCommit[]}
  | {ok: false; reason: 'bad-not-synced' | 'good-not-synced' | 'not-ancestor' | 'same-commit'}

/**
 * Human copy for a failed chain, naming the endpoints (a tag name or short
 * sha) so the message points at the actual pair instead of abstract roles.
 */
export function chainErrorCopy(
  reason: Extract<ChainResult, {ok: false}>['reason'],
  goodLabel: string,
  badLabel: string,
): string {
  switch (reason) {
    case 'same-commit':
      return `Good and bad are the same commit (${goodLabel}).`
    case 'bad-not-synced':
      return `The bad commit (${badLabel}) is not in the synced history.`
    case 'good-not-synced':
      return `The good commit (${goodLabel}) is not in the synced history.`
    case 'not-ancestor':
      return `Good (${goodLabel}) is not an ancestor of bad (${badLabel}) on the synced mainline.`
    default:
      return reason satisfies never
  }
}

/**
 * Walk `parentSha` from `badSha` collecting commits until `goodSha`
 * (inclusive). A missing/unknown parent ends the walk as `not-ancestor` —
 * that covers swapped endpoints, off-mainline picks, and walking off the
 * v5.0.0 sync boundary. A visited guard makes a (theoretically impossible)
 * parent cycle terminate too.
 */
export function buildChain(
  commitsBySha: Map<string, BisectCommit>,
  goodSha: string,
  badSha: string,
): ChainResult {
  if (goodSha === badSha) return {ok: false, reason: 'same-commit'}
  if (!commitsBySha.has(badSha)) return {ok: false, reason: 'bad-not-synced'}
  if (!commitsBySha.has(goodSha)) return {ok: false, reason: 'good-not-synced'}

  const chain: BisectCommit[] = []
  const visited = new Set<string>()
  let current: BisectCommit | undefined = commitsBySha.get(badSha)
  while (current && !visited.has(current.sha)) {
    visited.add(current.sha)
    chain.push(current)
    if (current.sha === goodSha) return {ok: true, chain}
    current = current.parentSha ? commitsBySha.get(current.parentSha) : undefined
  }
  return {ok: false, reason: 'not-ancestor'}
}

export type BisectState =
  | {
      kind: 'active'
      next: BisectCommit
      badBound: BisectCommit
      goodBound: BisectCommit
      /** Commits strictly between the bounds (any could still be the culprit). */
      unknownCount: number
      /** How many of those are actually testable (preview build, not skipped). */
      testableCount: number
      stepsLeft: number
    }
  | {kind: 'converged'; firstBad: BisectCommit; lastGood: BisectCommit; suspects: BisectCommit[]}
  | {kind: 'inconsistent'; goodMarkSha: string; badMarkSha: string}

export interface BisectOptions {
  /**
   * Restrict the testable candidates to these shas (releases-only mode:
   * the shas that release tags point at). Bounds and suspects stay
   * commit-level — only what gets *proposed* narrows.
   */
  candidateShas?: Set<string>
}

/**
 * Derive the whole stepper state from the chain and the marks log. Expects a
 * chain from buildChain, which is ≥2 commits by construction (identical
 * endpoints are rejected as `same-commit`). The endpoints are implicit marks
 * (chain[0] bad, chain[last] good). Next to test
 * is the testable commit nearest the midpoint of the unknown region — the
 * closest we can get to halving when builds are missing or skipped.
 * Converged when nothing testable remains between the bounds; everything
 * still strictly between them is a suspect.
 */
export function deriveBisectState(
  chain: BisectCommit[],
  marks: Mark[],
  options: BisectOptions = {},
): BisectState {
  const indexBySha = new Map(chain.map((commit, index) => [commit.sha, index]))

  // Last mark per sha wins (marks is append-only; undo removes the tail)
  const effective = new Map<string, Verdict>()
  for (const mark of marks) {
    if (indexBySha.has(mark.sha)) effective.set(mark.sha, mark.verdict)
  }
  effective.set(chain[0].sha, 'bad')
  effective.set(chain[chain.length - 1].sha, 'good')

  // Newer = lower index. The bad bound moves down (oldest bad), the good
  // bound up (newest good); a good mark newer than a bad mark is a
  // contradiction the user must resolve by undoing.
  let badBoundIndex = 0
  let goodBoundIndex = chain.length - 1
  for (const [sha, verdict] of effective) {
    const index = indexBySha.get(sha)!
    if (verdict === 'bad' && index > badBoundIndex) badBoundIndex = index
    if (verdict === 'good' && index < goodBoundIndex) goodBoundIndex = index
  }
  for (const [sha, verdict] of effective) {
    const index = indexBySha.get(sha)!
    if (verdict === 'good' && index < badBoundIndex) {
      return {kind: 'inconsistent', goodMarkSha: sha, badMarkSha: chain[badBoundIndex].sha}
    }
    if (verdict === 'bad' && index > goodBoundIndex) {
      return {kind: 'inconsistent', goodMarkSha: chain[goodBoundIndex].sha, badMarkSha: sha}
    }
  }

  const unknown = chain.slice(badBoundIndex + 1, goodBoundIndex)
  const candidates = unknown.filter(
    (commit) =>
      commit.testStudioUrl &&
      effective.get(commit.sha) !== 'skip' &&
      (!options.candidateShas || options.candidateShas.has(commit.sha)),
  )

  if (candidates.length === 0) {
    return {
      kind: 'converged',
      firstBad: chain[badBoundIndex],
      lastGood: chain[goodBoundIndex],
      suspects: unknown,
    }
  }

  // Median CANDIDATE, not the commit nearest the range midpoint: when
  // testable commits are sparse (missing builds, releases-only), only the
  // median halves the candidate set and keeps stepsLeft honest
  const next = candidates[Math.floor((candidates.length - 1) / 2)]

  return {
    kind: 'active',
    next,
    badBound: chain[badBoundIndex],
    goodBound: chain[goodBoundIndex],
    unknownCount: unknown.length,
    testableCount: candidates.length,
    stepsLeft: Math.ceil(Math.log2(candidates.length + 1)),
  }
}

export interface ReleaseTag {
  tag: string
  sha: string
  taggedAt: string
}

/**
 * Which releases contain a commit: walk each tag's first-parent ancestry over
 * the synced set and keep the tags that reach the sha. Returned oldest-first,
 * so `[0]` is the release that first shipped the commit; empty means the
 * commit hasn't been released yet. Tags cut off-mainline (their sha is not in
 * the synced set) can't be answered and are skipped.
 */
export function releasesContaining<T extends ReleaseTag>(
  commitsBySha: Map<string, BisectCommit>,
  tags: T[],
  sha: string,
): T[] {
  const containing = tags.filter((candidate) => {
    const visited = new Set<string>()
    let current = commitsBySha.get(candidate.sha)
    while (current && !visited.has(current.sha)) {
      if (current.sha === sha) return true
      visited.add(current.sha)
      current = current.parentSha ? commitsBySha.get(current.parentSha) : undefined
    }
    return false
  })
  return containing.toSorted((a, b) => a.taggedAt.localeCompare(b.taggedAt))
}

export type TimelineRole = 'current' | 'good' | 'bad' | 'skip'

export type TimelineEntry =
  | {kind: 'commit'; commit: BisectCommit; role: TimelineRole}
  | {
      kind: 'gap'
      count: number
      /** Newest commit inside the gap (compare head). */
      newestSha: string
      /**
       * Compare BASE: the included commit just past the gap's oldest end —
       * GitHub's three-dot compare excludes the base, so using a gap-internal
       * commit would drop it from the diff.
       */
      baseSha: string
      /** What the bisect already knows about the collapsed commits. */
      zone: 'bad' | 'unknown' | 'good'
    }

/**
 * The "map" of a session: the chain (newest first) reduced to the commits
 * worth seeing — endpoints, current bounds, every visited (marked) commit,
 * and the one being tested ("you are here") — with the runs in between
 * collapsed into gap entries. Gap zones fall out of the bisect invariant:
 * everything newer than the bad bound is broken, everything older than the
 * good bound works, the middle is untested. Empty for an inconsistent
 * session (the conflict card is the view there).
 */
export function buildTimeline(
  chain: BisectCommit[],
  marks: Mark[],
  options: BisectOptions = {},
): TimelineEntry[] {
  const state = deriveBisectState(chain, marks, options)
  if (state.kind === 'inconsistent') return []
  const indexBySha = new Map(chain.map((commit, index) => [commit.sha, index]))

  const effective = new Map<string, Verdict>()
  for (const mark of marks) {
    if (indexBySha.has(mark.sha)) effective.set(mark.sha, mark.verdict)
  }

  const badBoundIndex = indexBySha.get(
    state.kind === 'active' ? state.badBound.sha : state.firstBad.sha,
  )!
  const goodBoundIndex = indexBySha.get(
    state.kind === 'active' ? state.goodBound.sha : state.lastGood.sha,
  )!
  const currentIndex = state.kind === 'active' ? indexBySha.get(state.next.sha)! : undefined

  const include = new Set<number>([0, chain.length - 1, badBoundIndex, goodBoundIndex])
  if (currentIndex !== undefined) include.add(currentIndex)
  for (const sha of effective.keys()) include.add(indexBySha.get(sha)!)

  const roleOf = (index: number): TimelineRole => {
    if (index === currentIndex) return 'current'
    const marked = effective.get(chain[index].sha)
    if (marked) return marked
    return index <= badBoundIndex ? 'bad' : index >= goodBoundIndex ? 'good' : 'skip'
  }
  const zoneOf = (index: number): 'bad' | 'unknown' | 'good' =>
    index < badBoundIndex ? 'bad' : index > goodBoundIndex ? 'good' : 'unknown'

  const entries: TimelineEntry[] = []
  let gapStart: number | undefined
  const flushGap = (end: number) => {
    if (gapStart === undefined) return
    entries.push({
      kind: 'gap',
      count: end - gapStart,
      newestSha: chain[gapStart].sha,
      // end is always a valid index: the chain's last entry (the good
      // endpoint) is always included, so a gap can't run off the end
      baseSha: chain[end].sha,
      zone: zoneOf(gapStart),
    })
    gapStart = undefined
  }
  chain.forEach((commit, index) => {
    if (include.has(index)) {
      flushGap(index)
      entries.push({kind: 'commit', commit, role: roleOf(index)})
    } else if (gapStart === undefined) {
      gapStart = index
    }
  })
  flushGap(chain.length)
  return entries
}
