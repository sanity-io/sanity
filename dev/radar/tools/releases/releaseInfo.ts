/**
 * Pure helpers for the Releases tool: external URLs per release and the
 * regression attribution (which release first shipped each confirmed
 * regression, per the bisect sessions).
 */
import {type BisectCommit, type ReleaseTag, releasesContaining} from '../bisect/bisect'

/**
 * The sanity.io changelog URL for a release. The changelog document id is
 * derived from the release's BASE version — the previous release on the
 * first-parent chain, exactly what release automation computes with
 * `git describe` (see packages/@repo/release-notes/src/utils/ids.ts, which
 * base64url-encodes it into `studio-<...>`).
 */
export function changelogUrl(baseVersion: string): string {
  const encoded = btoa(baseVersion).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `https://www.sanity.io/changelog/studio-${encoded}`
}

export function npmxUrl(version: string): string {
  return `https://npmx.dev/package/sanity/v/${encodeURIComponent(version)}`
}

/**
 * The previous release on the first-parent chain — the tag NAME (e.g.
 * "v6.10.0"). Undefined when the walk leaves the synced set (off-mainline
 * tags) or hits the sync cutoff before another tag.
 *
 * Prerelease tags are deliberately NOT skipped. This mirrors release
 * automation's base-version computation (`git describe --first-parent
 * --match "v*"` in @repo/release-notes bump.ts, which matches rc tags too),
 * and the changelog URL derived from this value must reproduce the id that
 * automation generated — filtering here would break the link whenever an rc
 * ever lands on mainline. It also matches the blame model: releases are
 * blamed for the commits they FIRST shipped, and an rc that shipped them
 * first is the correct base for the span that follows it.
 */
export function baseTagOf(
  commitsBySha: Map<string, BisectCommit>,
  tagBySha: Map<string, string>,
  tag: {sha: string},
): string | undefined {
  const visited = new Set<string>()
  let current = commitsBySha.get(tag.sha)
  current = current?.parentSha ? commitsBySha.get(current.parentSha) : undefined
  while (current && !visited.has(current.sha)) {
    const found = tagBySha.get(current.sha)
    if (found) return found
    visited.add(current.sha)
    current = current.parentSha ? commitsBySha.get(current.parentSha) : undefined
  }
  return undefined
}

/**
 * The previous release as a bare VERSION ("6.10.0") — the release
 * automation's "base version" for a tag, which the changelog URL is derived
 * from.
 */
export function baseVersionOf(
  commitsBySha: Map<string, BisectCommit>,
  tagBySha: Map<string, string>,
  tag: {sha: string},
): string | undefined {
  return baseTagOf(commitsBySha, tagBySha, tag)?.replace(/^v/, '')
}

/**
 * Count confirmed regressions per INTRODUCING release: for each first-bad
 * sha from a regression-flagged bisect session, the oldest release whose
 * ancestry contains it gets the blame. Shas no release contains (unreleased
 * regressions) are not counted here.
 */
export function regressionCountByTag<T extends ReleaseTag>(
  commitsBySha: Map<string, BisectCommit>,
  tags: T[],
  firstBadShas: string[],
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const sha of firstBadShas) {
    const introducing = releasesContaining(commitsBySha, tags, sha)[0]
    if (!introducing) continue
    counts.set(introducing.tag, (counts.get(introducing.tag) ?? 0) + 1)
  }
  return counts
}
