import {BoltIcon} from '@sanity/icons/Bolt'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {ClockIcon} from '@sanity/icons/Clock'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Badge, Box, Button, Card, Flex, Stack, Text, Tooltip} from '@sanity/ui'
import {Fragment, useMemo, useState} from 'react'

import {
  addDays,
  addMonths,
  addWeeks,
  diffCalendarDays,
  fmtDayMonth,
  fmtDayMonthTime,
  fmtISODay,
  fmtMonth,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from './dateUtils'
import {getMockReleases, type MockRelease, type Readiness, type ReleaseType} from './mockReleases'

type Granularity = 'week' | 'month' | 'quarter'

const ROW_HEIGHT = 44
const MARKER_GAP_PCT = 8 // min horizontal gap before bumping a marker to the next lane

// ─── shared helpers ──────────────────────────────────────────────────────────

function getRange(granularity: Granularity, now: Date): {start: Date; end: Date} {
  if (granularity === 'week') return {start: addDays(now, -3), end: addDays(now, 21)}
  if (granularity === 'quarter') return {start: addMonths(now, -1), end: addMonths(now, 5)}
  return {start: addWeeks(now, -2), end: addWeeks(now, 10)} // month
}

function getTicks(granularity: Granularity, start: Date, end: Date): {date: Date; label: string}[] {
  const ticks: {date: Date; label: string}[] = []
  if (granularity === 'week') {
    let cursor = startOfWeek(start)
    while (cursor <= end) {
      if (cursor >= start) ticks.push({date: cursor, label: fmtDayMonth(cursor)})
      cursor = addWeeks(cursor, 1)
    }
  } else {
    let cursor = startOfMonth(start)
    while (cursor <= end) {
      if (cursor >= start) ticks.push({date: cursor, label: fmtMonth(cursor)})
      cursor = addMonths(cursor, 1)
    }
  }
  return ticks
}

function xPct(date: Date, start: Date, end: Date): number {
  const span = end.getTime() - start.getTime()
  const pct = ((date.getTime() - start.getTime()) / span) * 100
  return Math.max(0, Math.min(100, pct))
}

const TYPE_ICON: Record<ReleaseType, typeof BoltIcon> = {
  asap: BoltIcon,
  scheduled: ClockIcon,
  undecided: HelpCircleIcon,
}

function ReadinessDot({readiness}: {readiness: Readiness}) {
  if (readiness === 'error') {
    return (
      <Text size={0}>
        <ErrorOutlineIcon style={{color: 'var(--card-badge-critical-icon-color)'}} />
      </Text>
    )
  }
  if (readiness === 'validating') {
    return (
      <Text size={0} muted>
        <ClockIcon />
      </Text>
    )
  }
  return (
    <Text size={0}>
      <CheckmarkCircleIcon style={{color: 'var(--card-badge-positive-icon-color)'}} />
    </Text>
  )
}

function markerTone(r: MockRelease): 'primary' | 'default' | 'caution' {
  if (r.kind === 'scheduledDraft') return 'primary'
  if (r.type === 'asap') return 'caution'
  return 'default'
}

// assign non-overlapping lanes to date-sorted markers
function assignLanes(items: {r: MockRelease; x: number}[]): number[] {
  const laneLastX: number[] = []
  return items.map(({x}) => {
    let lane = laneLastX.findIndex((lastX) => x - lastX >= MARKER_GAP_PCT)
    if (lane === -1) lane = laneLastX.length
    laneLastX[lane] = x
    return lane
  })
}

function UndatedTray({releases}: {releases: MockRelease[]}) {
  const asap = releases.filter((r) => r.type === 'asap')
  const undecided = releases.filter((r) => r.type === 'undecided')
  if (asap.length === 0 && undecided.length === 0) return null
  return (
    <Flex gap={2} align="center" paddingTop={2}>
      <Text size={1} muted>
        Undated:
      </Text>
      {asap.length > 0 && (
        <Badge tone="caution" fontSize={0}>
          {asap.length} ASAP
        </Badge>
      )}
      {undecided.length > 0 && (
        <Badge tone="default" fontSize={0}>
          {undecided.length} undecided
        </Badge>
      )}
    </Flex>
  )
}

// ─── axis (ticks + now line), shared by roadmap + strip ────────────────────────

function Axis({
  start,
  end,
  now,
  height,
  granularity,
}: {
  start: Date
  end: Date
  now: Date
  height: number
  granularity: Granularity
}) {
  const ticks = useMemo(() => getTicks(granularity, start, end), [granularity, start, end])
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
        now
      </Text>
    </>
  )
}

// ─── Variant A: Roadmap (Gantt-lite) ───────────────────────────────────────────

function VariantRoadmap({
  releases,
  granularity,
  now,
}: {
  releases: MockRelease[]
  granularity: Granularity
  now: Date
}) {
  const {start, end} = getRange(granularity, now)
  const dated = releases
    .filter((r) => r.publishAt)
    .map((r) => ({r, x: xPct(r.publishAt as Date, start, end)}))
    .sort((a, b) => (a.r.publishAt as Date).getTime() - (b.r.publishAt as Date).getTime())
  const lanes = assignLanes(dated)
  const laneCount = Math.max(1, ...lanes.map((l) => l + 1))
  const height = laneCount * ROW_HEIGHT + 24

  // collisions: same calendar day
  const collisionIds = new Set<string>()
  dated.forEach((a, i) =>
    dated.forEach((b, j) => {
      if (i < j && isSameDay(a.r.publishAt as Date, b.r.publishAt as Date)) {
        collisionIds.add(a.r.id)
        collisionIds.add(b.r.id)
      }
    }),
  )

  return (
    <Stack space={3}>
      <Box style={{position: 'relative', height, marginTop: 16}}>
        <Axis start={start} end={end} now={now} height={height} granularity={granularity} />
        {dated.map(({r, x}, i) => {
          const Icon = TYPE_ICON[r.type]
          const collides = collisionIds.has(r.id)
          return (
            <Tooltip
              key={r.id}
              content={
                <Box padding={2}>
                  <Text size={1}>
                    {r.title} · {fmtDayMonthTime(r.publishAt as Date)} · {r.documentCount} docs
                    {collides ? ' · ⚠ same-day collision' : ''}
                  </Text>
                </Box>
              }
              portal
            >
              <Card
                tone={collides ? 'caution' : markerTone(r)}
                radius={2}
                shadow={1}
                padding={2}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: lanes[i] * ROW_HEIGHT + 8,
                  maxWidth: 150,
                  border: collides ? '1px solid var(--card-badge-caution-icon-color)' : undefined,
                }}
              >
                <Flex align="center" gap={2}>
                  <Text size={1}>{collides ? <WarningOutlineIcon /> : <Icon />}</Text>
                  <Text size={1} textOverflow="ellipsis" style={{maxWidth: 84}}>
                    {r.title}
                  </Text>
                  <ReadinessDot readiness={r.readiness} />
                </Flex>
              </Card>
            </Tooltip>
          )
        })}
      </Box>
      <UndatedTray releases={releases} />
    </Stack>
  )
}

// ─── Variant B: Density strip / minimap ────────────────────────────────────────

function VariantStrip({
  releases,
  granularity,
  now,
}: {
  releases: MockRelease[]
  granularity: Granularity
  now: Date
}) {
  const {start, end} = getRange(granularity, now)
  const dated = releases.filter((r) => r.publishAt)
  // group by day for collision dots
  const byDay = new Map<string, MockRelease[]>()
  dated.forEach((r) => {
    const key = fmtISODay(r.publishAt as Date)
    byDay.set(key, [...(byDay.get(key) || []), r])
  })

  return (
    <Stack space={3}>
      <Box style={{position: 'relative', height: 56, marginTop: 16}}>
        <Axis start={start} end={end} now={now} height={56} granularity={granularity} />
        {[...byDay.entries()].map(([key, group]) => {
          const date = group[0].publishAt as Date
          const x = xPct(date, start, end)
          const collides = group.length > 1
          return (
            <Tooltip
              key={key}
              portal
              content={
                <Box padding={2}>
                  <Stack space={2}>
                    <Text size={1} weight="semibold">
                      {fmtDayMonth(date)}
                      {collides ? ` · ${group.length} — ⚠ stagger` : ''}
                    </Text>
                    {group.map((r) => (
                      <Text key={r.id} size={1} muted>
                        {r.title}
                      </Text>
                    ))}
                  </Stack>
                </Box>
              }
            >
              <Box
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: 22,
                  transform: 'translateX(-50%)',
                }}
              >
                <Card
                  radius="full"
                  tone={collides ? 'caution' : 'primary'}
                  style={{
                    width: collides ? 18 : 12,
                    height: collides ? 18 : 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {collides && (
                    <Text size={0} weight="semibold">
                      {group.length}
                    </Text>
                  )}
                </Card>
              </Box>
            </Tooltip>
          )
        })}
      </Box>
      <UndatedTray releases={releases} />
    </Stack>
  )
}

// ─── Variant C: Horizon buckets (kanban-style) ─────────────────────────────────

function VariantHorizon({releases, now}: {releases: MockRelease[]; now: Date}) {
  const buckets: {key: string; label: string; match: (r: MockRelease) => boolean}[] = [
    {key: 'ready', label: 'Ready (ASAP)', match: (r) => r.type === 'asap'},
    {
      key: 'overdue',
      label: 'Overdue',
      match: (r) => !!r.publishAt && diffCalendarDays(r.publishAt, now) < 0,
    },
    {
      key: 'week',
      label: 'This week',
      match: (r) => {
        if (!r.publishAt) return false
        const d = diffCalendarDays(r.publishAt, now)
        return d >= 0 && d <= 7
      },
    },
    {
      key: 'month',
      label: 'This month',
      match: (r) => {
        if (!r.publishAt) return false
        const d = diffCalendarDays(r.publishAt, now)
        return d > 7 && d <= 31
      },
    },
    {
      key: 'later',
      label: 'Later',
      match: (r) => !!r.publishAt && diffCalendarDays(r.publishAt, now) > 31,
    },
    {key: 'undecided', label: 'Undecided', match: (r) => r.type === 'undecided'},
  ]
  const assigned = new Set<string>()
  const columns = buckets.map((b) => {
    const items = releases.filter((r) => !assigned.has(r.id) && b.match(r))
    items.forEach((r) => assigned.add(r.id))
    return {...b, items}
  })

  return (
    <Flex gap={3} style={{overflowX: 'auto'}}>
      {columns.map((col) => (
        <Card
          key={col.key}
          tone="transparent"
          radius={2}
          padding={2}
          style={{minWidth: 190, flex: 1}}
        >
          <Stack space={3}>
            <Flex align="center" justify="space-between">
              <Text size={1} weight="semibold">
                {col.label}
              </Text>
              <Badge fontSize={0} tone="default">
                {col.items.length}
              </Badge>
            </Flex>
            <Stack space={2}>
              {col.items.map((r) => {
                const Icon = TYPE_ICON[r.type]
                return (
                  <Card key={r.id} radius={2} shadow={1} padding={2} tone={markerTone(r)}>
                    <Stack space={2}>
                      <Flex align="center" gap={2}>
                        <Text size={1}>
                          <Icon />
                        </Text>
                        <Text size={1} textOverflow="ellipsis" style={{flex: 1}}>
                          {r.title}
                        </Text>
                        <ReadinessDot readiness={r.readiness} />
                      </Flex>
                      <Flex align="center" gap={2}>
                        {r.publishAt && (
                          <Text size={0} muted>
                            {fmtDayMonth(r.publishAt)}
                          </Text>
                        )}
                        <Text size={0} muted>
                          <DocumentsIcon /> {r.documentCount}
                        </Text>
                        {r.kind === 'scheduledDraft' && (
                          <Badge fontSize={0} tone="primary">
                            draft
                          </Badge>
                        )}
                      </Flex>
                    </Stack>
                  </Card>
                )
              })}
            </Stack>
          </Stack>
        </Card>
      ))}
    </Flex>
  )
}

// ─── the sandbox page ──────────────────────────────────────────────────────────

const GRANULARITIES: Granularity[] = ['week', 'month', 'quarter']

function VariantSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card radius={3} shadow={1} padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={2} weight="semibold">
            {title}
          </Text>
          <Text size={1} muted>
            {description}
          </Text>
        </Stack>
        {children}
      </Stack>
    </Card>
  )
}

export function TimelineSandbox() {
  const [granularity, setGranularity] = useState<Granularity>('month')
  // stable "now" for the session so mock dates don't drift between renders
  const [now] = useState(() => new Date())
  const releases = useMemo(() => getMockReleases(now), [now])

  return (
    <Box padding={4} style={{maxWidth: 1200, margin: '0 auto', overflowY: 'auto', height: '100%'}}>
      <Stack space={5}>
        <Stack space={3}>
          <Text size={3} weight="bold">
            Releases timeline — sandbox
          </Text>
          <Text size={1} muted>
            Three forward-view variants over the same mock data ({releases.length} releases /
            scheduled drafts, with deliberate same-day collisions and mixed readiness). Pick a
            direction; the winner gets wired to real data and promoted into the overview.
          </Text>
          <Flex gap={1} align="center">
            <Text size={1} muted style={{marginRight: 8}}>
              Range:
            </Text>
            {GRANULARITIES.map((g) => (
              <Button
                key={g}
                mode={granularity === g ? 'default' : 'bleed'}
                tone={granularity === g ? 'primary' : 'default'}
                text={g[0].toUpperCase() + g.slice(1)}
                onClick={() => setGranularity(g)}
                padding={2}
                fontSize={1}
              />
            ))}
          </Flex>
        </Stack>

        <VariantSection
          title="A · Roadmap (Gantt-lite)"
          description="Releases as pills positioned by date, lane-packed to avoid overlap; a 'now' line and same-day collision flags. Most spatial — best for seeing the shape of a multi-month plan and spotting clashes."
        >
          <VariantRoadmap releases={releases} granularity={granularity} now={now} />
        </VariantSection>

        <VariantSection
          title="B · Density strip / minimap"
          description="A compact single row of dots by date; clustered days grow and show a count. Lowest-commitment — an orientation strip that could sit above the list without taking much height."
        >
          <VariantStrip releases={releases} granularity={granularity} now={now} />
        </VariantSection>

        <VariantSection
          title="C · Horizon buckets (no time axis)"
          description="Ready / Overdue / This week / This month / Later / Undecided as columns. List-native, no new spatial primitive — familiar, but you lose the true sense of distance between dates. (Ignores the range control.)"
        >
          <VariantHorizon releases={releases} now={now} />
        </VariantSection>
      </Stack>
    </Box>
  )
}
