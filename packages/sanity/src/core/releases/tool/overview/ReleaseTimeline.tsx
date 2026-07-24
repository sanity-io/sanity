import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
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

/** Minimum horizontal gap (percent of the visible range) before a marker is bumped to the next lane. */
const MARKER_GAP_PCT = 9
const LANE_HEIGHT = 64
const PILL_WIDTH = 208
const AXIS_HEIGHT_PADDING = 44

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
 * markers would render closer than `MARKER_GAP_PCT` apart (ported from the sandbox's lane packer).
 */
function assignLanes(items: {x: number}[]): number[] {
  const laneLastX: number[] = []
  return items.map(({x}) => {
    let lane = laneLastX.findIndex((lastX) => x - lastX >= MARKER_GAP_PCT)
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
            <Text size={1} weight="medium" textOverflow="ellipsis" style={{flex: 1}}>
              {title}
            </Text>
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
  const {start, end} = useMemo(() => getRange(granularity, now), [granularity, now])
  const ticks = useMemo(
    () => getTicks(granularity, start, end, toZoned),
    [granularity, start, end, toZoned],
  )

  const sorted = useMemo(
    () => [...dated].sort((a, b) => a.date.getTime() - b.date.getTime()),
    [dated],
  )
  const positioned = useMemo(
    () => sorted.map((entry) => ({entry, x: xPct(entry.date, start, end)})),
    [sorted, start, end],
  )
  const lanes = useMemo(() => assignLanes(positioned), [positioned])
  const laneCount = Math.max(1, ...lanes.map((lane) => lane + 1))
  const height = laneCount * LANE_HEIGHT + AXIS_HEIGHT_PADDING

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

  const minWidth = granularity === 'week' ? 900 : granularity === 'quarter' ? 1600 : 1200

  return (
    <Box style={{overflowX: 'auto', overflowY: 'hidden'}}>
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
  )
}

/**
 * A collapsible, read-only timeline strip rendered above the releases `DocumentTable`: dated
 * releases and scheduled drafts as lane-packed pills on a horizontal time axis, with a
 * Week/Month/Quarter granularity toggle and a "now" marker. Undated releases (no armed or
 * intended date) are excluded — they stay list-only. Renders nothing when there is nothing dated
 * to show.
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

  const dated = useMemo<DatedRelease[]>(() => {
    return releases.reduce<DatedRelease[]>((acc, release) => {
      if (release.isDeleted || release.isLoading) return acc
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
          <ReleaseTimelineRoadmap
            dated={dated}
            granularity={granularity}
            now={now}
            toZoned={utcToCurrentZoneDate}
            onNavigate={handleNavigate}
          />
        )}
      </Stack>
    </Card>
  )
}
