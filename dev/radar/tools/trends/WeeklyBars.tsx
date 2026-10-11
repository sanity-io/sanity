import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Badge, Button, Card, Text, useClickOutsideEvent} from '@sanity/ui'
import {Popover} from '@sanity/ui/popover'
import {AxisBottom, AxisLeft} from '@visx/axis'
import {Group} from '@visx/group'
import {ParentSize} from '@visx/responsive'
import {scaleBand, scaleLinear} from '@visx/scale'
import {Bar} from '@visx/shape'
import {useRef, useState} from 'react'
import {Box, Flex, VStack} from 'ui5'

import {
  formatTick,
  formatValue,
  primaryLines,
  type TrendSeries,
  type TrendTag,
  type TrendUnit,
} from './data'
import {RunDetailPopover} from './RunDetailPopover'
import {COLOR} from './TrendChart'
import {
  monthTick,
  monthTickIndices,
  type WeekBucket,
  weekLabel,
  weeklyBuckets,
  weekOverWeek,
} from './weekly'

/**
 * How a weekly chart draws its bars.
 *
 * - `share`: a 100%-stacked bar per week — the measured share filled from the
 *   bottom, the remainder above it — the construction of Linear's "StyleX
 *   adoption per week" chart, where the green climbing to the top *is* the
 *   celebration. Both segments are named, so the bar reads as "this much
 *   migrated, this much left" without a legend lookup.
 * - `level`: a plain bar per week at the metric's value — their
 *   "styled-components files added per week" chart, for a count or a size that
 *   should sink to the axis.
 */
export type WeeklyVariant =
  | {kind: 'share'; fill: {label: string; color: string}; remainder: {label: string; color: string}}
  | {kind: 'level'; color: string}

// Same gutters as TrendChart, so the weekly cards line up with the trend
// cards in a grid; bottom leaves room for the year-month ticks
const MARGIN = {top: 8, right: 8, bottom: 26}

/**
 * The bar to read at pointer x: `scaleBand` has no invert, so measure from the
 * first band's center in whole steps. The scale's own step and offset, not
 * `width / count` — the outer padding shifts every band and the inner padding
 * makes the step wider than a bar, so a plain division drifts by a few pixels
 * per band and lands on the neighbour near a boundary.
 */
function bucketIndexAt(
  x: number,
  xScale: {(index: number): number | undefined; step(): number; bandwidth(): number},
  count: number,
): number {
  const firstCenter = (xScale(0) ?? 0) + xScale.bandwidth() / 2
  return Math.max(0, Math.min(count - 1, Math.round((x - firstCenter) / xScale.step())))
}

/**
 * A week-over-week move, signed. Shares move in percentage points ("+4 pts"),
 * not in percent of a percent — "35% → 39%" is a 4-point move, and calling it
 * "+4%" would read as 4% of 35.
 */
export function formatDelta(
  delta: number,
  unit: TrendUnit,
  options: {signed?: boolean} = {},
): string {
  const sign = options.signed === false ? '' : delta > 0 ? '+' : delta < 0 ? '−' : ''
  const size = Math.abs(delta)
  if (unit === 'percent') return `${sign}${size < 1 ? size.toFixed(1) : size.toFixed(0)} pts`
  return `${sign}${formatValue(size, unit)}`
}

/**
 * One histogram: a bar per calendar week, the bucket median as its height.
 * Hover names the week, its value and the week-over-week move; click (or
 * Enter) opens the week's newest run in the same run popover the trend
 * charts use, so a bar is a bisect anchor like any other point.
 */
export function WeeklyBars(props: {
  series: TrendSeries
  buckets: WeekBucket[]
  variant: WeeklyVariant
  width: number
  height: number
  tags?: TrendTag[]
}) {
  const {series, buckets, variant, width, height, tags = []} = props
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [selected, setSelected] = useState<WeekBucket | null>(null)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const captureRef = useRef<SVGRectElement>(null)
  if (width < 10 || buckets.length === 0) return null

  const {unit} = series
  const innerHeight = height - MARGIN.top - MARGIN.bottom
  const measured = buckets.filter((bucket) => bucket.value !== null)
  const top =
    variant.kind === 'share' ? 100 : Math.max(1, ...measured.map((bucket) => bucket.value!)) * 1.1
  const yScale = scaleLinear({
    domain: [0, top],
    range: [innerHeight, 0],
    nice: variant.kind !== 'share',
  })
  const yDomainMax = yScale.domain().at(-1) ?? 0
  const tickLabels = yScale.ticks(3).map((tick) => formatTick(tick, unit, yDomainMax))
  const marginLeft = Math.max(
    36,
    Math.ceil(Math.max(0, ...tickLabels.map((label) => label.length)) * 6.2) + 12,
  )
  const innerWidth = width - marginLeft - MARGIN.right
  const xScale = scaleBand<number>({
    domain: buckets.map((_, index) => index),
    range: [0, innerWidth],
    // Bars nearly touch, as in a histogram: the week grid is regular, and a
    // wide gap would read as a missing week
    paddingInner: 0.15,
    paddingOuter: 0.05,
  })
  const bandwidth = xScale.bandwidth()
  const monthIndices = new Set(monthTickIndices(buckets))
  const wow = weekOverWeek(buckets)

  const hovered = hoverIndex === null ? null : buckets[hoverIndex]
  const hoverX = hoverIndex === null ? null : (xScale(hoverIndex) ?? 0) + bandwidth / 2
  const previousMeasured = (index: number): WeekBucket | undefined => {
    for (let i = index - 1; i >= 0; i--) {
      if (buckets[i].value !== null) return buckets[i]
    }
    return undefined
  }
  /** The tooltip's content as one sentence — what the live region announces. */
  const describeBucket = (bucket: WeekBucket, index: number): string => {
    const week = `week of ${weekLabel(bucket.weekStart)}`
    if (bucket.value === null) return `${week}: no run this week`
    const value =
      variant.kind === 'share'
        ? `${variant.fill.label} ${formatValue(bucket.value, unit)}, ${variant.remainder.label} ${formatValue(100 - bucket.value, unit)}`
        : formatValue(bucket.value, unit)
    const previous = previousMeasured(index)
    const move =
      previous && previous.value !== null
        ? `, ${formatDelta(bucket.value - previous.value, unit)} vs week of ${weekLabel(previous.weekStart)}`
        : ''
    return `${week}: ${value}${move}, median of ${bucket.runs} ${bucket.runs === 1 ? 'run' : 'runs'}`
  }

  const handleMove = (event: React.PointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setHoverIndex(bucketIndexAt(event.clientX - rect.left, xScale, buckets.length))
  }
  const open = (index: number) => {
    const bucket = buckets[index]
    if (bucket?.latest) setSelected(bucket)
  }
  const handleKeyDown = (event: React.KeyboardEvent<SVGRectElement>) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const current = hoverIndex ?? buckets.length - 1
      setHoverIndex(
        Math.max(0, Math.min(buckets.length - 1, current + (event.key === 'ArrowRight' ? 1 : -1))),
      )
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      open(hoverIndex ?? buckets.length - 1)
    } else if (event.key === 'Escape') {
      setHoverIndex(null)
    }
  }

  const fillColor = variant.kind === 'share' ? variant.fill.color : variant.color
  const selectedX = selected === null ? 0 : (xScale(buckets.indexOf(selected)) ?? 0) + bandwidth / 2

  return (
    <div style={{position: 'relative', width, height}}>
      <svg width={width} height={height}>
        <Group left={marginLeft} top={MARGIN.top}>
          {buckets.map((bucket, index) => {
            if (bucket.value === null) return null
            const x = xScale(index) ?? 0
            const y = yScale(bucket.value)
            const dim = hoverIndex !== null && hoverIndex !== index
            return (
              <g key={bucket.weekStart.getTime()} opacity={dim ? 0.55 : 1}>
                {variant.kind === 'share' && (
                  // The remainder: what is left to migrate (or the CSS that is
                  // not styled-components) — recessive, so the eye reads the
                  // filled part as the achievement
                  <Bar
                    x={x}
                    y={0}
                    width={bandwidth}
                    height={Math.max(0, y)}
                    fill={variant.remainder.color}
                    opacity={0.35}
                  />
                )}
                <Bar
                  x={x}
                  y={y}
                  width={bandwidth}
                  height={Math.max(0, innerHeight - y)}
                  fill={fillColor}
                />
              </g>
            )
          })}
          {hoverX !== null && (
            <line
              x1={hoverX}
              x2={hoverX}
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
            tickValues={buckets.map((_, index) => index).filter((index) => monthIndices.has(index))}
            tickFormat={(index) => monthTick(buckets[Number(index)].weekStart)}
            stroke={COLOR.axis}
            tickStroke={COLOR.axis}
            tickLabelProps={{fill: COLOR.axis, fontSize: 10, textAnchor: 'middle'}}
          />
          <AxisLeft
            scale={yScale}
            numTicks={3}
            stroke={COLOR.axis}
            tickStroke={COLOR.axis}
            tickFormat={(value) => formatTick(Number(value), unit, yDomainMax)}
            tickLabelProps={{fill: COLOR.axis, fontSize: 10, textAnchor: 'end', dx: -2, dy: 3}}
          />
          <rect
            ref={captureRef}
            width={Math.max(0, innerWidth)}
            height={Math.max(0, innerHeight)}
            fill="transparent"
            style={{cursor: 'pointer', outline: 'none'}}
            tabIndex={0}
            role="application"
            aria-label={`${series.title} per week: ${measured.length} of ${buckets.length} weeks measured${
              wow
                ? `, latest ${formatValue(wow.latest.value!, unit)} (${formatDelta(wow.delta, unit)} vs the previous measured week)`
                : ''
            }. Arrow keys inspect weeks, Enter opens the week's newest run.`}
            onPointerMove={handleMove}
            onPointerLeave={() => setHoverIndex(null)}
            onFocus={() => setHoverIndex((current) => current ?? buckets.length - 1)}
            onKeyDown={handleKeyDown}
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              open(bucketIndexAt(event.clientX - rect.left, xScale, buckets.length))
            }}
          />
        </Group>
      </svg>
      {/* What the crosshair is on, for assistive tech: the tooltip below is
          visual only (pointerEvents none, never focused), and the capture
          rect's name is a static summary, so a keyboard user stepping through
          the weeks would otherwise hear nothing change. Announced politely so
          arrow-key repeats do not interrupt each other. */}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clipPath: 'inset(50%)',
          whiteSpace: 'nowrap',
        }}
      >
        {hovered ? describeBucket(hovered, hoverIndex!) : ''}
      </div>
      {hovered && hoverX !== null && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: hoverX + marginLeft > width / 2 ? undefined : hoverX + marginLeft + 8,
            right: hoverX + marginLeft > width / 2 ? width - (hoverX + marginLeft) + 8 : undefined,
            pointerEvents: 'none',
          }}
        >
          <Card radius={2} shadow={2} padding={2}>
            <VStack gap={2}>
              <Text size={0} muted>
                week of {weekLabel(hovered.weekStart)}
              </Text>
              {hovered.value === null ? (
                <Text size={0} muted>
                  no run this week
                </Text>
              ) : (
                <>
                  <Flex alignItems="center" gap={2}>
                    <Text size={0} weight="semibold">
                      {variant.kind === 'share' ? `${variant.fill.label} ` : ''}
                      {formatValue(hovered.value, unit)}
                    </Text>
                    {variant.kind === 'share' && (
                      <Text size={0} muted>
                        {variant.remainder.label} {formatValue(100 - hovered.value, unit)}
                      </Text>
                    )}
                  </Flex>
                  {(() => {
                    const previous = previousMeasured(hoverIndex!)
                    if (!previous || previous.value === null) return null
                    return (
                      <Text size={0} muted>
                        {formatDelta(hovered.value - previous.value, unit)} vs week of{' '}
                        {weekLabel(previous.weekStart)}
                      </Text>
                    )
                  })()}
                  <Text size={0} muted>
                    median of {hovered.runs} {hovered.runs === 1 ? 'run' : 'runs'}
                  </Text>
                </>
              )}
            </VStack>
          </Card>
        </div>
      )}
      {selected?.latest && (
        <>
          <div
            ref={setAnchorEl}
            style={{
              position: 'absolute',
              left: marginLeft + selectedX,
              top: MARGIN.top + yScale(selected.value ?? 0),
              width: 1,
              height: 1,
              pointerEvents: 'none',
            }}
          />
          <RunDetailPopover
            key={selected.latest.runId}
            series={series}
            point={selected.latest}
            previousPoint={previousMeasured(buckets.indexOf(selected))?.latest}
            tags={tags}
            referenceElement={anchorEl}
            onClose={() => {
              setSelected(null)
              captureRef.current?.focus()
            }}
          />
        </>
      )}
    </div>
  )
}

/**
 * A weekly chart in a card: title, the latest measured week with its
 * week-over-week move, the histogram and its key. The card is the weekly
 * counterpart of `SeriesCard`; the same series feeds both, so a bar's value
 * is always the median of points the trend chart also draws.
 */
export function WeeklyCard(props: {
  title: string
  description: string
  series: TrendSeries
  variant: WeeklyVariant
  goal: 'higher' | 'lower'
  tags?: TrendTag[]
  height?: number
}) {
  const {title, description, series, variant, goal, tags} = props
  const height = props.height ?? 160
  // The headline line: a lone line, or a paired chart's v5 line (the share
  // variant draws its complement as the remainder, so one line is the whole
  // story). Several judged lines mean branches are being compared, which the
  // weekly view does not draw.
  const judged = primaryLines(series)
  const points = judged.length === 1 ? judged[0].points : []
  const buckets = weeklyBuckets(points)
  const wow = weekOverWeek(buckets)
  const latest = [...buckets].reverse().find((bucket) => bucket.value !== null)
  // A move in the metric's good direction is the positive badge — for a
  // share that should climb, up is good; for a count that should sink, down is
  const improved = wow ? (goal === 'higher' ? wow.delta > 0 : wow.delta < 0) : false
  const [infoOpen, setInfoOpen] = useState(false)
  const [infoEl, setInfoEl] = useState<HTMLDivElement | null>(null)
  const infoButtonRef = useRef<HTMLButtonElement>(null)
  useClickOutsideEvent(
    () => setInfoOpen(false),
    () => [infoEl, infoButtonRef.current],
  )

  return (
    <Card border padding={3} radius={2}>
      <VStack gap={3}>
        <Flex alignItems="center" justifyContent="space-between" gap={3}>
          <Box flexBasis="0%" flexGrow={1} style={{minWidth: 0}}>
            <Text size={1} weight="medium">
              {title}
            </Text>
          </Box>
          <Flex alignItems="center" gap={2} flexShrink={0}>
            <Popover
              open={infoOpen}
              portal
              constrainSize
              content={
                <Box ref={setInfoEl} padding={3} style={{maxWidth: 260}}>
                  <Text size={1} muted>
                    {description}
                  </Text>
                </Box>
              }
            >
              <Button
                ref={infoButtonRef}
                mode="bleed"
                padding={2}
                fontSize={1}
                icon={InfoOutlineIcon}
                tone="default"
                aria-label={`About ${title}`}
                selected={infoOpen}
                onClick={() => setInfoOpen((value) => !value)}
              />
            </Popover>
          </Flex>
        </Flex>
        {latest && latest.value !== null && (
          <Flex alignItems="center" gap={2} flexWrap="wrap">
            <Text
              size={1}
              muted
              aria-label={`Latest week: ${formatValue(latest.value, series.unit)}`}
            >
              {formatValue(latest.value, series.unit)}
            </Text>
            {wow && wow.delta !== 0 && (
              <Badge tone={improved ? 'positive' : 'caution'} fontSize={0} style={{flexShrink: 0}}>
                {wow.delta > 0 ? '↑' : '↓'} {formatDelta(wow.delta, series.unit, {signed: false})}{' '}
                vs previous week
              </Badge>
            )}
          </Flex>
        )}
        {buckets.length === 0 ? (
          <Text size={1} muted>
            No measured weeks in this range.
          </Text>
        ) : (
          <ParentSize debounceTime={50} style={{height}}>
            {({width}) => (
              <WeeklyBars
                series={series}
                buckets={buckets}
                variant={variant}
                width={width}
                height={height}
                tags={tags}
              />
            )}
          </ParentSize>
        )}
        <Flex gap={3} flexWrap="wrap" alignItems="center">
          {variant.kind === 'share' ? (
            <>
              <Flex gap={1} alignItems="center">
                <span
                  aria-hidden="true"
                  style={{width: 10, height: 10, borderRadius: 2, background: variant.fill.color}}
                />
                <Text size={0} muted>
                  {variant.fill.label}
                </Text>
              </Flex>
              <Flex gap={1} alignItems="center">
                <span
                  aria-hidden="true"
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: variant.remainder.color,
                    opacity: 0.35,
                  }}
                />
                <Text size={0} muted>
                  {variant.remainder.label}
                </Text>
              </Flex>
            </>
          ) : (
            <Flex gap={1} alignItems="center">
              <span
                aria-hidden="true"
                style={{width: 10, height: 10, borderRadius: 2, background: variant.color}}
              />
              <Text size={0} muted>
                median per week
              </Text>
            </Flex>
          )}
          <Text size={0} muted>
            {goal} is better
          </Text>
        </Flex>
      </VStack>
    </Card>
  )
}
