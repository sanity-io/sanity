import {Card, Flex, Stack, Text} from '@sanity/ui'
import {AxisBottom, AxisLeft} from '@visx/axis'
import {Group} from '@visx/group'
import {scaleLinear, scaleTime} from '@visx/scale'
import {Area, LinePath} from '@visx/shape'
import {useRef, useState} from 'react'

import {
  CALIBRATION_EXPLAINER,
  formatTick,
  formatValue,
  INP_MIN_INTERACTIONS,
  isSignedUnit,
  clusterTags,
  labelledClusters,
  medianGapMs,
  type TagCluster,
  type ResolvedTag,
  resolveTagPositions,
  type TrendLine,
  type TrendPoint,
  type TrendSeries,
  type TrendTag,
} from './data'
import {baselineDetail, type DriftBaseline, type DriftResult} from './drift'
import {ALL_LAYERS_VISIBLE, type LayerState} from './layers'
import {categoricalColor} from './palette'
import {RunDetailPopover} from './RunDetailPopover'

// Left gutter is computed per chart from its tick labels — see marginLeft
// top: 12 so the release markers' 6px ticks (drawn above the plot, at negative
// y) clear the SVG's own edge with a little room rather than touching it — paid
// unconditionally so the plot never resizes when the releases layer is toggled.
// bottom: 22 for the axis line + its tick labels, plus 4 so the last row of
// glyphs isn't shaved by the SVG's own edge.
const MARGIN = {top: 12, right: 8, bottom: 26}

/**
 * Top gutter on a chart that can draw release labels.
 *
 * Deliberately a **fixed** amount, and reserved whenever the chart is capable of
 * labelling releases — not only when it currently is. Sizing it to the labels
 * actually drawn (or making it conditional on the `releases` layer) meant the
 * plot resized when the layer was toggled and differed between charts in the
 * same grid, so the same metric read at two different heights. A stable plot is
 * worth more than the ~60px a short-label chart could reclaim: the eye compares
 * these small multiples against each other.
 *
 * Sized for the longest label in practice — 'v10.10.10 +2 (latest)' is ~21
 * glyphs of 9px text at ~5.4px/glyph, of which sin(60°) ≈ 87% becomes height at
 * the label's tilt — plus the tick and breathing room.
 */
const TAG_LABEL_MARGIN_TOP = 112

/**
 * The nearest earlier point on the selected point's own line that measured a
 * *different* commit — the natural `ab_from` for an A/B comparison against
 * this point. Same-sha neighbours (weekend crons, shard repeats) are skipped:
 * a commit can't be compared against itself. Undefined when there is no
 * earlier distinct commit (first point, soak minutes, local runs).
 */
function previousPointFor(lines: TrendLine[], selected: TrendPoint): TrendPoint | undefined {
  const line = lines.find((candidate) => candidate.points.includes(selected))
  if (!line) return undefined
  for (let i = line.points.indexOf(selected) - 1; i >= 0; i--) {
    const candidate = line.points[i]
    if (candidate.sha !== selected.sha && candidate.sha !== 'unknown') return candidate
  }
  return undefined
}

/**
 * One-line machine identity for the hover tooltip: CPU model when the run
 * recorded one (Aug 2026 on), os/arch as the stand-in before that, plus the
 * always-collected core count and memory. Empty string when the point carries
 * no host at all, so callers can filter on truthiness.
 */
function hostSummary(host: TrendPoint['host']): string {
  if (!host) return ''
  return [
    host.cpuModel ?? (host.os ? (host.arch ? `${host.os}/${host.arch}` : host.os) : undefined),
    host.cpus !== undefined ? `${host.cpus} cores` : undefined,
    host.memGb !== undefined ? `${host.memGb} GB` : undefined,
  ]
    .filter(Boolean)
    .join(' · ')
}

/**
 * Toolchain + measuring-instrument line for the hover tooltip (Chromium is
 * what the sessions actually run in). Empty when the run recorded neither —
 * documents before Aug 2026 have Node only.
 */
function hostVersions(host: TrendPoint['host']): string {
  if (!host) return ''
  return [
    host.browserVersion ? `Chromium ${host.browserVersion}` : undefined,
    host.nodeVersion ? `Node ${host.nodeVersion}` : undefined,
  ]
    .filter(Boolean)
    .join(' · ')
}

/** Theme-aware colors via the studio's CSS custom properties. */
export const COLOR = {
  line: 'var(--card-accent-fg-color, #556bfc)',
  /**
   * The p75–p90 band: the series' own color at low alpha, applied via
   * `fill`/`stroke` + opacity rather than baked into the value. It ties the band
   * to the line it describes (a percentile spread belongs to its median), and it
   * inherits whatever contrast that color already has in both schemes.
   * Deliberately not a badge *background* token like
   * `--card-badge-primary-bg-color`, which in dark mode resolves to a
   * desaturated navy barely separable from the card behind it.
   */
  band: 'var(--card-accent-fg-color, #556bfc)',
  axis: 'var(--card-muted-fg-color, #727892)',
  /**
   * Context lines (host calibration) recede — reference, not measurement — but
   * must still separate from the axes, which are also muted gray. Use the
   * darker primary foreground so it's a distinct neutral (no hue, so it never
   * collides with a data-series color the way an accent/categorical would);
   * the dotting keeps it reading as reference rather than a measured line, and
   * separates it from the baseline overlay's dashed rules — dots always mean
   * host calibration, dashes always mean a baseline level.
   */
  context: 'var(--card-fg-color, #101112)',
  /**
   * Baseline-overlay marks on a drifted chart. Tone-matched to the card tint
   * the drift badge already applies (critical for a regression, positive for an
   * improvement), so the overlay reads as "this is the flagged thing" rather
   * than as another measured series. Deliberately *not* COLOR.band — that fill
   * is taken by the p75–p90 spread, and two shaded things in one hue would
   * read as one thing.
   */
  baselineRegression: 'var(--card-badge-critical-fg-color, #d13415)',
  baselineImprovement: 'var(--card-badge-positive-fg-color, #3ab577)',
  /**
   * A baseline that did not clear the thresholds. Drawn on every chart as a
   * reference, so it has to recede — a neutral grey says "here are the two
   * levels" without the tonal claim that something needs attention.
   */
  baselineNeutral: 'var(--card-muted-fg-color, #727892)',
  /**
   * The web.dev "good" threshold rule on vitals charts. Amber because crossing
   * it is a caution, and because the other overlay hues are claimed: critical
   * red / positive green are the drift directions, grey is the neutral
   * baseline — a grey-dashed quality bar would be indistinguishable from a
   * neutral baseline's before-rule.
   */
  goodThreshold: 'var(--card-badge-caution-fg-color, #a35200)',
  /**
   * Release markers. The same neutral as the host-calibration context line —
   * both are reference, not measurement, and a hue here would compete with the
   * data series for meaning ("is the purple one a branch?"). They stay
   * distinguishable by position and shape rather than color: calibration is a
   * horizontal dotted trail *inside* the plot, a release is a short vertical
   * tick *above* it, and the legend names both. Its own entry rather than
   * reusing `context` because a future re-tone of one must not silently move
   * the other.
   */
  release: 'var(--card-fg-color, #101112)',
}

/**
 * Whether a p75–p90 band is worth drawing for this series.
 *
 * Some metrics are computed from very few samples (INP is n=4, so p75/p90
 * interpolate between the 3rd and 4th values and are sometimes equal — 88/88 on
 * some runs), which collapses the area to a sliver that reads as a line. That is
 * actively misleading with the median layer hidden: you hide the median and
 * something line-shaped remains. Exported so `ChartLegend` keys off the same
 * predicate and never advertises a band the plot isn't drawing.
 */
export function seriesHasBand(series: TrendSeries): boolean {
  if (series.lines.length !== 1) return false
  return series.lines[0].points.some((point) => {
    if (point.p75 === undefined || point.p90 === undefined) return false
    // Relative, so it scales across ms / bytes / CLS without a per-unit table
    return Math.abs(point.p90 - point.p75) > Math.abs(point.value) * 0.02
  })
}

/**
 * Whether this chart can draw the host-calibration context line.
 *
 * Only where host speed can actually skew the number: time-based (ms) metrics
 * over run history. Counts, bytes and CLS don't move with a slow host, so a
 * calibration line there would invite correlations that can't exist. Suppressed
 * when comparing branches (each branch ran on its own hosts — overlapping
 * dashed trails are mud, and the Calibration tab already draws them per
 * branch), on the calibration charts themselves, and on soak minute charts
 * (calibration is a single per-run score, flat by construction).
 */
export function seriesHasCalibration(series: TrendSeries): boolean {
  if (series.lines.length !== 1) return false
  if (series.goal === 'context') return false
  if (series.xKind === 'minute') return false
  if (series.unit !== 'ms') return false
  return series.lines[0].points.filter((point) => point.calibrationMs !== undefined).length > 1
}

/**
 * Whether this chart can carry release markers.
 *
 * Only the x-axis kind decides it: soak latest-run charts plot minutes *within*
 * one run, so a calendar-dated release rule there would claim a relationship
 * between a release and a minute of runtime, which is nonsense. Everything else
 * qualifies — including branch comparisons, unlike the band and the baseline
 * overlay: a release is global context, identical for every line, so it can't
 * turn into per-branch mud.
 *
 * Exported so `ChartLegend` keys off the same predicate. Unlike
 * `seriesHasBand` this is a *capability* test, not a "currently drawing" test:
 * markers are domain-filtered per chart, so a chart whose plotted range holds
 * no release still advertises the layer — the toggle applies grid-wide, and
 * hiding it because one window is empty would make it unreachable.
 */
export function seriesHasReleases(series: TrendSeries, tags: TrendTag[]): boolean {
  if (series.xKind === 'minute') return false
  return tags.length > 0
}

/** Per-line color: the studio accent for a lone line, categorical when comparing. */
function lineColorFor(series: TrendSeries, index: number): string {
  // Comparing branches always wins — each branch gets its own categorical
  // color so two trails never collapse to one hue (even for context charts
  // like host calibration, where each branch ran on its own host).
  if (series.lines.length > 1) return categoricalColor(index)
  if (series.goal === 'context') return COLOR.context
  return COLOR.line
}

/**
 * Index of the run time closest to `targetMs`. Shared by the crosshair snapping
 * and the keyboard stepper so they can never disagree about which run is
 * "current". `times` must be sorted; -1 when empty.
 */
function nearestTimeIndex(times: number[], targetMs: number): number {
  if (times.length === 0) return -1
  return times.reduce(
    (nearest, time, index) =>
      Math.abs(time - targetMs) < Math.abs(times[nearest] - targetMs) ? index : nearest,
    0,
  )
}

/** Nearest point (by date) within a line to a target time, or null if empty. */
function nearestPoint(line: TrendLine, targetMs: number): TrendPoint | null {
  let best: TrendPoint | null = null
  let bestDelta = Infinity
  for (const point of line.points) {
    const delta = Math.abs(point.date.getTime() - targetMs)
    if (delta < bestDelta) {
      best = point
      bestDelta = delta
    }
  }
  return best
}

/** Nearest point across every line to a target time (comparison picks the closest branch). */
function nearestPointAcrossLines(lines: TrendLine[], targetMs: number): TrendPoint | null {
  let best: TrendPoint | null = null
  let bestDelta = Infinity
  for (const line of lines) {
    const candidate = nearestPoint(line, targetMs)
    if (!candidate) continue
    const delta = Math.abs(candidate.date.getTime() - targetMs)
    if (delta < bestDelta) {
      best = candidate
      bestDelta = delta
    }
  }
  return best
}

/**
 * Which baseline a chart draws, and whether it draws one at all.
 *
 * Only the *worst* fired baseline is drawn — the same one `driftBadge` turns
 * into the header percentage — so the chart and the badge can never tell two
 * different stories. Drawing both would put four horizontal rules on a
 * ~120px-tall small multiple while the badge still reported only one of them.
 * (Both baselines remain visible as text in the drift feed.)
 *
 * Suppressed when:
 * - **comparing branches** — the p75–p90 band is already suppressed as "mud"
 *   for the same reason; overlapping baseline spans across branches are worse.
 * - **x is minutes** — soak charts plot one run's samples, not run history, so
 *   a run-window baseline is meaningless there.
 * - **the drifted branch isn't the one plotted** — a stale/mismatched entry
 *   must not annotate someone else's line.
 */
export function baselineToDraw(
  series: TrendSeries,
  drift: DriftResult | undefined,
): DriftBaseline | null {
  if (!drift) return null
  if (series.lines.length !== 1) return null
  if (series.xKind === 'minute') return null
  if (series.lines[0].branch !== drift.branch) return null
  return drift.baseline
}

/**
 * The baseline overlay: the two window medians the drift check compared, each
 * drawn across the runs it was measured over. Two rules, no fill — the p75–p90
 * band already owns the fill channel, and a second shaded region reads as one
 * thing with it.
 *
 * Purely explanatory of the badge — `aria-hidden`, because the badge already
 * states the move numerically and the capture rect carries it in its label; the
 * legend names the marks so the meaning never rests on color alone.
 */
function BaselineOverlay(props: {
  baseline: DriftBaseline
  direction: DriftResult['direction']
  xScale: (ms: number) => number
  yScale: (value: number) => number
  innerWidth: number
  innerHeight: number
}) {
  const {baseline, direction, xScale, yScale, innerWidth, innerHeight} = props
  const color =
    direction === 'regression'
      ? COLOR.baselineRegression
      : direction === 'improvement'
        ? COLOR.baselineImprovement
        : COLOR.baselineNeutral
  const {recentPointsMs, baselinePointsMs} = baseline
  if (baselinePointsMs.length === 0 || recentPointsMs.length === 0) return null

  const baselineY = yScale(baseline.baseline)
  const recentY = yScale(baseline.recent)

  // The y-scale's domain comes from the *visible* points, but the medians come
  // from full history — in a short range over gappy history a level can fall
  // outside it, and an unclamped rule would draw into the axis or the header.
  // Clamping y (as x is, below) would draw the level at the wrong value, which
  // is worse than not drawing it: skip the overlay instead. The badge and the
  // drift feed still state the move.
  if (baselineY < 0 || baselineY > innerHeight || recentY < 0 || recentY > innerHeight) {
    return null
  }

  // Clamp to the plot: drift reads full history, so a window can begin before the
  // visible range (a 30-day view against a 28-run trailing window).
  const clampX = (ms: number) => Math.max(0, Math.min(innerWidth, xScale(ms)))
  const recentTo = clampX(recentPointsMs.at(-1)!)

  // A window can be narrower than it is readable: 7 runs is a comfortable slice
  // of a 90-day view today, but not of an "all" view once the history runs to
  // hundreds of runs, and the newest run sits flush against the right edge so
  // there is no room to pad rightward.
  //
  // So both rules get a floor, laid out as one step anchored at the right edge:
  // the recent level takes the rightmost slice and the baseline level extends
  // leftward from there. Padding them independently either
  // inverted the dashed rule or pushed the solid one over runs it never
  // measured. Spans become approximate only when a window falls under its floor
  // — the exact runs stay in the tooltip and the drift feed — but the shape (two
  // levels, one step) always reads.
  const MIN_RULE_WIDTH = 28
  const boundary = Math.max(0, Math.min(clampX(recentPointsMs[0]), recentTo - MIN_RULE_WIDTH))
  const baselineFrom = Math.max(0, Math.min(clampX(baselinePointsMs[0]), boundary - MIN_RULE_WIDTH))
  const recentX2 = Math.max(recentTo, boundary + 2)

  return (
    <g aria-hidden="true" pointerEvents="none">
      {/* The "before" level: dashed and recessive, so it never competes with the
          measured median line for attention. Ends where the recent window starts,
          so the two rules meet at the boundary instead of overlapping. */}
      <line
        x1={baselineFrom}
        x2={boundary}
        y1={baselineY}
        y2={baselineY}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="4 3"
        opacity={0.55}
      />
      {/* The step between the two levels. Without this the rules read as two
          unrelated horizontal lines; the connector is what makes them one claim
          ("it moved from here to here"). */}
      <line
        x1={boundary}
        x2={boundary}
        y1={baselineY}
        y2={recentY}
        stroke={color}
        strokeWidth={1}
        strokeDasharray="2 2"
        opacity={0.5}
      />
      {/* The "after" level: solid and heavier — the value the badge is about. */}
      <line
        x1={boundary}
        x2={recentX2}
        y1={recentY}
        y2={recentY}
        stroke={color}
        strokeWidth={2}
        opacity={0.9}
      />
    </g>
  )
}

/**
 * A cluster's label: its name, "+n" when the mark stands for several releases,
 * and "latest" when one of them is what npm currently serves.
 *
 * `latest` is marked in *text* rather than by drawing that tick differently. It
 * is worth pointing out — it's the release most readers mean — but an
 * unexplained heavier mark reads as a different kind of thing, and needs a
 * legend entry to decode. A word next to a version number needs nothing: it
 * also carries its own tense, so a reader takes it as a current fact about that
 * version rather than something baked into the chart's history (dist-tags
 * re-point on the next publish).
 */
function labelFor(cluster: TagCluster): string {
  const isLatest = cluster.tags.some((entry) => entry.distTags?.includes('latest'))
  const also = cluster.alsoCount > 0 ? ` +${cluster.alsoCount}` : ''
  // Parenthesised, so it reads as an aside about the version rather than running
  // together with it into one token ("v6.10.1 latest")
  return `${cluster.tag.tag}${also}${isLatest ? ' (latest)' : ''}`
}

/**
 * Release markers: a small tick above the plot per stable `v*` tag positioned in
 * the plotted window, so "did this step land with a release?" is answerable
 * without leaving the chart.
 *
 * The mark deliberately lives *outside* the plot. It began as a full-height
 * dotted rule, which located the release but crossed every measured value to do
 * it — nine releases in a 90-day window meant nine lines drawn through the data
 * to convey nine x positions. A tick in the top margin says the same thing while
 * leaving the measurement alone, which is the rule annotation has to follow here
 * (the same reason the baseline overlay paints under the data layers).
 *
 * Markers whose release was actually benchmarked (`measured`) sit above that
 * run's point; the rest fall back to the tag's own date. Both are drawn
 * identically — see ResolvedTag for why the distinction lives in the wording
 * rather than in the mark.
 *
 * The position claim stays weak for unanchored markers: "this release shipped
 * here", never "this run measured this release".
 *
 * Labels are opt-in (`showLabels`) because at grid-card width (~330px) a 90-day
 * window holds ~20 markers, i.e. one every ~15px: resting text there is
 * guaranteed overlap. The maximized dialog has the room, and at card size the
 * hover tooltip names the release instead.
 *
 * `aria-hidden` like the other annotation layers: the capture rect's label
 * carries the count, and the tooltip names the individual release.
 */
function ReleaseMarkers(props: {
  tags: ResolvedTag[]
  xScale: (ms: number) => number
  /** Resting text labels above the plot — only where there is room for them. */
  showLabels?: boolean
}) {
  const {tags, xScale, showLabels} = props
  if (tags.length === 0) return null
  // Two gaps, because marks and text need different room. Marks merge below 6px,
  // where two ticks stop reading as two; labels need 14px, since at -60° a
  // 7-glyph tag leans ~19px sideways (~12px perpendicular to its neighbour,
  // against a 9px line height). Marks merge first, then labels thin across what
  // survives — so a cluster is one mark with one label, never two marks sharing
  // one name.
  //
  // Crucially the *text* of a thinned label is not discarded — it folds into the
  // label that survives, as "+n". Dropping it outright is what made v6.10.1
  // vanish from the all-time view while its tick was still drawn: a mark with no
  // name and no hint that a name existed. Marks stay one-per-release wherever
  // they are separable; only the naming collapses.
  const clusters = clusterTags(tags, xScale, 6)
  // 14px between labels: at -60° that is ~12px perpendicular against a 9px line
  // height. See labelledClusters for why the gap is measured where it is.
  const labels = showLabels ? labelledClusters(clusters, 14) : new Map<number, TagCluster>()

  return (
    <g aria-hidden="true" pointerEvents="none">
      {clusters.map((cluster, index) => {
        const {tag, x} = cluster
        // Every marker is drawn identically — the `latest` release is called out
        // in its label's text instead (see labelFor), which needs no legend to
        // decode and no second mark weight to notice.
        return (
          <g key={tag.tag}>
            {/* A tick above the plot, not a rule through it.

                A full-height dotted rule marked the same x, but it crossed
                every measured value on the way — and with ~9 releases in a
                90-day window that is nine lines drawn over the data to convey
                nine positions. The tick sits in the top margin and touches the
                plot's edge, so it locates the release without competing with
                the series, the band, or the reference marks for the reader's
                attention inside the plot.

                It has to carry findability alone now, so it is solid and full
                strength rather than the recessive dotting a rule needed: a mark
                that only exists in 6px must actually read at a glance. */}
            <line
              x1={x}
              x2={x}
              y1={-6}
              y2={1}
              stroke={COLOR.release}
              strokeWidth={1.5}
              opacity={0.7}
              strokeLinecap="round"
            />
            {labels.has(index) && (
              // A shallow tilt, rotated about the point where the text meets its
              // own tick.
              //
              // Three positions were tried. -45° leaned ~40px sideways, crossing
              // the neighbouring tick and forcing most labels to be thinned
              // away. Fully vertical (-90°) fixed the density but is genuinely
              // hard to read. -60° keeps most of the width saving — a 7-glyph
              // tag leans only ~19px — while staying legible at a glance.
              //
              // Rotating about `translate(x, -7)` with textAnchor="start" means
              // the text's *start* is pinned a couple of px above the tick and
              // the string grows up-and-right from there, so a label always sits
              // against the mark it names instead of drifting away from it as
              // the tag gets longer.
              <text
                transform={`translate(${x + 1}, -7) rotate(-60)`}
                textAnchor="start"
                fontSize={9}
                fill={COLOR.axis}
                opacity={0.9}
              >
                {/* "+n" rather than dropping the others silently: the reader can
                    see more shipped here and hover for the names */}
                {labelFor(labels.get(index)!)}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}

/**
 * The release nearest a run, when it is near enough to be worth naming in that
 * run's tooltip.
 *
 * "Near enough" is half the median gap between runs: the marker the crosshair is
 * standing next to is the release that plausibly explains this run's value, and
 * anything further away belongs to a different run. A fixed pixel or day
 * tolerance would either go silent on sparse history or name an unrelated
 * release on dense history.
 */
function releasesNearRun(tags: ResolvedTag[], runMs: number, toleranceMs: number): TrendTag[] {
  return tags
    .filter((entry) => Math.abs(entry.atMs - runMs) <= toleranceMs)
    .sort((a, b) => Math.abs(a.atMs - runMs) - Math.abs(b.atMs - runMs))
    .map((entry) => entry.tag)
}

export function TrendChart(props: {
  series: TrendSeries
  width: number
  height: number
  /** Active drift for this series, if any — draws the baseline overlay. */
  drift?: DriftResult
  /** Which encoding layers to draw; defaults to all. */
  layers?: LayerState
  /** Stable release tags, drawn as vertical markers. Empty = no markers. */
  tags?: TrendTag[]
  /**
   * Draw resting labels on the release markers. Only true where there is room
   * for them (the maximized dialog) — see ReleaseMarkers.
   */
  showTagLabels?: boolean
}) {
  const {
    series,
    width,
    height,
    drift,
    layers = ALL_LAYERS_VISIBLE,
    tags = [],
    showTagLabels = false,
  } = props
  const {lines, unit} = series
  const [hoverMs, setHoverMs] = useState<number | null>(null)
  // The selected point only — its anchor coords are derived from the current
  // scales on every render, so an open popover follows the dot across a resize
  // or a domain change instead of pointing at a stale pixel position
  const [selected, setSelected] = useState<TrendPoint | null>(null)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const captureRef = useRef<SVGRectElement>(null)
  const allPoints = lines.flatMap((line) => line.points)
  if (width < 10 || allPoints.length === 0) return null

  const showReleases = layers.visible('releases') && seriesHasReleases(series, tags)
  // Reserved by *capability*, not by what is currently drawn: keyed on the
  // layer's visibility (or on the label lengths) the plot resized when releases
  // were toggled, and charts in one grid disagreed on height depending on
  // whether a release happened to fall in their window.
  //
  // The conditions here stay stable under the reader: `showTagLabels` is a
  // property of the surface (only the maximized dialog sets it), and a
  // minute-axis chart can *never* label a release — seriesHasReleases rejects
  // `xKind: 'minute'` outright, since a calendar-dated release says nothing
  // about a minute of one run's soak. Reserving for them anyway cost a
  // maximized soak chart ~100px of its 460 to permanently empty space.
  // `tags.length > 0` is the same reasoning against a tag-less dataset (or a
  // failed tag query): no tag can ever be labelled, so the gutter would be
  // permanently blank. It can reflow once, when the tag stream first emits
  // after the dialog mounts — a one-time jump on one chart, not grid churn.
  const canLabelReleases = showTagLabels && series.xKind !== 'minute' && tags.length > 0
  const marginTop = canLabelReleases ? TAG_LABEL_MARGIN_TOP : MARGIN.top
  const innerHeight = height - marginTop - MARGIN.bottom

  // Signed units (slopes) center on zero with a symmetric domain, so a
  // near-flat metric reads as a calm line through the middle rather than
  // magnified jitter. Unsigned metrics keep the 0→max framing.
  const values = allPoints.map((point) => point.value)
  // The "good" bar is part of the question a vitals chart answers ("how far
  // under the bar are we?"), so the domain always includes it — a bar clipped
  // away because we're comfortably good would hide exactly that comfort. The
  // resolution cost is real but bounded: the bar is never far from plausible
  // values of its own metric.
  const highs = allPoints.map((point) => point.p90 ?? point.value)
  const dataTop = Math.max(...highs, series.goodThreshold ?? 0)
  const yScale = scaleLinear({
    domain: isSignedUnit(unit)
      ? (() => {
          const extent = Math.max(0.5, ...values.map((value) => Math.abs(value))) * 1.2
          return [-extent, extent]
        })()
      : [0, dataTop > 0 ? dataTop * 1.1 : 1],
    range: [innerHeight, 0],
    nice: true,
  })
  const yDomainMax = yScale.domain().at(-1) ?? 0

  // The gutter is sized to the labels it will actually hold, not hardcoded: a
  // fixed width kept losing to whichever unit produced the widest tick next —
  // and a label that overflows by a couple of pixels is the worst failure
  // mode, shaving the leading glyph's left stroke so "8000ms" reads "3000ms".
  // The labels are knowable here (scale.ticks(3) is exactly what AxisLeft
  // draws for numTicks=3), so measure the longest and pad for the tick mark.
  // 6.2px/char over-approximates fontSize 10 digits; the floor keeps charts
  // with tiny labels ("0", "3") from hugging the card edge.
  const tickLabels = yScale.ticks(3).map((tick) => formatTick(tick, unit, yDomainMax))
  const marginLeft = Math.max(
    36,
    Math.ceil(Math.max(0, ...tickLabels.map((label) => label.length)) * 6.2) + 12,
  )
  const innerWidth = width - marginLeft - MARGIN.right

  const dates = allPoints.map((point) => point.date.getTime())
  let [minDate, maxDate] = [Math.min(...dates), Math.max(...dates)]
  if (minDate === maxDate) {
    // A single run so far: pad the domain so the point renders mid-chart
    minDate -= 24 * 60 * 60 * 1000
    maxDate += 24 * 60 * 60 * 1000
  }
  const xScale = scaleTime({domain: [new Date(minDate), new Date(maxDate)], range: [0, innerWidth]})

  const x = (point: TrendPoint) => xScale(point.date)
  // Anchored to the runs that measured them where possible — a release run's
  // point *is* the release, so the marker belongs on it rather than on the tag
  // date (which is hours earlier). resolveTagPositions owns the whole pipeline
  // (anchor, then filter to the domain, then sort by drawn position) precisely
  // so those steps cannot be ordered wrongly here — see its docstring.
  //
  // Cheap by construction: the tags array is shared across every chart and tiny
  // (~54 documents for all of v5+v6), so one O(n) pass per chart render costs
  // nothing next to the plot itself.
  const visibleTags = showReleases ? resolveTagPositions(tags, allPoints, minDate, maxDate) : []
  // The band only reads when there's one line — overlapping bands across branches
  // would be mud, so comparison mode shows lines only (see seriesHasBand for the
  // low-sample case)
  const showBand = layers.visible('band') && seriesHasBand(series)
  const overlayBaseline = layers.visible('baseline') ? baselineToDraw(series, drift) : null
  // The band belongs to the line it describes, so it takes that line's color
  const bandColor = lineColorFor(series, 0)

  // Host calibration as an in-chart context line, so "did the host spike where
  // the metric spiked?" is answerable without switching to the Calibration tab.
  const calibrationPoints =
    layers.visible('calibration') && seriesHasCalibration(series)
      ? lines[0].points.filter((point) => point.calibrationMs !== undefined)
      : []
  // Its own scale, but zero-based like the metric's: both lines then show
  // *relative* movement at the same visual proportion (a 20% slower host dips
  // as much of its height as a 20% slower metric does), which is exactly the
  // comparison eyeballing skew needs. A min–max domain would instead stretch
  // ±2% host jitter to full chart height and manufacture correlations.
  const calibrationScale = scaleLinear({
    domain: [0, Math.max(1, ...calibrationPoints.map((point) => point.calibrationMs!)) * 1.1],
    range: [innerHeight, 0],
  })

  const handleMove = (event: React.PointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setHoverMs(xScale.invert(event.clientX - rect.left).getTime())
  }

  // Keyboard access: arrow keys step the crosshair across runs (driving the
  // same hover state pointer motion uses), Enter/Space opens the run at the
  // crosshair, Escape clears it. Sorted unique run times are the step stops.
  const stepTimes = [...new Set(dates)].sort((a, b) => a - b)
  const handleKeyDown = (event: React.KeyboardEvent<SVGRectElement>) => {
    if (stepTimes.length === 0) return
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const current = hoverMs === null ? stepTimes.length - 1 : nearestTimeIndex(stepTimes, hoverMs)
      const next = Math.max(
        0,
        Math.min(stepTimes.length - 1, current + (event.key === 'ArrowRight' ? 1 : -1)),
      )
      setHoverMs(stepTimes[next])
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const targetMs = hoverMs ?? stepTimes.at(-1)!
      const best = nearestPointAcrossLines(lines, targetMs)
      if (best) setSelected(best)
    } else if (event.key === 'Escape') {
      setHoverMs(null)
    }
  }

  // Snapped to the nearest run, not the raw pointer x: the crosshair *is* the
  // run marker, so it has to sit on a run. It also has to be independent of any
  // layer's y-value — a dot on the median is anchored to nothing once the median
  // layer is toggled off.
  const snappedIndex = hoverMs === null ? -1 : nearestTimeIndex(stepTimes, hoverMs)
  // While a run's popover is open the marker stays on that run: reaching the
  // popover means moving the pointer out of the plot, which clears `hoverMs`, and
  // the line vanishing is exactly when you most need to see which run you opened.
  const snappedMs =
    snappedIndex === -1 ? (selected?.date.getTime() ?? null) : stepTimes[snappedIndex]
  const anchor = snappedMs === null ? null : xScale(new Date(snappedMs))
  // Read out the *snapped* run, so the rule and the tooltip always describe the
  // same run rather than drifting apart by up to half a run's spacing
  const hovered =
    snappedMs === null
      ? []
      : lines
          .map((line, index) => ({
            branch: line.branch,
            color: lineColorFor(series, index),
            point: nearestPoint(line, snappedMs),
          }))
          .filter((entry): entry is {branch: string; color: string; point: TrendPoint} =>
            Boolean(entry.point),
          )
  // The release the crosshair is standing next to, named in the tooltip — this
  // is how a marker gets identified at grid-card size, where resting labels
  // don't fit. The floor keeps a very dense history (several runs an hour) from
  // narrowing the tolerance to the point where no marker is ever nameable.
  // A release run states its release outright — it measured that commit, so
  // there is nothing to infer; it is named from the run itself, not from the
  // tag documents, which can lag the run (the tag sync is a separate cron).
  const measuredRelease = hovered.find((entry) => entry.point.releaseTag)?.point.releaseTag
  // All of them, not just the nearest: releases ship in bursts (v6.10.0 and
  // v6.10.1 6.8 hours apart), and their marks merge into one tick — so the
  // tooltip is where the individual names have to remain reachable, including
  // next to a measured release (which gets its own row above this list).
  const hoveredReleases = (
    snappedMs === null || visibleTags.length === 0
      ? []
      : releasesNearRun(
          visibleTags,
          snappedMs,
          Math.max(medianGapMs(stepTimes) / 2, 60 * 60 * 1000),
        )
  ).filter((entry) => entry.tag !== measuredRelease)
  const measuredIsLatest = visibleTags.some(
    (entry) => entry.tag.tag === measuredRelease && entry.tag.distTags?.includes('latest'),
  )

  return (
    <div style={{position: 'relative', width, height}}>
      {/* No role="img": the plot is interactive (see the focusable capture
          rect below), not a static image — claiming "img" would hide that */}
      <svg width={width} height={height}>
        <Group left={marginLeft} top={marginTop}>
          {/* Zero reference for signed slope charts — the "flat is good" line.
              Dashed like the other reference marks: solid, it reads as a flat
              data series the moment the median layer is toggled off. */}
          {isSignedUnit(unit) && (
            <line
              x1={0}
              x2={innerWidth}
              y1={yScale(0)}
              y2={yScale(0)}
              stroke={COLOR.axis}
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.4}
            />
          )}
          {/* The web.dev "good" bar. Long dashes so it never reads as the
              baseline overlay's rules ("4 3" dashed) or the zero line ("3 3");
              the legend names it, so the meaning never rests on color alone. */}
          {series.goodThreshold !== undefined && (
            <line
              x1={0}
              x2={innerWidth}
              y1={yScale(series.goodThreshold)}
              y2={yScale(series.goodThreshold)}
              stroke={COLOR.goodThreshold}
              strokeWidth={1}
              strokeDasharray="7 4"
              opacity={0.5}
              pointerEvents="none"
            />
          )}
          {/* Baseline overlay sits under the band, line and dots — it's
              annotation, and must never obscure the measurement it explains */}
          {overlayBaseline && drift && (
            <BaselineOverlay
              baseline={overlayBaseline}
              direction={drift.direction}
              xScale={(ms) => xScale(new Date(ms))}
              yScale={yScale}
              innerWidth={innerWidth}
              innerHeight={innerHeight}
            />
          )}
          {/* Release markers sit with the other annotation, under the band,
              line and dots: they explain the measurement and must never
              obscure it. */}
          <ReleaseMarkers
            tags={visibleTags}
            xScale={(ms) => xScale(new Date(ms))}
            showLabels={canLabelReleases}
          />
          {showBand && (
            <>
              <Area<TrendPoint>
                data={lines[0].points}
                x={x}
                y0={(point) => yScale(point.p75 ?? point.value)}
                y1={(point) => yScale(point.p90 ?? point.value)}
                fill={bandColor}
                opacity={0.22}
              />
              {/* Faint strokes on both edges. Without them the fill's boundary
                  is the most line-like thing in the plot, so with the median
                  layer toggled off the band gets read as the median itself —
                  two defined edges make it unmistakably a region. */}
              <LinePath<TrendPoint>
                data={lines[0].points}
                x={x}
                y={(point) => yScale(point.p75 ?? point.value)}
                stroke={bandColor}
                strokeWidth={1}
                opacity={0.5}
              />
              <LinePath<TrendPoint>
                data={lines[0].points}
                x={x}
                y={(point) => yScale(point.p90 ?? point.value)}
                stroke={bandColor}
                strokeWidth={1}
                opacity={0.5}
              />
            </>
          )}
          {/* Host calibration context line — under the metric line (it's
              reference, never the measurement), dotted and muted like the
              Calibration tab's own charts so it reads as the same thing.
              Dotted, not dashed: the baseline overlay's "before" rule owns
              the dash, and two reference marks sharing one pattern in a
              ~120px small multiple would be indistinguishable. */}
          {calibrationPoints.length > 1 && (
            <LinePath<TrendPoint>
              data={calibrationPoints}
              x={x}
              y={(point) => calibrationScale(point.calibrationMs!)}
              stroke={COLOR.context}
              strokeWidth={1}
              strokeDasharray="1 3"
              strokeLinecap="round"
              opacity={0.45}
            />
          )}
          {lines.map((line, index) => {
            const color = lineColorFor(series, index)
            return (
              <g key={line.branch}>
                {line.points.length > 1 && layers.visible('median') && (
                  <LinePath<TrendPoint>
                    data={line.points}
                    x={x}
                    y={(point) => yScale(point.value)}
                    stroke={color}
                    strokeWidth={1.5}
                    // Context lines (host calibration) are dotted so they read
                    // as reference, not as a measured metric line — the same
                    // dotting the in-chart calibration overlay uses. The darker
                    // context color separates them from the muted-gray axes;
                    // reduced opacity keeps them recessive despite being darker.
                    strokeDasharray={series.goal === 'context' ? '1 3' : undefined}
                    strokeLinecap={series.goal === 'context' ? 'round' : undefined}
                    opacity={series.goal === 'context' ? 0.55 : 1}
                  />
                )}
                {/* A lone run draws no LinePath, so without a mark the chart
                    would be blank — keep a resting dot for that case only
                    (the `single-run` debug source, and a genuine first run). */}
                {line.points.length === 1 && (
                  <circle
                    cx={x(line.points[0])}
                    cy={yScale(line.points[0].value)}
                    r={2.5}
                    fill={color}
                    pointerEvents="none"
                  />
                )}
              </g>
            )
          })}
          {/* The run marker: a full-height rule snapped to the hovered/focused
              run. Full height so it reads regardless of which layers are on. */}
          {anchor !== null && (
            <line
              x1={anchor}
              x2={anchor}
              y1={0}
              y2={innerHeight}
              stroke={COLOR.axis}
              strokeWidth={1}
              opacity={0.7}
              pointerEvents="none"
            />
          )}
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            numTicks={Math.min(4, allPoints.length)}
            stroke={COLOR.axis}
            tickStroke={COLOR.axis}
            // In-run soak charts encode elapsed minutes in the date; label them
            // as "Nm" rather than a calendar date
            tickFormat={
              series.xKind === 'minute'
                ? (value) => `${Math.round(Number(value) / 60_000)}m`
                : undefined
            }
            tickLabelProps={{fill: COLOR.axis, fontSize: 10, textAnchor: 'middle'}}
          />
          <AxisLeft
            scale={yScale}
            numTicks={3}
            stroke={COLOR.axis}
            tickStroke={COLOR.axis}
            // domainMax keeps every tick of one axis in one unit (all-seconds
            // once the scale top crosses 10s, all-ms below it)
            tickFormat={(value) => formatTick(Number(value), unit, yScale.domain().at(-1))}
            tickLabelProps={{fill: COLOR.axis, fontSize: 10, textAnchor: 'end', dx: -2, dy: 3}}
          />
          {/* Transparent capture rect over the plot area drives the crosshair
              AND the click — it sits above the dots in paint order, so a click
              here (anywhere in the plot) opens the run nearest the pointer,
              which is a bigger target than a 3px dot. It's also the keyboard
              entry point: focusable, arrow keys step the crosshair, Enter opens
              the run, so the whole chart is operable without a pointer. */}
          <rect
            ref={captureRef}
            width={Math.max(0, innerWidth)}
            height={Math.max(0, innerHeight)}
            fill="transparent"
            style={{cursor: 'pointer', outline: 'none'}}
            tabIndex={0}
            role="application"
            aria-label={`${series.title}: ${stepTimes.length} ${stepTimes.length === 1 ? 'run' : 'runs'}.${
              overlayBaseline && drift
                ? // "Flagged" only when something actually fired — neutral
                  // overlays are drawn on nearly every chart, and announcing
                  // those as flagged would dilute the word to nothing
                  ` ${
                    drift.direction === 'neutral' ? 'Baseline' : `Flagged ${drift.direction},`
                  } ${baselineDetail(overlayBaseline)}: ${formatValue(
                    overlayBaseline.baseline,
                    unit,
                  )} to ${formatValue(overlayBaseline.recent, unit)}.`
                : ''
            }${
              series.goodThreshold !== undefined
                ? ` Good is ${formatValue(series.goodThreshold, unit)} or less (web.dev).`
                : ''
            }${
              // The markers themselves are aria-hidden (decoration), so the count
              // is what tells a screen reader user the annotation exists at all;
              // the individual tag is named in the tooltip as the crosshair
              // reaches it. Naming all ~20 here would bury the metric.
              visibleTags.length === 1
                ? ` 1 release marked, ${visibleTags[0].tag.tag}.`
                : visibleTags.length > 1
                  ? ` ${visibleTags.length} releases marked, ${visibleTags[0].tag.tag} to ${visibleTags.at(-1)!.tag.tag}.`
                  : ''
            } Arrow keys inspect runs, Enter opens details.`}
            onPointerMove={handleMove}
            onPointerLeave={() => setHoverMs(null)}
            // Seed the crosshair on keyboard focus so there's an immediate
            // visible focus indicator (the crosshair) before any arrow press
            onFocus={() => setHoverMs((current) => current ?? stepTimes.at(-1) ?? null)}
            onKeyDown={handleKeyDown}
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              const targetMs = xScale.invert(event.clientX - rect.left).getTime()
              const best = nearestPointAcrossLines(lines, targetMs)
              if (best) setSelected(best)
            }}
          />
        </Group>
      </svg>
      {/* Tied to actual hovering, not to the marker: the marker also stands on
          the selected run while its popover is open, and a hover tooltip on top
          of that popover would report the same run twice. */}
      {hoverMs !== null && anchor !== null && hovered.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            // Flip past the midpoint so the tooltip never runs off the edge
            left: anchor + marginLeft > width / 2 ? undefined : anchor + marginLeft + 8,
            right: anchor + marginLeft > width / 2 ? width - (anchor + marginLeft) + 8 : undefined,
            pointerEvents: 'none',
          }}
        >
          <Card radius={2} shadow={2} padding={2}>
            <Stack gap={2}>
              {hovered.map((entry) => (
                <Flex key={entry.branch} align="center" gap={2}>
                  {lines.length > 1 && (
                    <span
                      aria-hidden="true"
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: entry.color,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <Text size={0} weight="semibold">
                    {formatValue(entry.point.value, unit)}
                  </Text>
                  {/* INP confidence: the count qualifies the value, so it sits
                      right next to it — caution-toned when below the floor the
                      percentile rule wants, since that INP is a weak estimate */}
                  {entry.point.interactions !== undefined && (
                    <Text
                      size={0}
                      muted={entry.point.interactions >= INP_MIN_INTERACTIONS}
                      style={
                        entry.point.interactions < INP_MIN_INTERACTIONS
                          ? {color: 'var(--card-badge-caution-fg-color)'}
                          : undefined
                      }
                    >
                      n={entry.point.interactions}
                      {entry.point.interactions < INP_MIN_INTERACTIONS
                        ? ` of ${INP_MIN_INTERACTIONS}`
                        : ''}
                    </Text>
                  )}
                  <Text size={0} muted>
                    {lines.length > 1
                      ? entry.branch
                      : series.xKind === 'minute'
                        ? `minute ${Math.round(entry.point.date.getTime() / 60_000)}`
                        : entry.point.date.toISOString().slice(0, 10)}
                    {/* Provenance as text — PR number only; a truncated sha is
                        noise at hover speed, and the run popover (click) has
                        the full commit link */}
                    {series.xKind !== 'minute' && entry.point.prNumber
                      ? ` · PR #${entry.point.prNumber}`
                      : ''}
                  </Text>
                </Flex>
              ))}
              {/* The hovered run's host-speed score (higher = slower), on its
                  own labelled line so it never reads as part of the metric
                  value. Shown whenever the point knows its host — with the
                  dotted layer hidden, on comparisons, and on charts that don't
                  qualify for the context line alike. Per branch when
                  comparing, since each branch ran on its own hosts.

                  Gated on score OR host identity: Calibration-tab points carry
                  no calibrationMs (their value IS the score — a labelled row
                  would just repeat it), but their machine identity must still
                  show on the one chart whose job is host spread. */}
              {hovered.some(
                (entry) => entry.point.calibrationMs !== undefined || entry.point.host,
              ) && (
                <Stack gap={1}>
                  {hovered
                    .filter((entry) => entry.point.calibrationMs !== undefined)
                    .map((entry) => (
                      // title spells out what the score is — the tooltip is the
                      // first place a viewer meets the number, and "calibration
                      // of what?" is a fair question there
                      <Flex
                        key={`calibration-${entry.branch}`}
                        align="center"
                        gap={2}
                        title={CALIBRATION_EXPLAINER}
                      >
                        <Text size={0} muted>
                          host calibration{lines.length > 1 ? ` · ${entry.branch}` : ''}
                        </Text>
                        <Text size={0} weight="semibold">
                          {formatValue(entry.point.calibrationMs!, 'ms')}
                        </Text>
                      </Flex>
                    ))}
                  {/* Machine identity under the score: the CPU model is what
                      distinguishes runner hardware generations (os/arch stands
                      in on documents that predate it), and the versions line
                      names the toolchain and the measuring instrument — a
                      Chromium bump moves vitals with no studio change. The
                      full detail (image version) stays in the run popover. */}
                  {hovered
                    .filter((entry) => hostSummary(entry.point.host))
                    .map((entry) => (
                      <Text key={`host-${entry.branch}`} size={0} muted>
                        {lines.length > 1 ? `${entry.branch}: ` : ''}
                        {hostSummary(entry.point.host)}
                      </Text>
                    ))}
                  {hovered
                    .filter((entry) => hostVersions(entry.point.host))
                    .map((entry) => (
                      <Text key={`versions-${entry.branch}`} size={0} muted>
                        {lines.length > 1 ? `${entry.branch}: ` : ''}
                        {hostVersions(entry.point.host)}
                      </Text>
                    ))}
                </Stack>
              )}
              {/* The run's own release, when it measured one. "measured" is a
                  stronger claim than "near", and only earned when the run
                  built that exact commit. */}
              {measuredRelease && (
                <Flex
                  align="center"
                  gap={2}
                  title="This run measured the release commit, so the value is that release."
                >
                  <Text size={0} muted>
                    measured release
                  </Text>
                  <Text size={0} weight="semibold">
                    {measuredRelease}
                  </Text>
                  {measuredIsLatest && (
                    <Text size={0} muted>
                      latest
                    </Text>
                  )}
                </Flex>
              )}
              {/* The other release markers the crosshair is standing next to,
                  named. This is how a marker is identified at grid-card size,
                  where resting labels don't fit — and the wording stays honest
                  about the join: these releases shipped near this run, they
                  were not necessarily what this run measured. */}
              {hoveredReleases.length > 0 && (
                <Flex
                  align="center"
                  gap={2}
                  title="Release tags near this run. Unmeasured releases are placed by tag date, so a release near a run does not mean that run measured it."
                >
                  <Text size={0} muted>
                    {measuredRelease
                      ? 'also near'
                      : hoveredReleases.length > 1
                        ? 'releases'
                        : 'release'}
                  </Text>
                  <Text size={0} weight="semibold">
                    {hoveredReleases.map((entry) => entry.tag).join(', ')}
                  </Text>
                  {hoveredReleases.some((entry) => entry.distTags?.includes('latest')) && (
                    <Text size={0} muted>
                      latest
                    </Text>
                  )}
                </Flex>
              )}
              {/* No baseline medians here: the legend names the baseline and
                  its window, the overlay draws the levels, and repeating the
                  same two labelled rows in every chart's tooltip was noise. */}
            </Stack>
          </Card>
        </div>
      )}
      {selected && (
        <>
          {/* Invisible anchor at the selected dot — coords derived from the
              current scales (MARGIN offsets the Group), so it tracks the dot
              through resizes and domain changes. The popover positions against it. */}
          <div
            ref={setAnchorEl}
            style={{
              position: 'absolute',
              left: marginLeft + x(selected),
              top: marginTop + yScale(selected.value),
              width: 1,
              height: 1,
              pointerEvents: 'none',
            }}
          />
          <RunDetailPopover
            key={selected.runId}
            series={series}
            point={selected}
            previousPoint={previousPointFor(lines, selected)}
            // The *full* tag list, not `visibleTags`: the release a run comes
            // after is often older than the plotted window (a 30-day view of a
            // month with no release), and the popover states release context
            // unconditionally. Independent of the `releases` layer toggle too —
            // that hides marks on the plot, it doesn't make the fact untrue.
            tags={tags}
            referenceElement={anchorEl}
            onClose={() => {
              setSelected(null)
              // Restore focus to the chart so keyboard users continue where
              // they were, rather than being dropped at the top of the page
              captureRef.current?.focus()
            }}
          />
        </>
      )}
    </div>
  )
}
