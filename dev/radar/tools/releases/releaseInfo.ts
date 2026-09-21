/**
 * Pure helpers for the Releases tool: external URLs per release and the
 * regression attribution (which release first shipped each confirmed
 * regression, which ones still carried it and which one fixed it, per the
 * bisect sessions).
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

/** A confirmed regression as the release attribution needs it. */
export interface RegressionSpan {
  firstBadSha: string
  /** Release tag it was fixed in, when known. */
  fixedIn?: string | null
}

/**
 * What one release has to say about the confirmed regressions: the ones it
 * INTRODUCED (first shipped the culprit — the blame), the ones it INHERITED
 * (introduced by an earlier release and not yet fixed when it shipped) and
 * the ones it FIXED. A regression therefore marks a span of releases —
 * introducing release, every release after it, up to and excluding the one
 * that fixed it (every synced release when it is not fixed yet) — and the
 * three lists keep the span's ends distinguishable from its middle.
 */
export interface ReleaseRegressions<R> {
  introduced: R[]
  inherited: R[]
  fixed: R[]
}

/**
 * Group confirmed regressions by release along their span: for each item's
 * first-bad sha, the oldest release whose ancestry contains it gets the
 * blame (`introduced`); every other release containing the sha carries it
 * (`inherited`) until the fix ships; the release named by `fixedIn` gets it
 * under `fixed`. Containment of the fix is ancestry too, so a release that
 * shipped before the fix keeps the regression however its version compares
 * (mirrors the blame side); when the fix tag's commit is outside the synced
 * chain — no ancestry to walk — every release at or above it by semver
 * counts as fixed instead, so a stored fix is never silently ignored. Items
 * no release contains (unreleased regressions) are dropped. Order within a
 * list follows the input.
 */
export function regressionsByTag<T extends ReleaseTag, R extends RegressionSpan>(
  commitsBySha: Map<string, BisectCommit>,
  tags: T[],
  regressions: R[],
): Map<string, ReleaseRegressions<R>> {
  const byTag = new Map<string, ReleaseRegressions<R>>()
  const entry = (tag: string) => {
    const existing = byTag.get(tag)
    if (existing) return existing
    const created = {introduced: [], inherited: [], fixed: []}
    byTag.set(tag, created)
    return created
  }
  const tagByName = new Map(tags.map((tag) => [tag.tag, tag]))
  for (const regression of regressions) {
    const [introducing, ...later] = releasesContaining(commitsBySha, tags, regression.firstBadSha)
    if (!introducing) continue
    entry(introducing.tag).introduced.push(regression)

    const fixTag = regression.fixedIn ? tagByName.get(regression.fixedIn) : undefined
    const fixedTags = fixTag ? releasesFixedBy(commitsBySha, tags, fixTag) : new Set<string>()
    if (fixTag) entry(fixTag.tag).fixed.push(regression)
    for (const release of later) {
      if (fixedTags.has(release.tag)) continue
      entry(release.tag).inherited.push(regression)
    }
  }
  return byTag
}

/**
 * The releases that ship the fix tagged `fixTag`: those whose ancestry
 * contains its commit, or — when that commit is not in the synced chain —
 * those at or above it by semver.
 */
function releasesFixedBy<T extends ReleaseTag>(
  commitsBySha: Map<string, BisectCommit>,
  tags: T[],
  fixTag: T,
): Set<string> {
  const byAncestry = releasesContaining(commitsBySha, tags, fixTag.sha)
  if (byAncestry.length > 0) return new Set(byAncestry.map((tag) => tag.tag))
  return new Set(
    tags
      .filter((candidate) => compareTagsSemverDesc(candidate.tag, fixTag.tag) <= 0)
      .map((tag) => tag.tag),
  )
}

/**
 * Semver order for `vMAJOR.MINOR.PATCH[-prerelease]` tags, newest first —
 * the releases list is a version list, not a timeline, and tag dates put a
 * maintenance patch cut last week above the minor it backports from.
 * A prerelease sorts below its release (`v7.0.0-rc.1` < `v7.0.0`);
 * prerelease identifiers compare numerically when both are numbers, else as
 * strings. Anything that doesn't parse sorts last, by tag name.
 */
export function compareTagsSemverDesc(a: string, b: string): number {
  const pa = parseSemverTag(a)
  const pb = parseSemverTag(b)
  if (!pa && !pb) return compareCodePointsDesc(a, b)
  if (!pa) return 1
  if (!pb) return -1
  for (const key of ['major', 'minor', 'patch'] as const) {
    if (pa[key] !== pb[key]) return pb[key] - pa[key]
  }
  if (!pa.prerelease && !pb.prerelease) return 0
  if (!pa.prerelease) return -1
  if (!pb.prerelease) return 1
  return comparePrereleaseDesc(pa.prerelease, pb.prerelease)
}

/** The major version of a `vMAJOR.MINOR.PATCH[-prerelease]` tag; undefined when it doesn't parse. */
export function majorOf(tag: string): number | undefined {
  return parseSemverTag(tag)?.major
}

/**
 * Split a semver-DESC sorted tag list into its release lines, one group per
 * major in list order. Majors are contiguous in that order, so this is a
 * single pass; tags that don't parse sort last and form one trailing group
 * with `major: undefined`.
 */
export function groupTagsByMajor<T extends {tag: string}>(
  sortedTags: T[],
): {major: number | undefined; tags: T[]}[] {
  const lines: {major: number | undefined; tags: T[]}[] = []
  for (const tag of sortedTags) {
    const major = majorOf(tag.tag)
    const last = lines.at(-1)
    if (last && last.major === major) last.tags.push(tag)
    else lines.push({major, tags: [tag]})
  }
  return lines
}

function parseSemverTag(
  tag: string,
): {major: number; minor: number; patch: number; prerelease?: string} | undefined {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(tag)
  if (!match) return undefined
  const [, major, minor, patch, prerelease] = match
  return {major: Number(major), minor: Number(minor), patch: Number(patch), prerelease}
}

function comparePrereleaseDesc(a: string, b: string): number {
  const as = a.split('.')
  const bs = b.split('.')
  for (let i = 0; i < Math.max(as.length, bs.length); i++) {
    // A shorter identifier list is the lower precedence (rc < rc.1)
    if (as[i] === undefined) return 1
    if (bs[i] === undefined) return -1
    const an = /^\d+$/.test(as[i]) ? Number(as[i]) : undefined
    const bn = /^\d+$/.test(bs[i]) ? Number(bs[i]) : undefined
    if (an !== undefined && bn !== undefined) {
      if (an !== bn) return bn - an
    } else if (an !== undefined) {
      return 1 // numeric identifiers rank below alphanumeric ones
    } else if (bn !== undefined) {
      return -1
    } else if (as[i] !== bs[i]) {
      return compareCodePointsDesc(as[i], bs[i])
    }
  }
  return 0
}

/** SemVer wants ASCII order for non-numeric identifiers; `localeCompare` is locale- and case-folding-dependent. */
function compareCodePointsDesc(a: string, b: string): number {
  if (a === b) return 0
  return a < b ? 1 : -1
}

/**
 * The Bisect tool URL for a session, from the Releases tool's own location.
 * Tools are top-level studio routes (`<basePath>/<tool name>`), and the
 * Bisect tool reads `?session=` from the location rather than router state,
 * so this is plain path surgery on the current pathname: swap the trailing
 * `releases` segment for `bisect` and append the query. Router-based
 * resolution is not an option here — `useRouter()` inside a tool is scoped
 * to that tool, so a `{tool: 'bisect'}` state can't be encoded from it.
 */
export function bisectSessionPath(pathname: string, sessionId: string): string {
  const base = pathname.replace(/\/releases(?:\/.*)?$/, '')
  return `${base}/bisect?session=${encodeURIComponent(sessionId)}`
}
