import {CalendarIcon} from '@sanity/icons/Calendar'
import {ChevronLeftIcon} from '@sanity/icons/ChevronLeft'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {EditIcon} from '@sanity/icons/Edit'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {LockIcon} from '@sanity/icons/Lock'
import {UserIcon} from '@sanity/icons/User'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Badge, Box, Button, Card, Flex, LayerProvider, Stack, Text, Tooltip} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useCallback, useMemo, useRef, useState} from 'react'

/**
 * RECONSTRUCTIONS, not imports.
 *
 * Everything below is built from `@sanity/ui` primitives in this file. None of it imports the
 * branch's components, because they do not exist on this branch and a story cannot import across
 * one. That is the whole reason these are Envisioned rather than Studio-lane stories.
 *
 * What makes them worth more than the usual Envisioned entry is that they are not speculation.
 * Each reconstructs a design that a Sanity team has already argued and built on
 * `releases/overview-redesign`, and each docblock cites the file it came from so a `git show` is
 * a cheap staleness check. If the branch design moves, these pages are wrong and the citation is
 * how you find out.
 *
 * They are still reconstructions. They do not prove the branch's implementation works, cannot
 * catch a regression in it, and will differ from it in detail. Read them as the argument, not
 * as the artifact.
 */

// --- fixture -------------------------------------------------------------------------------

interface TimelineRelease {
  id: string
  title: string
  day: number
  state: 'scheduled' | 'active' | 'published' | 'blocked'
  docs: number
}

/** Day offsets from an arbitrary origin. Fixed integers so the layout is deterministic. */
const RELEASES: TimelineRelease[] = [
  {id: 'r1', title: 'Autumn campaign', day: -26, state: 'published', docs: 42},
  {id: 'r2', title: 'Pricing page refresh', day: -18, state: 'published', docs: 6},
  {id: 'r3', title: 'Docs restructure', day: -14, state: 'published', docs: 118},
  {id: 'r4', title: 'Q3 changelog', day: -3, state: 'active', docs: 9},
  {id: 'r5', title: 'Careers relaunch', day: 0, state: 'active', docs: 23},
  {id: 'r6', title: 'Partner directory', day: 2, state: 'blocked', docs: 51},
  {id: 'r7', title: 'Black Friday', day: 9, state: 'scheduled', docs: 87},
  {id: 'r8', title: 'Security whitepaper', day: 11, state: 'scheduled', docs: 4},
  {id: 'r9', title: 'Winter release notes', day: 24, state: 'scheduled', docs: 31},
  {id: 'r10', title: 'Enterprise tier launch', day: 38, state: 'scheduled', docs: 64},
]

const STATE_TONE = {
  scheduled: 'primary',
  active: 'positive',
  published: 'default',
  blocked: 'critical',
} as const

const PX_PER_DAY = {week: 26, month: 9, quarter: 3.4} as const
type Granularity = keyof typeof PX_PER_DAY

const PILL_WIDTH = 200
const PILL_GAP = 12
const LANE_HEIGHT = 40
const VISIBLE_LANES = 4

/**
 * Lane packing, which is the part of the design worth reproducing faithfully.
 *
 * Pills are a FIXED width regardless of zoom, so at coarse granularity many of them collide on
 * the axis. Rather than let them overlap or shrink, each pill drops to the first lane whose last
 * pill ends before this one begins. Zooming out therefore makes the strip taller, not denser,
 * and no release is ever hidden behind another.
 */
function packLanes(items: TimelineRelease[], pxPerDay: number) {
  const laneEnds: number[] = []
  return items
    .slice()
    .sort((a, b) => a.day - b.day)
    .map((r) => {
      const x = r.day * pxPerDay
      let lane = laneEnds.findIndex((end) => end <= x)
      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(0)
      }
      laneEnds[lane] = x + PILL_WIDTH + PILL_GAP
      return {...r, x, lane}
    })
}

// --- the timeline strip ----------------------------------------------------------------------

function TimelineStrip({density = 'detailed'}: {density?: 'detailed' | 'compact'}) {
  const [granularity, setGranularity] = useState<Granularity>('month')
  const [offscreen, setOffscreen] = useState({left: 0, right: 0})
  const trackRef = useRef<HTMLDivElement | null>(null)

  const pxPerDay = PX_PER_DAY[granularity]
  const placed = useMemo(() => packLanes(RELEASES, pxPerDay), [pxPerDay])
  const minX = Math.min(...placed.map((p) => p.x)) - 60
  const width = Math.max(...placed.map((p) => p.x)) - minX + PILL_WIDTH + 60
  const laneCount = Math.max(...placed.map((p) => p.lane)) + 1

  /**
   * The edge signposts. They count how many releases are scrolled off each side and offer to
   * scroll toward them, which is the affordance that makes a single continuous strip navigable
   * without the window-rescale the branch's docblock explicitly rejected as disorienting.
   */
  const measure = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const l = el.scrollLeft
    const r = l + el.clientWidth
    setOffscreen({
      left: placed.filter((p) => p.x - minX + PILL_WIDTH < l).length,
      right: placed.filter((p) => p.x - minX > r).length,
    })
  }, [placed, minX])

  const scrollBy = (dir: -1 | 1) =>
    trackRef.current?.scrollBy({left: dir * 320, behavior: 'smooth'})
  const today = () =>
    trackRef.current?.scrollTo({left: -minX - trackRef.current.clientWidth / 3, behavior: 'smooth'})

  const trackHeight = 36 + (density === 'compact' ? LANE_HEIGHT : VISIBLE_LANES * LANE_HEIGHT)

  return (
    // Tooltip portals, and the global decorators supply ThemeProvider but not LayerProvider.
    <LayerProvider>
      <Card border radius={2} padding={0} style={{width: 860, overflow: 'hidden'}}>
        <Flex
          align="center"
          justify="space-between"
          padding={2}
          style={{borderBottom: '1px solid var(--card-border-color)'}}
        >
          <Flex align="center" gap={1}>
            <Button
              mode="bleed"
              icon={ChevronLeftIcon}
              text={offscreen.left ? String(offscreen.left) : undefined}
              fontSize={0}
              padding={2}
              disabled={!offscreen.left}
              onClick={() => scrollBy(-1)}
            />
            <Button mode="ghost" text="Today" fontSize={0} padding={2} onClick={today} />
            <Button
              mode="bleed"
              icon={ChevronRightIcon}
              text={offscreen.right ? String(offscreen.right) : undefined}
              fontSize={0}
              padding={2}
              disabled={!offscreen.right}
              onClick={() => scrollBy(1)}
            />
          </Flex>
          <SegmentedSwitch
            options={['week', 'month', 'quarter']}
            value={granularity}
            onChange={(v) => setGranularity(v as Granularity)}
          />
        </Flex>

        <div
          ref={trackRef}
          onScroll={measure}
          style={{
            position: 'relative',
            overflowX: 'auto',
            overflowY: 'hidden',
            height: trackHeight,
          }}
        >
          <div style={{position: 'relative', width, height: trackHeight}}>
            {/* the axis baseline */}
            <div
              style={{
                position: 'absolute',
                top: 24,
                left: 0,
                right: 0,
                height: 1,
                background: 'var(--card-border-color)',
              }}
            />
            {/* now marker */}
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: -minX,
                width: 2,
                height: trackHeight - 12,
                background: 'var(--card-focus-ring-color, #2276fc)',
                opacity: 0.5,
              }}
            />
            {placed.map((p) => {
              const left = p.x - minX
              if (density === 'compact') {
                return (
                  <Tooltip
                    key={p.id}
                    content={
                      <Box padding={2}>
                        <Text size={0}>{p.title}</Text>
                      </Box>
                    }
                    portal
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 18,
                        left,
                        width: 14,
                        height: 14,
                        transform: 'rotate(45deg)',
                        borderRadius: 2,
                        background: 'var(--card-muted-fg-color)',
                        opacity: 0.75,
                        cursor: 'pointer',
                      }}
                    />
                  </Tooltip>
                )
              }
              return (
                <div
                  key={p.id}
                  style={{
                    position: 'absolute',
                    top: 36 + p.lane * LANE_HEIGHT,
                    left,
                    width: PILL_WIDTH,
                  }}
                >
                  <Card border radius={2} padding={2} tone={STATE_TONE[p.state]}>
                    <Flex align="center" gap={2}>
                      {p.state === 'blocked' && (
                        <Text size={0}>
                          <WarningOutlineIcon />
                        </Text>
                      )}
                      {p.state === 'published' && (
                        <Text size={0}>
                          <LockIcon />
                        </Text>
                      )}
                      <Box flex={1} style={{minWidth: 0}}>
                        <Text size={0} weight="medium" textOverflow="ellipsis">
                          {p.title}
                        </Text>
                      </Box>
                      <Text size={0} muted>
                        {p.docs}
                      </Text>
                    </Flex>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
        <Flex padding={2} gap={2} style={{borderTop: '1px solid var(--card-border-color)'}}>
          <Text size={0} muted>
            {laneCount} lane{laneCount === 1 ? '' : 's'} · {RELEASES.length} releases · zoom:{' '}
            {granularity}
          </Text>
        </Flex>
      </Card>
    </LayerProvider>
  )
}

// --- the segmented control -------------------------------------------------------------------

function SegmentedSwitch({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Card border radius={2} padding={1}>
      <Flex gap={1}>
        {options.map((o) => (
          <Button
            key={o}
            mode={o === value ? 'ghost' : 'bleed'}
            text={o}
            fontSize={0}
            padding={2}
            onClick={() => onChange(o)}
          />
        ))}
      </Flex>
    </Card>
  )
}

function LooseButtons({options, value}: {options: string[]; value: string}) {
  return (
    <Flex gap={2}>
      {options.map((o) => (
        <Button
          key={o}
          mode={o === value ? 'default' : 'ghost'}
          text={o}
          fontSize={0}
          padding={2}
        />
      ))}
    </Flex>
  )
}

// --- the properties panel ---------------------------------------------------------------------

interface Row {
  icon?: React.ReactNode
  label: string
  value: React.ReactNode
}

function PropertiesPanel({sections}: {sections: {title?: string; rows: Row[]}[]}) {
  return (
    <Card border radius={2} padding={3} style={{maxWidth: 380}}>
      <Stack gap={4}>
        {sections.map((s) => (
          <Stack key={s.title ?? 'x'} gap={3}>
            {s.title && (
              <Text size={0} weight="medium" muted>
                {s.title}
              </Text>
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto max-content 1fr',
                columnGap: 10,
                rowGap: 8,
                alignItems: 'baseline',
              }}
            >
              {s.rows.map((r) => (
                <Fragment3 key={r.label} row={r} />
              ))}
            </div>
          </Stack>
        ))}
      </Stack>
    </Card>
  )
}

/** One `[glyph] [label] [value]` triple, contributing three cells to the parent grid. */
function Fragment3({row}: {row: Row}) {
  return (
    <>
      <Text size={0} muted>
        {row.icon ?? ''}
      </Text>
      <Text size={1} muted>
        {row.label}
      </Text>
      <Text size={1} textOverflow="ellipsis">
        {row.value}
      </Text>
    </>
  )
}

function ChippedPanel({sections}: {sections: {title?: string; rows: Row[]}[]}) {
  return (
    <Card border radius={2} padding={3} style={{maxWidth: 380}}>
      <Stack gap={4}>
        {sections.map((s) => (
          <Stack key={s.title ?? 'y'} gap={3}>
            {s.title && (
              <Text size={0} weight="medium" muted>
                {s.title}
              </Text>
            )}
            {s.rows.map((r) => (
              <Flex key={r.label} align="center" gap={2} wrap="wrap">
                <Text size={1} muted>
                  {r.label}
                </Text>
                <Badge tone="primary" fontSize={0}>
                  {r.value}
                </Badge>
              </Flex>
            ))}
          </Stack>
        ))}
      </Stack>
    </Card>
  )
}

const PANEL_SECTIONS = [
  {
    title: 'Schedule',
    rows: [
      {icon: <CalendarIcon />, label: 'Publishes', value: '12 Aug 2026, 09:00 CEST'},
      {icon: <CalendarIcon />, label: 'Created', value: '4 Jul 2026'},
    ],
  },
  {
    title: 'People',
    rows: [
      {icon: <UserIcon />, label: 'Created by', value: 'Ada Okonkwo'},
      {icon: <UserIcon />, label: 'Contributors', value: 'Bo Lindqvist, Mira Haddad'},
    ],
  },
  {
    title: 'Contents',
    rows: [
      {label: 'Documents', value: '87'},
      {
        label: 'Validation',
        value: (
          <span style={{color: 'var(--card-badge-critical-fg-color, #d33)'}}>1 blocking error</span>
        ),
      },
    ],
  },
]

// --- the action rail ---------------------------------------------------------------------------

function ActionRail({alwaysVisibleEdit}: {alwaysVisibleEdit: boolean}) {
  return (
    <Card border radius={2} padding={3} style={{width: 620}}>
      <Flex align="center" justify="space-between" gap={3}>
        <Stack gap={2} flex={1}>
          <Flex align="center" gap={2}>
            <Text size={2} weight="semibold">
              Black Friday
            </Text>
            {!alwaysVisibleEdit && (
              <Text size={0} muted>
                (pencil appears on hover)
              </Text>
            )}
          </Flex>
          <Text size={0} muted>
            Scheduled for 28 Nov 2026 · 87 documents
          </Text>
        </Stack>
        <Flex align="center" gap={2}>
          {alwaysVisibleEdit && (
            <Button mode="ghost" icon={EditIcon} padding={2} aria-label="Edit details" />
          )}
          <Button mode="default" tone="primary" text="Schedule" padding={2} fontSize={1} />
          <Button
            mode="bleed"
            icon={EllipsisHorizontalIcon}
            padding={2}
            aria-label="More actions"
          />
        </Flex>
      </Flex>
    </Card>
  )
}

// --- meta ---------------------------------------------------------------------------------------

const BRANCH = '`releases/overview-redesign`'

const meta: Meta = {
  title: 'Envisioned/Releases Overview Redesign',
  parameters: {
    docs: {
      description: {
        component: [
          'A story cannot import across branches, so everything here is rebuilt from ' +
            '`@sanity/ui` primitives rather than imported from the design it documents. What ' +
            'makes these worth more than the usual speculation is that they are not speculation: ' +
            'each reconstructs a design a Sanity team has already argued and built.',
          '',
          '| | |',
          '|---|---|',
          '| Anchor | `Releases/*`, the overview and detail screens these would replace, storied throughout that chapter as they stand on `main` |',
          `| Evidence | unlike the rest of this lane, these are not arguments being made here. Each one reconstructs a design a Sanity team has already argued and built on ${BRANCH}, whose own docblocks state the reasoning quoted below. That branch adds 25 source files and is 101 commits behind \`main\` as of 2026-07-26 |`,
          '| Patterns | `bulk-actions` · `draft-publish-lifecycle` |',
          '',
          'These pages show the argument, not the artifact. They do not prove the branch ' +
            'implementation works, cannot catch a regression in it, and will differ from it in ' +
            'detail. When the work merges, these should be deleted and replaced by real ' +
            'Studio-lane stories importing the real components.',
          '',
          'Each docblock cites the exact file on the branch, so a `git show` against that path is ' +
            'a cheap staleness check. If the design moves, these pages are wrong and the citation ' +
            'is how you find out. That is the same discipline ledger #61 taught: when a story ' +
            'asserts something it cannot demonstrate, name the file that would prove it.',
          '',
          'The options for doing this properly, and why it is not done yet, are in ' +
            '`docs/workspace/storybook-briefs/wip-stories-plan-PARKED-2026-07-26.md`.',
          '',
          '> **Why it matters:** a story imports its component by path, and that path resolves ' +
            'against the checked-out branch. These components exist only on the feature branch, ' +
            'so the catalog cannot import them, one artifact cannot track many branches. ' +
            'Everything here is rebuilt from `@sanity/ui` primitives in the story file.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'variant:envisioned',
    'chapter:beyond',
    'chapter:cms',
    'pattern:bulk-actions',
    'pattern:draft-publish-lifecycle',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

export const Timeline: Story = {
  name: 'A continuous release timeline',
  parameters: {
    docs: {
      description: {
        story: [
          'Reconstructs `core/releases/tool/overview/ReleaseTimeline.tsx` (836 lines, the ' +
            'largest new component on the branch).',
          '',
          'A single continuous, horizontally scrollable strip spanning every dated release. ' +
            'Drag it, change the zoom, press Today.',
          '',
          'The interesting decision is one they rejected. The branch docblock records that the ' +
            'strip deliberately does *not* rescale its window to fit the current selection, ' +
            '"which was disorienting, the axis jumped and there was no anchor". Instead the axis ' +
            'is fixed and continuous, granularity changes the zoom rather than the range, and a ' +
            'Today button re-anchors. That is a design choice made against a tried alternative, ' +
            'which is the most useful kind to record.',
          '',
          'Lane packing is the other idea, and it is reproduced faithfully here. Pills are a ' +
            'fixed width at every zoom, so at coarse granularity they collide. Rather than ' +
            'overlap or shrink them, each drops to the first lane whose previous pill has ended. ' +
            'Zoom out to `quarter` and watch the strip grow taller rather than denser: no release ' +
            'is ever hidden behind another, at any zoom. Height is fixed and the track scrolls, ' +
            'so the surrounding page never reflows.',
          '',
          'The edge signposts count releases scrolled off each side and scroll toward them. ' +
            'They are what make one long strip navigable without a rescale, and they are why the ' +
            'rejected alternative was not needed.',
        ].join('\n'),
      },
    },
  },
  render: () => <TimelineStrip />,
}

export const TimelineCompact: Story = {
  name: 'The timeline at compact density',
  parameters: {
    docs: {
      description: {
        story: [
          "Reconstructs the same file's `density: 'compact'` mode.",
          '',
          'The same data as a single-line diamond axis, each marker carrying the hover label. Ten releases in one lane instead of four.',
          '',
          'The branch keeps the marker size identical across both densities specifically so there is **no size-shift when switching**. That is a small decision with a large effect: a density toggle that also resizes its targets makes the switch feel like a different screen rather than the same one at a different resolution.',
          '',
          'Worth having as its own page because density toggles are usually storied only in their default state, and the interesting question about them is what survives the switch.',
        ].join('\n'),
      },
    },
  },
  render: () => <TimelineStrip density="compact" />,
}

export const OneSwitch: Story = {
  name: 'One switch, not a run of buttons',
  parameters: {
    docs: {
      description: {
        story: [
          'Reconstructs `core/releases/tool/overview/SegmentedControl.tsx`.',
          '',
          'The branch extracted the cardinality picker into a general segmented control so that, in its own words, "every mutually-exclusive control on the page (kind, timeline zoom, lifecycle) reads as the same cohesive switch rather than a run of loose buttons".',
          '',
          'Both rows below are the same three options and the same selected value. The difference is entirely whether the group has a boundary.',
          '',
          'The argument is about what the control claims. Loose buttons read as three independent actions: nothing in the shape says that picking one un-picks the others. A bordered group with one ghost and two bleed says "exactly one of these is true" before any label is read. On a page carrying three such controls, the shared shape also says they are the same *kind* of control, which is the part that only pays off at page scale.',
          '',
          'Storied because this is the cheapest idea on the branch and the most portable: it is not about releases at all.',
        ].join('\n'),
      },
    },
  },
  render: function Switches() {
    const [a, setA] = useState('month')
    return (
      <Stack gap={4} style={{maxWidth: 520}}>
        <Stack gap={2}>
          <Text size={0} muted>
            as shipped: a run of loose buttons
          </Text>
          <LooseButtons options={['week', 'month', 'quarter']} value={a} />
        </Stack>
        <Stack gap={2}>
          <Text size={0} muted>
            the branch: one bordered switch
          </Text>
          <Flex>
            <SegmentedSwitch options={['week', 'month', 'quarter']} value={a} onChange={setA} />
          </Flex>
        </Stack>
      </Stack>
    )
  },
}

export const Properties: Story = {
  name: 'Properties as an aligned grid, not chips',
  parameters: {
    docs: {
      description: {
        story: [
          'Reconstructs `core/components/detailLayout/DetailPropertiesPanel.tsx`.',
          '',
          'The same six facts, twice. On the left as the branch renders them: an aligned `[glyph] [label] [value]` grid where values are **single-line text and semantic colour carries the meaning**. On the right as chips.',
          '',
          'Scan the left column of each. The grid gives every label the same start position, so the eye reads down one edge and the values line up against it. Chips put each value in its own box, and the boxes are different widths, so there is no column to scan and every row has to be read individually. The grid is doing the work a table does, without being a table.',
          '',
          'Note where this file lives: `core/components/detailLayout/`, not `core/releases/`. Its docblock says it is "shared by the Releases and Variant-definition detail pages so both read as one family". That placement is a claim: this is meant to be a generic detail-screen vocabulary, the first in the studio. If it holds through merge it belongs in the decomposition map as a shared tier. If it drifts release-specific first, that is worth catching while it is still cheap to move.',
          '',
          'The panel truncates overflowing values with a tooltip rather than wrapping, which is what keeps the grid a grid at narrow widths.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <Flex gap={4} wrap="wrap">
      <Stack gap={2}>
        <Text size={0} muted>
          the branch: aligned grid, semantic colour
        </Text>
        <PropertiesPanel sections={PANEL_SECTIONS} />
      </Stack>
      <Stack gap={2}>
        <Text size={0} muted>
          the same facts as chips
        </Text>
        <ChippedPanel sections={PANEL_SECTIONS} />
      </Stack>
    </Flex>
  ),
}

export const Rail: Story = {
  name: 'Edit as a standing affordance',
  parameters: {
    docs: {
      description: {
        story: [
          'Reconstructs `core/releases/tool/detail/ReleaseActionRail.tsx` (gated behind `beta.variants` on the branch).',
          '',
          'A top-of-page rail carrying an icon-only Edit details, the state-driven primary action, and an overflow menu. It replaces the bottom footer action cluster, which the branch drops.',
          '',
          'The argued point is where Edit lives. The docblock is explicit that it is "a defined, always-visible affordance (not an inline hover pencil, not buried in the overflow), which is more discoverable and keyboard-accessible".',
          '',
          'Both are shown below. The lower one has the affordance only on hover, which is the pattern the branch is rejecting: a hover pencil is invisible to anyone who has not already guessed it is there, unreachable by keyboard without a focus-visible equivalent, and absent entirely on touch. The cost of making it standing is one always-present icon button.',
          '',
          'The same reasoning also moved the action cluster from the footer to the top, which matters more than it sounds: a footer cluster on a scrolling detail page is off-screen exactly when the page is long enough to need it.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      <Stack gap={2}>
        <Text size={0} muted>
          the branch: Edit is always there
        </Text>
        <ActionRail alwaysVisibleEdit />
      </Stack>
      <Stack gap={2}>
        <Text size={0} muted>
          the pattern it rejects: Edit on hover only
        </Text>
        <ActionRail alwaysVisibleEdit={false} />
      </Stack>
    </Stack>
  ),
}
