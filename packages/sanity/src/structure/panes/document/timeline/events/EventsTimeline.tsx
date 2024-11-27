import {Box, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  CommandList,
  type CommandListRenderItemCallback,
  type DocumentGroupEvent,
  type DocumentVariantType,
  isCreateDocumentVersionEvent,
  isEditDocumentVersionEvent,
  LoadingBlock,
  useTranslation,
} from 'sanity'

import {ExpandableTimelineItemButton} from '../expandableTimelineItemButton'
import {ListWrapper, Root} from '../timeline.styled'
import {EventTimelineItem} from './EventTimelineItem'
import {PublishedEventMenu} from './PublishedEventMenu'

interface TimelineProps {
  events: DocumentGroupEvent[]
  hasMoreEvents: boolean | null
  selectedEventId?: string
  onLoadMore: () => void
  onSelect: (event: DocumentGroupEvent) => void
  onExpand: (event: DocumentGroupEvent) => Promise<void>
  /**
   * The list needs a predefined max height for the scroller to work.
   */
  listMaxHeight?: string
  documentVariantType: DocumentVariantType
}

export const TIMELINE_LIST_WRAPPER_ID = 'timeline-list-wrapper'

export const EventsTimeline = ({
  events: allEvents,
  hasMoreEvents,
  selectedEventId,
  onLoadMore,
  onSelect,
  documentVariantType,
  listMaxHeight = 'calc(100vh - 280px)',
  onExpand,
}: TimelineProps) => {
  const [mounted, setMounted] = useState(false)
  const {t} = useTranslation('studio')
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())
  const [expandingParents, setExpandingParents] = useState<Set<string>>(new Set())

  const events = useMemo(() => {
    return allEvents.filter((event) => {
      if (isCreateDocumentVersionEvent(event) && event.parentId) {
        // Check if it's the last event in the list, in that case, we want to show it
        const isLastEvent = allEvents[allEvents.length - 1].id === event.id
        if (isLastEvent) return true
        return expandedParents.has(event.parentId)
      }
      if (isEditDocumentVersionEvent(event) && event.parentId) {
        return expandedParents.has(event.parentId)
      }
      return true
    })
  }, [expandedParents, allEvents])

  const handleExpandParent = useCallback(
    (event: DocumentGroupEvent) => async () => {
      const parentId = event.id

      let isExpanding = false
      setExpandedParents((prev) => {
        const next = new Set(prev)

        if (prev.has(parentId)) next.delete(parentId)
        else {
          isExpanding = true
          next.add(parentId)
        }

        return next
      })
      if (isExpanding) {
        setExpandingParents((prev) => {
          const next = new Set(prev)
          next.add(parentId)
          return next
        })
        await onExpand(event)
        setExpandingParents((prev) => {
          const next = new Set(prev)
          next.delete(parentId)
          return next
        })
      }
    },
    [onExpand, setExpandingParents],
  )

  const handleSelectChunk = useCallback(
    (event: DocumentGroupEvent) => {
      onSelect(event)
    },
    [onSelect],
  )

  const renderOptionsMenu = useCallback(
    (event: DocumentGroupEvent) => {
      if (event.type === 'PublishDocumentVersion' && documentVariantType === 'published') {
        return <PublishedEventMenu event={event} />
      }
      if (
        event.type === 'PublishDocumentVersion' &&
        documentVariantType === 'draft' &&
        event.creationEvent
      ) {
        return (
          <ExpandableTimelineItemButton
            isExpanded={expandedParents.has(event.id)}
            onExpand={handleExpandParent(event)}
          />
        )
      }
      return null
    },
    [documentVariantType, expandedParents, handleExpandParent],
  )

  const renderItem = useCallback<CommandListRenderItemCallback<DocumentGroupEvent[][number]>>(
    (event, {activeIndex}) => {
      const showLoading =
        isCreateDocumentVersionEvent(event) &&
        event.parentId &&
        expandingParents.has(event.parentId)
      const opacity =
        (isEditDocumentVersionEvent(event) || isCreateDocumentVersionEvent(event)) &&
        event.parentId &&
        expandingParents.has(event.parentId)

      return (
        <Box
          paddingBottom={1}
          paddingRight={1}
          key={event.timestamp}
          style={{
            transition: 'opacity 0.2s',
            opacity: opacity ? 0 : 1,
          }}
          paddingLeft={
            (isEditDocumentVersionEvent(event) || isCreateDocumentVersionEvent(event)) &&
            event.parentId
              ? 4
              : 1
          }
        >
          {showLoading && <LoadingBlock />}
          <EventTimelineItem
            event={event}
            isSelected={event.id === selectedEventId}
            onSelect={handleSelectChunk}
            optionsMenu={renderOptionsMenu(event)}
            documentVariantType={documentVariantType}
          />
          {activeIndex === events.length - 1 && hasMoreEvents && <LoadingBlock />}
        </Box>
      )
    },
    [
      expandingParents,
      selectedEventId,
      handleSelectChunk,
      renderOptionsMenu,
      documentVariantType,
      events.length,
      hasMoreEvents,
    ],
  )

  useEffect(() => setMounted(true), [])
  const selectedIndex = events.findIndex((event) => event.id === selectedEventId)

  return (
    <Root
      /**
       * We delay initial rendering if `selectedIndex` is present.
       * This is a _temporary_ workaround to allow the virtual <CommandList>
       * to scroll to a specific index prior to being displayed.
       *
       * Without this, there'll be a noticeable 'flash' where the virtual list
       * will render with its child items at the top and then scroll into position.
       */
      $visible={!selectedIndex || mounted}
      data-ui="timeline"
    >
      {events.length > 0 ? (
        <ListWrapper direction="column" $maxHeight={listMaxHeight} id={TIMELINE_LIST_WRAPPER_ID}>
          <CommandList
            activeItemDataAttr="data-hovered"
            ariaLabel={t('timeline.list.aria-label')}
            autoFocus="list"
            initialIndex={selectedIndex}
            initialScrollAlign="center"
            itemHeight={57}
            items={events}
            onEndReached={onLoadMore}
            onEndReachedIndexOffset={20}
            overscan={5}
            renderItem={renderItem}
            wrapAround={false}
          />
        </ListWrapper>
      ) : (
        <Stack padding={3} space={3}>
          <Text size={1} weight="medium">
            {t('timeline.error.no-document-history-title')}
          </Text>
          <Text muted size={1}>
            {t('timeline.error.no-document-history-description')}
          </Text>
        </Stack>
      )}
    </Root>
  )
}

EventsTimeline.displayName = 'EventsTimeline'
