import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronLeftIcon} from '@sanity/icons/ChevronLeft'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {LockIcon} from '@sanity/icons/Lock'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Badge, Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {addDays} from 'date-fns/addDays'
import {addMonths} from 'date-fns/addMonths'
import {addWeeks} from 'date-fns/addWeeks'
import {format} from 'date-fns/format'
import {startOfMonth} from 'date-fns/startOfMonth'
import {startOfWeek} from 'date-fns/startOfWeek'
import {Fragment, useCallback, useMemo, useState} from 'react'
import {useRouter} from 'sanity/router'

import {Button} from '../../../../ui-components/button/Button'
import {ToneIcon} from '../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {useTimeZone} from '../../../hooks/useTimeZone'
import {useTranslation} from '../../../i18n'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../../studio/constants'
import {isCardinalityOneRelease} from '../../../util/releaseUtils'
import {releasesLocaleNamespace} from '../../i18n'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {getReleaseTiming} from '../../util/getReleaseTiming'
import {type TableRelease} from './ReleasesOverview'

/**
 * v1 (read-only) port of "Variant A · Roadmap" from the timeline sandbox
 * (`dev/test-studio/plugins/timeline-sandbox/TimelineSandbox.tsx`) — see
 * docs/initiatives/releases-overview-redesign/timeline-design.md.
 *
 * @internal
 */
export type ReleaseTimelineGranularity = 'week' | 'month' | 'quarter'

const GRANULARITIES: ReleaseTimelineGranularity[] = ['week', 'month', 'quarter']

const LANE_HEIGHT = 64
/** Fixed pill width (matches "Variant A · Roadmap" in the timeline sandbox) — pills never grow
 * beyond this, no matter how long the release title is; long titles are ellipsis-truncated
 * instead (see `ReleaseTimelinePill`). */
const PILL_WIDTH = 216
/** Minimum breathing room (px) required between two pills before they're considered to collide
 * horizontally and one gets bumped to the next lane. */
const PILL_GAP_PX = 16
const AXIS_HEIGHT_PADDING = 44
const MARKER_SIZE = 12

interface DatedRelease {
  release: TableRelease
  date: Date
  scheduled: boolean
  intendedNotArmed: boolean
  overdue: boolean
}

/** Converts a real (UTC) instant into the studio's content-releases time zone. Matches the
 * `utcToCurrentZoneDate` returned by `useTimeZone` — a `TZDate` (or plain `Date` in tests) whose
 * getters (and therefore `date-fns/format`, called with no `in:` option) read as zoned wall-clock
 * values, exactly like `useReleaseTime` already does for the Schedule column. */
type ToZonedDate = (date: Date) => Date

function getRange(granularity: ReleaseTimelineGranularity, now: Date): {start: Date; end: Date} {
  if (granularity === 'week') return {start: addDays(now, -3), end: addDays(now, 21)}
  if (granularity === 'quarter') return {start: addMonths(now, -1), end: addMonths(now, 5)}
  return {start: addWeeks(now, -2), end: addWeeks(now, 10)} // month
}

function getTicks(
  granularity: ReleaseTimelineGranularity,
  start: Date,
  end: Date,
  toZoned: ToZonedDate,
): {date: Date; label: string}[] {
  const ticks: {date: Date; label: string}[] = []
  if (granularity === 'week') {
    let cursor = startOfWeek(start, {weekStartsOn: 1})
    while (cursor <= end) {
      if (cursor >= start) {
        ticks.push({date: cursor, label: zonedFormat(cursor, toZoned, 'd MMM')})
      }
      cursor = addWeeks(cursor, 1)
    }
    return ticks
  }
  let cursor = startOfMonth(start)
  while (cursor <= end) {
    if (cursor >= start) {
      ticks.push({date: cursor, label: zonedFormat(cursor, toZoned, 'MMM')})
    }
    cursor = addMonths(cursor, 1)
  }
  return ticks
}

function xPct(date: Date, start: Date, end: Date): number {
  const span = end.getTime() - start.getTime()
  if (span <= 0) return 0
  const pct = ((date.getTime() - start.getTime()) / span) * 100
  return Math.max(0, Math.min(100, pct))
}

/**
 * Assign non-overlapping lanes to date-sorted markers, bumping to the next lane whenever two
 * markers would render closer than `gapPct` (percent of the visible range) apart — ported from
 * the sandbox's lane packer, but made pixel-aware: `gapPct` is derived from the actual rendered
 * pill width against the track's `minWidth`, so it scales with granularity instead of using one
 * fixed percentage (a fixed percentage under-packs on the wider `week`/`month` ranges real,
 * clustered data hits, letting same-week pills overlap).
 */
function assignLanes(items: {x: number}[], gapPct: number): number[] {
  const laneLastX: number[] = []
  return items.map(({x}) => {
    let lane = laneLastX.findIndex((lastX) => x - lastX >= gapPct)
    if (lane === -1) lane = laneLastX.length
    laneLastX[lane] = x
    return lane
  })
}

/** Format a real (UTC) instant as wall-clock text in the studio's content-releases time zone. */
function zonedFormat(date: Date, toZoned: ToZonedDate, fmtStr: string): string {
  return format(toZoned(date), fmtStr)
}

/** The calendar-day key (in the studio's content-releases time zone) used to group same-day
 * collisions. */
function zonedDayKey(date: Date, toZoned: ToZonedDate): string {
  return zonedFormat(date, toZoned, 'yyyy-MM-dd')
}

function Axis({
  start,
  end,
  now,
  height,
  ticks,
  nowLabel,
}: {
  start: Date
  end: Date
  now: Date
  height: number
  ticks: {date: Date; label: string}[]
  nowLabel: string
}) {
  const nowX = xPct(now, start, end)
  return (
    <>
      {ticks.map((tick) => {
        const x = xPct(tick.date, start, end)
        return (
          <Fragment key={tick.date.toISOString()}>
            <Box
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: 0,
                bottom: 0,
                borderLeft: '1px dashed var(--card-border-color)',
                opacity: 0.5,
              }}
            />
            <Text size={0} muted style={{position: 'absolute', left: `calc(${x}% + 4px)`, top: -2}}>
              {tick.label}
            </Text>
          </Fragment>
        )
      })}
      {/* now marker */}
      <Box
        data-testid="release-timeline-now-marker"
        style={{
          position: 'absolute',
          left: `${nowX}%`,
          top: 0,
          height,
          borderLeft: '2px solid var(--card-badge-primary-icon-color)',
        }}
      />
      <Text
        size={0}
        weight="semibold"
        style={{
          position: 'absolute',
          left: `calc(${nowX}% + 4px)`,
          bottom: -4,
          color: 'var(--card-badge-primary-icon-color)',
        }}
      >
        {nowLabel}
      </Text>
    </>
  )
}

function ReleaseTimelinePill({
  entry,
  x,
  lane,
  collides,
  toZoned,
  onNavigate,
}: {
  entry: DatedRelease
  x: number
  lane: number
  collides: boolean
  toZoned: ToZonedDate
  onNavigate: (release: TableRelease) => void
}) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {release, date, scheduled, intendedNotArmed, overdue} = entry
  const isDraft = isCardinalityOneRelease(release)
  const title = release.metadata?.title || t('release-placeholder.title')
  const dateLabel = zonedFormat(date, toZoned, 'd MMM, HH:mm')
  const documentCount = release.documentsMetadata?.documentCount ?? 0

  const tone = intendedNotArmed ? 'caution' : 'default'

  return (
    <Tooltip
      content={
        <Box padding={2}>
          <Stack space={2}>
            <Text size={1} weight="semibold">
              {title}
            </Text>
            <Text size={1} muted>
              {dateLabel}
            </Text>
            <Text size={1} muted>
              {t(
                documentCount === 1 ? 'summary.document-count_one' : 'summary.document-count_other',
                {
                  count: documentCount,
                },
              )}
            </Text>
            {collides && (
              <Text size={1} style={{color: 'var(--card-badge-caution-icon-color)'}}>
                {t('timeline.tooltip-collision')}
              </Text>
            )}
          </Stack>
        </Box>
      }
      portal
    >
      <Card
        data-testid={`release-timeline-pill-${release._id}`}
        tone={tone}
        radius={2}
        shadow={1}
        padding={3}
        as="button"
        onClick={() => onNavigate(release)}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: lane * LANE_HEIGHT + 12,
          width: PILL_WIDTH,
          maxWidth: PILL_WIDTH,
          textAlign: 'left',
          cursor: 'pointer',
          border: collides
            ? '1px solid var(--card-badge-caution-icon-color)'
            : '1px solid var(--card-border-color)',
        }}
      >
        <Stack space={3}>
          <Flex align="center" gap={2}>
            <Text size={1}>
              {intendedNotArmed ? (
                <ToneIcon icon={WarningOutlineIcon} tone="caution" />
              ) : (
                <Text size={1} muted>
                  <LockIcon data-testid={scheduled ? 'release-timeline-lock-icon' : undefined} />
                </Text>
              )}
            </Text>
            {/* `minWidth: 0` is load-bearing: without it this flex item won't shrink below its
                content's intrinsic width, so a long title silently pushes past the pill's fixed
                `width` and bleeds over neighboring pills instead of being clipped by
                `textOverflow="ellipsis"`. `title` surfaces the full text on hover as a fallback
                to the pill-level Tooltip above. */}
            <Box title={title} style={{minWidth: 0, overflow: 'hidden', flex: 1}}>
              <Text size={1} weight="medium" textOverflow="ellipsis">
                {title}
              </Text>
            </Box>
          </Flex>
          <Flex align="center" gap={2} wrap="wrap">
            <Text size={0} muted style={{whiteSpace: 'nowrap'}}>
              {dateLabel}
            </Text>
            {isDraft && (
              <Badge fontSize={0} tone="primary">
                {t('timeline.draft-badge')}
              </Badge>
            )}
            {overdue && (
              <Badge fontSize={0} tone="caution">
                {t('timeline.overdue-badge')}
              </Badge>
            )}
            {collides && (
              <Badge fontSize={0} tone="caution">
                {t('timeline.collision-badge')}
              </Badge>
            )}
          </Flex>
        </Stack>
      </Card>
    </Tooltip>
  )
}

/**
 * A state-colored ◇ diamond marking a release's exact position on the time axis, restored from
 * the sandbox's milestone baseline — the pill below is a label hanging off this point, so nothing
 * reads as a duration/bar. Rendered independent of lane-packing (always on the baseline, unlike
 * the pill it belongs to) so the axis stays legible even when the pills above are dense.
 */
function ReleaseTimelineMarker({
  entry,
  x,
  collides,
}: {
  entry: DatedRelease
  x: number
  collides: boolean
}) {
  const tone = collides || entry.intendedNotArmed ? 'caution' : 'default'
  return (
    <Card
      data-testid={`release-timeline-marker-${entry.release._id}`}
      tone={tone}
      shadow={1}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: 4,
        width: MARKER_SIZE,
        height: MARKER_SIZE,
        transform: 'translateX(-50%) rotate(45deg)',
        border: '2px solid var(--card-bg-color)',
      }}
    />
  )
}

/**
 * A pinned chip flanking the axis (left = `start`, right = `end`) that summarizes dated releases
 * falling outside the visible window: left is always past-due (overdue too far back to plot),
 * right is future beyond the horizon. Rather than clamp those onto the axis edge at a false
 * position — which piled them into an unreadable tower — they're pulled off the axis and counted
 * here. Clicking widens the window on that side to include them at their true positions; while
 * widened the chip becomes a reset affordance. Hidden entirely when there's nothing beyond the
 * edge and the window isn't widened.
 */
function EdgeOverflowChip({
  side,
  count,
  expanded,
  items,
  onToggle,
  toZoned,
}: {
  side: 'start' | 'end'
  count: number
  expanded: boolean
  items: DatedRelease[]
  onToggle: () => void
  toZoned: ToZonedDate
}) {
  const {t} = useTranslation(releasesLocaleNamespace)
  if (count === 0 && !expanded) return null

  const icon = side === 'start' ? ChevronLeftIcon : ChevronRightIcon

  if (expanded) {
    return (
      <Box flex="none" style={{marginTop: 20}}>
        <Button
          data-testid={`release-timeline-overflow-${side}`}
          mode="bleed"
          icon={icon}
          onClick={onToggle}
          aria-label={t('timeline.overflow-collapse')}
          tooltipProps={{content: t('timeline.overflow-collapse')}}
        />
      </Box>
    )
  }

  const label =
    side === 'start'
      ? t('timeline.overflow-earlier', {count})
      : t('timeline.overflow-later', {count})
  const preview = items.slice(0, 8)
  const tooltipContent = (
    <Box padding={2}>
      <Stack space={2}>
        <Text size={1} weight="semibold">
          {t('timeline.overflow-expand')}
        </Text>
        {preview.map(({release, date}) => (
          <Text key={release._id} size={1} muted>
            {`${release.metadata?.title || t('release-placeholder.title')} — ${zonedFormat(
              date,
              toZoned,
              'd MMM yyyy',
            )}`}
          </Text>
        ))}
        {items.length > preview.length && (
          <Text size={1} muted>
            {t('timeline.overflow-more', {count: items.length - preview.length})}
          </Text>
        )}
      </Stack>
    </Box>
  )

  return (
    <Box flex="none" style={{marginTop: 20, maxWidth: 170}}>
      <Button
        data-testid={`release-timeline-overflow-${side}`}
        mode="ghost"
        tone={side === 'start' ? 'caution' : 'default'}
        icon={side === 'start' ? icon : undefined}
        iconRight={side === 'end' ? icon : undefined}
        text={label}
        onClick={onToggle}
        tooltipProps={{content: tooltipContent}}
      />
    </Box>
  )
}

function ReleaseTimelineRoadmap({
  dated,
  granularity,
  now,
  toZoned,
  onNavigate,
}: {
  dated: DatedRelease[]
  granularity: ReleaseTimelineGranularity
  now: Date
  toZoned: ToZonedDate
  onNavigate: (release: TableRelease) => void
}) {
  const {t} = useTranslation(releasesLocaleNamespace)

  // Widen-the-window state, per edge, tagged with the granularity it was set under. Keeping the
  // granularity in the state (rather than resetting via an effect, which the react-compiler rule
  // flags) means switching Week/Month/Quarter auto-collapses back to that granularity's default
  // range: a stale tag simply reads as "not expanded".
  const [expanded, setExpanded] = useState<{
    start: boolean
    end: boolean
    g: ReleaseTimelineGranularity
  }>({start: false, end: false, g: granularity})
  const expandStart = expanded.g === granularity && expanded.start
  const expandEnd = expanded.g === granularity && expanded.end
  const toggleEdge = useCallback(
    (edge: 'start' | 'end') =>
      setExpanded((prev) => {
        const current = prev.g === granularity ? prev : {start: false, end: false, g: granularity}
        return {...current, g: granularity, [edge]: !current[edge]}
      }),
    [granularity],
  )

  const sorted = useMemo(
    () => [...dated].sort((a, b) => a.date.getTime() - b.date.getTime()),
    [dated],
  )

  const base = useMemo(() => getRange(granularity, now), [granularity, now])
  // When an edge is widened, stretch that side of the range out to the furthest dated release on
  // that side so every off-window item plots at its true position; otherwise keep the default
  // window and let anything beyond it fall into the edge overflow chips.
  const start =
    expandStart && sorted.length > 0 && sorted[0].date < base.start ? sorted[0].date : base.start
  const end =
    expandEnd && sorted.length > 0 && sorted[sorted.length - 1].date > base.end
      ? sorted[sorted.length - 1].date
      : base.end

  const ticks = useMemo(
    () => getTicks(granularity, start, end, toZoned),
    [granularity, start, end, toZoned],
  )

  // Only entries inside the visible window are plotted; the rest are summarized in the edge chips.
  const beforeItems = useMemo(() => sorted.filter((e) => e.date < start), [sorted, start])
  const afterItems = useMemo(() => sorted.filter((e) => e.date > end), [sorted, end])
  const inWindow = useMemo(
    () => sorted.filter((e) => e.date >= start && e.date <= end),
    [sorted, start, end],
  )

  const positioned = useMemo(
    () => inWindow.map((entry) => ({entry, x: xPct(entry.date, start, end)})),
    [inWindow, start, end],
  )
  const minWidth = granularity === 'week' ? 900 : granularity === 'quarter' ? 1600 : 1200
  // The gap that keeps pills from overlapping has to be expressed as a percent of the visible
  // range, but pills are a fixed pixel width — so scale the two together against the track's
  // pixel `minWidth`, instead of a single hardcoded percentage that under-packs on the wider
  // week/month ranges real, clustered data hits.
  const gapPct = ((PILL_WIDTH + PILL_GAP_PX) / minWidth) * 100
  const lanes = useMemo(() => assignLanes(positioned, gapPct), [positioned, gapPct])
  const laneCount = Math.max(1, ...lanes.map((lane) => lane + 1))
  const height = laneCount * LANE_HEIGHT + AXIS_HEIGHT_PADDING

  const collisionIds = useMemo(() => {
    const byDay = new Map<string, string[]>()
    inWindow.forEach(({release, date}) => {
      const key = zonedDayKey(date, toZoned)
      byDay.set(key, [...(byDay.get(key) || []), release._id])
    })
    const ids = new Set<string>()
    byDay.forEach((ids_) => {
      if (ids_.length > 1) ids_.forEach((id) => ids.add(id))
    })
    return ids
  }, [inWindow, toZoned])

  return (
    <Flex align="flex-start" gap={2}>
      <EdgeOverflowChip
        side="start"
        count={beforeItems.length}
        expanded={expandStart}
        items={beforeItems}
        onToggle={() => toggleEdge('start')}
        toZoned={toZoned}
      />
      <Box flex={1} style={{overflowX: 'auto', overflowY: 'hidden'}}>
        <Box style={{position: 'relative', height, minWidth, marginTop: 20}}>
          <Axis
            start={start}
            end={end}
            now={now}
            height={height}
            ticks={ticks}
            nowLabel={t('timeline.now-marker')}
          />
          {/* baseline the pills hang off, so they read as points on a line */}
          <Box
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 9,
              borderTop: '2px solid var(--card-border-color)',
            }}
          />
          {positioned.map(({entry, x}) => (
            <ReleaseTimelineMarker
              key={`marker-${entry.release._id}`}
              entry={entry}
              x={x}
              collides={collisionIds.has(entry.release._id)}
            />
          ))}
          {positioned.map(({entry, x}, i) => (
            <ReleaseTimelinePill
              key={entry.release._id}
              entry={entry}
              x={x}
              lane={lanes[i]}
              collides={collisionIds.has(entry.release._id)}
              toZoned={toZoned}
              onNavigate={onNavigate}
            />
          ))}
        </Box>
      </Box>
      <EdgeOverflowChip
        side="end"
        count={afterItems.length}
        expanded={expandEnd}
        items={afterItems}
        onToggle={() => toggleEdge('end')}
        toZoned={toZoned}
      />
    </Flex>
  )
}

/**
 * Bottom-left summary chip counting releases excluded from the strip because they have no date
 * at all (`getReleaseTiming(release).date === null`) — restored from the sandbox's "Undated"
 * tray, adapted from its three-way asap/scheduled/undecided split to the two-state timing model:
 * a release is either dated (shown above, armed or merely intended) or unscheduled (no date,
 * list-only). Hidden entirely when there's nothing to report.
 */
function UnscheduledChip({count}: {count: number}) {
  const {t} = useTranslation(releasesLocaleNamespace)
  if (count === 0) return null
  return (
    <Flex gap={2} align="center" data-testid="release-timeline-unscheduled-chip">
      <Badge tone="default" fontSize={0}>
        {t('timeline.unscheduled-count', {count})}
      </Badge>
    </Flex>
  )
}

/**
 * A collapsible, read-only timeline strip rendered above the releases `DocumentTable`: dated
 * releases and scheduled drafts as lane-packed pills on a horizontal time axis, with a
 * Week/Month/Quarter granularity toggle and a "now" marker. Undated releases (no armed or
 * intended date) are excluded — they stay list-only, summarized in the "Unscheduled" chip below
 * the strip. Renders nothing when there is nothing dated to show.
 *
 * @internal
 */
export function ReleaseTimeline({releases}: {releases: TableRelease[]}) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const router = useRouter()
  const {utcToCurrentZoneDate} = useTimeZone(CONTENT_RELEASES_TIME_ZONE_SCOPE)
  const [collapsed, setCollapsed] = useState(false)
  const [granularity, setGranularity] = useState<ReleaseTimelineGranularity>('month')

  const now = useMemo(() => new Date(), [])

  const {dated, unscheduledCount} = useMemo(() => {
    const live = releases.filter((release) => !release.isDeleted && !release.isLoading)
    const datedList = live.reduce<DatedRelease[]>((acc, release) => {
      const timing = getReleaseTiming(release)
      if (!timing.date) return acc
      acc.push({
        release,
        date: timing.date,
        scheduled: timing.scheduled,
        intendedNotArmed: timing.intendedNotArmed,
        overdue: timing.overdue,
      })
      return acc
    }, [])
    return {dated: datedList, unscheduledCount: live.length - datedList.length}
  }, [releases])

  const handleNavigate = useCallback(
    (release: TableRelease) => {
      router.navigate({releaseId: getReleaseIdFromReleaseDocumentId(release._id)})
    },
    [router],
  )

  const handleToggleCollapsed = useCallback(() => setCollapsed((prev) => !prev), [])

  if (dated.length === 0) return null

  return (
    <Card
      data-testid="release-timeline"
      flex="none"
      borderBottom
      paddingX={3}
      paddingTop={2}
      paddingBottom={collapsed ? 2 : 3}
    >
      <Stack space={3}>
        <Flex align="center" justify="space-between" gap={3}>
          <Button
            data-testid="release-timeline-toggle"
            mode="bleed"
            icon={collapsed ? ChevronRightIcon : ChevronDownIcon}
            text={t('timeline.title')}
            onClick={handleToggleCollapsed}
            tooltipProps={{content: t(collapsed ? 'timeline.expand' : 'timeline.collapse')}}
          />
          {!collapsed && (
            <Flex gap={1} align="center">
              {GRANULARITIES.map((g) => (
                <Button
                  key={g}
                  data-testid={`release-timeline-granularity-${g}`}
                  mode={granularity === g ? 'default' : 'bleed'}
                  tone={granularity === g ? 'primary' : 'default'}
                  text={t(`timeline.granularity.${g}`)}
                  onClick={() => setGranularity(g)}
                />
              ))}
            </Flex>
          )}
        </Flex>
        {!collapsed && (
          <>
            <ReleaseTimelineRoadmap
              dated={dated}
              granularity={granularity}
              now={now}
              toZoned={utcToCurrentZoneDate}
              onNavigate={handleNavigate}
            />
            <UnscheduledChip count={unscheduledCount} />
          </>
        )}
      </Stack>
    </Card>
  )
}
