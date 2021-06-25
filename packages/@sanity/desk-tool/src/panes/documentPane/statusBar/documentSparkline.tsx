/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/no-multi-comp */
/* eslint-disable react/no-array-index-key */

import React from 'react'
import SyncIcon from 'part:@sanity/base/sync-icon'
import {useSyncState} from '@sanity/react-hooks'
import {useTimeAgo} from '@sanity/base/hooks'
import {Card, Flex, Stack, Text, Button, rem} from '@sanity/ui'
import styled from 'styled-components'
import {PlayIcon, PublishIcon} from '@sanity/icons'
import {ContainerQuery} from 'part:@sanity/components/container-query'
import {useDocumentHistory} from '../documentHistory'
import {formatTimelineEventLabel} from '../timeline/helpers'
import {Badge} from './types'
import {SESSION_BADGE_SIZE, SESSION_BADGE_MARGIN, MAX_SESSIONS} from './constants'
import {DocumentBadges} from './documentBadges'
import {usePrevious} from './hooks'
import {SessionBadge} from './sessionBadge'

const ReviewChangesButton = styled.div`
  --size: ${({theme}) => rem(theme.sanity.avatar.sizes[0].size)};
  ${({theme}) => `
    --draft-bg: ${theme.sanity.color.solid.caution.enabled.bg};
    --draft-fg: ${theme.sanity.color.solid.caution.enabled.fg};
  `}

  @media (hover: hover) {
    &:not([data-disabled='true']):hover {
      ${({theme}) => `
      --card-muted-fg-color: ${theme.sanity.color.button.default.default.enabled.fg};
      --draft-bg: ${theme.sanity.color.button.default.default.enabled.fg};
      --draft-fg: ${theme.sanity.color.button.default.default.enabled.bg};
    `}

      [data-type] [data-badge-icon] {
        display: none;
      }

      [data-type]:last-of-type [data-badge-icon-hover] {
        display: block;
      }
    }
  }

  &[data-transition='in'] {
    transform: translate3d(0px, 0, 0);
  }

  &[data-transition='out'] {
    pointer-events: none;
    transform: translate3d(calc(var(--size) * -3), 0, 0);
    opacity: 0;
  }
`

const SessionBadgesWrapper = styled.div`
  position: relative;
  white-space: nowrap;
  transition: all 0.2s ease-in-out;
  box-sizing: border-box;
  line-height: 1;
  height: ${({theme}) => rem(theme.sanity.avatar.sizes[0].size)};
`

const ResponsiveDocumentBadges = styled.div`
  display: none;
`

const ResponsiveSparkline = styled.div`
  [data-container-min~='small'] ${ResponsiveDocumentBadges} {
    display: block;
  }
`

const SessionLayout = ({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) => (
  <Card padding={1}>
    <Flex align="center">
      {children}
      <Stack space={1} marginX={2}>
        <Text size={0} muted weight="semibold">
          {title}
        </Text>
        {subtitle && (
          <Text size={0} muted>
            {subtitle}
          </Text>
        )}
      </Stack>
    </Flex>
  </Card>
)

interface DocumentSparklineProps {
  badges: Badge[]
  lastUpdated: string | undefined | null
  editState: any
}

export function DocumentSparkline({badges, lastUpdated, editState}: DocumentSparklineProps) {
  const [transitionDirection, setTransitionDirection] = React.useState<'in' | 'out' | ''>('')
  const {open: openHistory, historyController, timeline} = useDocumentHistory()
  const showingRevision = historyController.onOlderRevision()
  const showingChangePanel = historyController.changesPanelActive()
  const syncState = useSyncState(timeline?.publishedId)
  const isLiveDocument = editState?.liveEdit

  const chunks = timeline.mapChunks((chunk) => chunk)
  // Find the first unpublish or publish event and use it as the base event if it exists
  const lastUnpublishOrPublishSession = chunks.find(
    (chunk) => chunk.type === 'unpublish' || chunk.type === 'publish'
  )

  const lastPublishedTimeAgo = useTimeAgo(lastUnpublishOrPublishSession?.endTimestamp || '', {
    minimal: true,
    agoSuffix: true,
  })
  const lastUpdatedTimeAgo = useTimeAgo(lastUpdated || '', {minimal: true, agoSuffix: true})

  // Make sure we only show editDraft sessions (and count the unpublish as a draft session)
  const filteredSessions = lastUnpublishOrPublishSession
    ? chunks.filter(
        (session) =>
          (session.type === 'editDraft' || session.type === 'unpublish') &&
          session.index >= lastUnpublishOrPublishSession.index
      )
    : chunks.filter((session) => session.type === 'editDraft')

  // Track the amount of sessions for the transition to work
  const prevSessionsCount = usePrevious(filteredSessions.length)

  React.useEffect(() => {
    // If we have more sessions than before, transition the changes button in
    if (filteredSessions.length > prevSessionsCount) {
      setTransitionDirection('in')
    }
    // If we have less sessions than before, or if there are no longer any draft sessions
    // transition the changes button out
    if (prevSessionsCount > filteredSessions.length && filteredSessions.length === 0) {
      setTransitionDirection('out')
    }
    // Reset the transition after 0.8s
    const animateTimer = setTimeout(() => {
      setTransitionDirection('')
    }, 800)
    return () => {
      clearTimeout(animateTimer)
    }
  }, [filteredSessions.length, prevSessionsCount])

  // Only show a max number of edit sessions in the sessions button
  const sessionsSliced = filteredSessions.slice(0, MAX_SESSIONS).reverse()

  // To enable transitions with position absolute and translate3d
  // give the session container the correct width based on amount of sessions
  const sessionContainerWidth =
    sessionsSliced.length === 1
      ? SESSION_BADGE_SIZE
      : sessionsSliced.length * SESSION_BADGE_MARGIN + SESSION_BADGE_SIZE - SESSION_BADGE_MARGIN

  // Only show a published session badge if the base event was a publish event
  // and we don't have a live document
  const showPublishedSessionBadge =
    lastUnpublishOrPublishSession?.type === 'publish' && !isLiveDocument

  return (
    <ResponsiveSparkline>
      <ContainerQuery data-disabled={showingRevision}>
        <Flex align="center" wrap="wrap" style={{zIndex: 2}}>
          {(showPublishedSessionBadge || isLiveDocument) && (
            <SessionLayout
              title="Published"
              subtitle={isLiveDocument && lastUpdated ? lastUpdatedTimeAgo : lastPublishedTimeAgo}
            >
              <SessionBadge
                type={isLiveDocument ? 'live' : 'publish'}
                icon={isLiveDocument ? PlayIcon : PublishIcon}
                title={isLiveDocument ? undefined : formatTimelineEventLabel('publish')}
              />
            </SessionLayout>
          )}

          {!isLiveDocument && (
            <Button
              as={ReviewChangesButton}
              mode="ghost"
              padding={2}
              onClick={openHistory}
              type="button"
              disabled={showingRevision || showingChangePanel}
              data-syncing={syncState.isSyncing}
              title="Review changes"
              data-transition={filteredSessions.length === 0 ? 'out' : transitionDirection}
            >
              <Flex align="center">
                <Flex
                  as={SessionBadgesWrapper}
                  wrap="nowrap"
                  style={{minWidth: sessionContainerWidth}}
                >
                  {sessionsSliced.map((session, i) => {
                    const spacing = i * SESSION_BADGE_MARGIN
                    const title = formatTimelineEventLabel(session.type) || session.type
                    const icon = syncState?.isSyncing ? SyncIcon : undefined
                    return (
                      <SessionBadge
                        key={session.index}
                        title={title}
                        type="editDraft" // always use editDraft
                        icon={icon}
                        data-syncing={syncState.isSyncing}
                        data-session-badge
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          transform: `translate3d(${spacing}px, 0, 0)`,
                        }}
                      />
                    )
                  })}
                </Flex>

                <Flex align="center">
                  <Stack space={1} marginX={2}>
                    <Text size={0} muted weight="semibold">
                      Changes
                    </Text>
                    {lastUpdated && (
                      <Text size={0} muted>
                        {lastUpdatedTimeAgo}
                      </Text>
                    )}
                  </Stack>
                </Flex>
              </Flex>
            </Button>
          )}
          <ResponsiveDocumentBadges
            style={{
              // TODO: hacky solution. Should probably be fixed.
              transform:
                filteredSessions.length > 0 ? `translate3d(0, 0, 0)` : `translate3d(-100px, 0, 0)`,
            }}
          >
            <DocumentBadges editState={editState} badges={badges} />
          </ResponsiveDocumentBadges>
        </Flex>
      </ContainerQuery>
    </ResponsiveSparkline>
  )
}
