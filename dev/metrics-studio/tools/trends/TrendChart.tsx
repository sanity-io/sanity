import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {AxisBottom, AxisLeft} from '@visx/axis'
import {Group} from '@visx/group'
import {scaleLinear, scaleTime} from '@visx/scale'
import {Area, LinePath} from '@visx/shape'
import {useRef, useState} from 'react'

import {formatValue, isSignedUnit, type TrendLine, type TrendPoint, type TrendSeries} from './data'
import {baselineDetail, type DriftBaseline, type DriftResult} from './drift'
import {ALL_LAYERS_VISIBLE, type LayerState} from './layers'
import {categoricalColor} from './palette'
import {RunDetailPopover} from './RunDetailPopover'

const MARGIN = {top: 8, right: 8, bottom: 22, left: 44}

/**
 * The nearest earlier point on the selected point's own line that measured a
 * *different* commit — the natural `ab_from` for an A/B comparison against
 * this point. Same-sha neighbours (weekend crons, shard repeats) are skipped:
 * a commit can't be compared against itself. Undefined when there is no
 * earlier distinct commit (first point, soak minutes, local runs).
 */
function previousShaFor(lines: TrendLine[], selected: TrendPoint): string | undefined {
  const line = lines.find((candidate) => candidate.points.includes(selected))
  if (!line) return undefined
  for (let i = line.points.indexOf(selected) - 1; i >= 0; i--) {
    const {sha} = line.points[i]
    if (sha !== selected.sha && sha !== 'unknown') return sha
  }
  return undefined
}

/** Theme-aware colors via the studio's CSS custom properties. */
export const COLOR = {
  line: 'var(--card-accent-fg-color, #556bfc)',
  /**
   * The p75–p90 band. This used to be `--card-badge-primary-bg-color` — a badge
   * *background* token pressed into service as a data fill, which in dark mode
   * resolves to a desaturated navy barely separable from the card behind it.
   *
   * Instead the band is now the series' own color at low alpha, applied via
   * `fill`/`stroke` + opacity rather than baked into the value: it ties the band
   * to the line it describes (a percentile spread belongs to its median), and it
   * inherits whatever contrast that color already has in both schemes.
   */
  band: 'var(--card-accent-fg-color, #556bfc)',
  axis: 'var(--card-muted-fg-color, #727892)',
  /**
   * Context lines (host calibration) recede — reference, not measurement — but
   * must still separate from the axes, which are also muted gray. Use the
   * darker primary foreground so it's a distinct neutral (no hue, so it never
   * collides with a data-series color the way an accent/categorical would);
   * the dashes keep it reading as reference rather than a measured line.
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
  // leftward from there. Padding them independently (tried both ways) either
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

export function TrendChart(props: {
  series: TrendSeries
  width: number
  height: number
  /** Active drift for this series, if any — draws the baseline overlay. */
  drift?: DriftResult
  /** Which encoding layers to draw; defaults to all. */
  layers?: LayerState
}) {
  const {series, width, height, drift, layers = ALL_LAYERS_VISIBLE} = props
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

  const innerWidth = width - MARGIN.left - MARGIN.right
  const innerHeight = height - MARGIN.top - MARGIN.bottom

  const dates = allPoints.map((point) => point.date.getTime())
  let [minDate, maxDate] = [Math.min(...dates), Math.max(...dates)]
  if (minDate === maxDate) {
    // A single run so far: pad the domain so the point renders mid-chart
    minDate -= 24 * 60 * 60 * 1000
    maxDate += 24 * 60 * 60 * 1000
  }
  const xScale = scaleTime({domain: [new Date(minDate), new Date(maxDate)], range: [0, innerWidth]})

  // Signed units (slopes) center on zero with a symmetric domain, so a
  // near-flat metric reads as a calm line through the middle rather than
  // magnified jitter. Unsigned metrics keep the 0→max framing.
  const values = allPoints.map((point) => point.value)
  const highs = allPoints.map((point) => point.p90 ?? point.value)
  const yScale = scaleLinear({
    domain: isSignedUnit(unit)
      ? (() => {
          const extent = Math.max(0.5, ...values.map((value) => Math.abs(value))) * 1.2
          return [-extent, extent]
        })()
      : [0, Math.max(...highs) > 0 ? Math.max(...highs) * 1.1 : 1],
    range: [innerHeight, 0],
    nice: true,
  })

  const x = (point: TrendPoint) => xScale(point.date)
  // The band only reads when there's one line — overlapping bands across branches
  // would be mud, so comparison mode shows lines only (see seriesHasBand for the
  // low-sample case)
  const showBand = layers.visible('band') && seriesHasBand(series)
  const overlayBaseline = layers.visible('baseline') ? baselineToDraw(series, drift) : null
  // The band belongs to the line it describes, so it takes that line's color
  const bandColor = lineColorFor(series, 0)

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

  return (
    <div style={{position: 'relative', width, height}}>
      {/* No role="img": the plot is interactive (see the focusable capture
          rect below), not a static image — claiming "img" would hide that */}
      <svg width={width} height={height}>
        <Group left={MARGIN.left} top={MARGIN.top}>
          {/* Zero reference for signed slope charts — the "flat is good" line */}
          {isSignedUnit(unit) && (
            <line
              x1={0}
              x2={innerWidth}
              y1={yScale(0)}
              y2={yScale(0)}
              stroke={COLOR.axis}
              strokeWidth={1}
              opacity={0.4}
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
                    // Context lines (host calibration) are dashed so they read
                    // as reference, not as a measured metric line. The darker
                    // context color separates them from the muted-gray axes;
                    // reduced opacity keeps them recessive despite being darker.
                    strokeDasharray={series.goal === 'context' ? '4 3' : undefined}
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
            tickFormat={(value) => formatValue(Number(value), unit)}
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
            aria-label={`${series.title} — ${stepTimes.length} run(s).${
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
            left: anchor + MARGIN.left > width / 2 ? undefined : anchor + MARGIN.left + 8,
            right:
              anchor + MARGIN.left > width / 2 ? width - (anchor + MARGIN.left) + 8 : undefined,
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
                  <Text size={0} muted>
                    {lines.length > 1
                      ? entry.branch
                      : series.xKind === 'minute'
                        ? `minute ${Math.round(entry.point.date.getTime() / 60_000)}`
                        : entry.point.date.toISOString().slice(0, 10)}
                    {/* Provenance as text — the dot itself is the click target
                        (opens the run); GitHub backlinks live in the drift feed */}
                    {series.xKind !== 'minute' &&
                      (entry.point.prNumber
                        ? ` · PR #${entry.point.prNumber}`
                        : entry.point.sha !== 'unknown'
                          ? ` · ${entry.point.sha.slice(0, 7)}`
                          : '')}
                  </Text>
                </Flex>
              ))}
              {/* What the overlay rules are. Unlabelled in the plot they invite a
                  fair "that isn't the middle of the data" — a median ignores how
                  far outliers fall, so it sits with the cluster rather than
                  between the extremes. Naming the statistic and its window size
                  makes that readable instead of surprising. */}
              {overlayBaseline && (
                <>
                  <Box
                    aria-hidden="true"
                    style={{height: 1, background: 'var(--card-border-color)'}}
                  />
                  <Stack gap={1}>
                    <Flex align="center" gap={2}>
                      <Text size={0} muted>
                        baseline (median of {overlayBaseline.baselinePointsMs.length} runs)
                      </Text>
                      <Text size={0} weight="semibold">
                        {formatValue(overlayBaseline.baseline, unit)}
                      </Text>
                    </Flex>
                    <Flex align="center" gap={2}>
                      <Text size={0} muted>
                        recent (median of {overlayBaseline.recentPointsMs.length} runs)
                      </Text>
                      <Text size={0} weight="semibold">
                        {formatValue(overlayBaseline.recent, unit)}
                      </Text>
                    </Flex>
                  </Stack>
                </>
              )}
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
              left: MARGIN.left + x(selected),
              top: MARGIN.top + yScale(selected.value),
              width: 1,
              height: 1,
              pointerEvents: 'none',
            }}
          />
          <RunDetailPopover
            key={selected.runId}
            series={series}
            point={selected}
            previousSha={previousShaFor(lines, selected)}
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
