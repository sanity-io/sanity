/// <reference types="vite/client" />
import {ActivityIcon} from '@sanity/icons/Activity'
import {BoltIcon} from '@sanity/icons/Bolt'
import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ClockIcon} from '@sanity/icons/Clock'
import {ControlsIcon} from '@sanity/icons/Controls'
import {DropIcon} from '@sanity/icons/Drop'
import {EllipsisVerticalIcon} from '@sanity/icons/EllipsisVertical'
import {ExpandIcon} from '@sanity/icons/Expand'
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {LaunchIcon} from '@sanity/icons/Launch'
import {PackageIcon} from '@sanity/icons/Package'
import {SyncIcon} from '@sanity/icons/Sync'
import {
  Badge,
  Button,
  Card,
  Container,
  Dialog,
  Flex,
  Grid,
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
import {Menu, MenuButton, MenuItem} from '@sanity/ui/menu'
import {Popover} from '@sanity/ui/popover'
import {ParentSize} from '@visx/responsive'
import {type ComponentType, type ReactNode, useEffect, useMemo, useRef, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of} from 'rxjs'
import {useDocumentStore} from 'sanity'
import {Box} from 'ui5'

import {idSlug} from './acks'
import {ChartLegend} from './ChartLegend'
import {
  availableBranches,
  buildSeries,
  CALIBRATION_EXPLAINER,
  latestSoakCharts,
  settleViews,
  soakSlopeSeries,
  soakLatestValueSeries,
  calibrationSeries,
  filterByRange,
  formatValue,
  TAGS_QUERY,
  TREND_QUERY,
  TREND_GROUPS,
  type TrendGroup,
  type TrendRun,
  type TrendSeries,
  type TrendTag,
  vitalSections,
} from './data'
import {DEBUG_SOURCES, type DebugSource, generateDebugRuns, generateDebugTags} from './debugData'
import {type DriftResult, worstBySeries} from './drift'
import {DriftFeed} from './DriftFeed'
import {type LayerState, useLayerState} from './layers'
import {sourceFileUrl, webVitalDocUrl} from './links'
import {MAX_COMPARE_BRANCHES} from './palette'
import {seriesHasCalibration, TrendChart} from './TrendChart'
import {type DriftState, useDriftState} from './useDriftState'
import {useUrlState} from './useUrlState'

const RANGES = [
  {label: 'Last 30 days', days: 30},
  {label: 'Last 90 days', days: 90},
  {label: 'All time', days: null},
] as const

/** One glanceable glyph per metric-group tab; titles stay the identifier. */
const GROUP_ICONS: Record<TrendGroup, ComponentType> = {
  vitals: ActivityIcon,
  responsiveness: BoltIcon,
  load: ClockIcon,
  bundle: PackageIcon,
  soak: DropIcon,
  settle: SyncIcon,
  environment: ControlsIcon,
}

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

function InfoButton(props: {
  text: string
  label: string
  sourceFile?: string
  vitalDoc?: string
  /** Shown as a second paragraph on charts that draw the calibration line. */
  calibrationNote?: string
}) {
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
          <Stack gap={3}>
            <Text size={1} muted>
              {props.text}
            </Text>
            {props.calibrationNote && (
              <Text size={1} muted>
                {props.calibrationNote}
              </Text>
            )}
            {(props.vitalDoc || props.sourceFile) && (
              <Stack gap={2}>
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
          <Stack gap={1}>
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
      // Slugged: series keys contain spaces/`·`, which are invalid in DOM ids
      // and split the aria-labelledby reference list
      id={`ack-card-${idSlug(`${props.seriesKey}-${props.branch}`)}`}
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
            <MenuItem text="Reopen" onClick={props.onUnack} />
          ) : (
            <>
              <MenuItem text="Silence" onClick={() => props.onAck('silenced')} />
              <MenuItem text="Snooze 7 days" onClick={() => props.onAck('snoozed')} />
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

/** DOM id for a chart card — slugged, since series keys contain `·`/spaces. */
function chartDomId(seriesKey: string): string {
  return `chart-${idSlug(seriesKey)}`
}

function driftBadge(entry: DriftResult): {tone: 'caution' | 'positive'; label: string} {
  const worst = entry.baseline
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
  /** The baseline to draw, flagged or not. Falls back to the flagged one. */
  baseline?: DriftResult
  focused?: boolean
  onFocus?: () => void
  onAck?: (state: 'silenced' | 'snoozed' | 'fixed') => void
  onUnack?: () => void
  layers?: LayerState
  /** Release tags for the chart's markers. */
  tags?: TrendTag[]
  /** Open this chart in the maximized dialog. Absent = not expandable. */
  onExpand?: () => void
  /**
   * Rendered inside the maximize dialog. The card is then the superset view:
   * no expand button (it's already expanded), the description reads as visible
   * text instead of hiding behind ⓘ, and the release markers carry labels —
   * all things there is room for at dialog width and not in a grid cell.
   */
  expanded?: boolean
}) {
  const {
    series,
    height,
    drift,
    silenced,
    baseline,
    focused,
    onFocus,
    onAck,
    onUnack,
    layers,
    tags,
    onExpand,
    expanded,
  } = props
  // The overlay draws from any computed baseline; the badge and tint only from a
  // flagged one
  const overlay = baseline ?? drift ?? silenced
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
      id={chartDomId(series.key)}
      border
      padding={3}
      radius={2}
      tone={badge ? badge.tone : 'default'}
      // A short pulsing ring when jumped-to / deep-linked (see FOCUS_PULSE_CSS)
      className={focused ? 'chart-focus-pulse' : undefined}
    >
      <Stack gap={3}>
        {/* Two header rows: the title owns the first (with the menu/info
            controls right-aligned), and the stat row beneath pairs the drift
            badge with the latest value — the number sits next to the
            percentage it contextualizes instead of floating top-right while
            the badge wraps under a long title. */}
        <Flex align="center" justify="space-between" gap={3}>
          {/* flexBasis/flexGrow rather than `flex`: this is ui5's Box, which
              (unlike @sanity/ui's) has no `flex` prop — same pair
              RunDetailPopover's header uses. */}
          <Box flexBasis="0%" flexGrow={1} style={{minWidth: 0}}>
            {/* In the dialog the title lives in the dialog header — repeating it
                here would only push the plot down. Clicking the grid card's
                title deep-links to that chart (shareable focus). */}
            {expanded ? null : onFocus ? (
              <Box
                as="button"
                onClick={onFocus}
                title="Go to chart"
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
          </Box>
          <Flex align="center" gap={2} style={{flexShrink: 0}}>
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
            {onExpand && (
              <Button
                mode="bleed"
                padding={2}
                fontSize={1}
                icon={ExpandIcon}
                tone="default"
                aria-label={`Expand ${series.title}`}
                onClick={onExpand}
              />
            )}
            {/* Context hidden behind the info button so the grid stays
                scannable — one click, not a paragraph per card. In the dialog
                it's redundant: the description is already visible text there. */}
            {!expanded && (
              <InfoButton
                text={series.description}
                label={`About ${series.title}`}
                sourceFile={series.sourceFile}
                vitalDoc={webVitalDocUrl(series.title)}
                // Explain the dotted context line where the chart is explained —
                // "calibration of what?" shouldn't require the Calibration tab
                calibrationNote={seriesHasCalibration(series) ? CALIBRATION_EXPLAINER : undefined}
              />
            )}
          </Flex>
        </Flex>
        {/* The dialog has room for the paragraph the grid cannot afford — the
            whole point of maximizing is more context per chart, not just a
            bigger plot. */}
        {expanded && (
          <Text size={1} muted>
            {series.description}
            {seriesHasCalibration(series) ? ` ${CALIBRATION_EXPLAINER}` : ''}
          </Text>
        )}
        {(badge || silenced || latest) && (
          // Value first, badge after — "64ms ↓ -22%" reads as a statement
          // qualified by its move, where badge-first read as two stats
          <Flex align="center" gap={2} style={{flexWrap: 'wrap'}}>
            {latest && (
              <Text
                size={1}
                muted
                aria-label={`Latest run: ${formatValue(latest.value, series.unit)}`}
              >
                {formatValue(latest.value, series.unit)}
              </Text>
            )}
            {badge && (
              <Badge tone={badge.tone} fontSize={0} style={{flexShrink: 0}}>
                {badge.label}
              </Badge>
            )}
            {!badge && silenced && (
              <Badge tone="default" fontSize={0} style={{flexShrink: 0}}>
                acknowledged
              </Badge>
            )}
          </Flex>
        )}
        {/* Explicit height: ParentSize's default height:100% collapses to 0
            inside an auto-height Stack row, and a 0-sized parent means no
            chart gets rendered at all */}
        <ParentSize debounceTime={50} style={{height}}>
          {({width}) => (
            <TrendChart
              series={series}
              width={width}
              height={height}
              drift={overlay}
              layers={layers}
              tags={tags}
              // Resting marker labels need ~40px per marker; only the dialog has it
              showTagLabels={expanded}
            />
          )}
        </ParentSize>
        <ChartLegend series={series} drift={overlay} layers={layers} tags={tags} />
      </Stack>
    </Card>
  )
}

/**
 * Blank state for a tab whose group has no data in the selected range. Every
 * group is always a tab (a fixed layout is learnable), so each needs one.
 */
function EmptyGroup(props: {children: ReactNode}) {
  return (
    <Card tone="transparent" border padding={4} radius={2}>
      <Text size={1} muted>
        {props.children}
      </Text>
    </Card>
  )
}

/** The responsive chart grid used by every group and soak sub-view. */
function ChartGrid(props: {
  series: TrendSeries[]
  /** Rendered instead of the grid when there is nothing to plot. */
  emptyMessage?: ReactNode
  driftBySeries?: Map<string, DriftResult>
  silencedBySeries?: Map<string, DriftResult>
  /** Baselines for the chart overlay, including sub-threshold ones. */
  baselineBySeries?: Map<string, DriftResult>
  drift?: DriftState
  focusedKey?: string | null
  onFocusMetric?: (seriesKey: string) => void
  layers?: LayerState
  /** Release tags for the charts' markers. */
  tags?: TrendTag[]
  onExpand?: (seriesKey: string) => void
}) {
  if (props.series.length === 0 && props.emptyMessage !== undefined) {
    return <EmptyGroup>{props.emptyMessage}</EmptyGroup>
  }
  return (
    <Grid gridTemplateColumns={[1, 1, 2, 3]} gap={3}>
      {props.series.map((entry) => {
        const entryDrift = props.driftBySeries?.get(entry.key)
        const entrySilenced = props.silencedBySeries?.get(entry.key)
        const entryBaseline = props.baselineBySeries?.get(entry.key)
        return (
          <SeriesCard
            key={entry.key}
            series={entry}
            height={128}
            drift={entryDrift}
            silenced={entrySilenced}
            baseline={entryBaseline}
            focused={props.focusedKey === entry.key}
            onFocus={props.onFocusMetric ? () => props.onFocusMetric!(entry.key) : undefined}
            onAck={
              entryDrift && props.drift ? (state) => props.drift!.ack(entryDrift, state) : undefined
            }
            onUnack={
              entrySilenced && props.drift ? () => props.drift!.clear(entrySilenced) : undefined
            }
            layers={props.layers}
            tags={props.tags}
            onExpand={props.onExpand ? () => props.onExpand!(entry.key) : undefined}
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
  layers?: LayerState
  tags?: TrendTag[]
  onExpand?: (seriesKey: string) => void
  latest: {run: TrendRun; charts: TrendSeries[]} | null
}) {
  const {slopes, endValues, latest} = props
  const views = [
    slopes.length > 0 && {
      id: 'slope',
      label: 'Slope over runs',
      hint: 'Per-minute slope, across runs. Is a leak or degradation worsening release over release?',
      charts: slopes,
    },
    endValues.length > 0 && {
      id: 'end',
      label: 'End of run',
      hint: 'End-of-run value, across runs: where each metric landed by the end of the soak.',
      charts: endValues,
    },
    latest &&
      latest.charts.length > 0 && {
        id: 'latest',
        label: 'Latest run',
        hint: `Latest soak run: ${latest.run.git?.branch ?? 'unknown'} @ ${latest.run.git?.sha?.slice(0, 10) ?? '?'}, minute by minute.`,
        charts: latest.charts,
      },
  ].filter(Boolean) as {id: string; label: string; hint: string; charts: TrendSeries[]}[]

  const [view, setView] = useUrlState('soak', views[0]?.id ?? 'slope')
  const active = views.find((v) => v.id === view) ?? views[0]
  if (!active) {
    return (
      <EmptyGroup>
        No soak runs in this range. Soak mode runs once a day from main (the track-main benchmark);
        try a longer range.
      </EmptyGroup>
    )
  }

  return (
    <Stack gap={3}>
      <TabList gap={1}>
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
        <Stack gap={3}>
          <Text size={1} muted>
            {active.hint}
          </Text>
          <ChartGrid
            series={active.charts}
            layers={props.layers}
            tags={props.tags}
            onExpand={props.onExpand}
          />
        </Stack>
      </TabPanel>
    </Stack>
  )
}

/**
 * The settle group behind sub-tabs, one per question (tripwire count, time to
 * settle, activity after ready, component renders — see settleViews). Unlike
 * soak, these are ordinary run-history series, so they keep the drift/ack
 * plumbing the plain grid has. Renders a blank state instead of nothing when
 * the range holds no settle runs, since the tab is always shown.
 */
function SettlePanel(props: {
  series: TrendSeries[]
  driftBySeries: Map<string, DriftResult>
  silencedBySeries: Map<string, DriftResult>
  baselineBySeries: Map<string, DriftResult>
  drift: DriftState
  focusedKey: string | null
  onFocusMetric: (seriesKey: string) => void
  layers: LayerState
  tags: TrendTag[]
  onExpand: (seriesKey: string) => void
  /** Explicit `?settle=` sub-tab ('' = none) and the deep-linked `?chart=` key. */
  view: string
  onViewChange: (id: string) => void
  chartKey: string
  /** The focused chart lives in another sub-tab the user just left. */
  onLeaveChart: () => void
}) {
  const views = useMemo(() => settleViews(props.series), [props.series])
  // Same rule as the group tabs: an explicit sub-tab wins, else the sub-tab
  // holding the deep-linked/focused chart (so a drift-feed jump or a shared
  // ?chart= link lands on the grid that has it), else the first.
  const active =
    views.find((v) => v.id === props.view) ??
    (props.chartKey
      ? views.find((v) => v.series.some((entry) => entry.key === props.chartKey))
      : undefined) ??
    views[0]

  if (!active) {
    return (
      <EmptyGroup>
        No settle runs in this range. Settle mode runs once a day from main (the track-main
        benchmark) against the customization build; locally,{' '}
        <code>pnpm bench run --mode settle</code> prints the same numbers as terminal charts.
      </EmptyGroup>
    )
  }

  return (
    <Stack gap={3}>
      <TabList gap={1}>
        {views.map((v) => (
          <Tab
            key={v.id}
            id={`settle-tab-${v.id}`}
            aria-controls={`settle-panel-${v.id}`}
            label={v.label}
            selected={v.id === active.id}
            onClick={() => {
              props.onViewChange(v.id)
              // As with the group tabs: a focused chart in another sub-tab
              // must not linger in the shareable URL once navigated away
              if (props.chartKey && !v.series.some((entry) => entry.key === props.chartKey)) {
                props.onLeaveChart()
              }
            }}
          />
        ))}
      </TabList>
      <TabPanel id={`settle-panel-${active.id}`} aria-labelledby={`settle-tab-${active.id}`}>
        <Stack gap={3}>
          <Text size={1} muted>
            {active.hint}
          </Text>
          <ChartGrid
            series={active.series}
            driftBySeries={props.driftBySeries}
            silencedBySeries={props.silencedBySeries}
            baselineBySeries={props.baselineBySeries}
            drift={props.drift}
            focusedKey={props.focusedKey}
            onFocusMetric={props.onFocusMetric}
            layers={props.layers}
            tags={props.tags}
            onExpand={props.onExpand}
          />
        </Stack>
      </TabPanel>
    </Stack>
  )
}

/**
 * One chart, maximized. The grid is 40+ small multiples — great for scanning,
 * too cramped for reading: at ~330px a 90-day window puts a release marker every
 * ~15px and the metric's own description has to hide behind an ⓘ. This is the
 * same `SeriesCard`, not a second implementation of it, given room to draw
 * labelled markers and show its description.
 *
 * State lives in `?max=<series key>` (see TrendsTool) so a maximized chart is
 * shareable and reloadable like every other view state, and opening it pushes a
 * history entry so Back closes it.
 */
function MaximizedChartDialog(props: {
  series: TrendSeries
  drift?: DriftResult
  silenced?: DriftResult
  baseline?: DriftResult
  layers?: LayerState
  tags?: TrendTag[]
  onAck?: (state: 'silenced' | 'snoozed' | 'fixed') => void
  onUnack?: () => void
  onClose: () => void
}) {
  const {series, onClose, ...rest} = props
  return (
    // width={4} rather than "fill": on a very wide monitor a full-viewport plot
    // stretches ~90 days across 2500px, which reads as a flat line no matter
    // what the metric did. Dialog owns Escape and the focus trap.
    <Dialog
      id="chart-maximize"
      header={series.title}
      width={4}
      onClose={onClose}
      onClickOutside={onClose}
    >
      <Box padding={3}>
        {/* No border/padding duplication: the card renders inside the dialog's
            own content box.

            560 rather than 460: the label gutter grew to ~112px once markers
            carried rotated '(latest)' labels, and at 460 that left the plot
            itself only ~320px — the labels had room but the data no longer did.
            This keeps ~420px of plot, which is what the original 460 was chosen
            to give, while still fitting the legend without scrolling. */}
        <SeriesCard series={series} height={560} expanded {...rest} />
      </Box>
    </Dialog>
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
  // Encoding layers (median / band / baseline overlay), toggled from any chart
  // legend and applied to the whole grid — see layers.ts
  const [layersParam, setLayersParam] = useUrlState('layers', '')
  const layers = useLayerState(layersParam, setLayersParam)
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

  // Release tags, for the chart markers. Its own stream, and its own error
  // handling: markers are annotation, so a tag query that fails degrades to
  // "no markers" rather than poisoning the runs stream into an error card.
  // Realtime like everything else — a new release appears without a reload
  // (the daily cron re-upserts tags, and dist-tags re-point between releases).
  const liveTags$ = useMemo(
    () =>
      documentStore.listenQuery(TAGS_QUERY, {}, {tag: 'metrics.trends.tags'}).pipe(
        map((result) => result as TrendTag[]),
        catchError(() => of<TrendTag[]>([])),
      ),
    [documentStore],
  )
  const liveTags = useObservable(liveTags$, [])

  const debugRuns = useMemo(() => (source === 'live' ? null : generateDebugRuns(source)), [source])
  const runs = source === 'live' ? live.runs : debugRuns
  // Debug sources get synthetic tags too, so the marker layer (including label
  // collision) is testable offline like every other layer — see SPEC
  const debugTags = useMemo(() => (source === 'live' ? [] : generateDebugTags(source)), [source])
  const tags = source === 'live' ? liveTags : debugTags
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
  /**
   * Drift is computed over *all* history for the selected branches, never the
   * range-filtered view. Its baseline is defined in runs (last 7 vs prior 21),
   * so feeding it a 30-day slice would leave the baseline drawing on ~23 of 30
   * visible runs and — worse — make the verdict a function of the range picker:
   * the same metric could flag at 90d and not at 30d. The charts still render
   * `series` (the range the user chose); only the drift math reads the full
   * history.
   */
  const driftSeries = useMemo(
    () =>
      buildSeries(
        (runs ?? []).filter((run) => run.git && selectedBranches.includes(run.git.branch)),
      ),
    [runs, selectedBranches],
  )
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
  // Calibration is built even from zero runs (an empty line per branch), so
  // the environment tab's blank state keys off its points, not its presence.
  const calibrationHasPoints = calibration.lines.some((line) => line.points.length > 0)
  const vitalGroups = useMemo(
    () => vitalSections(series.filter((entry) => entry.group === 'vitals')),
    [series],
  )

  // Every metric group is a tab, always: a fixed layout is learnable, and a
  // group without data in the range renders a blank state saying so (see
  // EmptyGroup) rather than quietly disappearing — a new mode stays
  // discoverable before its first run lands.
  const tabs = TREND_GROUPS
  // Includes calibration, which lives outside `series` — a deep link to it
  // must still resolve to the Calibration tab.
  const groupById = useMemo(() => {
    const map = new Map<string, TrendGroup>()
    for (const entry of [...series, calibration]) map.set(entry.key, entry.group)
    return map
  }, [series, calibration])

  // Every chart the tool can show, by key — what `?max=` resolves against.
  // The soak views and the environment tab build their series outside `series`,
  // so a maximize link into one of those has to find them here.
  const seriesByKey = useMemo(() => {
    const map = new Map<string, TrendSeries>()
    for (const entry of [
      ...series,
      ...environmentSeries,
      ...soakSlopes,
      ...soakEndValues,
      ...(latestSoak?.charts ?? []),
    ]) {
      map.set(entry.key, entry)
    }
    return map
  }, [series, environmentSeries, soakSlopes, soakEndValues, latestSoak])

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
  // The settle sub-tab follows the same rule ('' = derive from the chart);
  // owned here so a focus jump can clear it alongside ?tab=.
  const [settleViewParam, setSettleViewParam] = useUrlState('settle', '')
  const activeTab =
    tabs.find((tab) => tab.id === tabParam) ??
    (chartParam ? tabs.find((tab) => tab.id === groupById.get(chartParam)) : undefined) ??
    tabs[0]

  // Shared drift state (feeds both the pinned feed and the per-tab badges, so
  // they can't disagree). Badge = active regressions in that group.
  const drift = useDriftState(driftSeries)
  const showBranch = series.some((s) => s.lines.length > 1)
  const [focusedKey, setFocusedKey] = useState<string | null>(null)
  // A deep-linked (?chart=) focus arms only once data is in: at mount the
  // charts don't exist yet (listenQuery hasn't emitted), so an immediate
  // scroll would silently no-op and the ring would expire unseen.
  const pendingDeepLink = useRef(chartParam)
  useEffect(() => {
    if (!pendingDeepLink.current || series.length === 0) return
    setFocusedKey(pendingDeepLink.current)
    pendingDeepLink.current = ''
  }, [series])
  const focusMetric = (seriesKey: string) => {
    // One history entry per jump: push the chart param, then clear any
    // explicit tab on that same entry (replace) — the active tab derives from
    // the chart's group, and a single Back returns to the pre-jump state.
    setChartParam(seriesKey, 'push')
    setTabParam('', 'replace')
    setSettleViewParam('', 'replace')
    setFocusedKey(seriesKey)
  }
  // Side-effects of a focus (DOM scroll + auto-clearing the ring) live in an
  // effect keyed on the focused chart. setState only happens in the rAF/timer
  // callbacks, not synchronously in the effect body (react-compiler).
  useEffect(() => {
    if (!focusedKey) return undefined
    let timer: number | undefined
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(chartDomId(focusedKey))
      el?.scrollIntoView({behavior: 'smooth', block: 'center'})
      // Let the ring play out only if the chart is actually on screen; when
      // the element is missing (chart filtered out) drop the focus right away
      timer = window.setTimeout(
        () => setFocusedKey((k) => (k === focusedKey ? null : k)),
        el ? 2200 : 0,
      )
    })
    return () => {
      cancelAnimationFrame(raf)
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [focusedKey])

  // Which chart is maximized, as a URL param — same vocabulary as `?chart=`, so
  // a maximized chart is shareable and survives reload. Resolved by key at
  // render: a stale link (or a chart filtered out by the current branch/range)
  // resolves to nothing and simply shows no dialog.
  const [maximizedParam, setMaximizedParam] = useUrlState('max', '')
  const maximized = maximizedParam ? seriesByKey.get(maximizedParam) : undefined
  const expandMetric = (seriesKey: string) => {
    // 'push' so Back closes the dialog — the same precedent focusMetric sets,
    // and the behaviour a Back press means once something modal is open
    setMaximizedParam(seriesKey, 'push')
  }
  const closeMaximized = () => setMaximizedParam('')
  // Return focus to the expand button that opened the dialog, rather than
  // dropping the keyboard user at the top of the document.
  //
  // Keyed on the param clearing rather than done in the close handler, because
  // the dialog also closes via Back (popstate updates the param without going
  // through any handler) — an effect covers every route out. Deferred a frame
  // so it lands after the dialog's own focus restoration.
  const previousMaximized = useRef('')
  useEffect(() => {
    const justClosed = previousMaximized.current && !maximizedParam
    const key = previousMaximized.current
    previousMaximized.current = maximizedParam
    if (!justClosed) return undefined
    const raf = requestAnimationFrame(() => {
      const card = document.getElementById(chartDomId(key))
      card?.querySelector<HTMLButtonElement>('button[aria-label^="Expand "]')?.focus()
    })
    return () => cancelAnimationFrame(raf)
  }, [maximizedParam])

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
  // regressions winning over improvements.
  const driftBySeries = useMemo(() => worstBySeries(drift.active), [drift.active])
  // Every series' baseline, flagged or not — the charts draw an overlay from this
  // so the reference lines don't appear and disappear as metrics cross the
  // threshold. Badge, card tint and the ack menu still key off `drift.active`.
  const baselineBySeries = useMemo(() => worstBySeries(drift.all), [drift.all])
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
          <Stack gap={4}>
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
                <Stack gap={3}>
                  <Text size={1} muted>
                    One benchmark run per day of the studio built from <code>main</code>, measured
                    against a local API mock (no network, no real project); see{' '}
                    <code>perf/bench</code>. Each chart tracks one metric over time. Click anywhere
                    in a chart to open the nearest run, with links to the PR, commit, and CI run.
                  </Text>
                  <Text size={1} muted>
                    Because the CI machine varies day to day, absolute numbers depend on the host:
                    before trusting a spike, check the host calibration in the Calibration tab. If
                    it spikes on the same day, suspect the runner, not the studio. Flat lines are
                    the goal; the ⓘ on each chart explains what it measures.
                  </Text>
                </Stack>
              </Card>
            )}

            {error && (
              <Card tone="critical" border padding={3} radius={2}>
                <Text size={1}>
                  Couldn't load benchmark runs: {error}. Reload the page to try again.
                </Text>
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
                  No benchmark runs in this range. Try a longer range, or wait for the daily
                  benchmark (one run per day from main).
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
              <Stack gap={3}>
                <TabList gap={1}>
                  {tabs.map((tab) => {
                    const count = regressionsByGroup.get(tab.id) ?? 0
                    return (
                      <Tab
                        key={tab.id}
                        id={`group-tab-${tab.id}`}
                        aria-controls={`group-panel-${tab.id}`}
                        icon={GROUP_ICONS[tab.id]}
                        label={
                          <Flex align="center" gap={2}>
                            <span>{tab.title}</span>
                            {count > 0 && (
                              <Badge
                                tone="caution"
                                fontSize={0}
                                aria-label={`${count} metric${count === 1 ? '' : 's'} to review`}
                              >
                                {count}
                              </Badge>
                            )}
                          </Flex>
                        }
                        selected={tab.id === activeTab.id}
                        onClick={() => {
                          setTabParam(tab.id)
                          // Don't let a focused chart from another tab linger
                          // in shareable URLs once the user navigates away
                          if (chartParam && groupById.get(chartParam) !== tab.id) setChartParam('')
                        }}
                      />
                    )
                  })}
                </TabList>
                <TabPanel
                  id={`group-panel-${activeTab.id}`}
                  aria-labelledby={`group-tab-${activeTab.id}`}
                >
                  <Stack gap={3}>
                    <Text size={1} muted>
                      {activeTab.description}
                    </Text>
                    {activeTab.id === 'soak' ? (
                      <SoakPanel
                        slopes={soakSlopes}
                        endValues={soakEndValues}
                        latest={latestSoak}
                        layers={layers}
                        tags={tags}
                        onExpand={expandMetric}
                      />
                    ) : activeTab.id === 'settle' ? (
                      <SettlePanel
                        series={series.filter((entry) => entry.group === 'settle')}
                        driftBySeries={driftBySeries}
                        silencedBySeries={silencedBySeries}
                        baselineBySeries={baselineBySeries}
                        drift={drift}
                        focusedKey={focusedKey}
                        onFocusMetric={focusMetric}
                        layers={layers}
                        tags={tags}
                        onExpand={expandMetric}
                        view={settleViewParam}
                        onViewChange={setSettleViewParam}
                        chartKey={chartParam}
                        onLeaveChart={() => setChartParam('')}
                      />
                    ) : activeTab.id === 'vitals' ? (
                      vitalGroups.length === 0 ? (
                        <EmptyGroup>
                          No Web Vitals data in this range — try a longer range.
                        </EmptyGroup>
                      ) : (
                        // One section per vital, so the overview reads by metric
                        // ("how is LCP doing, everywhere?") — see vitalSections.
                        // The extra top padding separates the first section
                        // header from the tab description it would otherwise hug.
                        <Stack gap={6} paddingTop={3}>
                          {vitalGroups.map((section) => (
                            <Stack key={section.vital} gap={4}>
                              <Flex align="baseline" gap={2}>
                                <Text size={1} weight="semibold">
                                  {section.vital}
                                </Text>
                                {section.name && (
                                  <Text size={1} muted>
                                    {section.name}
                                  </Text>
                                )}
                              </Flex>
                              <ChartGrid
                                layers={layers}
                                series={section.series}
                                driftBySeries={driftBySeries}
                                silencedBySeries={silencedBySeries}
                                baselineBySeries={baselineBySeries}
                                drift={drift}
                                focusedKey={focusedKey}
                                onFocusMetric={focusMetric}
                                tags={tags}
                                onExpand={expandMetric}
                              />
                            </Stack>
                          ))}
                        </Stack>
                      )
                    ) : (
                      <ChartGrid
                        layers={layers}
                        series={
                          activeTab.id === 'environment'
                            ? calibrationHasPoints
                              ? environmentSeries
                              : []
                            : series.filter((entry) => entry.group === activeTab.id)
                        }
                        emptyMessage={`No ${activeTab.title.toLowerCase()} data in this range — try a longer range.`}
                        driftBySeries={driftBySeries}
                        silencedBySeries={silencedBySeries}
                        baselineBySeries={baselineBySeries}
                        drift={drift}
                        focusedKey={focusedKey}
                        onFocusMetric={focusMetric}
                        tags={tags}
                        onExpand={expandMetric}
                      />
                    )}
                  </Stack>
                </TabPanel>
              </Stack>
            )}
          </Stack>
        </Container>
      </Card>
      {/* The maximized chart. Rendered last, outside the scroll container: it's
          a Dialog, and it gets the same per-series drift/baseline/ack props the
          grid card gets, so maximizing is always a superset of the card and
          never a downgrade. */}
      {maximized && (
        <MaximizedChartDialog
          series={maximized}
          drift={driftBySeries.get(maximized.key)}
          silenced={silencedBySeries.get(maximized.key)}
          baseline={baselineBySeries.get(maximized.key)}
          layers={layers}
          tags={tags}
          onAck={(state) => {
            const entry = driftBySeries.get(maximized.key)
            if (entry) drift.ack(entry, state)
          }}
          onUnack={() => {
            const entry = silencedBySeries.get(maximized.key)
            if (entry) drift.clear(entry)
          }}
          onClose={closeMaximized}
        />
      )}
    </PortalProvider>
  )
}
