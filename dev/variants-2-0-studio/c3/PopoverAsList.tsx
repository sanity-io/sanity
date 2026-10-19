// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit 9748ea43e0, lib/explorations/variants-2-0/mark/PopoverAsList.tsx).
// Only the imports differ from the original (they point at this monorepo and ./types).
import {PreviewCard} from '../../../packages/sanity/src/core/components/previewCard/PreviewCard'
import {ReleaseAvatarIcon} from '../../../packages/sanity/src/core/releases/components/ReleaseAvatar'

import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type ReactNode} from 'react'

import {type AudienceVersion, type State} from './types'
import {VersionsIcon} from './VersionsIcon'
import {type PopoverGroup} from './PopoverContents'
import {PILL_GLYPHS} from './StatePill'
import {useVersionTime} from './time'

/** The list row's height: 8px padding around the 33px media. The popover rows match it. */
export const LIST_ROW_HEIGHT = 49

/**
 * One row as the list draws it: a `PreviewCard` (the theme's hover, pressed and focus), 8px padding,
 * a title and a muted subtitle at 13px, `LIST_ROW_HEIGHT` high. The media slot holds the versions
 * glyph on the last item only.
 */
function Row(props: {
  testId: string
  title: string
  subtitle?: string | null
  media?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  label?: string
}) {
  const clickable = !!props.onClick
  return (
    <PreviewCard
      __unstable_focusRing={clickable}
      aria-label={props.label}
      as={clickable ? 'button' : 'div'}
      data-testid={props.testId}
      onClick={props.onClick}
      radius={2}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        cursor: clickable ? 'pointer' : 'default',
        padding: 8,
        boxSizing: 'border-box',
        minHeight: LIST_ROW_HEIGHT,
      }}
      tone="inherit"
      type={clickable ? 'button' : undefined}
    >
      <Flex align="center" gap={2} style={{minHeight: 33}}>
        {props.media ? (
          <Flex align="center" flex="none" justify="center" style={{width: 33, height: 33}}>
            {props.media}
          </Flex>
        ) : null}
        <Stack flex={1} gap={1} style={{minWidth: 0}}>
          <Text size={1} textOverflow="ellipsis">
            {props.title}
          </Text>
          {props.subtitle ? (
            <Text muted size={1} textOverflow="ellipsis">
              {props.subtitle}
            </Text>
          ) : null}
        </Stack>
        {props.trailing}
      </Flex>
    </PreviewCard>
  )
}

/** The latest event of a line: the version edited or created most recently. */
const latest = (states: readonly AudienceVersion[]) =>
  [...states].sort(
    (a, b) => (a.updatedMinutesAgo ?? Infinity) - (b.updatedMinutesAgo ?? Infinity),
  )[0]

/** The subtitle: the Studio's own status wording of the latest event (a scheduled one names its date). */
function useLatestLine(states: readonly AudienceVersion[]): string | null {
  const v = latest(states)
  const time = useVersionTime(v)
  if (v.state === 'scheduled' && v.when)
    return `Scheduled for ${[v.when, v.at].filter(Boolean).join(' ')}`
  return time
}

/** The states of a line as the list's own dots: disc, ring, clock, bolt, 4px apart. */
function Dots({states}: {states: readonly AudienceVersion[]}) {
  const seen: State[] = []
  for (const s of states) if (!seen.includes(s.state)) seen.push(s.state)
  return (
    <Flex align="center" data-testid="line-dots" flex="none" gap={1}>
      {seen.map((state) => (
        <span data-state={state} data-testid={`dot-${state}`} key={state} style={{display: 'flex'}}>
          <Text size={2}>
            <ReleaseAvatarIcon {...(PILL_GLYPHS[state] as {release: 'drafts'})} />
          </Text>
        </span>
      ))}
    </Flex>
  )
}

function AudienceRow(props: {
  group: PopoverGroup
  onPick?: (pick: {audience: string | null; state: State}) => void
}) {
  const subtitle = useLatestLine(props.group.states)
  const first = latest(props.group.states)
  return (
    <Row
      label={`${props.group.audience}. ${subtitle ?? ''} Open in the version inventory`}
      onClick={
        props.onPick
          ? () => props.onPick?.({audience: props.group.audience, state: first.state})
          : undefined
      }
      subtitle={subtitle}
      testId="audience-line"
      title={props.group.audience}
      trailing={<Dots states={props.group.states} />}
    />
  )
}

/**
 * PL1: the popover as part of the list. A flush flyout (see `VersionMark`) whose rows are list rows:
 * the same 49px height, 8px padding, 13px title and muted subtitle, and 8px between rows, so rows
 * line up with the list's across the join. A row is an audience; its subtitle is the latest event;
 * its states are dots. No pills, nothing that looks like a button. The last item opens the inventory.
 */
export function PopoverAsList(props: {
  groups: readonly PopoverGroup[]
  total: number
  width: number
  testId: string
  /** Rows open the inventory scoped to their audience (an open question: it can be turned off). */
  clickable?: boolean
  onOpenInventory?: () => void
  onPick?: (pick: {audience: string | null; state: State}) => void
}) {
  const {clickable = true} = props
  return (
    <Card
      border
      data-testid={props.testId}
      radius={2}
      style={{
        width: props.width,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        overflow: 'hidden',
      }}
    >
      <Stack gap={2} padding={2}>
        {props.groups.map((group) => (
          <AudienceRow
            group={group}
            key={group.audience}
            onPick={clickable ? props.onPick : undefined}
          />
        ))}
        <Box data-testid="popover-footer">
          <Row
            media={
              <Text size={2}>
                <VersionsIcon />
              </Text>
            }
            onClick={props.onOpenInventory}
            testId="popover-inventory"
            title={`See all ${props.total} ${props.total === 1 ? 'version' : 'versions'} in inventory`}
            trailing={
              <Text size={1}>
                <ChevronRightIcon />
              </Text>
            }
          />
        </Box>
      </Stack>
    </Card>
  )
}
