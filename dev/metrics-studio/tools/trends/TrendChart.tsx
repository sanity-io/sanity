import {Card, Flex, Stack, Text} from '@sanity/ui'
import {AxisBottom, AxisLeft} from '@visx/axis'
import {Group} from '@visx/group'
import {scaleLinear, scaleTime} from '@visx/scale'
import {Area, LinePath} from '@visx/shape'
import {useRef, useState} from 'react'

import {formatValue, isSignedUnit, type TrendLine, type TrendPoint, type TrendSeries} from './data'
import {categoricalColor} from './palette'
import {RunDetailPopover} from './RunDetailPopover'

const MARGIN = {top: 8, right: 8, bottom: 22, left: 44}

/** Theme-aware colors via the studio's CSS custom properties. */
export const COLOR = {
  line: 'var(--card-accent-fg-color, #556bfc)',
  band: 'var(--card-badge-primary-bg-color, rgba(85, 107, 252, 0.15))',
  axis: 'var(--card-muted-fg-color, #727892)',
  /** Context charts (host calibration) recede — reference, not measurement. */
  context: 'var(--card-muted-fg-color, #727892)',
}

/** Per-line color: the studio accent for a lone line, categorical when comparing. */
function lineColorFor(series: TrendSeries, index: number): string {
  if (series.goal === 'context') return COLOR.context
  if (series.lines.length <= 1) return COLOR.line
  return categoricalColor(index)
}

/**
 * A run marker. Not interactive itself — the plot-wide capture rect handles
 * clicks (it sits above the dots) and opens the nearest run. The `emphasized`
 * dot tracks the crosshair; pointerEvents none so it never intercepts.
 */
function RunDot(props: {
  point: TrendPoint
  cx: number
  cy: number
  color: string
  emphasized?: boolean
}) {
  const {cx, cy, color, emphasized} = props
  return (
    <circle
      cx={cx}
      cy={cy}
      // Smaller resting dot; the hovered one grows and switches to the accent
      // color (a color change reads far better than the old subtle white ring)
      r={emphasized ? 4 : 2}
      fill={emphasized ? 'var(--card-focus-ring-color, #556bfc)' : color}
      pointerEvents="none"
    />
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

export function TrendChart(props: {series: TrendSeries; width: number; height: number}) {
  const {series, width, height} = props
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
  // The p75–p90 band only reads when there's one line — overlapping bands
  // across branches would be mud, so comparison mode shows lines only
  const showBand = lines.length === 1 && lines[0].points.some((p) => p.p75 !== undefined)

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
      const current =
        hoverMs === null
          ? stepTimes.length - 1
          : stepTimes.reduce(
              (nearest, time, index) =>
                Math.abs(time - hoverMs) < Math.abs(stepTimes[nearest] - hoverMs) ? index : nearest,
              0,
            )
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

  const anchor = hoverMs === null ? null : xScale(new Date(hoverMs))
  // Each line's nearest point to the hovered time, for the crosshair readout
  const hovered =
    hoverMs === null
      ? []
      : lines
          .map((line, index) => ({
            branch: line.branch,
            color: lineColorFor(series, index),
            point: nearestPoint(line, hoverMs),
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
          {showBand && (
            <Area<TrendPoint>
              data={lines[0].points}
              x={x}
              y0={(point) => yScale(point.p75 ?? point.value)}
              y1={(point) => yScale(point.p90 ?? point.value)}
              fill={COLOR.band}
            />
          )}
          {lines.map((line, index) => {
            const color = lineColorFor(series, index)
            return (
              <g key={line.branch}>
                {line.points.length > 1 && (
                  <LinePath<TrendPoint>
                    data={line.points}
                    x={x}
                    y={(point) => yScale(point.value)}
                    stroke={color}
                    strokeWidth={1.5}
                    // Context lines (host calibration) are dashed so they read
                    // as reference, not as a measured metric line
                    strokeDasharray={series.goal === 'context' ? '4 3' : undefined}
                  />
                )}
                {line.points.map((point, pointIndex) => {
                  const isHovered = hovered.some(
                    (entry) => entry.branch === line.branch && entry.point === point,
                  )
                  return (
                    // Soak charts encode one run as many minute samples, so every
                    // point shares the same runId — index keeps the key unique
                    <g key={`${point.runId}:${pointIndex}`}>
                      {/* Soft halo behind the hovered point — reads clearly as
                          "this run is targeted / clickable" */}
                      {isHovered && (
                        <circle
                          cx={x(point)}
                          cy={yScale(point.value)}
                          r={9}
                          fill={color}
                          opacity={0.18}
                          pointerEvents="none"
                        />
                      )}
                      <RunDot
                        point={point}
                        cx={x(point)}
                        cy={yScale(point.value)}
                        color={color}
                        emphasized={isHovered}
                      />
                    </g>
                  )
                })}
              </g>
            )
          })}
          {anchor !== null && (
            <line
              x1={anchor}
              x2={anchor}
              y1={0}
              y2={innerHeight}
              stroke={COLOR.axis}
              strokeWidth={1}
              strokeDasharray="3 3"
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
            aria-label={`${series.title} — ${stepTimes.length} run(s). Arrow keys inspect runs, Enter opens details.`}
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
      {anchor !== null && hovered.length > 0 && (
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
            <Stack space={2}>
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
            series={series}
            point={selected}
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
