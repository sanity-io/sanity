/// <reference types="vite/client" />
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Popover,
  PortalProvider,
  Select,
  Spinner,
  Stack,
  Text,
} from '@sanity/ui'
import {ParentSize} from '@visx/responsive'
import {useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of} from 'rxjs'
import {useDocumentStore} from 'sanity'

import {ChartLegend} from './ChartLegend'
import {
  buildSeries,
  calibrationSeries,
  filterByRange,
  formatValue,
  TREND_QUERY,
  TREND_GROUPS,
  type TrendRun,
  type TrendSeries,
} from './data'
import {DEBUG_SOURCES, type DebugSource, generateDebugRuns} from './debugData'
import {TrendChart} from './TrendChart'
import {useUrlState} from './useUrlState'

const RANGES = [
  {label: 'Last 30 days', days: 30},
  {label: 'Last 90 days', days: 90},
  {label: 'All time', days: null},
] as const

type DataSource = 'live' | DebugSource

interface LiveState {
  runs: TrendRun[] | null
  error: string | null
}

function InfoButton(props: {text: string; label: string}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover
      open={open}
      onClickOutside={() => setOpen(false)}
      portal
      constrainSize
      content={
        <Box padding={3} style={{maxWidth: 260}}>
          <Text size={1} muted>
            {props.text}
          </Text>
        </Box>
      }
    >
      <Button
        mode="bleed"
        padding={2}
        fontSize={1}
        icon={InfoOutlineIcon}
        tone="default"
        aria-label={props.label}
        selected={open}
        onClick={() => setOpen((v) => !v)}
      />
    </Popover>
  )
}

function SeriesCard(props: {series: TrendSeries; height: number}) {
  const {series, height} = props
  const latest = series.points.at(-1)
  return (
    <Card border padding={3} radius={2}>
      <Stack space={3}>
        <Flex align="center" justify="space-between" gap={2}>
          <Text size={1} weight="medium" textOverflow="ellipsis">
            {series.title}
          </Text>
          <Flex align="center" gap={2} style={{flexShrink: 0}}>
            {latest && (
              <Text size={1} muted title="latest run">
                {formatValue(latest.value, series.unit)}
              </Text>
            )}
            {/* Context hidden behind the info button so the grid stays
                scannable — one click, not a paragraph per card */}
            <InfoButton text={series.description} label={`About ${series.title}`} />
          </Flex>
        </Flex>
        {/* Explicit height: ParentSize's default height:100% collapses to 0
            inside an auto-height Stack row, and a 0-sized parent means no
            chart gets rendered at all */}
        <ParentSize debounceTime={50} style={{height}}>
          {({width}) => <TrendChart series={series} width={width} height={height} />}
        </ParentSize>
        <ChartLegend series={series} />
      </Stack>
    </Card>
  )
}

export function TrendsTool() {
  const documentStore = useDocumentStore()
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  // Source and range persist in the URL so a debug view survives reload and
  // is shareable; an unknown/dev-only source falls back to live
  const [rangeParam, setRangeParam] = useUrlState('range', '90')
  const [sourceParam, setSourceParam] = useUrlState('source', 'live')
  const source: DataSource =
    sourceParam === 'live' ||
    (import.meta.env.DEV && DEBUG_SOURCES.includes(sourceParam as DebugSource))
      ? (sourceParam as DataSource)
      : 'live'
  const rangeDays = rangeParam === 'all' ? null : Number(rangeParam)

  // Realtime: listenQuery re-runs the projection whenever a benchRun changes,
  // so a cron run appears without a reload. Error state is derived in the
  // chain — if the listener dies, the stream is replaced with the error.
  const live$ = useMemo(
    () =>
      documentStore.listenQuery(TREND_QUERY, {}, {tag: 'metrics.trends'}).pipe(
        map((result): LiveState => ({runs: result as TrendRun[], error: null})),
        catchError((error: unknown) =>
          of<LiveState>({
            runs: null,
            error: error instanceof Error ? error.message : String(error),
          }),
        ),
      ),
    [documentStore],
  )
  const live = useObservable(live$, {runs: null, error: null})

  const debugRuns = useMemo(() => (source === 'live' ? null : generateDebugRuns(source)), [source])
  const runs = source === 'live' ? live.runs : debugRuns
  const error = source === 'live' ? live.error : null
  const loading = source === 'live' && live.runs === null && live.error === null

  const inRange = useMemo(() => (runs ? filterByRange(runs, rangeDays) : []), [runs, rangeDays])
  const series = useMemo(() => buildSeries(inRange), [inRange])
  const calibration = useMemo(() => calibrationSeries(inRange), [inRange])

  return (
    <PortalProvider element={portalElement}>
      <Card ref={setPortalElement} height="fill" overflow="auto">
        <Container width={3} padding={4}>
          <Stack space={4}>
            <Flex align="flex-start" justify="space-between" gap={3}>
              <Flex align="center" gap={2}>
                <Text size={2} weight="semibold">
                  Studio performance trends
                </Text>
                <Button
                  mode="bleed"
                  padding={2}
                  fontSize={1}
                  icon={HelpCircleIcon}
                  tone="default"
                  text="How to read this"
                  selected={showHelp}
                  onClick={() => setShowHelp((v) => !v)}
                />
              </Flex>
              <Flex gap={2} style={{flexShrink: 0}}>
                {import.meta.env.DEV && (
                  <Select
                    value={source}
                    onChange={(event) => setSourceParam(event.currentTarget.value)}
                    aria-label="Data source (dev only)"
                  >
                    <option value="live">Live data</option>
                    {DEBUG_SOURCES.map((debugSource) => (
                      <option key={debugSource} value={debugSource}>
                        Debug: {debugSource}
                      </option>
                    ))}
                  </Select>
                )}
                <Select
                  value={rangeParam}
                  onChange={(event) => setRangeParam(event.currentTarget.value)}
                  aria-label="Time range"
                >
                  {RANGES.map((range) => (
                    <option key={range.label} value={String(range.days ?? 'all')}>
                      {range.label}
                    </option>
                  ))}
                </Select>
              </Flex>
            </Flex>

            {/* How-to-read is opt-in — returning viewers don't need the wall
                of text, first-timers are one click away */}
            {showHelp && (
              <Card tone="primary" border padding={3} radius={2}>
                <Stack space={3}>
                  <Text size={1} muted>
                    One benchmark run per day of the studio built from <code>main</code>, measured
                    against a local API mock (no network, no real project) — see{' '}
                    <code>perf/bench</code>. Each chart tracks one metric over time; each dot is one
                    run and opens the full result document.
                  </Text>
                  <Text size={1} muted>
                    Because the CI machine varies day to day, absolute numbers are host-relative:
                    before trusting a spike, check the host-calibration strip below — if it spikes
                    on the same day, suspect the runner, not the studio. Flat lines are the goal;
                    the ⓘ on each chart explains what it measures.
                  </Text>
                </Stack>
              </Card>
            )}

            {error && (
              <Card tone="critical" border padding={3} radius={2}>
                <Text size={1}>Failed to load runs: {error}</Text>
              </Card>
            )}
            {loading && (
              <Flex align="center" justify="center" padding={6}>
                <Spinner muted />
              </Flex>
            )}
            {!error && !loading && series.length === 0 && (
              <Card tone="transparent" border padding={4} radius={2}>
                <Text size={1} muted>
                  No benchmark runs in this range yet. The daily track-main cron stores one run per
                  day once perf/bench is on the main branch.
                </Text>
              </Card>
            )}

            {calibration.points.length > 0 && (
              <Stack space={3}>
                <SeriesCard series={calibration} height={64} />
              </Stack>
            )}

            {TREND_GROUPS.filter((group) => group.id !== 'environment').map((group) => {
              const groupSeries = series.filter((entry) => entry.group === group.id)
              if (groupSeries.length === 0) return null
              return (
                <Stack key={group.id} space={3}>
                  <Stack space={2}>
                    <Text size={1} weight="semibold">
                      {group.title}
                    </Text>
                    <Text size={1} muted>
                      {group.description}
                    </Text>
                  </Stack>
                  <Grid columns={[1, 1, 2, 3]} gap={3}>
                    {groupSeries.map((entry) => (
                      <SeriesCard key={entry.key} series={entry} height={128} />
                    ))}
                  </Grid>
                </Stack>
              )
            })}
          </Stack>
        </Container>
      </Card>
    </PortalProvider>
  )
}
