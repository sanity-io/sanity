/// <reference types="vite/client" />
import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {EllipsisVerticalIcon} from '@sanity/icons/EllipsisVertical'
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {LaunchIcon} from '@sanity/icons/Launch'
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Menu,
  MenuButton,
  MenuItem,
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
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
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
  type TrendGroup,
  type TrendRun,
  type TrendSeries,
} from './data'
import {DEBUG_SOURCES, type DebugSource, generateDebugRuns} from './debugData'
import {type DriftResult} from './drift'
import {DriftFeed} from './DriftFeed'
import {efpsSourceUrl, sourceFileUrl, webVitalDocUrl} from './links'
import {MAX_COMPARE_BRANCHES} from './palette'
import {TrendChart} from './TrendChart'
import {type DriftState, useDriftState, worstOf} from './useDriftState'
import {useUrlState} from './useUrlState'

const RANGES = [
  {label: 'Last 30 days', days: 30},
  {label: 'Last 90 days', days: 90},
  {label: 'All time', days: null},
] as const

type DataSource = 'live' | DebugSource

/**
 * Focus-pulse for a jumped-to / deep-linked chart: the ring fades in, holds,
 * then eases out over ~2s so the eye is drawn to the right card without a
 * jarring flash. Injected once at the tool root.
 */
const FOCUS_PULSE_CSS = `
@keyframes chart-focus-pulse {
  0%   { box-shadow: 0 0 0 0 var(--card-focus-ring-color, #556bfc); }
  15%  { box-shadow: 0 0 0 3px var(--card-focus-ring-color, #556bfc); }
  70%  { box-shadow: 0 0 0 3px var(--card-focus-ring-color, #556bfc); }
  100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
}
.chart-focus-pulse {
  animation: chart-focus-pulse 2s ease-in-out;
  border-radius: 6px;
}
@media (prefers-reduced-motion: reduce) {
  .chart-focus-pulse { animation: none; box-shadow: 0 0 0 2px var(--card-focus-ring-color, #556bfc); }
}
`

interface LiveState {
  runs: TrendRun[] | null
  error: string | null
}

function InfoButton(props: {text: string; label: string; sourceFile?: string; vitalDoc?: string}) {
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
            {(props.vitalDoc || props.sourceFile) && (
              <Stack space={2}>
                {/* Reference doc for the Web Vital itself (web.dev) */}
                {props.vitalDoc && (
                  <Box
                    as="a"
                    href={props.vitalDoc}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Learn about this metric on web.dev (opens in a new tab)"
                  >
                    <Flex align="center" gap={1}>
                      <LaunchIcon />
                      <Text size={1}>About this metric (web.dev)</Text>
                    </Flex>
                  </Box>
                )}
                {props.sourceFile && (
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
                )}
                {/* Cross-reference the legacy eFPS scenario this was ported
                    from, while dev/efps burns down (omitted for bench-only
                    scenarios with no eFPS counterpart) */}
                {props.sourceFile && efpsSourceUrl(props.sourceFile) && (
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

/**
 * The chart-card acknowledgement menu behind a single ⋮. When the metric is
 * active it offers silence / snooze / (mark-fixed for regressions); when it's
 * already acknowledged it offers Un-ack — one control either way.
 */
function AckMenu(props: {
  seriesKey: string
  branch: string
  direction: 'regression' | 'improvement' | 'neutral'
  acked: boolean
  onAck: (state: 'silenced' | 'snoozed' | 'fixed') => void
  onUnack: () => void
}) {
  return (
    <MenuButton
      id={`ack-card-${props.seriesKey}-${props.branch}`}
      button={
        <Button
          mode="bleed"
          padding={2}
          fontSize={1}
          icon={EllipsisVerticalIcon}
          aria-label={props.acked ? 'Acknowledged' : 'Acknowledge'}
        />
      }
      menu={
        <Menu>
          {props.acked ? (
            <MenuItem text="Un-ack" onClick={props.onUnack} />
          ) : (
            <>
              <MenuItem text="Silence" onClick={() => props.onAck('silenced')} />
              <MenuItem text="Snooze 7d" onClick={() => props.onAck('snoozed')} />
              {/* "Mark fixed" only makes sense for a regression — an improvement
                  has nothing to fix */}
              {props.direction === 'regression' && (
                <MenuItem text="Mark fixed" onClick={() => props.onAck('fixed')} />
              )}
            </>
          )}
        </Menu>
      }
      popover={{portal: true}}
    />
  )
}

/**
 * Reduce drift results to one per series (the worst move), regressions winning
 * over improvements. Module-scoped and pure so the memos that call it don't
 * carry it as a dependency (react-compiler).
 */
function worstBySeries(entries: DriftResult[]): Map<string, DriftResult> {
  const isRegression = (d: DriftResult) => d.direction === 'regression'
  const map = new Map<string, DriftResult>()
  for (const entry of entries) {
    const current = map.get(entry.seriesKey)
    // A regression always outranks an improvement (the card should warn, not
    // celebrate); only within the same direction does the larger move win —
    // the magnitude check must NOT let a big improvement displace a regression.
    const better =
      !current ||
      (isRegression(entry) && !isRegression(current)) ||
      (isRegression(entry) === isRegression(current) &&
        Math.abs(worstOf(entry).deltaFraction) > Math.abs(worstOf(current).deltaFraction))
    if (better) map.set(entry.seriesKey, entry)
  }
  return map
}

function driftBadge(entry: DriftResult): {tone: 'caution' | 'positive'; label: string} {
  const worst = worstOf(entry)
  const sign = worst.deltaFraction > 0 ? '+' : ''
  const arrow = entry.direction === 'regression' ? '↑' : '↓'
  return {
    tone: entry.direction === 'regression' ? 'caution' : 'positive',
    label: `${arrow} ${sign}${(worst.deltaFraction * 100).toFixed(0)}%`,
  }
}

function SeriesCard(props: {
  series: TrendSeries
  height: number
  drift?: DriftResult
  silenced?: DriftResult
  focused?: boolean
  onFocus?: () => void
  onAck?: (state: 'silenced' | 'snoozed' | 'fixed') => void
  onUnack?: () => void
}) {
  const {series, height, drift, silenced, focused, onFocus, onAck, onUnack} = props
  // Latest value of the first line — a headline number only when not comparing
  const latest = series.lines.length === 1 ? series.lines[0].points.at(-1) : undefined
  const badge = drift ? driftBadge(drift) : null
  return (
    // A drifted chart tints its card so it stands out in the grid; the badge
    // in the header carries the exact move and the ⋮ menu acknowledges it —
    // the same silence/snooze/fix as the feed, right where you're looking. A
    // silenced chart drops the tint but keeps a muted marker + Un-ack, so it's
    // reversible without opening the feed. `focused` flashes a ring when you
    // deep-link / jump to this chart from the feed.
    <Card
      id={`chart-${series.key}`}
      border
      padding={3}
      radius={2}
      tone={badge ? badge.tone : 'default'}
      // A short pulsing ring when jumped-to / deep-linked (see FOCUS_PULSE_CSS)
      className={focused ? 'chart-focus-pulse' : undefined}
    >
      <Stack space={3}>
        {/* Center-aligned: the title + badge co-center with the value/menu/info
            cluster on the common single-line case, and the title wraps (no
            ellipsis) within its flex-1 box when it's too long to fit */}
        <Flex align="center" justify="space-between" gap={3}>
          <Flex align="center" gap={2} flex={1} style={{minWidth: 0, flexWrap: 'wrap'}}>
            {/* Clicking the title deep-links to this chart (shareable focus) */}
            {onFocus ? (
              <Box
                as="button"
                onClick={onFocus}
                title="Focus this chart"
                style={{
                  background: 'none',
                  border: 0,
                  padding: 0,
                  margin: 0,
                  cursor: 'pointer',
                  font: 'inherit',
                  color: 'inherit',
                  textAlign: 'left',
                }}
              >
                <Text size={1} weight="medium">
                  {series.title}
                </Text>
              </Box>
            ) : (
              <Text size={1} weight="medium">
                {series.title}
              </Text>
            )}
            {badge && (
              <Badge tone={badge.tone} fontSize={0} mode="default" style={{flexShrink: 0}}>
                {badge.label}
              </Badge>
            )}
            {!badge && silenced && (
              <Badge tone="default" fontSize={0} mode="outline" style={{flexShrink: 0}}>
                acknowledged
              </Badge>
            )}
          </Flex>
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
            {(drift || silenced) && (onAck || onUnack) && (
              <AckMenu
                seriesKey={(drift ?? silenced)!.seriesKey}
                branch={(drift ?? silenced)!.branch}
                direction={(drift ?? silenced)!.direction}
                acked={!drift && Boolean(silenced)}
                onAck={onAck ?? (() => {})}
                onUnack={onUnack ?? (() => {})}
              />
            )}
            {/* Context hidden behind the info button so the grid stays
                scannable — one click, not a paragraph per card */}
            <InfoButton
              text={series.description}
              label={`About ${series.title}`}
              sourceFile={series.sourceFile}
              vitalDoc={webVitalDocUrl(series.title)}
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
function ChartGrid(props: {
  series: TrendSeries[]
  driftBySeries?: Map<string, DriftResult>
  silencedBySeries?: Map<string, DriftResult>
  drift?: DriftState
  focusedKey?: string | null
  onFocusMetric?: (seriesKey: string) => void
}) {
  return (
    <Grid columns={[1, 1, 2, 3]} gap={3}>
      {props.series.map((entry) => {
        const entryDrift = props.driftBySeries?.get(entry.key)
        const entrySilenced = props.silencedBySeries?.get(entry.key)
        return (
          <SeriesCard
            key={entry.key}
            series={entry}
            height={128}
            drift={entryDrift}
            silenced={entrySilenced}
            focused={props.focusedKey === entry.key}
            onFocus={props.onFocusMetric ? () => props.onFocusMetric!(entry.key) : undefined}
            onAck={
              entryDrift && props.drift ? (state) => props.drift!.ack(entryDrift, state) : undefined
            }
            onUnack={
              entrySilenced && props.drift ? () => props.drift!.clear(entrySilenced) : undefined
            }
          />
        )
      })}
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
  // is shareable; an unknown source falls back to live. Demo/debug data is
  // available in every build (dropdown + `?source=` param) so a synthetic view
  // is shareable and the tool is explorable before real runs exist.
  const [rangeParam, setRangeParam] = useUrlState('range', '90')
  const [sourceParam, setSourceParam] = useUrlState('source', 'live')
  const source: DataSource =
    sourceParam === 'live' || DEBUG_SOURCES.includes(sourceParam as DebugSource)
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

  // Calibration (the environment group) is its own tab now — it's honesty
  // context, not something you check first, so it no longer sits pinned above
  // everything. Its series carry group 'environment'.
  const environmentSeries = useMemo(
    () => [calibration, ...series.filter((entry) => entry.group === 'environment')],
    [calibration, series],
  )

  // The metric groups that actually have data become tabs. Soak is a tab
  // whenever any of its three views has data; environment whenever calibration
  // has points.
  const soakHasData = soakSlopes.length > 0 || soakEndValues.length > 0 || Boolean(latestSoak)
  const tabs = useMemo(
    () =>
      TREND_GROUPS.filter((group) => {
        if (group.id === 'soak') return soakHasData
        if (group.id === 'environment') return calibration.lines.some((l) => l.points.length > 0)
        return series.some((entry) => entry.group === group.id)
      }),
    [series, soakHasData, calibration],
  )
  const groupById = useMemo(() => {
    const map = new Map<string, TrendGroup>()
    for (const entry of series) map.set(entry.key, entry.group)
    return map
  }, [series])

  // Deep-linkable focused chart: the `chart` URL param names the series to
  // jump to (shareable). Jumping from a drift-feed row or a chart header writes
  // it (pushState, so Back returns) and flashes a focus ring; the URL param
  // persists so the link stays shareable/reloadable.
  const [chartParam, setChartParam] = useUrlState('chart', '')

  // Tab selection. The fallback is static ('' = "no explicit tab") — a dynamic
  // fallback derived from series would be read only once by useState and never
  // update after live runs load, stranding shared ?chart= links on the wrong
  // tab. Instead resolve the active tab reactively: an explicit ?tab= wins,
  // else a deep-linked chart's group, else the first tab.
  const [tabParam, setTabParam] = useUrlState('tab', '')
  const activeTab =
    tabs.find((tab) => tab.id === tabParam) ??
    (chartParam ? tabs.find((tab) => tab.id === groupById.get(chartParam)) : undefined) ??
    tabs[0]

  // Shared drift state (feeds both the pinned feed and the per-tab badges, so
  // they can't disagree). Badge = active regressions in that group.
  const drift = useDriftState(series)
  const showBranch = series.some((s) => s.lines.length > 1)
  const [focusedKey, setFocusedKey] = useState<string | null>(chartParam || null)
  const scrollToChart = useCallback((seriesKey: string) => {
    requestAnimationFrame(() => {
      document
        .getElementById(`chart-${seriesKey}`)
        ?.scrollIntoView({behavior: 'smooth', block: 'center'})
    })
  }, [])
  const focusMetric = (seriesKey: string) => {
    const group = groupById.get(seriesKey)
    if (group) setTabParam(group, 'push')
    setChartParam(seriesKey, 'push')
    setFocusedKey(seriesKey)
  }
  // Side-effects of a focus (DOM scroll + auto-clearing the ring) live in an
  // effect keyed on the focused chart. setState only happens in the timer
  // callback, not synchronously in the effect body (react-compiler).
  useEffect(() => {
    if (!focusedKey) return
    scrollToChart(focusedKey)
    const timer = window.setTimeout(() => setFocusedKey((k) => (k === focusedKey ? null : k)), 2200)
    return () => window.clearTimeout(timer)
  }, [focusedKey, scrollToChart])

  const regressionsByGroup = useMemo(() => {
    const counts = new Map<TrendGroup, number>()
    for (const entry of drift.active) {
      if (entry.direction !== 'regression') continue
      const group = groupById.get(entry.seriesKey)
      if (group) counts.set(group, (counts.get(group) ?? 0) + 1)
    }
    return counts
  }, [drift.active, groupById])
  // Drift per series (for flagging the chart card itself). A series can drift
  // on more than one branch; keep the worst so the card shows the biggest move,
  // regressions winning over improvements. (worstBySeries is module-scoped.)
  const driftBySeries = useMemo(() => worstBySeries(drift.active), [drift.active])
  // Silenced/snoozed per series — the card keeps a muted "acknowledged" marker
  // with an Un-ack, so you can reverse it without opening the feed. Active
  // drift takes precedence, so drop any series that's also active.
  const silencedBySeries = useMemo(() => {
    const map = worstBySeries(drift.silenced)
    for (const key of driftBySeries.keys()) map.delete(key)
    return map
  }, [drift.silenced, driftBySeries])

  return (
    <PortalProvider element={portalElement}>
      <style dangerouslySetInnerHTML={{__html: FOCUS_PULSE_CSS}} />
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
              <Flex align="center" gap={2} style={{flexShrink: 0}}>
                {/* Data source is a debug affordance: always available in dev,
                    but in prod it only appears once a demo is active (via the
                    ?source= param) so it's a quiet way back to live, not chrome
                    normal users ever see. Kept small and subtle either way. */}
                {(import.meta.env.DEV || source !== 'live') && (
                  <Select
                    value={source}
                    onChange={(event) => setSourceParam(event.currentTarget.value)}
                    aria-label="Data source"
                    fontSize={1}
                    padding={2}
                    radius={2}
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
                    before trusting a spike, check the host calibration in the Calibration tab — if
                    it spikes on the same day, suspect the runner, not the studio. Flat lines are
                    the goal; the ⓘ on each chart explains what it measures.
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

            {/* The one always-pinned signal: what needs attention right now.
                Silent when everything is steady and unacked. */}
            <DriftFeed drift={drift} showBranch={showBranch} onFocusMetric={focusMetric} />

            {/* Metric groups behind tabs so the page isn't one long scroll.
                Each tab badges its count of active regressions (same drift
                state as the feed, so they always agree). */}
            {activeTab && (
              <Stack space={3}>
                <TabList space={1}>
                  {tabs.map((tab) => {
                    const count = regressionsByGroup.get(tab.id) ?? 0
                    return (
                      <Tab
                        key={tab.id}
                        id={`group-tab-${tab.id}`}
                        aria-controls={`group-panel-${tab.id}`}
                        label={
                          <Flex align="center" gap={2}>
                            <span>{tab.title}</span>
                            {count > 0 && (
                              <Badge
                                tone="caution"
                                fontSize={0}
                                mode="default"
                                aria-label={`${count} metric${count === 1 ? '' : 's'} to review`}
                              >
                                {count}
                              </Badge>
                            )}
                          </Flex>
                        }
                        selected={tab.id === activeTab.id}
                        onClick={() => setTabParam(tab.id)}
                      />
                    )
                  })}
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
                      <ChartGrid
                        series={
                          activeTab.id === 'environment'
                            ? environmentSeries
                            : series.filter((entry) => entry.group === activeTab.id)
                        }
                        driftBySeries={driftBySeries}
                        silencedBySeries={silencedBySeries}
                        drift={drift}
                        focusedKey={focusedKey}
                        onFocusMetric={focusMetric}
                      />
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
