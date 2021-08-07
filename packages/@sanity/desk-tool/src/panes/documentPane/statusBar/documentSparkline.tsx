// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {useSyncState} from '@sanity/react-hooks'
import {DocumentBadgeDescription} from '@sanity/base'
import {useTimeAgo} from '@sanity/base/hooks'
import {EditStateFor} from '@sanity/base/lib/datastores/document/document-pair/editState'
import {EditIcon, PlayIcon, PublishIcon, RestoreIcon} from '@sanity/icons'
import {Box, ElementQuery, Flex, Stack, Text, Button} from '@sanity/ui'
import SyncIcon from 'part:@sanity/base/sync-icon'
import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import {useDocumentHistory} from '../documentHistory'
import {formatTimelineEventLabel} from '../timeline/helpers'
import {MAX_SESSIONS} from './constants'
import {DocumentBadges} from './documentBadges'
import {usePrevious} from './hooks'
import {SessionBadge} from './sessionBadge'

const ReviewChangesButton = styled(Button)`
  transition: opacity 200ms;

  &[data-transition='out'] {
    pointer-events: none;
    opacity: 0;
  }
`

const MetadataBox = styled(ElementQuery)`
  --session-layout-width: 92px;

  transition: transform 200ms;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;

  &[data-transition='in'] {
    transform: translate3d(0, 0, 0);
  }

  &[data-transition='out'] {
    transform: translate3d(calc(0px - var(--session-layout-width) - 12px), 0, 0);
  }

  /* Transition a smaller distance on smaller screens */
  &[data-eq-max~='0'] {
    --session-layout-width: 25px;
  }
`

const BadgesBox = styled(Box)`
  line-height: 0;

  /* Hide on small screens */
  [data-eq-max~='1'] > & {
    display: none;
  }
`

const ReviewChangesBadgeBox = styled.div`
  display: none;
  transition: opacity 100ms;

  [data-transition='out'] > & {
    pointer-events: none;
    opacity: 0;
  }

  /* Show on small screens */
  [data-eq-max~='0'] > & {
    display: block;
  }
`

const ReviewChangesButtonBox = styled(Box)`
  width: var(--session-layout-width);

  /* Hide on small screens */
  [data-eq-max~='0'] > & {
    display: none;
  }
`

const BadgeStack = styled.div`
  display: flex;

  & > div:not(:first-child) {
    margin-left: -18px;
  }
`

const SessionLayoutBox = styled(Flex)`
  white-space: nowrap;
  width: var(--session-layout-width);
`

const SessionLayoutBadgeBox = styled.div`
  margin: -3px;
  min-width: 0;
`

const SessionLayout = ({
  badge,
  subtitle,
  title,
}: {
  badge: React.ReactNode
  subtitle?: React.ReactNode
  title: React.ReactNode
}) => (
  <SessionLayoutBox align="center" data-ui="SessionLayout" padding={2} sizing="border">
    <SessionLayoutBadgeBox>{badge}</SessionLayoutBadgeBox>

    <Stack flex={1} marginLeft={2} space={1}>
      <Text muted size={0} weight="semibold">
        {title}
      </Text>
      {subtitle && (
        <Text muted size={0}>
          {subtitle}
        </Text>
      )}
    </Stack>
  </SessionLayoutBox>
)

interface DocumentSparklineProps {
  badges: DocumentBadgeDescription[]
  editState: EditStateFor | null
  lastUpdated: string | undefined | null
}

const ELEMENT_QUERY_MEDIA = [92, 225]

// eslint-disable-next-line complexity
export function DocumentSparkline({badges, lastUpdated, editState}: DocumentSparklineProps) {
  const [transitionDirection, setTransitionDirection] = useState<'in' | 'out' | ''>('')
  const {open: openHistory, historyController, timeline} = useDocumentHistory()
  const showingRevision = historyController.onOlderRevision()
  const showingChangePanel = historyController.changesPanelActive()
  const syncState = useSyncState(timeline?.publishedId)
  const isLiveDocument = editState?.liveEdit
  const timelineChunks = timeline.mapChunks((chunk) => chunk)

  // Find the first unpublish or publish event and use it as the base event if it exists
  const lastUnpublishOrPublishSession = timelineChunks.find(
    (chunk) => chunk.type === 'unpublish' || chunk.type === 'publish'
  )

  const lastPublishedTimeAgo = useTimeAgo(lastUnpublishOrPublishSession?.endTimestamp || '', {
    minimal: true,
    agoSuffix: true,
  })

  const lastUpdatedTimeAgo = useTimeAgo(lastUpdated || '', {minimal: true, agoSuffix: true})

  // Make sure we only show editDraft sessions (and count the unpublish as a draft session)
  const filteredSessions = lastUnpublishOrPublishSession
    ? timelineChunks.filter(
        (session) =>
          (session.type === 'editDraft' || session.type === 'unpublish') &&
          session.index >= lastUnpublishOrPublishSession.index
      )
    : timelineChunks.filter((session) => session.type === 'editDraft')

  // Track the amount of sessions for the transition to work
  const prevSessionsCount = usePrevious(filteredSessions.length) ?? -1

  useEffect(() => {
    // If we have more sessions than before, transition the changes button in
    if (filteredSessions.length > prevSessionsCount) {
      setTransitionDirection('in')
    }

    // If we have less sessions than before, or if there are no longer any draft sessions
    // transition the changes button out
    if (prevSessionsCount > filteredSessions.length && filteredSessions.length === 0) {
      setTransitionDirection('out')
    }
  }, [filteredSessions.length, prevSessionsCount])

  // Only show a max number of edit sessions in the sessions button
  const sessionsSliced = filteredSessions.slice(0, MAX_SESSIONS).reverse()

  // Only show a published session badge if the base event was a publish event
  // and we don't have a live document
  const showPublishedSessionBadge =
    lastUnpublishOrPublishSession?.type === 'publish' && !isLiveDocument

  const transition = filteredSessions.length === 0 ? 'out' : transitionDirection

  return (
    <div data-disabled={showingRevision} data-ui="DocumentSparkline">
      <Flex align="center">
        {(showPublishedSessionBadge || isLiveDocument) && (
          <Box paddingRight={1}>
            <SessionLayout
              badge={
                <SessionBadge
                  icon={isLiveDocument ? PlayIcon : PublishIcon}
                  title={isLiveDocument ? undefined : formatTimelineEventLabel('publish')}
                  tone={isLiveDocument ? 'critical' : 'positive'}
                />
              }
              subtitle={isLiveDocument && lastUpdated ? lastUpdatedTimeAgo : lastPublishedTimeAgo}
              title="Published"
            />
          </Box>
        )}

        <MetadataBox data-transition={transition} media={ELEMENT_QUERY_MEDIA}>
          {!isLiveDocument && (
            <>
              <ReviewChangesBadgeBox>
                <SessionBadge icon={EditIcon} tone="caution" />
              </ReviewChangesBadgeBox>

              <ReviewChangesButtonBox>
                <ReviewChangesButton
                  disabled={showingRevision}
                  data-syncing={syncState.isSyncing}
                  data-transition={transition}
                  mode="ghost"
                  onClick={openHistory}
                  padding={0}
                  selected={showingChangePanel}
                  title="Review changes"
                  tone="caution"
                  type="button"
                >
                  {/* NO CHANGES */}
                  {sessionsSliced.length === 0 && (
                    <SessionLayout
                      badge={
                        <SessionBadge icon={EditIcon} iconHover={RestoreIcon} tone="caution" />
                      }
                      subtitle={<>&nbsp;</>}
                      title="Changes"
                    />
                  )}

                  {/* THERE ARE CHANGES */}
                  {sessionsSliced.length > 0 && (
                    <SessionLayout
                      badge={
                        <BadgeStack>
                          {sessionsSliced.map((session) => {
                            const title = formatTimelineEventLabel(session.type) || session.type

                            return (
                              <SessionBadge
                                data-syncing={syncState.isSyncing}
                                data-session-badge
                                icon={syncState?.isSyncing ? SyncIcon : EditIcon}
                                iconHover={syncState?.isSyncing ? undefined : RestoreIcon}
                                key={session.index}
                                title={title}
                                tone="caution"
                              />
                            )
                          })}
                        </BadgeStack>
                      }
                      subtitle={lastUpdatedTimeAgo}
                      title="Changes"
                    />
                  )}
                </ReviewChangesButton>
              </ReviewChangesButtonBox>
            </>
          )}

          <BadgesBox data-ui="BadgesBox" flex={1} paddingX={3}>
            <DocumentBadges editState={editState} badges={badges} />
          </BadgesBox>
        </MetadataBox>
      </Flex>
    </div>
  )
}
