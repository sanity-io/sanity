import {DocumentBadgeDescription} from '@sanity/base'
import {EditStateFor} from '@sanity/base/_internal'
import {useTimeAgo} from '@sanity/base/hooks'
import {EditIcon} from '@sanity/icons'
import {Box, Flex} from '@sanity/ui'
import React, {useEffect, useMemo, useState, useRef} from 'react'
import {useDocumentHistory} from '../../documentHistory'
import {DocumentBadges} from './documentBadges'
import {useElementRect} from './lib/useElementRect'
import {ReviewChangesButton} from './reviewChangesButton'
import {IconBadge} from './iconBadge'
import {
  BadgesBox,
  MetadataBox,
  ReviewChangesBadgeBox,
  ReviewChangesButtonBox,
} from './documentSparkline.styled'
import {PublishStatus} from './publishStatus'

interface DocumentSparklineProps {
  badges: DocumentBadgeDescription[]
  editState: EditStateFor | null
  lastUpdated: string | undefined | null
}

export function DocumentSparkline(props: DocumentSparklineProps) {
  const {badges, lastUpdated, editState} = props
  const {historyController, timeline} = useDocumentHistory()
  const showingRevision = historyController.onOlderRevision()
  const liveEdit = Boolean(editState?.liveEdit)

  // @todo: make this memoizable
  const timelineSessions = timeline.mapChunks((chunk) => chunk)

  // Find the first unpublish or publish event and use it as the base event if it exists
  const lastUnpublishOrPublishSession = timelineSessions.find(
    (chunk) => chunk.type === 'unpublish' || chunk.type === 'publish'
  )

  const published = lastUnpublishOrPublishSession?.type === 'publish'
  const lastPublished = lastUnpublishOrPublishSession?.endTimestamp

  const lastPublishedTimeAgo = useTimeAgo(lastPublished || '', {
    minimal: true,
    agoSuffix: true,
  })

  const lastUpdatedTimeAgo = useTimeAgo(lastUpdated || '', {minimal: true, agoSuffix: true})

  // Make sure we only show editDraft sessions (and count the unpublish as a draft session)
  const changedSessions = useMemo(() => {
    if (lastUnpublishOrPublishSession) {
      return timelineSessions
        .filter((session) => session.index >= lastUnpublishOrPublishSession.index)
        .filter((session) => session.type === 'editDraft' || session.type === 'unpublish')
    }

    return timelineSessions.filter((session) => session.type === 'editDraft')
  }, [lastUnpublishOrPublishSession, timelineSessions])

  const changed = changedSessions.length > 0

  // Keep track of the size of the review changes button
  const [
    reviewChangesButtonElement,
    setReviewChangesButtonElement,
  ] = useState<HTMLButtonElement | null>(null)
  const reviewChangesButtonElementRect = useElementRect(reviewChangesButtonElement)
  const reviewChangesButtonWidth = reviewChangesButtonElementRect?.width
  const reviewChangesButtonWidthRef = useRef(reviewChangesButtonWidth || 0)

  // Use the size of the review changes button as a element query breakpoint
  const metadataBoxBreakpoints = useMemo(
    () => [reviewChangesButtonWidth || reviewChangesButtonWidthRef.current, 225],
    [reviewChangesButtonWidth]
  )

  const metadataBoxStyle = useMemo(
    () =>
      ({
        '--session-layout-width': reviewChangesButtonWidth
          ? `${reviewChangesButtonWidth}px`
          : undefined,
      } as React.CSSProperties),
    [reviewChangesButtonWidth]
  )

  // Maintain the last known width of the review changes button
  useEffect(() => {
    if (reviewChangesButtonWidth) {
      reviewChangesButtonWidthRef.current = reviewChangesButtonWidth
    }
  }, [reviewChangesButtonWidth])

  return (
    <Flex
      align="center"
      // data-disabled={showingRevision}
      data-ui="DocumentSparkline"
    >
      {/* Publish status */}
      {(liveEdit || published) && (
        <Box marginRight={1}>
          <PublishStatus
            disabled={showingRevision}
            lastPublishedTimeAgo={lastPublishedTimeAgo}
            lastUpdated={lastUpdated}
            lastUpdatedTimeAgo={lastUpdatedTimeAgo}
            liveEdit={liveEdit}
          />
        </Box>
      )}

      {/* Changes and badges */}
      <MetadataBox
        data-changed={changed || liveEdit ? '' : undefined}
        media={metadataBoxBreakpoints}
        style={metadataBoxStyle}
      >
        {!liveEdit && (
          <>
            <ReviewChangesBadgeBox>
              <IconBadge icon={EditIcon} muted tone="caution" />
            </ReviewChangesBadgeBox>

            <ReviewChangesButtonBox>
              <ReviewChangesButton
                disabled={showingRevision}
                lastUpdatedTimeAgo={lastUpdatedTimeAgo}
                ref={setReviewChangesButtonElement}
              />
            </ReviewChangesButtonBox>
          </>
        )}

        <BadgesBox flex={1} marginLeft={3}>
          <DocumentBadges editState={editState} badges={badges} />
        </BadgesBox>
      </MetadataBox>
    </Flex>
  )
}
