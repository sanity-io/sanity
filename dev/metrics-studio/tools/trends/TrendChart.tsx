import {Card, Flex, Stack, Text} from '@sanity/ui'
import {AxisBottom, AxisLeft} from '@visx/axis'
import {Group} from '@visx/group'
import {scaleLinear, scaleTime} from '@visx/scale'
import {Area, LinePath} from '@visx/shape'
import {useState} from 'react'
import {useIntentLink} from 'sanity/router'

import {formatValue, type TrendLine, type TrendPoint, type TrendSeries} from './data'
import {categoricalColor} from './palette'

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

/** A dot linking to the run document behind the sample. */
function RunDot(props: {
  point: TrendPoint
  cx: number
  cy: number
  unit: TrendSeries['unit']
  color: string
  emphasized?: boolean
}) {
  const {point, cx, cy, unit, color, emphasized} = props
  const intent = useIntentLink({intent: 'edit', params: {id: point.runId, type: 'benchRun'}})
  return (
    <a
      href={intent.href}
      onClick={intent.onClick}
      aria-label={`open run ${point.sha.slice(0, 10)}`}
    >
      {/* invisible halo: a comfortable hover/click target around the 3px dot */}
      <circle cx={cx} cy={cy} r={9} fill="transparent" />
      <circle
        cx={cx}
        cy={cy}
        r={emphasized ? 4.5 : 3}
        fill={color}
        stroke={emphasized ? 'var(--card-bg-color, #fff)' : undefined}
        strokeWidth={emphasized ? 1.5 : 0}
      >
        <title>{`${point.date.toISOString().slice(0, 10)} @ ${point.sha.slice(0, 10)} — ${formatValue(point.value, unit)} (click to open the run)`}</title>
      </circle>
    </a>
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

export function TrendChart(props: {series: TrendSeries; width: number; height: number}) {
  const {series, width, height} = props
  const {lines, unit} = series
  const [hoverMs, setHoverMs] = useState<number | null>(null)
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
  const maxValue = Math.max(...allPoints.map((point) => point.p90 ?? point.value))
  const yScale = scaleLinear({
    domain: [0, maxValue > 0 ? maxValue * 1.1 : 1],
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
      <svg width={width} height={height} role="img" aria-label={series.title}>
        <Group left={MARGIN.left} top={MARGIN.top}>
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
                {line.points.map((point) => {
                  const isHovered = hovered.some(
                    (entry) => entry.branch === line.branch && entry.point === point,
                  )
                  return (
                    <RunDot
                      key={point.runId}
                      point={point}
                      cx={x(point)}
                      cy={yScale(point.value)}
                      unit={unit}
                      color={color}
                      emphasized={isHovered}
                    />
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
          {/* Transparent capture rect over the plot area drives the crosshair */}
          <rect
            width={Math.max(0, innerWidth)}
            height={Math.max(0, innerHeight)}
            fill="transparent"
            onPointerMove={handleMove}
            onPointerLeave={() => setHoverMs(null)}
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
                  </Text>
                </Flex>
              ))}
            </Stack>
          </Card>
        </div>
      )}
    </div>
  )
}
