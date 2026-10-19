// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit 9748ea43e0, lib/explorations/variants-2-0/mark/VersionsPopover.tsx).
// Only the imports differ from the original (they point at this monorepo and ./types).
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'

import {type AudienceVersion} from './types'
import {VersionsIcon} from './VersionsIcon'
import {PopoverAsList} from './PopoverAsList'
import {type PopoverContent, TimedBody} from './PopoverContents'
import {MorePill, type PillMode, PillModeContext, StatePill} from './StatePill'
import {moreText, versionLines} from './versionLines'

/** Audiences the popover lists before the footer. A first guess, so it is a prop. */
export const POPOVER_AUDIENCES = 5
/** The popover's fixed width, until the width exploration is decided. */
export const POPOVER_WIDTH = 400
/** A width in pixels, or `'fit'`: as wide as the longest line, between 280 and 480. */
export type PopoverWidth = number | 'fit'
export type {PopoverContent}
/**
 * The shell and weight options of the popover pattern exploration. PP2 is the pick (2026-10-19)
 * and the default; PP1, PP3 and PP4 are the rejected options, kept as stories.
 * PP1 floating card, 6px, 8px gap, shadow, no border. PP2 floating card at the row radius (3px),
 * 8px gap, 1px border, light shadow. PP3 flush flyout: touches the pane, 3px on the outer corners,
 * 1px border shared with the pane, no shadow. PP4 tooltip weight: 3px, 8px gap, 1px border, no
 * shadow, compact content (padding 1, no divider lines).
 */
export type PopoverPattern = 'pp1' | 'pp2' | 'pp3' | 'pp4' | 'pl1'
/** Pills a line shows before the "+N" pill. */
const SHOWN_PILLS = 2

const STATE_WORD = {
  published: 'Published',
  draft: 'Draft',
  scheduled: 'Scheduled',
  asap: 'ASAP',
  undecided: 'Undecided',
} as const

/**
 * The popover body: one line per audience (the first `maxAudiences`), each state a pill. With more
 * than two states a line shows two pills and a neutral "+N" pill (named for what it hides); it never
 * wraps or stacks. A scheduled bundle shows by name, such as "Halloween · 31 Oct". The footer is a quiet, non-interactive
 * line with the versions icon and the total count; the way into the pane is the button itself.
 */
export function VersionsPopover(props: {
  versions: readonly AudienceVersion[]
  maxAudiences?: number
  width?: PopoverWidth
  pattern?: PopoverPattern
  /** What the body shows: today's pills, or one of the time options PT1 to PT4. */
  content?: PopoverContent
  /** `a`: flat status labels. `b`: outlined chips that open the inventory scoped to their state. */
  option?: 'a' | 'b'
  /** The last item: opens the version inventory. */
  onOpenInventory?: () => void
  /** Option B: a pill opens the inventory scoped to its audience and state. */
  onPick?: PillMode['onPick']
  /**
   * Option A (v1): the popover only shows. The base document is first, then the audiences by last edit, newest first; the footer is a
   * plain muted "and N more versions" (none when everything fits); no control, flat labels only.
   */
  readOnly?: boolean
  /** PL1: rows open the inventory scoped to their audience (default on; an open question). */
  rowsClickable?: boolean
  testId: string
}) {
  const {versions, maxAudiences = POPOVER_AUDIENCES, width = POPOVER_WIDTH, testId} = props
  const pattern = props.pattern ?? 'pp2'
  const compact = pattern === 'pp4'
  const readOnly = !!props.readOnly
  const mode: PillMode = readOnly
    ? {look: 'label'}
    : {look: props.option === 'b' ? 'chip' : 'label', onPick: props.onPick}
  const linePadding = compact ? '4px 8px' : '9px 12px'
  // The base document is the first line, as "All users (Default)", then each audience.
  const {lines, more} = versionLines(versions, {max: maxAudiences})
  if (pattern === 'pl1') {
    return (
      <PopoverAsList
        clickable={props.rowsClickable}
        groups={lines}
        onOpenInventory={props.onOpenInventory}
        onPick={props.onPick}
        testId={testId}
        total={versions.length}
        width={typeof width === 'number' ? width : POPOVER_WIDTH}
      />
    )
  }
  return (
    <PillModeContext.Provider value={mode}>
      <Card
        border={pattern !== 'pp1'}
        data-testid={testId}
        radius={pattern === 'pp1' ? 3 : 2}
        style={{
          ...(width === 'fit' ? {width: 'fit-content', minWidth: 280, maxWidth: 480} : {width}),
          // Flush to the pane: square where it meets the pane, 3px on the outer corners.
          ...(pattern === 'pp3' ? {borderTopLeftRadius: 0, borderBottomLeftRadius: 0} : {}),
          overflow: 'hidden',
        }}
      >
        {props.content && props.content !== 'pills' ? (
          <TimedBody content={props.content} groups={lines} />
        ) : (
          <Stack>
            {lines.map((line, index) => {
              const shown = line.states.slice(0, SHOWN_PILLS)
              const hidden = line.states.slice(SHOWN_PILLS)
              return (
                <Flex
                  align="center"
                  data-testid="audience-line"
                  gap={4}
                  key={line.audience}
                  style={{
                    padding: linePadding,
                    boxShadow:
                      index && !compact
                        ? 'inset 0 1px 0 var(--card-hairline-soft-color)'
                        : undefined,
                  }}
                >
                  <Box flex={1} style={{minWidth: 0}}>
                    <Text size={1} textOverflow="ellipsis">
                      {line.audience}
                    </Text>
                  </Box>
                  <Flex flex="none" gap={1} justify="flex-end">
                    {shown.map((s, i) => (
                      <StatePill
                        audience={line.audience}
                        key={`${s.state}-${i}`}
                        label={
                          s.state === 'scheduled' && s.release
                            ? [s.release, s.when].filter(Boolean).join(' · ')
                            : undefined
                        }
                        state={s.state}
                      />
                    ))}
                    {hidden.length ? (
                      <MorePill
                        audience={line.audience}
                        hidden={hidden.map((s) =>
                          s.release
                            ? s.state === 'scheduled'
                              ? s.release
                              : `${STATE_WORD[s.state]} (${s.release})`
                            : STATE_WORD[s.state],
                        )}
                      />
                    ) : null}
                  </Flex>
                </Flex>
              )
            })}
          </Stack>
        )}
        {readOnly ? (
          more > 0 ? (
            <Card borderTop={!compact} data-testid="popover-footer" style={{padding: linePadding}}>
              <Text muted size={1}>
                {moreText(more)}
              </Text>
            </Card>
          ) : null
        ) : (
          <Card
            borderTop={!compact}
            data-testid="popover-footer"
            style={{padding: compact ? 2 : 4}}
          >
            {/* The last item is a real button: foreground text, the versions glyph at the left, a chevron
              at the right edge, the Button's own hover fill and focus ring. */}
            <Button
              data-testid="popover-inventory"
              mode="bleed"
              onClick={props.onOpenInventory}
              padding={2}
              style={{cursor: 'pointer'}}
              width="fill"
            >
              <Flex align="center" gap={2}>
                <Text size={1}>
                  <VersionsIcon />
                </Text>
                <Box flex={1}>
                  <Text size={1}>
                    {`See all ${versions.length} ${versions.length === 1 ? 'version' : 'versions'} in inventory`}
                  </Text>
                </Box>
                <Text size={1}>
                  <ChevronRightIcon />
                </Text>
              </Flex>
            </Button>
          </Card>
        )}
      </Card>
    </PillModeContext.Provider>
  )
}
