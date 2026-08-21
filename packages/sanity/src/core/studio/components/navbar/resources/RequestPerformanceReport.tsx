/* oxlint-disable i18next/no-literal-string, @sanity/i18n/no-attribute-string-literals, @sanity/i18n/no-attribute-template-literals -- Diagnostics uses fixed English terminology so support and users see the same technical labels. */
import {Card, Flex, Heading, Stack, Text} from '@sanity/ui'
import {memo, type PointerEvent as ReactPointerEvent, useCallback, useMemo, useState} from 'react'
import {styled} from 'styled-components'

import {Button} from '../../../../../ui-components/button/Button'
import {type RequestPerformanceEntry, type RequestPerformanceSnapshot} from '../../../diagnostics'

const CHART_WIDTH = 800
const CHART_HEIGHT = 240
const CHART_PADDING = {bottom: 28, left: 72, right: 12, top: 18}

type MarkerShape = 'circle' | 'cross' | 'diamond' | 'square' | 'triangle' | 'triangle-down'

interface SeriesStyle {
  color: string
  marker: MarkerShape
}

const QUERY_STYLE: SeriesStyle = {
  color: 'var(--card-muted-fg-color)',
  marker: 'circle',
}
const BUCKET_STYLES: Record<string, SeriesStyle> = {
  actions: {color: 'var(--card-badge-primary-dot-color)', marker: 'diamond'},
  doc: {color: 'var(--card-badge-positive-dot-color)', marker: 'square'},
  history: {color: 'var(--card-badge-caution-dot-color)', marker: 'triangle'},
  mutate: {color: 'var(--card-badge-suggest-dot-color)', marker: 'cross'},
  query: QUERY_STYLE,
}
const FALLBACK_STYLES: SeriesStyle[] = [
  {color: 'var(--card-badge-critical-dot-color)', marker: 'triangle-down'},
  {color: 'var(--card-badge-positive-dot-color)', marker: 'square'},
  {color: 'var(--card-badge-caution-dot-color)', marker: 'triangle'},
  {color: 'var(--card-badge-suggest-dot-color)', marker: 'cross'},
  {color: 'var(--card-badge-primary-dot-color)', marker: 'diamond'},
]

const ChartContainer = styled.div`
  position: relative;
`

const PointTooltipPositioner = styled.div<{$x: number; $y: number}>`
  left: ${({$x}) => `${($x / CHART_WIDTH) * 100}%`};
  pointer-events: none;
  position: absolute;
  top: ${({$y}) => `${($y / CHART_HEIGHT) * 100}%`};
  transform: ${({$x, $y}) => {
    const translateX = $x < 170 ? '0' : $x > CHART_WIDTH - 170 ? '-100%' : '-50%'
    const translateY = $y < 92 ? '12px' : 'calc(-100% - 10px)'
    return `translate(${translateX}, ${translateY})`
  }};
  width: 220px;
  z-index: 1;
`

const SummaryTable = styled.table`
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;

  th,
  td {
    padding: 4px 8px;
  }

  th:first-child,
  td:first-child {
    padding-left: 0;
    text-align: left;
    width: 36%;
  }

  th:not(:first-child),
  td:not(:first-child) {
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  th:last-child,
  td:last-child {
    padding-right: 0;
  }

  tbody tr {
    transition: opacity 120ms ease-out;
  }

  tbody tr[data-muted='true'] {
    opacity: 0.4;
  }
`

const SeriesButton = styled.button`
  align-items: center;
  background: none;
  border: 0;
  color: inherit;
  cursor: pointer;
  display: flex;
  font: inherit;
  gap: 8px;
  margin: -4px;
  padding: 4px;

  &:focus-visible {
    border-radius: 3px;
    outline: 2px solid var(--card-focus-ring-color);
    outline-offset: 1px;
  }
`

const SeriesMarker = styled.svg`
  flex: none;
  height: 12px;
  width: 12px;
`

interface BucketSummary {
  bucket: string
  count: number
  maxMs: number
  medianMs: number
  p95Ms: number
  style: SeriesStyle
}

interface ChartPoint {
  entry: RequestPerformanceEntry
  style: SeriesStyle
  x: number
  y: number
}

interface ChartData {
  endLabel: string
  endMs: number
  maxDurationMs: number
  points: ChartPoint[]
  startLabel: string
  startMs: number
}

interface TimeRange {
  end: number
  start: number
}

interface DragSelection {
  currentX: number
  pointerId: number
  startX: number
}

interface RequestPerformanceReportProps {
  diagnosticsCompletedAt?: string
  diagnosticsStartedAt?: string
  history: RequestPerformanceSnapshot
  useUtc?: boolean
}

/** @internal */
export function RequestPerformanceReport({
  diagnosticsCompletedAt,
  diagnosticsStartedAt,
  history,
  useUtc = true,
}: RequestPerformanceReportProps) {
  const [selectedBucket, setSelectedBucket] = useState<string>()
  const [timeRange, setTimeRange] = useState<TimeRange>()
  const reportEntries = useMemo(
    () =>
      excludeEntriesStartedDuringDiagnostics(
        history.entries,
        diagnosticsStartedAt,
        diagnosticsCompletedAt,
      ),
    [diagnosticsCompletedAt, diagnosticsStartedAt, history.entries],
  )
  const excludedEntryCount = history.entries.length - reportEntries.length
  const reportTotalRequests = history.sessionSummary.totalRequests
  const seriesStyles = useMemo(
    () =>
      createSeriesStyles(
        reportEntries,
        history.sessionSummary.buckets.map(({bucket}) => bucket),
      ),
    [history.sessionSummary.buckets, reportEntries],
  )
  const visibleEntries = useMemo(
    () => filterEntriesByTime(reportEntries, timeRange),
    [reportEntries, timeRange],
  )
  const visibleSummaries = useMemo(
    () => summarizeBuckets(visibleEntries, seriesStyles),
    [seriesStyles, visibleEntries],
  )
  const sessionSummaries = useMemo(
    () =>
      history.sessionSummary.buckets.map((summary) => ({
        ...summary,
        style: seriesStyles.get(summary.bucket) ?? QUERY_STYLE,
      })),
    [history.sessionSummary.buckets, seriesStyles],
  )
  const summaries = timeRange ? visibleSummaries : sessionSummaries
  const chart = useMemo(
    () => createChartData(visibleEntries, seriesStyles, timeRange, useUtc),
    [seriesStyles, timeRange, useUtc, visibleEntries],
  )
  const abortedCount = visibleEntries.filter(({status}) => status === 'aborted').length
  const chartPointCount = selectedBucket
    ? chart.points.filter(({entry}) => entry.bucket === selectedBucket).length
    : chart.points.length

  const handleBucketClick = useCallback((bucket: string) => {
    setSelectedBucket((current) => (current === bucket ? undefined : bucket))
  }, [])

  const handleTimeRangeSelect = useCallback(
    (nextRange: TimeRange) => {
      const entriesInRange = filterEntriesByTime(reportEntries, nextRange)
      if (entriesInRange.length === 0) return

      setTimeRange(nextRange)
      setSelectedBucket((current) =>
        current && entriesInRange.some(({bucket}) => bucket === current) ? current : undefined,
      )
    },
    [reportEntries],
  )

  const handleTimeRangeReset = useCallback(() => setTimeRange(undefined), [])

  return (
    <Stack gap={2}>
      <Flex align="center" gap={3} justify="space-between" wrap="wrap">
        <Heading as="h2" size={1}>
          Recent request timings
        </Heading>
        <Text muted size={1}>
          {visibleEntries.length.toLocaleString()} recent samples ·{' '}
          {reportTotalRequests.toLocaleString()} session requests
        </Text>
      </Flex>

      <Card border data-testid="diagnostics-request-history" padding={4} radius={2}>
        {reportEntries.length === 0 ? (
          <Text muted size={1}>
            {excludedEntryCount > 0
              ? 'No session requests outside this diagnostics run are available to plot.'
              : 'No data API requests have been observed for this workspace target in this browser session.'}
          </Text>
        ) : (
          <Stack gap={4}>
            <InteractiveChart
              ariaLabel={`Scatter plot of ${chartPointCount} session request timings`}
              chart={chart}
              key={`${chart.startMs}-${chart.endMs}`}
              onTimeRangeSelect={handleTimeRangeSelect}
              selectedBucket={selectedBucket}
              useUtc={useUtc}
            />

            <Flex align="center" gap={3} justify="space-between" wrap="wrap">
              <Text muted size={1}>
                {timeRange
                  ? `${formatTime(timeRange.start, useUtc)} to ${formatTime(timeRange.end, useUtc)}`
                  : 'Drag across the chart to focus on a time range.'}
              </Text>
              {timeRange ? (
                <Button mode="ghost" onClick={handleTimeRangeReset} text="Reset time range" />
              ) : null}
            </Flex>

            <Stack gap={2}>
              <Text muted size={1} weight="semibold">
                {timeRange
                  ? 'Selected range summary'
                  : 'Full session summary (estimated percentiles)'}
              </Text>
              <SummaryTable>
                <thead>
                  <tr>
                    <th scope="col">
                      <Text muted size={1} weight="semibold">
                        Series
                      </Text>
                    </th>
                    <th scope="col">
                      <Text muted size={1} weight="semibold">
                        n
                      </Text>
                    </th>
                    <th scope="col">
                      <Text muted size={1} weight="semibold">
                        Median
                      </Text>
                    </th>
                    <th scope="col">
                      <Text muted size={1} weight="semibold">
                        p95
                      </Text>
                    </th>
                    <th scope="col">
                      <Text muted size={1} weight="semibold">
                        Max
                      </Text>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((summary) => {
                    const muted = Boolean(selectedBucket && selectedBucket !== summary.bucket)
                    return (
                      <tr data-muted={muted} key={summary.bucket}>
                        <td>
                          <SeriesButton
                            aria-pressed={selectedBucket === summary.bucket}
                            onClick={() => handleBucketClick(summary.bucket)}
                            type="button"
                          >
                            <SeriesMarker aria-hidden="true" viewBox="-6 -6 12 12">
                              <g fill={summary.style.color} stroke="none">
                                <PointMarker shape={summary.style.marker} />
                              </g>
                            </SeriesMarker>
                            <Text as="span" size={1} weight="semibold">
                              {summary.bucket}
                            </Text>
                          </SeriesButton>
                        </td>
                        <td>
                          <Text size={1}>{summary.count.toLocaleString()}</Text>
                        </td>
                        <td>
                          <Text size={1}>{formatMilliseconds(summary.medianMs)}</Text>
                        </td>
                        <td>
                          <Text size={1}>{formatMilliseconds(summary.p95Ms)}</Text>
                        </td>
                        <td>
                          <Text size={1}>{formatMilliseconds(summary.maxMs)}</Text>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </SummaryTable>
            </Stack>

            {abortedCount > 0 ? (
              <Text muted size={1}>
                {abortedCount.toLocaleString()} aborted{' '}
                {abortedCount === 1 ? 'sample is' : 'samples are'} included in copied output but
                excluded from summary statistics.
              </Text>
            ) : null}

            {history.truncated ? (
              <Text muted size={1}>
                Older samples have been omitted because the session limit was reached.
              </Text>
            ) : null}
          </Stack>
        )}
      </Card>
    </Stack>
  )
}

const ChartPoints = memo(function ChartPoints({
  onPointEnter,
  onPointLeave,
  points,
  selectedBucket,
  useUtc,
}: {
  onPointEnter: (point: ChartPoint) => void
  onPointLeave: () => void
  points: ChartPoint[]
  selectedBucket: string | undefined
  useUtc: boolean
}) {
  return points.map((point, index) => {
    const {entry, style, x, y} = point
    if (selectedBucket && entry.bucket !== selectedBucket) return null

    return (
      <g
        aria-label={formatPointLabel(entry, useUtc)}
        data-marker={style.marker}
        data-testid="diagnostics-request-history-point"
        fill={style.color}
        key={`${entry.startedAt}-${entry.bucket}-${index}`}
        onBlur={onPointLeave}
        onFocus={() => onPointEnter(point)}
        onPointerEnter={() => onPointEnter(point)}
        onPointerLeave={onPointLeave}
        opacity={entry.status === 'error' ? 1 : 0.52}
        stroke={entry.status === 'error' ? 'var(--card-badge-critical-fg-color)' : 'none'}
        strokeWidth={entry.status === 'error' ? 2 : 0}
        tabIndex={0}
        transform={`translate(${x} ${y})`}
      >
        <circle fill="transparent" r={8} stroke="none" />
        <PointMarker shape={style.marker} />
      </g>
    )
  })
})

function InteractiveChart({
  ariaLabel,
  chart,
  onTimeRangeSelect,
  selectedBucket,
  useUtc,
}: {
  ariaLabel: string
  chart: ChartData
  onTimeRangeSelect: (range: TimeRange) => void
  selectedBucket: string | undefined
  useUtc: boolean
}) {
  const [dragSelection, setDragSelection] = useState<DragSelection>()
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint>()
  const visibleHoveredPoint =
    hoveredPoint && (!selectedBucket || hoveredPoint.entry.bucket === selectedBucket)
      ? hoveredPoint
      : undefined

  const handlePointEnter = useCallback((point: ChartPoint) => setHoveredPoint(point), [])
  const handlePointLeave = useCallback(() => setHoveredPoint(undefined), [])

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (event.button !== 0 || chart.startMs === chart.endMs) return
      const x = getChartX(event)
      event.currentTarget.setPointerCapture?.(event.pointerId)
      setHoveredPoint(undefined)
      setDragSelection({currentX: x, pointerId: event.pointerId, startX: x})
    },
    [chart.endMs, chart.startMs],
  )

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (!dragSelection || dragSelection.pointerId !== event.pointerId) return
      const x = getChartX(event)
      setDragSelection({...dragSelection, currentX: x})
    },
    [dragSelection],
  )

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (!dragSelection || dragSelection.pointerId !== event.pointerId) return
      event.currentTarget.releasePointerCapture?.(event.pointerId)
      const currentX = getChartX(event)
      const left = Math.min(dragSelection.startX, currentX)
      const right = Math.max(dragSelection.startX, currentX)

      setDragSelection(undefined)
      if (right - left < 8) return

      onTimeRangeSelect({
        end: chartXToTimestamp(right, chart),
        start: chartXToTimestamp(left, chart),
      })
    },
    [chart, dragSelection, onTimeRangeSelect],
  )

  const handlePointerCancel = useCallback(() => setDragSelection(undefined), [])

  return (
    <ChartContainer>
      <svg
        aria-label={ariaLabel}
        data-duration-scale="linear"
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- can't be an img (svg)
        role="img"
        style={{
          cursor: dragSelection ? 'grabbing' : 'crosshair',
          display: 'block',
          height: 'auto',
          touchAction: 'none',
          userSelect: 'none',
          width: '100%',
        }}
        viewBox="0 0 800 240"
      >
        <ChartGrid maxDurationMs={chart.maxDurationMs} />
        <ChartPoints
          onPointEnter={handlePointEnter}
          onPointLeave={handlePointLeave}
          points={chart.points}
          selectedBucket={selectedBucket}
          useUtc={useUtc}
        />
        {dragSelection ? <SelectionOverlay selection={dragSelection} /> : null}
        <text
          fill="var(--card-muted-fg-color)"
          fontSize="11"
          x={CHART_PADDING.left}
          y={CHART_HEIGHT - 6}
        >
          {chart.startLabel}
        </text>
        <text
          fill="var(--card-muted-fg-color)"
          fontSize="11"
          textAnchor="end"
          x={CHART_WIDTH - CHART_PADDING.right}
          y={CHART_HEIGHT - 6}
        >
          {chart.endLabel}
        </text>
      </svg>

      {visibleHoveredPoint ? <PointTooltip point={visibleHoveredPoint} useUtc={useUtc} /> : null}
    </ChartContainer>
  )
}

function PointTooltip({point, useUtc}: {point: ChartPoint; useUtc: boolean}) {
  const {entry, style, x, y} = point
  const status =
    entry.status === 'success' ? 'Success' : entry.status === 'error' ? 'Error' : 'Aborted'

  return (
    <PointTooltipPositioner $x={x} $y={y} role="tooltip">
      <Card border padding={3} radius={2} shadow={2}>
        <Stack gap={3}>
          <Flex align="center" gap={2}>
            <SeriesMarker aria-hidden="true" viewBox="-6 -6 12 12">
              <g fill={style.color} stroke="none">
                <PointMarker shape={style.marker} />
              </g>
            </SeriesMarker>
            <Text size={1} weight="semibold">
              {entry.bucket}
            </Text>
          </Flex>
          <TooltipDetail label="Duration" value={formatMilliseconds(entry.durationMs)} />
          <TooltipDetail label="Started" value={formatTime(entry.startedAt, useUtc)} />
          <TooltipDetail label="API version" value={entry.apiVersion} />
          <TooltipDetail label="Status" value={status} />
        </Stack>
      </Card>
    </PointTooltipPositioner>
  )
}

function TooltipDetail({label, value}: {label: string; value: string}) {
  return (
    <Flex align="baseline" gap={3} justify="space-between">
      <Text muted size={1}>
        {label}
      </Text>
      <Text size={1} style={{fontVariantNumeric: 'tabular-nums', textAlign: 'right'}}>
        {value}
      </Text>
    </Flex>
  )
}

function SelectionOverlay({selection}: {selection: DragSelection}) {
  const x = Math.min(selection.startX, selection.currentX)
  const width = Math.abs(selection.currentX - selection.startX)

  return (
    <rect
      fill="var(--card-badge-primary-dot-color)"
      height={CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom}
      opacity={0.12}
      pointerEvents="none"
      stroke="var(--card-badge-primary-fg-color)"
      strokeWidth={1}
      width={width}
      x={x}
      y={CHART_PADDING.top}
    />
  )
}

function ChartGrid({maxDurationMs}: {maxDurationMs: number}) {
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom

  return [0, 0.5, 1].map((ratio) => {
    const y = CHART_PADDING.top + plotHeight * ratio
    const durationMs = maxDurationMs * (1 - ratio)

    return (
      <g key={ratio}>
        <line
          opacity={0.45}
          stroke="var(--card-border-color)"
          x1={CHART_PADDING.left}
          x2={CHART_WIDTH - CHART_PADDING.right}
          y1={y}
          y2={y}
        />
        <text
          dominantBaseline="middle"
          fill="var(--card-muted-fg-color)"
          fontSize="11"
          textAnchor="end"
          x={CHART_PADDING.left - 8}
          y={y}
        >
          {formatMilliseconds(durationMs)}
        </text>
      </g>
    )
  })
}

function PointMarker({shape}: {shape: MarkerShape}) {
  switch (shape) {
    case 'circle':
      return <circle cx={0} cy={0} r={2.5} />
    case 'cross':
      return <path d="M-1-4H1V-1H4V1H1V4H-1V1H-4V-1H-1Z" strokeLinejoin="round" />
    case 'diamond':
      return <path d="M0-3.5L3.5 0L0 3.5L-3.5 0Z" />
    case 'square':
      return <rect height={5.5} width={5.5} x={-2.75} y={-2.75} />
    case 'triangle':
      return <path d="M0-3.75L3.75 3L-3.75 3Z" />
    case 'triangle-down':
      return <path d="M-3.75-3L3.75-3L0 3.75Z" />
    default:
      return null
  }
}

function createSeriesStyles(
  entries: RequestPerformanceEntry[],
  additionalBuckets: string[] = [],
): Map<string, SeriesStyle> {
  const buckets = [...new Set([...entries.map(({bucket}) => bucket), ...additionalBuckets])].sort()

  return new Map(
    buckets.map((bucket, index) => [
      bucket,
      BUCKET_STYLES[bucket] ?? FALLBACK_STYLES[index % FALLBACK_STYLES.length] ?? QUERY_STYLE,
    ]),
  )
}

function summarizeBuckets(
  entries: RequestPerformanceEntry[],
  seriesStyles: Map<string, SeriesStyle>,
): BucketSummary[] {
  const durationsByBucket = new Map<string, number[]>()

  for (const entry of entries) {
    if (entry.status === 'aborted') continue
    const durations = durationsByBucket.get(entry.bucket) ?? []
    durations.push(entry.durationMs)
    durationsByBucket.set(entry.bucket, durations)
  }

  return [...durationsByBucket.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([bucket, durations]) => {
      const sorted = durations.toSorted((left, right) => left - right)
      return {
        bucket,
        count: sorted.length,
        maxMs: sorted.at(-1) ?? 0,
        medianMs: percentile(sorted, 0.5),
        p95Ms: percentile(sorted, 0.95),
        style: seriesStyles.get(bucket) ?? QUERY_STYLE,
      }
    })
}

function createChartData(
  entries: RequestPerformanceEntry[],
  seriesStyles: Map<string, SeriesStyle>,
  timeRange: TimeRange | undefined,
  useUtc: boolean,
): ChartData {
  if (entries.length === 0) {
    return {endLabel: '', endMs: 0, maxDurationMs: 1, points: [], startLabel: '', startMs: 0}
  }

  const timestamps = entries.map(getEntryTimestamp)
  const startMs = timeRange?.start ?? Math.min(...timestamps)
  const endMs = timeRange?.end ?? Math.max(...timestamps)
  const durationRange = endMs - startMs
  const maxDurationMs = niceMaximum(Math.max(...entries.map(({durationMs}) => durationMs)))
  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom

  return {
    endLabel: formatTime(endMs, useUtc),
    endMs,
    maxDurationMs,
    points: entries.map((entry, index) => {
      const timestamp = timestamps[index] ?? startMs
      const xRatio = durationRange === 0 ? 0.5 : (timestamp - startMs) / durationRange
      return {
        entry,
        style: seriesStyles.get(entry.bucket) ?? QUERY_STYLE,
        x: CHART_PADDING.left + xRatio * plotWidth,
        y: CHART_PADDING.top + (1 - entry.durationMs / maxDurationMs) * plotHeight,
      }
    }),
    startLabel: formatTime(startMs, useUtc),
    startMs,
  }
}

function excludeEntriesStartedDuringDiagnostics(
  entries: RequestPerformanceEntry[],
  diagnosticsStartedAt: string | undefined,
  diagnosticsCompletedAt: string | undefined,
): RequestPerformanceEntry[] {
  if (!diagnosticsStartedAt || !diagnosticsCompletedAt) return entries
  const diagnosticsStart = new Date(diagnosticsStartedAt).getTime()
  const diagnosticsEnd = new Date(diagnosticsCompletedAt).getTime()
  if (Number.isNaN(diagnosticsStart) || Number.isNaN(diagnosticsEnd)) return entries

  return entries.filter((entry) => {
    const timestamp = getEntryTimestamp(entry)
    return timestamp < diagnosticsStart || timestamp > diagnosticsEnd
  })
}

function filterEntriesByTime(
  entries: RequestPerformanceEntry[],
  timeRange: TimeRange | undefined,
): RequestPerformanceEntry[] {
  if (!timeRange) return entries
  return entries.filter((entry) => {
    const timestamp = getEntryTimestamp(entry)
    return timestamp >= timeRange.start && timestamp <= timeRange.end
  })
}

function getEntryTimestamp(entry: RequestPerformanceEntry): number {
  return new Date(entry.startedAt).getTime()
}

function getChartX(event: ReactPointerEvent<SVGSVGElement>): number {
  const bounds = event.currentTarget.getBoundingClientRect()
  const ratio = bounds.width === 0 ? 0 : (event.clientX - bounds.left) / bounds.width
  return Math.min(
    CHART_WIDTH - CHART_PADDING.right,
    Math.max(CHART_PADDING.left, ratio * CHART_WIDTH),
  )
}

function chartXToTimestamp(x: number, chart: ChartData): number {
  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right
  const ratio = (x - CHART_PADDING.left) / plotWidth
  return chart.startMs + ratio * (chart.endMs - chart.startMs)
}

function percentile(sortedValues: number[], percentileValue: number): number {
  const index = Math.max(0, Math.ceil(sortedValues.length * percentileValue) - 1)
  return sortedValues[index] ?? 0
}

function niceMaximum(value: number): number {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / magnitude) * magnitude
}

function formatMilliseconds(value: number): string {
  return `${Math.round(value).toLocaleString()} ms`
}

function formatTime(timestamp: number | string, useUtc: boolean): string {
  const date = new Date(timestamp)
  if (!useUtc) return date.toLocaleTimeString()

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
  })
}

function formatPointLabel(entry: RequestPerformanceEntry, useUtc: boolean): string {
  return `${entry.bucket}, ${formatMilliseconds(entry.durationMs)}, ${formatTime(entry.startedAt, useUtc)}, ${entry.status}`
}
