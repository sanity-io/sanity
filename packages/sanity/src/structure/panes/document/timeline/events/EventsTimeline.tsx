import {Box, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {
  CommandList,
  type CommandListRenderItemCallback,
  type DocumentGroupEvent,
  type DocumentVariantType,
  LoadingBlock,
  useTranslation,
} from 'sanity'

import {ListWrapper, Root} from '../timeline.styled'
import {EventTimelineItem} from './EventTimelineItem'
import {PublishedEventMenu} from './PublishedEventMenu'

interface TimelineProps {
  events: DocumentGroupEvent[]
  hasMoreEvents: boolean | null
  selectedEventId?: string
  onLoadMore: () => void
  onSelect: (event: DocumentGroupEvent) => void
  /**
   * The list needs a predefined max height for the scroller to work.
   */
  listMaxHeight?: string
  documentVariantType: DocumentVariantType
}

export const TIMELINE_LIST_WRAPPER_ID = 'timeline-list-wrapper'

export const EventsTimeline = ({
  events,
  hasMoreEvents,
  selectedEventId,
  onLoadMore,
  onSelect,
  documentVariantType,
  listMaxHeight = 'calc(100vh - 280px)',
}: TimelineProps) => {
  const [mounted, setMounted] = useState(false)
  const {t} = useTranslation('studio')
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())

  const handleExpandParent = useCallback(
    (parentId: string) => () =>
      setExpandedParents((prev) => {
        const next = new Set(prev)

        if (prev.has(parentId)) next.delete(parentId)
        else next.add(parentId)

        return next
      }),
    [],
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
      return null
    },
    [documentVariantType],
  )

  const renderItem = useCallback<CommandListRenderItemCallback<DocumentGroupEvent[][number]>>(
    (event, {activeIndex}) => {
      return (
        <Box
          paddingBottom={1}
          paddingRight={1}
          paddingLeft={1}
          key={event.timestamp}
          // paddingLeft={isNonPublishChunk(event) && event.parentId ? 4 : 1}
        >
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
      events.length,
      handleSelectChunk,
      hasMoreEvents,
      selectedEventId,
      renderOptionsMenu,
      documentVariantType,
    ],
  )

  useEffect(() => setMounted(true), [])
  const selectedIndex = 0
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
