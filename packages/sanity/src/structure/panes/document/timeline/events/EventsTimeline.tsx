import {Box, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {motion, type Variants} from 'framer-motion'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  CommandList,
  type CommandListRenderItemCallback,
  type DocumentGroupEvent,
  getDocumentVariantType,
  isCreateDocumentVersionEvent,
  isEditDocumentVersionEvent,
  isPublishDocumentVersionEvent,
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
  fetchEventChildren: (event: DocumentGroupEvent) => Promise<void>
  /**
   * The list needs a predefined max height for the scroller to work.
   */
  listMaxHeight?: string
}

const TimelineItemWrapper = motion.create(Box)
const CHILDREN_ITEMS_VARIANTS: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
}

const ITEM_HEIGHT = 57

export const TIMELINE_LIST_WRAPPER_ID = 'timeline-list-wrapper'

export const EventsTimeline = ({
  events: allEvents,
  hasMoreEvents,
  selectedEventId,
  onLoadMore,
  onSelect,
  listMaxHeight = 'calc(100vh - 280px)',
  fetchEventChildren,
}: TimelineProps) => {
  const [mounted, setMounted] = useState(false)
  const {t} = useTranslation('studio')
  const [expandedParents, setExpandedParents] = useState<Set<string>>(() => {
    if (selectedEventId) {
      // Find that event and if it has a parent, expand the parent.
      const selectedEvent = allEvents.find((event) => event.id === selectedEventId)
      if (selectedEvent && 'parentId' in selectedEvent && selectedEvent.parentId) {
        return new Set([selectedEvent.parentId])
      }
    }
    return new Set()
  })
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
        await fetchEventChildren(event)
        setExpandingParents((prev) => {
          const next = new Set(prev)
          next.delete(parentId)
          return next
        })
      }
    },
    [fetchEventChildren, setExpandingParents],
  )

  const handleSelectChunk = useCallback(
    (event: DocumentGroupEvent) => {
      onSelect(event)
    },
    [onSelect],
  )

  const renderOptionsMenu = useCallback(
    (event: DocumentGroupEvent) => {
      const documentVariantType = getDocumentVariantType(event.documentId)
      if (isPublishDocumentVersionEvent(event) && documentVariantType === 'published') {
        return <PublishedEventMenu event={event} />
      }
      if (
        isPublishDocumentVersionEvent(event) &&
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
    [expandedParents, handleExpandParent],
  )

  const renderItem = useCallback<CommandListRenderItemCallback<DocumentGroupEvent[][number]>>(
    (event, {activeIndex}) => {
      /**
       * The create version event will be present while expanding (loading the edits), so we are attaching to it the loading block at the top.
       * - publishEvent (expanding?)
       * --- loadingBlock  ~createEvent~
       * */
      const showExpandingLoader =
        isCreateDocumentVersionEvent(event) &&
        event.parentId &&
        expandingParents.has(event.parentId)

      const isLastEvent = activeIndex === events.length - 1
      if (showExpandingLoader) {
        return (
          <TimelineItemWrapper
            animate={{opacity: 1}}
            initial={{opacity: 0}}
            transition={{duration: 0.2, delay: 0.2}}
          >
            {/* We need this item to match the same height as the rest of the list items, which is 57px */}
            <Flex align="center" justify="center" style={{height: ITEM_HEIGHT}}>
              <Spinner />
            </Flex>
          </TimelineItemWrapper>
        )
      }
      return (
        <TimelineItemWrapper
          paddingBottom={1}
          paddingRight={1}
          key={event.timestamp}
          animate="animate"
          exit="exit"
          initial="initial"
          variants={'parentId' in event ? CHILDREN_ITEMS_VARIANTS : undefined}
          paddingLeft={
            (isEditDocumentVersionEvent(event) || isCreateDocumentVersionEvent(event)) &&
            event.parentId &&
            !isLastEvent
              ? 4
              : 1
          }
        >
          <EventTimelineItem
            event={event}
            isSelected={event.id === selectedEventId}
            onSelect={handleSelectChunk}
            optionsMenu={renderOptionsMenu(event)}
          />

          {isLastEvent && hasMoreEvents && <LoadingBlock />}
        </TimelineItemWrapper>
      )
    },
    [
      expandingParents,
      selectedEventId,
      handleSelectChunk,
      renderOptionsMenu,
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
            itemHeight={ITEM_HEIGHT}
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
