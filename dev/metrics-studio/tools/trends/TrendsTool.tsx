/// <reference types="vite/client" />
import {Card, Container, Flex, Grid, PortalProvider, Select, Spinner, Stack, Text} from '@sanity/ui'
import {ParentSize} from '@visx/responsive'
import {useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of} from 'rxjs'
import {useDocumentStore} from 'sanity'

import {
  buildSeries,
  calibrationSeries,
  filterByRange,
  formatValue,
  TREND_QUERY,
  type TrendRun,
  type TrendSeries,
} from './data'
import {DEBUG_SOURCES, type DebugSource, generateDebugRuns} from './debugData'
import {TrendChart} from './TrendChart'

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

function SeriesCard(props: {series: TrendSeries; height: number}) {
  const {series, height} = props
  const latest = series.points.at(-1)
  return (
    <Card border padding={3} radius={2}>
      <Stack space={3}>
        <Flex align="center" justify="space-between" gap={3}>
          <Text size={1} weight="medium" textOverflow="ellipsis">
            {series.title}
          </Text>
          {latest && (
            <Text size={1} muted>
              {formatValue(latest.value, series.unit)}
            </Text>
          )}
        </Flex>
        {/* Explicit height: ParentSize's default height:100% collapses to 0
            inside an auto-height Stack row, and a 0-sized parent means no
            chart gets rendered at all */}
        <ParentSize debounceTime={50} style={{height}}>
          {({width}) => <TrendChart series={series} width={width} height={height} />}
        </ParentSize>
      </Stack>
    </Card>
  )
}

export function TrendsTool() {
  const documentStore = useDocumentStore()
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const [rangeDays, setRangeDays] = useState<number | null>(90)
  const [source, setSource] = useState<DataSource>('live')

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
            <Flex align="center" justify="space-between" gap={3}>
              <Stack space={2}>
                <Text size={2} weight="semibold">
                  Studio performance trends
                </Text>
                <Text size={1} muted>
                  Daily absolute-mode runs from main (see perf/bench). Numbers are host-relative —
                  read them against the calibration strip below.
                </Text>
              </Stack>
              <Flex gap={2}>
                {import.meta.env.DEV && (
                  <Select
                    value={source}
                    onChange={(event) => setSource(event.currentTarget.value)}
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
                  value={String(rangeDays ?? 'all')}
                  onChange={(event) => {
                    const value = event.currentTarget.value
                    setRangeDays(value === 'all' ? null : Number(value))
                  }}
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

            {calibration.points.length > 0 && <SeriesCard series={calibration} height={64} />}

            <Grid columns={[1, 1, 2, 3]} gap={3}>
              {series.map((entry) => (
                <SeriesCard key={entry.key} series={entry} height={128} />
              ))}
            </Grid>
          </Stack>
        </Container>
      </Card>
    </PortalProvider>
  )
}
