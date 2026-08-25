import {expect, test} from 'vitest'

import {
  clusterTags,
  labelledClusters,
  medianGapMs,
  releaseContextAt,
  resolveTagPositions,
  type TrendPoint,
  type TrendTag,
} from './data'

const DAY = 24 * 60 * 60 * 1000

function tag(name: string, taggedAt: string, major = 6): TrendTag {
  return {tag: name, taggedAt, major}
}

const JAN = '2026-01-10T12:00:00.000Z'
const FEB = '2026-02-10T12:00:00.000Z'
const MAR = '2026-03-10T12:00:00.000Z'

function point(dateIso: string, releaseTag?: string): TrendPoint {
  return {
    date: new Date(dateIso),
    value: 100,
    sha: 'a'.repeat(40),
    runId: `run-${dateIso}`,
    ...(releaseTag ? {releaseTag} : {}),
  }
}

/** Markers for a wide-open domain, so a test only constrains what it means to. */
const markers = (tags: TrendTag[], points: TrendPoint[] = []) =>
  resolveTagPositions(tags, points, Date.parse(JAN) - DAY, Date.parse(MAR) + DAY)

const names = (resolved: {tag: TrendTag}[]) => resolved.map((entry) => entry.tag.tag)

test('no tags means no markers', () => {
  expect(markers([])).toEqual([])
})

test('keeps only tags inside the domain', () => {
  const tags = [tag('v6.0.0', JAN), tag('v6.1.0', FEB), tag('v6.2.0', MAR)]
  const inside = resolveTagPositions(tags, [], Date.parse(FEB) - 1000, Date.parse(FEB) + 1000)
  expect(names(inside)).toEqual(['v6.1.0'])
})

// A release cut on the first or last plotted run is part of that window's
// story — it's the marker most likely to explain a step at the chart's edge
test('the domain boundaries are inclusive', () => {
  const tags = [tag('v6.0.0', JAN), tag('v6.2.0', MAR)]
  const inside = resolveTagPositions(tags, [], Date.parse(JAN), Date.parse(MAR))
  expect(names(inside)).toEqual(['v6.0.0', 'v6.2.0'])
})

test('output is time-ordered even when the input is not', () => {
  const tags = [tag('v6.2.0', MAR), tag('v6.0.0', JAN), tag('v6.1.0', FEB)]
  expect(names(markers(tags))).toEqual(['v6.0.0', 'v6.1.0', 'v6.2.0'])
})

// Live documents: one unparseable date must not take a whole chart down
test('drops tags with an unparseable date', () => {
  expect(names(markers([tag('v6.0.0', 'not-a-date'), tag('v6.1.0', FEB)]))).toEqual(['v6.1.0'])
})

test('carries the tag the markers render', () => {
  const tags = [{...tag('v6.1.0', FEB, 6), distTags: ['latest']}]
  expect(markers(tags)[0]).toEqual({
    tag: {tag: 'v6.1.0', taggedAt: FEB, major: 6, distTags: ['latest']},
    atMs: Date.parse(FEB),
    measured: false,
  })
})

// The cron cadence is the honest default when there is nothing to measure
test('fewer than two runs falls back to a day', () => {
  expect(medianGapMs([])).toBe(DAY)
  expect(medianGapMs([1000])).toBe(DAY)
})

test('an even cadence is its own gap', () => {
  expect(medianGapMs([0, DAY, 2 * DAY, 3 * DAY])).toBe(DAY)
})

// Gappy history is the norm (weekend skips, CI outages, backfills): one long
// hole must not drag the scale the way a mean would
test('a single long gap does not move the median', () => {
  expect(medianGapMs([0, DAY, 2 * DAY, 30 * DAY])).toBe(DAY)
})

test('unsorted times give the same answer', () => {
  expect(medianGapMs([2 * DAY, 0, 30 * DAY, DAY])).toBe(DAY)
})

// Repeated timestamps (shard runs of one commit) make zero-width gaps; a zero
// tolerance would silence every marker, so it falls back instead
test('identical times fall back rather than returning zero', () => {
  expect(medianGapMs([1000, 1000, 1000])).toBe(DAY)
})

const RELEASES = [tag('v6.0.0', JAN), tag('v6.1.0', FEB), tag('v6.2.0', MAR)]

// No release runs: every marker keeps the tag's own date, which is what the
// whole 90 days of existing history looks like
test('falls back to the tag date when nothing measured the release', () => {
  const resolved = markers(RELEASES, [point(FEB)])
  expect(resolved.map((entry) => [entry.tag.tag, entry.measured])).toEqual([
    ['v6.0.0', false],
    ['v6.1.0', false],
    ['v6.2.0', false],
  ])
  expect(resolved[1].atMs).toBe(Date.parse(FEB))
})

// The point that measured a release is the release, so the marker moves onto
// it — the run happens hours after the tag was cut
test('anchors a marker on the run that measured it', () => {
  const measuredAt = '2026-02-10T18:30:00.000Z'
  const resolved = markers(RELEASES, [point(measuredAt, 'v6.1.0')])
  const anchored = resolved.find((entry) => entry.tag.tag === 'v6.1.0')!
  expect(anchored.measured).toBe(true)
  expect(anchored.atMs).toBe(Date.parse(measuredAt))
  // The others are untouched
  expect(resolved.filter((entry) => entry.measured)).toHaveLength(1)
})

test('mixes anchored and date-placed markers on one chart', () => {
  expect(markers(RELEASES, [point(MAR, 'v6.2.0')]).map((entry) => entry.measured)).toEqual([
    false,
    false,
    true,
  ])
})

// A re-run stores a second document for the same release (documentIdForRun keys
// on runId), so the position must not flip between two equally valid runs
test('a re-measured release keeps the earliest position', () => {
  const first = '2026-02-10T18:00:00.000Z'
  const second = '2026-02-11T09:00:00.000Z'
  const resolved = markers(RELEASES, [point(second, 'v6.1.0'), point(first, 'v6.1.0')])
  expect(resolved.find((entry) => entry.tag.tag === 'v6.1.0')!.atMs).toBe(Date.parse(first))
})

test('a point tagged with an unknown release adds no marker', () => {
  const resolved = markers([tag('v6.1.0', FEB)], [point(FEB, 'v6.1.0'), point(MAR, 'v9.9.9')])
  expect(names(resolved)).toEqual(['v6.1.0'])
})

// Regression: anchoring must happen BEFORE domain filtering. A release tagged
// just outside the window whose measuring run is inside it still belongs on the
// chart — filtering on the tag date first dropped it, and hovering that run then
// showed no release at all, losing the strongest claim for the run that earned
// it. Release runs are dispatched hours after tagging, so this is a real case.
test('a tag outside the domain is kept when its run is inside', () => {
  const taggedAt = '2026-02-09T23:00:00.000Z'
  const measuredAt = '2026-02-10T13:00:00.000Z'
  const resolved = resolveTagPositions(
    [tag('v6.1.0', taggedAt)],
    [point(measuredAt, 'v6.1.0')],
    Date.parse('2026-02-10T00:00:00.000Z'),
    Date.parse(MAR),
  )
  expect(resolved).toHaveLength(1)
  expect(resolved[0].atMs).toBe(Date.parse(measuredAt))
  expect(resolved[0].measured).toBe(true)
})

// The mirror case: a tag inside the window whose run landed past the end is
// positioned on that run, so it drops out rather than drawing at the tag date
// while claiming to be the run's position
test('a tag inside the domain drops when its run is outside', () => {
  const resolved = resolveTagPositions(
    [tag('v6.1.0', FEB)],
    [point(MAR, 'v6.1.0')],
    Date.parse(JAN),
    Date.parse('2026-02-20T00:00:00.000Z'),
  )
  expect(resolved).toEqual([])
})

test('labels every mark when they are far enough apart', () => {
  const labels = labelledClusters(clusterTags(at([0, 40, 80]), identity, 6), 14)
  expect([...labels.keys()]).toEqual([0, 1, 2])
})

// A label is drawn at the LAST mark it speaks for and named after that mark, so
// its name and position agree
test('a shared label sits on the last mark it speaks for', () => {
  const clusters = clusterTags(at([0, 8]), identity, 6)
  const labels = labelledClusters(clusters, 14)
  expect([...labels.keys()]).toEqual([1])
  expect(labels.get(1)!.tag.tag).toBe('v6.0.1')
  expect(labels.get(1)!.alsoCount).toBe(1)
})

// Regression: the gap must be measured against the group's *last* mark (where
// its label is drawn), not its first. Measuring from the first put a group's
// label at x=12 and the next group's at x=18 — 6px apart, ~5px perpendicular at
// -60° against a 9px line height, so they overlapped. Reachable from a hotfix
// burst: three releases inside ~2 days.
test('adjacent labels are never closer than the gap', () => {
  const clusters = clusterTags(at([0, 6, 12, 18]), identity, 6)
  const labels = labelledClusters(clusters, 14)
  const xs = [...labels.keys()].map((index) => clusters[index].x)
  for (const [i, x] of xs.slice(1).entries()) {
    expect(x - xs[i]).toBeGreaterThanOrEqual(14)
  }
})

// The chain folds into one label rather than re-opening the comparison at each
// step — the same chain-collapse clusterTags applies to marks
test('a chain of sub-gap steps folds into one label', () => {
  const clusters = clusterTags(at([0, 12, 24, 36]), identity, 6)
  const labels = labelledClusters(clusters, 14)
  expect(labels.size).toBe(1)
  const only = [...labels.values()][0]
  expect(only.tag.tag).toBe('v6.0.3')
  expect(only.alsoCount).toBe(only.tags.length - 1)
})

// Regression: re-anchoring can move a marker past a close neighbour, and both
// clusterTags (which merges adjacent marks left-to-right) and the aria-label
// range depend on the array agreeing with what is drawn
test('sorts by drawn position, not by tag date', () => {
  const resolved = markers(
    [tag('v6.1.0', '2026-02-10T01:00:00.000Z'), tag('v6.2.0', '2026-02-10T12:00:00.000Z')],
    // v6.1.0 measured 20h after its tag, leapfrogging v6.2.0
    [point('2026-02-10T21:00:00.000Z', 'v6.1.0')],
  )
  expect(names(resolved)).toEqual(['v6.2.0', 'v6.1.0'])
  const positions = resolved.map((entry) => entry.atMs)
  expect(positions).toEqual([...positions].sort((a, b) => a - b))
})

test('no releases means no context', () => {
  expect(releaseContextAt([], Date.parse(FEB))).toEqual({})
})

test('brackets a run between the surrounding releases', () => {
  const at = Date.parse(FEB) + 5 * DAY
  const {previous, next} = releaseContextAt(RELEASES, at)
  expect([previous?.tag, next?.tag]).toEqual(['v6.1.0', 'v6.2.0'])
})

// The common case for recent runs: past the latest release, not yet shipped
test('a run after every release has no next', () => {
  const {previous, next} = releaseContextAt(RELEASES, Date.parse(MAR) + DAY)
  expect([previous?.tag, next]).toEqual(['v6.2.0', undefined])
})

test('a run before every release has no previous', () => {
  const {previous, next} = releaseContextAt(RELEASES, Date.parse(JAN) - DAY)
  expect([previous, next?.tag]).toEqual([undefined, 'v6.0.0'])
})

// A run measured exactly at the tag is *in* that release, not before it
test('a run exactly at a release counts as after it', () => {
  const {previous, next} = releaseContextAt(RELEASES, Date.parse(FEB))
  expect([previous?.tag, next?.tag]).toEqual(['v6.1.0', 'v6.2.0'])
})

test('picks the nearest release on each side regardless of input order', () => {
  const shuffled = [RELEASES[2], RELEASES[0], RELEASES[1]]
  const {previous, next} = releaseContextAt(shuffled, Date.parse(FEB) + DAY)
  expect([previous?.tag, next?.tag]).toEqual(['v6.1.0', 'v6.2.0'])
})

test('ignores releases with an unparseable date', () => {
  const tags = [tag('v6.9.9', 'nonsense'), ...RELEASES]
  const {previous} = releaseContextAt(tags, Date.parse(MAR) + DAY)
  expect(previous?.tag).toBe('v6.2.0')
})

/** Resolved entries at given px positions, for clustering tests. */
const at = (positions: number[]) =>
  positions.map((x, index) => ({tag: tag(`v6.0.${index}`, JAN), atMs: x}))

/** Identity xOf, so test positions read as px directly. */
const identity = (ms: number) => ms

test('an empty plot draws no marks', () => {
  expect(clusterTags([], identity, 5)).toEqual([])
})

test('well-separated markers each get their own mark', () => {
  const clusters = clusterTags(at([0, 40, 80]), identity, 5)
  expect(clusters.map((c) => [c.x, c.alsoCount])).toEqual([
    [0, 0],
    [40, 0],
    [80, 0],
  ])
})

// v6.10.0 and v6.10.1 shipped 6.8h apart — 4.6px on a 90-day chart. Two ticks
// that close read as one thick smudge, so they merge into a single mark.
test('near-coincident markers merge into one mark', () => {
  const clusters = clusterTags(at([100, 104]), identity, 5)
  expect(clusters).toHaveLength(1)
  expect(clusters[0].alsoCount).toBe(1)
})

// The mark takes the cluster's last release: that's the one in effect for the
// runs that follow it
test('a merged mark is positioned and named after its last release', () => {
  const clusters = clusterTags(at([100, 102, 104]), identity, 5)
  expect(clusters).toHaveLength(1)
  expect(clusters[0].x).toBe(104)
  expect(clusters[0].tag.tag).toBe('v6.0.2')
  expect(clusters[0].alsoCount).toBe(2)
  // Nothing is lost — every release stays reachable for the label and tooltip
  expect(clusters[0].tags.map((t) => t.tag)).toEqual(['v6.0.0', 'v6.0.1', 'v6.0.2'])
})

test('merges clusters but keeps distant marks apart', () => {
  const clusters = clusterTags(at([0, 3, 100, 102, 200]), identity, 5)
  expect(clusters.map((c) => [c.x, c.alsoCount])).toEqual([
    [3, 1],
    [102, 1],
    [200, 0],
  ])
})

// The label reads "(latest)" when *any* release in the cluster carries the
// dist-tag, not only the one the mark is named after
test('a merged cluster keeps every release for its label', () => {
  const tags = [
    {tag: {...tag('v6.9.9', JAN), distTags: ['latest']}, atMs: 100},
    {tag: tag('v6.10.0', JAN), atMs: 103},
  ]
  const [cluster] = clusterTags(tags, identity, 5)
  expect(cluster.tag.tag).toBe('v6.10.0')
  expect(cluster.tags.some((t) => t.distTags?.includes('latest'))).toBe(true)
  // The documented invariant
  expect(cluster.alsoCount).toBe(cluster.tags.length - 1)
})

// Compared against the cluster's own mark, so a chain of sub-gap steps collapses
// into one mark rather than each step re-opening the comparison
test('a chain of sub-gap steps collapses into one mark', () => {
  const clusters = clusterTags(at([0, 4, 8, 12]), identity, 5)
  expect(clusters).toHaveLength(1)
  expect(clusters[0].x).toBe(12)
})
