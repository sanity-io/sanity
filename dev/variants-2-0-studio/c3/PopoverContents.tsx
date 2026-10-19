// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit ef8bd9ec7f, lib/explorations/variants-2-0/mark/PopoverContents.tsx).
// Changes from the original: imports point at this monorepo and ./types; nothing else, except where marked "LIVE:".
import {ReleaseAvatar} from '../../../packages/sanity/src/core/releases/components/ReleaseAvatar'
import {Tooltip} from '../../../packages/sanity/src/ui-components/tooltip/Tooltip'

import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {Fragment} from 'react'

import {
  titleStack,
  updatedAtText,
  versionStatusItem,
} from '../../../packages/sanity/src/core/components/documentStatus/DocumentVersionsStatus.css'
import {type AudienceVersion, type State} from './types'
import {MorePill, StatePill} from './StatePill'
import {VersionTime} from './time'

/** The content options of the time and edited exploration. `pills` is today's design. */
export type PopoverContent = 'pills' | 'pt1' | 'pt2' | 'pt3' | 'pt4'

export interface PopoverGroup {
  audience: string
  states: AudienceVersion[]
}

const STATE_WORD: Record<State, string> = {
  published: 'Published',
  draft: 'Draft',
  scheduled: 'Scheduled',
  asap: 'ASAP',
  undecided: 'Undecided',
}

/** The name of a state: a release is named, as the Studio names a release version. */
const stateName = (v: AudienceVersion) =>
  v.release && (v.state === 'scheduled' || v.state === 'asap' || v.state === 'undecided') ? v.release : STATE_WORD[v.state]

/** A pill's label: a scheduled bundle shows its name and date. */
const pillLabel = (v: AudienceVersion) =>
  v.state === 'scheduled' && v.release ? [v.release, v.when].filter(Boolean).join(' · ') : undefined

/** What the neutral "+N" pill names for the states it hides. */
const hiddenName = (v: AudienceVersion) =>
  v.release
    ? v.state === 'scheduled'
      ? v.release
      : `${STATE_WORD[v.state]} (${v.release})`
    : STATE_WORD[v.state]

const SHOWN_PILLS = 2

/** Today's pills: at most two, then the neutral "+N". */
function Pills({
  states,
  tooltip,
  audience,
}: {
  states: AudienceVersion[]
  tooltip?: boolean
  audience?: string | null
}) {
  const shown = states.slice(0, SHOWN_PILLS)
  const hidden = states.slice(SHOWN_PILLS)
  return (
    <Flex flex="none" gap={1} justify="flex-end">
      {shown.map((s, i) =>
        tooltip ? (
          <VersionTime key={`${s.state}-${i}`} version={s}>
            {(time) => (
              // PT3: the time is in a tooltip on the pill, so the pill takes the pointer.
              <Tooltip content={time ?? undefined} disabled={!time} portal>
                <span style={{display: 'inline-flex'}}>
                  <StatePill audience={audience} hoverable label={pillLabel(s)} state={s.state} />
                </span>
              </Tooltip>
            )}
          </VersionTime>
        ) : (
          <StatePill
            audience={audience}
            key={`${s.state}-${i}`}
            label={pillLabel(s)}
            state={s.state}
          />
        ),
      )}
      {hidden.length ? <MorePill audience={audience} hidden={hidden.map(hiddenName)} /> : null}
    </Flex>
  )
}

const padding = '9px 12px'
const divider = 'inset 0 1px 0 var(--card-hairline-soft-color)'

/** The glyph of a state, as the Studio's status list draws it on the right of an item. */
function StateAvatar({state}: {state: State}) {
  return state === 'published' ? (
    <ReleaseAvatar fontSize={2} padding={0} release="published" size="small" />
  ) : state === 'draft' ? (
    <ReleaseAvatar fontSize={2} padding={0} release="drafts" size="small" />
  ) : (
    <ReleaseAvatar
      fontSize={2}
      padding={0}
      releaseType={state === 'scheduled' ? 'scheduled' : 'asap'}
      size="small"
    />
  )
}

/** PT1: the Studio's own status list. Two lines per version, a glyph on the right, a divider between groups. */
function PT1({groups}: {groups: PopoverGroup[]}) {
  return (
    <Stack gap={1} padding={1}>
      {groups.map((group, index) => (
        <Card
          borderBottom={index < groups.length - 1}
          data-testid="audience-line"
          key={group.audience}
          paddingBottom={index < groups.length - 1 ? 1 : 0}
        >
          {group.states.map((v, i) => (
            <VersionTime key={`${v.state}-${i}`} version={v}>
              {(time) => (
                <Box className={versionStatusItem} data-testid="status-item" paddingX={2}>
                  <Flex gap={2} justify="space-between" paddingY={2}>
                    <Stack className={titleStack} gap={2}>
                      <Text size={1} weight="medium">
                        {`${group.audience} · ${stateName(v)}`}
                      </Text>
                      {time ? (
                        <Text className={updatedAtText} muted size={1}>
                          {time}
                        </Text>
                      ) : null}
                    </Stack>
                    <Box paddingRight={2}>
                      <StateAvatar state={v.state} />
                    </Box>
                  </Flex>
                </Box>
              )}
            </VersionTime>
          ))}
        </Card>
      ))}
    </Stack>
  )
}

/** PT2: one two-line row per audience: the name, the verbs and times under it, the pills on the right. */
function PT2({groups}: {groups: PopoverGroup[]}) {
  return (
    <Stack>
      {groups.map((group, index) => (
        <Flex
          align="center"
          data-testid="audience-line"
          gap={4}
          key={group.audience}
          style={{padding, boxShadow: index ? divider : undefined}}
        >
          <Stack flex={1} gap={2} style={{minWidth: 0}}>
            <Text size={1} textOverflow="ellipsis" weight="medium">
              {group.audience}
            </Text>
            <Text muted size={1} textOverflow="ellipsis">
              {group.states.map((v, i) => (
                <Fragment key={`${v.state}-${i}`}>
                  {i ? ' · ' : null}
                  <VersionTime version={v}>{(time) => time ?? stateName(v)}</VersionTime>
                </Fragment>
              ))}
            </Text>
          </Stack>
          <Pills audience={group.audience} states={group.states} />
        </Flex>
      ))}
    </Stack>
  )
}

/** PT3: today's pill rows, with the time in a tooltip on each pill. */
function PT3({groups}: {groups: PopoverGroup[]}) {
  return (
    <Stack>
      {groups.map((group, index) => (
        <Flex
          align="center"
          data-testid="audience-line"
          gap={4}
          key={group.audience}
          style={{padding, boxShadow: index ? divider : undefined}}
        >
          <Box flex={1} style={{minWidth: 0}}>
            <Text size={1} textOverflow="ellipsis">
              {group.audience}
            </Text>
          </Box>
          <Pills audience={group.audience} states={group.states} tooltip />
        </Flex>
      ))}
    </Stack>
  )
}

/** PT4: a header per audience, then one line per state: the pill on the left, the time on the right. */
function PT4({groups}: {groups: PopoverGroup[]}) {
  return (
    <Stack>
      {groups.map((group, index) => (
        <Stack
          data-testid="audience-line"
          gap={2}
          key={group.audience}
          style={{padding: '8px 12px', boxShadow: index ? divider : undefined}}
        >
          <Text muted size={1} textOverflow="ellipsis" weight="medium">
            {group.audience}
          </Text>
          {group.states.map((v, i) => (
            <Flex align="center" gap={3} justify="space-between" key={`${v.state}-${i}`}>
              <StatePill audience={group.audience} label={pillLabel(v)} state={v.state} />
              <VersionTime version={v}>
                {(time) =>
                  time ? (
                    <Text muted size={1} style={{whiteSpace: 'nowrap'}}>
                      {time}
                    </Text>
                  ) : null
                }
              </VersionTime>
            </Flex>
          ))}
        </Stack>
      ))}
    </Stack>
  )
}

/** The body of the popover for the time and edited options. */
export function TimedBody({
  content,
  groups,
}: {
  content: Exclude<PopoverContent, 'pills'>
  groups: PopoverGroup[]
}) {
  return content === 'pt1' ? (
    <PT1 groups={groups} />
  ) : content === 'pt2' ? (
    <PT2 groups={groups} />
  ) : content === 'pt3' ? (
    <PT3 groups={groups} />
  ) : (
    <PT4 groups={groups} />
  )
}
