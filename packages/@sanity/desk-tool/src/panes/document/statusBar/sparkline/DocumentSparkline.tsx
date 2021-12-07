import {EditIcon} from '@sanity/icons'
import {Box, Flex, useElementRect} from '@sanity/ui'
import React, {useEffect, useMemo, useState, useRef, memo} from 'react'
import {ElementContainerQuery} from '@sanity/base/components'
import {raf2} from '../../../../utils/raf'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentBadges} from './DocumentBadges'
import {ReviewChangesButton} from './ReviewChangesButton'
import {IconBadge} from './IconBadge'
import {
  BadgesBox,
  MetadataBox,
  ReviewChangesBadgeBox,
  ReviewChangesButtonBox,
} from './DocumentSparkline.styled'
import {PublishStatus} from './PublishStatus'

export const DocumentSparkline = memo(function DocumentSparkline() {
  const {editState, historyController, value} = useDocumentPane()
  const lastUpdated = value?._updatedAt
  const lastPublished = editState?.published?._updatedAt
  const showingRevision = historyController.onOlderRevision()
  const liveEdit = Boolean(editState?.liveEdit)
  const published = Boolean(editState?.published)
  const changed = Boolean(editState?.draft)
  const loaded = published || changed

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

  // Only transition between subsequent state, not the initial
  const [transition, setTransition] = useState(false)
  useEffect(() => {
    if (!transition && loaded) {
      // NOTE: the reason for double RAF here is a common "bug" in browsers.
      // See: https://stackoverflow.com/questions/44145740/how-does-double-requestanimationframe-work
      // There is no need to cancel this animation,
      // since calling it again will cause the same result (transition=true).
      return raf2(() => setTransition(true))
    }

    return undefined
  }, [loaded, transition])

  const [shouldCollapseChange, setShowCollapseChange] = useState(false)
  const [shouldCollapsePublish, setShowCollapsePublish] = useState(false)

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

  const publishStatus = useMemo(
    () =>
      (liveEdit || published) && (
        <Box marginRight={1}>
          <PublishStatus
            disabled={showingRevision}
            lastPublished={lastPublished}
            lastUpdated={lastUpdated}
            liveEdit={liveEdit}
            collapseText={shouldCollapsePublish}
          />
        </Box>
      ),
    [lastPublished, lastUpdated, liveEdit, published, showingRevision, shouldCollapsePublish]
  )

  const metadata = useMemo(
    () => (
      <MetadataBox
        data-changed={changed || liveEdit ? '' : undefined}
        data-transition={transition ? '' : undefined}
        media={metadataBoxBreakpoints}
        style={metadataBoxStyle}
      >
        {!liveEdit && changed && (
          <>
            <ReviewChangesBadgeBox>
              <IconBadge icon={EditIcon} muted tone="caution" />
            </ReviewChangesBadgeBox>

            <ReviewChangesButtonBox>
              <ReviewChangesButton
                disabled={showingRevision}
                lastUpdated={lastUpdated}
                ref={setReviewChangesButtonElement}
                collapseText={shouldCollapseChange}
              />
            </ReviewChangesButtonBox>
          </>
        )}

        <BadgesBox flex={1} marginLeft={3}>
          <DocumentBadges />
        </BadgesBox>
      </MetadataBox>
    ),
    [
      changed,
      lastUpdated,
      liveEdit,
      metadataBoxBreakpoints,
      metadataBoxStyle,
      showingRevision,
      transition,
      shouldCollapseChange,
    ]
  )

  return (
    <ElementContainerQuery>
      {({width}) => {
        setShowCollapseChange(width < 200)
        setShowCollapsePublish(width < 160)

        return (
          <Flex align="center" data-ui="DocumentSparkline">
            {publishStatus}
            {metadata}
          </Flex>
        )
      }}
    </ElementContainerQuery>
  )
})
