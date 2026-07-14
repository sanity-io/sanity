/// <reference types="vite/client" />
import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {LaunchIcon} from '@sanity/icons/Launch'
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
  Tab,
  TabList,
  TabPanel,
  Text,
  useClickOutsideEvent,
} from '@sanity/ui'
import {ParentSize} from '@visx/responsive'
import {useMemo, useRef, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of} from 'rxjs'
import {useDocumentStore} from 'sanity'

import {ChartLegend} from './ChartLegend'
import {
  availableBranches,
  buildSeries,
  latestSoakCharts,
  soakSlopeSeries,
  soakLatestValueSeries,
  calibrationSeries,
  filterByRange,
  formatValue,
  TREND_QUERY,
  TREND_GROUPS,
  type TrendRun,
  type TrendSeries,
} from './data'
import {DEBUG_SOURCES, type DebugSource, generateDebugRuns} from './debugData'
import {DriftFeed} from './DriftFeed'
import {efpsSourceUrl, sourceFileUrl} from './links'
import {MAX_COMPARE_BRANCHES} from './palette'
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

function InfoButton(props: {text: string; label: string; sourceFile?: string}) {
  const [open, setOpen] = useState(false)
  // Popover has no onClickOutside prop (passing it logs an "unknown event
  // handler" error and never closes); useClickOutsideEvent is the @sanity/ui
  // idiom, treating the popover content and its trigger button as "inside".
  const [contentEl, setContentEl] = useState<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  useClickOutsideEvent(
    () => setOpen(false),
    () => [contentEl, buttonRef.current],
  )
  return (
    <Popover
      open={open}
      portal
      constrainSize
      content={
        <Box ref={setContentEl} padding={3} style={{maxWidth: 260}}>
          <Stack space={3}>
            <Text size={1} muted>
              {props.text}
            </Text>
            {props.sourceFile && (
              <Stack space={2}>
                <Box
                  as="a"
                  href={sourceFileUrl(props.sourceFile)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View scenario source (opens in a new tab)"
                >
                  <Flex align="center" gap={1}>
                    <LaunchIcon />
                    <Text size={1}>View scenario source</Text>
                  </Flex>
                </Box>
                {/* Cross-reference the legacy eFPS scenario this was ported
                    from, while dev/efps burns down (omitted for bench-only
                    scenarios with no eFPS counterpart) */}
                {efpsSourceUrl(props.sourceFile) && (
                  <Box
                    as="a"
                    href={efpsSourceUrl(props.sourceFile)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="View the legacy eFPS scenario (opens in a new tab)"
                  >
                    <Flex align="center" gap={1}>
                      <LaunchIcon />
                      <Text size={1} muted>
                        Legacy eFPS scenario
                      </Text>
                    </Flex>
                  </Box>
                )}
              </Stack>
            )}
          </Stack>
        </Box>
      }
    >
      <Button
        ref={buttonRef}
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

function BranchPicker(props: {
  branches: string[]
  selected: string[]
  onToggle: (branch: string) => void
}) {
  const {branches, selected, onToggle} = props
  const [open, setOpen] = useState(false)
  // See InfoButton: Popover has no onClickOutside; use the @sanity/ui hook.
  // Hooks run before the early return below to satisfy rules-of-hooks.
  const [contentEl, setContentEl] = useState<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  useClickOutsideEvent(
    () => setOpen(false),
    () => [contentEl, buttonRef.current],
  )
  if (branches.length < 2) return null

  const label =
    selected.length === 1
      ? selected[0]
      : selected.length === branches.length
        ? 'All branches'
        : `${selected.length} branches`

  return (
    <Popover
      open={open}
      portal
      constrainSize
      content={
        <Box ref={setContentEl} padding={2} style={{maxWidth: 280}}>
          <Stack space={1}>
            <Box paddingX={2} paddingY={1}>
              <Text size={0} muted>
                Compare up to {MAX_COMPARE_BRANCHES} branches
              </Text>
            </Box>
            {branches.map((branch) => {
              const checked = selected.includes(branch)
              const atCap = !checked && selected.length >= MAX_COMPARE_BRANCHES
              return (
                <Button
                  key={branch}
                  mode="bleed"
                  justify="flex-start"
                  disabled={atCap}
                  selected={checked}
                  onClick={() => onToggle(branch)}
                  text={branch}
                  icon={checked ? CheckmarkIcon : undefined}
                />
              )
            })}
          </Stack>
        </Box>
      }
    >
      <Button
        ref={buttonRef}
        mode="ghost"
        text={label}
        icon={ChevronDownIcon}
        iconRight
        onClick={() => setOpen((v) => !v)}
        aria-label="Filter by branch"
      />
    </Popover>
  )
}

function SeriesCard(props: {series: TrendSeries; height: number}) {
  const {series, height} = props
  // Latest value of the first line — a headline number only when not comparing
  const latest = series.lines.length === 1 ? series.lines[0].points.at(-1) : undefined
  return (
    <Card border padding={3} radius={2}>
      <Stack space={3}>
        <Flex align="center" justify="space-between" gap={2}>
          <Text size={1} weight="medium" textOverflow="ellipsis">
            {series.title}
          </Text>
          <Flex align="center" gap={2} style={{flexShrink: 0}}>
            {latest && (
              <Text
                size={1}
                muted
                aria-label={`Latest run: ${formatValue(latest.value, series.unit)}`}
              >
                {formatValue(latest.value, series.unit)}
              </Text>
            )}
            {/* Context hidden behind the info button so the grid stays
                scannable — one click, not a paragraph per card */}
            <InfoButton
              text={series.description}
              label={`About ${series.title}`}
              sourceFile={series.sourceFile}
            />
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

/** The responsive chart grid used by every group and soak sub-view. */
function ChartGrid(props: {series: TrendSeries[]}) {
  return (
    <Grid columns={[1, 1, 2, 3]} gap={3}>
      {props.series.map((entry) => (
        <SeriesCard key={entry.key} series={entry} height={128} />
      ))}
    </Grid>
  )
}

/**
 * The soak section is heavy (3 views × up to 7 charts), so it gets its own
 * sub-tabs rather than dumping every chart at once: slope-per-run,
 * end-of-run value, and the latest run's minute-by-minute curves.
 */
function SoakPanel(props: {
  slopes: TrendSeries[]
  endValues: TrendSeries[]
  latest: {run: TrendRun; charts: TrendSeries[]} | null
}) {
  const {slopes, endValues, latest} = props
  const views = [
    slopes.length > 0 && {
      id: 'slope',
      label: 'Slope over runs',
      hint: 'Per-minute slope, across runs — is a leak or degradation worsening release over release?',
      charts: slopes,
    },
    endValues.length > 0 && {
      id: 'end',
      label: 'End of run',
      hint: 'End-of-run value, across runs — where each metric landed by the end of the soak.',
      charts: endValues,
    },
    latest &&
      latest.charts.length > 0 && {
        id: 'latest',
        label: 'Latest run',
        hint: `Latest soak run — ${latest.run.git?.branch ?? 'unknown'} @ ${latest.run.git?.sha?.slice(0, 10) ?? '?'} · minute-by-minute.`,
        charts: latest.charts,
      },
  ].filter(Boolean) as {id: string; label: string; hint: string; charts: TrendSeries[]}[]

  const [view, setView] = useUrlState('soak', views[0]?.id ?? 'slope')
  const active = views.find((v) => v.id === view) ?? views[0]
  if (!active) return null

  return (
    <Stack space={3}>
      <TabList space={1}>
        {views.map((v) => (
          <Tab
            key={v.id}
            id={`soak-tab-${v.id}`}
            aria-controls={`soak-panel-${v.id}`}
            label={v.label}
            selected={v.id === active.id}
            onClick={() => setView(v.id)}
          />
        ))}
      </TabList>
      <TabPanel id={`soak-panel-${active.id}`} aria-labelledby={`soak-tab-${active.id}`}>
        <Stack space={3}>
          <Text size={1} muted>
            {active.hint}
          </Text>
          <ChartGrid series={active.charts} />
        </Stack>
      </TabPanel>
    </Stack>
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
  const branches = useMemo(() => availableBranches(inRange), [inRange])

  // Branch selection persists in the URL (comma-separated) so a comparison
  // is shareable. Empty/absent = default: main if present, else all.
  const [branchParam, setBranchParam] = useUrlState('branches', '')
  const selectedBranches = useMemo(() => {
    const requested = branchParam.split(',').filter(Boolean)
    const valid = requested.filter((branch) => branches.includes(branch))
    if (valid.length > 0) return valid.slice(0, MAX_COMPARE_BRANCHES)
    return branches.includes('main') ? ['main'] : branches
  }, [branchParam, branches])

  const toggleBranch = (branch: string) => {
    const next = selectedBranches.includes(branch)
      ? selectedBranches.filter((b) => b !== branch)
      : [...selectedBranches, branch].slice(0, MAX_COMPARE_BRANCHES)
    setBranchParam(next.join(','))
  }

  const filtered = useMemo(
    () => inRange.filter((run) => run.git && selectedBranches.includes(run.git.branch)),
    [inRange, selectedBranches],
  )
  const series = useMemo(() => buildSeries(filtered), [filtered])
  const soakSlopes = useMemo(() => soakSlopeSeries(filtered), [filtered])
  // End-of-run soak values across runs — the "where did it land" history that
  // complements the slope view
  const soakEndValues = useMemo(() => soakLatestValueSeries(filtered), [filtered])
  // In-run soak charts are a single latest run — branch-filtered, but not
  // overlaid (each is one run's minute curve)
  const latestSoak = useMemo(() => latestSoakCharts(filtered), [filtered])
  // Calibration is host-level, not per-branch — always the full in-range set
  const calibration = useMemo(() => calibrationSeries(inRange), [inRange])

  // The metric groups that actually have data become tabs (environment lives
  // in the pinned calibration strip, not a tab). Soak is a tab whenever any of
  // its three views has data.
  const soakHasData = soakSlopes.length > 0 || soakEndValues.length > 0 || Boolean(latestSoak)
  const tabs = useMemo(
    () =>
      TREND_GROUPS.filter((group) => group.id !== 'environment').filter((group) =>
        group.id === 'soak' ? soakHasData : series.some((entry) => entry.group === group.id),
      ),
    [series, soakHasData],
  )
  const [tabParam, setTabParam] = useUrlState('tab', tabs[0]?.id ?? 'vitals')
  const activeTab = tabs.find((tab) => tab.id === tabParam) ?? tabs[0]

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
                <BranchPicker
                  branches={branches}
                  selected={selectedBranches}
                  onToggle={toggleBranch}
                />
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
                    run — click it for the run details and links to the PR, commit, and CI run.
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

            {/* Surfaces drifted metrics first; silent when all steady */}
            <DriftFeed series={series} />

            {calibration.lines[0].points.length > 0 && (
              <Stack space={3}>
                <SeriesCard series={calibration} height={64} />
              </Stack>
            )}

            {/* Metric groups behind tabs so the page isn't one long scroll;
                the drift feed + calibration above stay pinned as the always-on
                "what needs attention / how to read it" context */}
            {activeTab && (
              <Stack space={3}>
                <TabList space={1}>
                  {tabs.map((tab) => (
                    <Tab
                      key={tab.id}
                      id={`group-tab-${tab.id}`}
                      aria-controls={`group-panel-${tab.id}`}
                      label={tab.title}
                      selected={tab.id === activeTab.id}
                      onClick={() => setTabParam(tab.id)}
                    />
                  ))}
                </TabList>
                <TabPanel
                  id={`group-panel-${activeTab.id}`}
                  aria-labelledby={`group-tab-${activeTab.id}`}
                >
                  <Stack space={3}>
                    <Text size={1} muted>
                      {activeTab.description}
                    </Text>
                    {activeTab.id === 'soak' ? (
                      <SoakPanel
                        slopes={soakSlopes}
                        endValues={soakEndValues}
                        latest={latestSoak}
                      />
                    ) : (
                      <ChartGrid series={series.filter((entry) => entry.group === activeTab.id)} />
                    )}
                  </Stack>
                </TabPanel>
              </Stack>
            )}
          </Stack>
        </Container>
      </Card>
    </PortalProvider>
  )
}
