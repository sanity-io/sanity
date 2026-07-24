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
import {Fragment, useCallback, useEffect, useMemo, useRef, useState} from 'react'
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
 * The strip is a single continuous, horizontally-scrollable timeline spanning the full range of
 * dated releases: there is no window-rescale (which was disorienting — the axis jumped and there
 * was no anchor). Granularity toggles the zoom (pixels-per-day + tick interval); a "Today" button
 * recenters on now; and the left/right signposts count releases scrolled off each edge and scroll
 * toward them. Height is fixed so the surrounding page never reflows.
 *
 * @internal
 */
export type ReleaseTimelineGranularity = 'week' | 'month' | 'quarter'

const GRANULARITIES: ReleaseTimelineGranularity[] = ['week', 'month', 'quarter']

/** Density: `detailed` = labelled pill cards (default); `compact` = a single-line diamonds-only
 * axis, each diamond carrying the hover tooltip + click-to-open. */
export type ReleaseTimelineDensity = 'detailed' | 'compact'

/** Lane stride: one-line pill (~37px) plus vertical breathing room, so adjacent lanes never
 * overlap. */
const LANE_HEIGHT = 40
/** Fixed pill width — pills never grow beyond this; long titles ellipsis-truncate. */
const PILL_WIDTH = 240
/** Breathing room (px) between pills before one bumps to the next lane. */
const PILL_GAP_PX = 12
const MARKER_SIZE = 14
/** Compact (diamonds-only) diamonds are the primary element, so render them a touch larger. */
const MARKER_SIZE_COMPACT = 18
/** Vertical geometry of the strip. Pills hang below the axis baseline. The track is a scroll
 * container (`overflow: auto`), so its top edge clips its content — the tick/now labels need a
 * few px of breathing room from `top: 0` or the top of their glyphs gets shaved off. */
const AXIS_LABEL_TOP = 6
const BASELINE_TOP = 24
const PILLS_TOP = 36
/** Number of lanes visible before the track scrolls vertically — sets the fixed strip height. */
const VISIBLE_LANES = 4
const TRACK_HEIGHT = PILLS_TOP + VISIBLE_LANES * LANE_HEIGHT
/** Compact (diamonds-only) view: a single-line strip, just the axis + interactive diamonds. */
const COMPACT_HEIGHT = 48
/** Pixels-per-day per granularity: the zoom. A wide span in `week` scrolls rather than cramming. */
const PX_PER_DAY: Record<ReleaseTimelineGranularity, number> = {week: 34, month: 9, quarter: 3.5}
/** A little breathing room before the earliest item so its diamond isn't half-clipped at the edge. */
const LEFT_PAD_DAYS: Record<ReleaseTimelineGranularity, number> = {week: 2, month: 5, quarter: 10}
/** Track never renders narrower than this, so a small data span still fills the container. */
const MIN_TRACK_WIDTH = 640
const MS_PER_DAY = 86_400_000

/** Reserve ~one pill-width of time after the latest item so its right-extending label isn't
 * clipped by the track edge (pills anchor at their date and extend rightward). */
function rightPadDays(granularity: ReleaseTimelineGranularity): number {
  return Math.ceil(PILL_WIDTH / PX_PER_DAY[granularity]) + 2
}

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

/**
 * The rendered range: the full span of dated releases, padded, and always including "now" so the
 * Today anchor is reachable. No window-rescale — granularity only changes the zoom, never which
 * releases are in range.
 */
function getRange(
  granularity: ReleaseTimelineGranularity,
  now: Date,
  earliest: Date,
  latest: Date,
): {start: Date; end: Date} {
  const lo = new Date(Math.min(now.getTime(), earliest.getTime()))
  const hi = new Date(Math.max(now.getTime(), latest.getTime()))
  return {
    start: addDays(lo, -LEFT_PAD_DAYS[granularity]),
    end: addDays(hi, rightPadDays(granularity)),
  }
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
 * markers would render closer than `gapPct` (percent of the visible range) apart — pixel-aware:
 * `gapPct` is derived from the actual rendered pill width against the track's pixel width, so it
 * scales with zoom instead of using one fixed percentage.
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
                top: BASELINE_TOP,
                bottom: 0,
                borderLeft: '1px dashed var(--card-border-color)',
                opacity: 0.5,
              }}
            />
            <Text
              size={0}
              muted
              style={{position: 'absolute', left: `calc(${x}% + 4px)`, top: AXIS_LABEL_TOP}}
            >
              {tick.label}
            </Text>
          </Fragment>
        )
      })}
      {/* now marker + label. The label carries its own background so it stays legible where it
          lands on top of a tick label/gridline; rendered after the ticks so it paints over them. */}
      <Box
        data-testid="release-timeline-now-marker"
        style={{
          position: 'absolute',
          left: `${nowX}%`,
          top: BASELINE_TOP,
          height: height - BASELINE_TOP,
          borderLeft: '2px solid var(--card-badge-primary-icon-color)',
          zIndex: 3,
        }}
      />
      <Box
        style={{
          position: 'absolute',
          left: `calc(${nowX}% + 4px)`,
          top: AXIS_LABEL_TOP,
          backgroundColor: 'var(--card-bg-color)',
          borderRadius: 3,
          padding: '0 4px',
          zIndex: 3,
        }}
      >
        <Text size={0} weight="semibold" style={{color: 'var(--card-badge-primary-icon-color)'}}>
          {nowLabel}
        </Text>
      </Box>
    </>
  )
}

/** Card tone: amber for anything needing attention (intended-not-armed, incl. overdue, or a
 * same-day collision), neutral for a cleanly-scheduled release. Overdue is distinguished more
 * quietly — by a red warning icon on the pill, not a wall of red cards. */
function pillTone(entry: DatedRelease, collides: boolean): 'default' | 'caution' {
  if (entry.intendedNotArmed || collides) return 'caution'
  return 'default'
}

/** Solid, saturated fill for a diamond marker so it reads clearly on a white background (a
 * tone-tinted card washes out): blue = cleanly scheduled, amber = intended/collision, red =
 * overdue. */
function markerColor(entry: DatedRelease, collides: boolean): string {
  if (entry.overdue) return 'var(--card-badge-critical-icon-color)'
  if (entry.intendedNotArmed || collides) return 'var(--card-badge-caution-icon-color)'
  return 'var(--card-badge-primary-icon-color)'
}

/** Shared hover-card content for a dated release — used by both the detailed-view pill and the
 * compact-view diamond (which has no visible label of its own). */
function TimelineTooltipContent({
  entry,
  collides,
  toZoned,
}: {
  entry: DatedRelease
  collides: boolean
  toZoned: ToZonedDate
}) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {release, date, overdue} = entry
  const isDraft = isCardinalityOneRelease(release)
  const title = release.metadata?.title || t('release-placeholder.title')
  const documentCount = release.documentsMetadata?.documentCount ?? 0
  return (
    <Box padding={2}>
      <Stack space={2}>
        <Text size={1} weight="semibold">
          {title}
        </Text>
        <Text size={1} muted>
          {zonedFormat(date, toZoned, 'd MMM, HH:mm')}
        </Text>
        <Text size={1} muted>
          {t(documentCount === 1 ? 'summary.document-count_one' : 'summary.document-count_other', {
            count: documentCount,
          })}
        </Text>
        {isDraft && (
          <Text size={1} muted>
            {t('timeline.status-draft')}
          </Text>
        )}
        {overdue && (
          <Text size={1} style={{color: 'var(--card-badge-critical-icon-color)'}}>
            {t('timeline.status-overdue')}
          </Text>
        )}
        {collides && (
          <Text size={1} style={{color: 'var(--card-badge-caution-icon-color)'}}>
            {t('timeline.status-stagger')}
          </Text>
        )}
      </Stack>
    </Box>
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
  const {release, scheduled, intendedNotArmed, overdue} = entry
  const title = release.metadata?.title || t('release-placeholder.title')
  const dateLabel = zonedFormat(entry.date, toZoned, 'd MMM, HH:mm')
  const tone = pillTone(entry, collides)

  return (
    <Tooltip
      content={<TimelineTooltipContent entry={entry} collides={collides} toZoned={toZoned} />}
      portal
    >
      <Card
        data-testid={`release-timeline-pill-${release._id}`}
        data-collides={collides || undefined}
        tone={tone}
        radius={2}
        shadow={1}
        paddingX={2}
        paddingY={2}
        as="button"
        onClick={() => onNavigate(release)}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: lane * LANE_HEIGHT + PILLS_TOP,
          width: PILL_WIDTH,
          maxWidth: PILL_WIDTH,
          textAlign: 'left',
          cursor: 'pointer',
          zIndex: 1,
        }}
      >
        <Flex align="center" gap={2}>
          <Text size={1} muted>
            {intendedNotArmed ? (
              <ToneIcon icon={WarningOutlineIcon} tone={overdue ? 'critical' : 'caution'} />
            ) : (
              <LockIcon data-testid={scheduled ? 'release-timeline-lock-icon' : undefined} />
            )}
          </Text>
          {/* No `overflow: hidden` here — the `Text` handles its own ellipsis; an outer clip box
              was cropping the top of the glyphs. `minWidth: 0` lets the flex item shrink so the
              title truncates instead of pushing past the pill's fixed width. The full title lives
              in the pill-level Tooltip, so there's no native `title` (which would double up). */}
          <Box flex={1} style={{minWidth: 0}}>
            <Text size={1} weight="medium" textOverflow="ellipsis">
              {title}
            </Text>
          </Box>
          <Text size={0} muted style={{whiteSpace: 'nowrap'}}>
            {dateLabel}
          </Text>
        </Flex>
      </Card>
    </Tooltip>
  )
}

/**
 * A state-colored ◇ diamond marking a release's exact position on the time axis. In the detailed
 * view it's a passive anchor (the pill below carries the label + tooltip + click); in the compact
 * (diamonds-only) view it's `interactive` — it carries the tooltip and is clickable to open the
 * release, since there's no pill. Rendered independent of lane-packing (always on the baseline).
 */
function ReleaseTimelineMarker({
  entry,
  x,
  collides,
  interactive,
  toZoned,
  onNavigate,
}: {
  entry: DatedRelease
  x: number
  collides: boolean
  interactive?: boolean
  toZoned?: ToZonedDate
  onNavigate?: (release: TableRelease) => void
}) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const size = interactive ? MARKER_SIZE_COMPACT : MARKER_SIZE
  const diamond = (
    <Card
      data-testid={`release-timeline-marker-${entry.release._id}`}
      data-collides={collides || undefined}
      as={interactive ? 'button' : undefined}
      onClick={interactive && onNavigate ? () => onNavigate(entry.release) : undefined}
      aria-label={
        interactive ? entry.release.metadata?.title || t('release-placeholder.title') : undefined
      }
      style={{
        position: 'absolute',
        left: `${x}%`,
        // Center the diamond on the baseline regardless of its size.
        top: BASELINE_TOP - size / 2,
        width: size,
        height: size,
        transform: 'translateX(-50%) rotate(45deg)',
        backgroundColor: markerColor(entry, collides),
        // A ring in the card background separates overlapping diamonds and lifts them off the axis.
        border: '2px solid var(--card-bg-color)',
        boxShadow: '0 0 0 1px var(--card-border-color)',
        borderRadius: 2,
        // Above the pills so the true-position diamond is never hidden behind a card label.
        zIndex: 2,
        cursor: interactive ? 'pointer' : undefined,
        padding: 0,
      }}
    />
  )
  if (interactive && toZoned) {
    return (
      <Tooltip
        content={<TimelineTooltipContent entry={entry} collides={collides} toZoned={toZoned} />}
        portal
      >
        {diamond}
      </Tooltip>
    )
  }
  return diamond
}

/**
 * A pinned scroll signpost flanking the axis (left = `start`, right = `end`): counts the dated
 * releases currently scrolled off that edge and scrolls the track toward them when clicked.
 * Hidden when nothing is off that edge.
 */
function ScrollSignpost({
  side,
  count,
  onClick,
}: {
  side: 'start' | 'end'
  count: number
  onClick: () => void
}) {
  const {t} = useTranslation(releasesLocaleNamespace)
  if (count === 0) return null
  const icon = side === 'start' ? ChevronLeftIcon : ChevronRightIcon
  const label =
    side === 'start'
      ? t('timeline.overflow-earlier', {count})
      : t('timeline.overflow-later', {count})
  return (
    <Box flex="none" style={{alignSelf: 'center'}}>
      <Button
        data-testid={`release-timeline-overflow-${side}`}
        mode="bleed"
        tone="default"
        icon={side === 'start' ? icon : undefined}
        iconRight={side === 'end' ? icon : undefined}
        text={label}
        onClick={onClick}
        tooltipProps={{
          content: t(side === 'start' ? 'timeline.scroll-earlier' : 'timeline.scroll-later'),
        }}
      />
    </Box>
  )
}

function ReleaseTimelineRoadmap({
  dated,
  granularity,
  density,
  now,
  toZoned,
  onNavigate,
}: {
  dated: DatedRelease[]
  granularity: ReleaseTimelineGranularity
  density: ReleaseTimelineDensity
  now: Date
  toZoned: ToZonedDate
  onNavigate: (release: TableRelease) => void
}) {
  const compact = density === 'compact'
  const {t} = useTranslation(releasesLocaleNamespace)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [overflow, setOverflow] = useState<{left: number; right: number}>({left: 0, right: 0})

  const sorted = useMemo(
    () => [...dated].sort((a, b) => a.date.getTime() - b.date.getTime()),
    [dated],
  )

  const {start, end} = useMemo(
    () => getRange(granularity, now, sorted[0].date, sorted[sorted.length - 1].date),
    [granularity, now, sorted],
  )
  const ticks = useMemo(
    () => getTicks(granularity, start, end, toZoned),
    [granularity, start, end, toZoned],
  )

  const spanDays = (end.getTime() - start.getTime()) / MS_PER_DAY
  const trackWidth = Math.max(MIN_TRACK_WIDTH, Math.round(spanDays * PX_PER_DAY[granularity]))
  const nowPct = xPct(now, start, end)

  const positioned = useMemo(
    () => sorted.map((entry) => ({entry, x: xPct(entry.date, start, end)})),
    [sorted, start, end],
  )
  const gapPct = ((PILL_WIDTH + PILL_GAP_PX) / trackWidth) * 100
  const lanes = useMemo(() => assignLanes(positioned, gapPct), [positioned, gapPct])
  const laneCount = Math.max(1, ...lanes.map((lane) => lane + 1))
  // Compact = a single diamonds-only line; detailed = lane-packed pills below the axis.
  const innerHeight = compact ? COMPACT_HEIGHT : PILLS_TOP + laneCount * LANE_HEIGHT
  const trackHeight = compact ? COMPACT_HEIGHT : TRACK_HEIGHT

  const collisionIds = useMemo(() => {
    const byDay = new Map<string, string[]>()
    sorted.forEach(({release, date}) => {
      const key = zonedDayKey(date, toZoned)
      byDay.set(key, [...(byDay.get(key) || []), release._id])
    })
    const ids = new Set<string>()
    byDay.forEach((ids_) => {
      if (ids_.length > 1) ids_.forEach((id) => ids.add(id))
    })
    return ids
  }, [sorted, toZoned])

  // Count pills scrolled off each edge of the viewport, so the signposts reflect what's currently
  // out of view. Driven by the scroll event (and a deferred pass after each (re)layout).
  const updateOverflow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const total = el.scrollWidth
    if (total === 0) return
    const view0 = el.scrollLeft
    const view1 = el.scrollLeft + el.clientWidth
    let left = 0
    let right = 0
    positioned.forEach(({x}) => {
      const px = (x / 100) * total
      if (px < view0) left += 1
      else if (px > view1) right += 1
    })
    setOverflow({left, right})
  }, [positioned])

  const scrollToNow = useCallback(
    (behavior: ScrollBehavior) => {
      const el = scrollRef.current
      if (!el?.scrollTo) return
      const target = Math.max(0, (nowPct / 100) * el.scrollWidth - el.clientWidth * 0.3)
      el.scrollTo({left: target, behavior})
    },
    [nowPct],
  )

  const pageBy = useCallback((direction: -1 | 1) => {
    const el = scrollRef.current
    if (!el?.scrollBy) return
    el.scrollBy({left: direction * el.clientWidth * 0.8, behavior: 'smooth'})
  }, [])

  // Recenter on now only on first mount and when the zoom changes — NOT on every data update, so
  // a live edit arriving while the user has scrolled elsewhere doesn't yank them back. Overflow is
  // recomputed on any relayout, deferred to the next frame (post-layout) rather than run
  // synchronously in the effect body.
  const didInit = useRef(false)
  const prevGranularity = useRef(granularity)
  useEffect(() => {
    if (!didInit.current || prevGranularity.current !== granularity) {
      scrollToNow('auto')
      didInit.current = true
      prevGranularity.current = granularity
    }
    const raf = requestAnimationFrame(updateOverflow)
    return () => cancelAnimationFrame(raf)
  }, [granularity, scrollToNow, updateOverflow])

  return (
    <Stack space={2}>
      <Flex justify="flex-end">
        <Button
          data-testid="release-timeline-today"
          mode="bleed"
          text={t('timeline.today')}
          onClick={() => scrollToNow('smooth')}
          tooltipProps={{content: t('timeline.today-tooltip')}}
        />
      </Flex>
      <Flex align="stretch" gap={1}>
        <ScrollSignpost side="start" count={overflow.left} onClick={() => pageBy(-1)} />
        <Box
          data-testid="release-timeline-track"
          ref={scrollRef}
          flex={1}
          onScroll={updateOverflow}
          style={{overflowX: 'auto', overflowY: compact ? 'hidden' : 'auto', height: trackHeight}}
        >
          <Box style={{position: 'relative', height: innerHeight, minWidth: trackWidth}}>
            <Axis
              start={start}
              end={end}
              now={now}
              height={innerHeight}
              ticks={ticks}
              nowLabel={t('timeline.now-marker')}
            />
            {/* baseline the diamonds sit on (and pills hang off), so they read as points on a line */}
            <Box
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: BASELINE_TOP,
                borderTop: '2px solid var(--card-border-color)',
              }}
            />
            {positioned.map(({entry, x}) => (
              <ReleaseTimelineMarker
                key={`marker-${entry.release._id}`}
                entry={entry}
                x={x}
                collides={collisionIds.has(entry.release._id)}
                interactive={compact}
                toZoned={compact ? toZoned : undefined}
                onNavigate={compact ? onNavigate : undefined}
              />
            ))}
            {!compact &&
              positioned.map(({entry, x}, i) => (
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
        <ScrollSignpost side="end" count={overflow.right} onClick={() => pageBy(1)} />
      </Flex>
    </Stack>
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
 * releases and scheduled drafts as lane-packed pills on one continuous, horizontally-scrollable
 * time axis, with a Week/Month/Quarter zoom toggle, a "now" marker, and a Today recenter button.
 * Undated releases (no armed or intended date) are excluded — they stay list-only, summarized in
 * the "Unscheduled" chip below the strip. Renders nothing when there is nothing dated to show.
 *
 * @internal
 */
export function ReleaseTimeline({releases}: {releases: TableRelease[]}) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const router = useRouter()
  const {utcToCurrentZoneDate} = useTimeZone(CONTENT_RELEASES_TIME_ZONE_SCOPE)
  const [collapsed, setCollapsed] = useState(false)
  const [granularity, setGranularity] = useState<ReleaseTimelineGranularity>('month')
  const [density, setDensity] = useState<ReleaseTimelineDensity>('detailed')

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
            <Flex gap={3} align="center">
              <Flex gap={1} align="center">
                <Button
                  data-testid="release-timeline-density-compact"
                  mode={density === 'compact' ? 'default' : 'bleed'}
                  tone={density === 'compact' ? 'primary' : 'default'}
                  text={t('timeline.density-compact')}
                  onClick={() => setDensity('compact')}
                  tooltipProps={{content: t('timeline.density-compact-tooltip')}}
                />
                <Button
                  data-testid="release-timeline-density-detailed"
                  mode={density === 'detailed' ? 'default' : 'bleed'}
                  tone={density === 'detailed' ? 'primary' : 'default'}
                  text={t('timeline.density-detailed')}
                  onClick={() => setDensity('detailed')}
                  tooltipProps={{content: t('timeline.density-detailed-tooltip')}}
                />
              </Flex>
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
            </Flex>
          )}
        </Flex>
        {!collapsed && (
          <>
            <ReleaseTimelineRoadmap
              dated={dated}
              granularity={granularity}
              density={density}
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
