import {Spinner} from '@sanity/ui'
import {motion, type Variants} from 'motion/react'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  CommandList,
  type CommandListRenderItemCallback,
  type DocumentGroupEvent,
  getDocumentVariantType,
  isCreateDocumentVersionEvent,
  isDeleteDocumentVersionEvent,
  isEditDocumentVersionEvent,
  isPublishDocumentVersionEvent,
  LoadingBlock,
  useTranslation,
} from 'sanity'
import {Text, Flex, Box, type Space} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {structureLocaleNamespace} from '../../../../i18n'
import {ExpandableTimelineItemButton} from '../expandableTimelineItemButton'
import {ListWrapper, Root} from '../timeline.styled'
import {EventTimelineItem} from './EventTimelineItem'
import {PublishedEventMenu} from './PublishedEventMenu'
import {
  getAncestorIds,
  getInitialRevealedTransactions,
  getSelectedRowIndex,
  getTimelineRows,
  getTransactionCounts,
  INITIAL_TRANSACTIONS,
  MORE_TRANSACTIONS,
  type TimelineRow,
} from './timelineRows'

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

/** Left padding of a row, by how deep it is nested. */
const DEPTH_PADDING: Space[] = [1, 4, 5]

const TIMELINE_LIST_WRAPPER_ID = 'timeline-list-wrapper'

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
  const {t: tStructure} = useTranslation(structureLocaleNamespace)
  // Expand every event the selected event is nested under, so it is visible.
  const [initialExpansion] = useState(() => {
    const parentIds = getAncestorIds(allEvents, selectedEventId)
    return {
      parentIds,
      editGroups: allEvents.filter(
        (event) =>
          parentIds.includes(event.id) && isEditDocumentVersionEvent(event) && !event.isTransaction,
      ),
    }
  })
  const [expandedParents, setExpandedParents] = useState<Set<string>>(
    () => new Set(initialExpansion.parentIds),
  )
  const [expandingParents, setExpandingParents] = useState<Set<string>>(new Set())
  const [revealedTransactions, setRevealedTransactions] = useState<Map<string, number>>(() =>
    getInitialRevealedTransactions(allEvents, selectedEventId),
  )

  const transactionCounts = useMemo(() => getTransactionCounts(allEvents), [allEvents])
  const rows = useMemo(
    () => getTimelineRows({events: allEvents, expandedParents, revealedTransactions}),
    [allEvents, expandedParents, revealedTransactions],
  )
  const selectedIndex = getSelectedRowIndex(rows, selectedEventId)

  const handleShowMore = useCallback(
    (parentId: string) => () => {
      setRevealedTransactions((prev) => {
        const next = new Map(prev)
        next.set(parentId, (prev.get(parentId) ?? INITIAL_TRANSACTIONS) + MORE_TRANSACTIONS)
        return next
      })
    },
    [],
  )

  useEffect(() => {
    // Edit groups expanded to show the selected transaction are frozen like the ones the user
    // expands, so new edits don't regroup them.
    for (const editGroup of initialExpansion.editGroups) {
      void fetchEventChildren(editGroup)
    }
  }, [fetchEventChildren, initialExpansion])

  const handleExpandParent = useCallback(
    (event: DocumentGroupEvent) => async () => {
      const parentId = event.id
      const isExpanding = !expandedParents.has(parentId)

      setExpandedParents((prev) => {
        const next = new Set(prev)
        if (isExpanding) next.add(parentId)
        else next.delete(parentId)
        return next
      })
      if (!isExpanding) return

      if (isEditDocumentVersionEvent(event)) {
        // The transactions are listed already, expanding only freezes the group.
        void fetchEventChildren(event)
        return
      }
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
    },
    [expandedParents, fetchEventChildren, setExpandingParents],
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
        (isPublishDocumentVersionEvent(event) &&
          documentVariantType === 'draft' &&
          event.creationEvent) ||
        (isDeleteDocumentVersionEvent(event) && event.creationEvent) ||
        // The newest listed transaction shares its id with the group, but has nothing to expand.
        (isEditDocumentVersionEvent(event) &&
          !event.isTransaction &&
          transactionCounts.has(event.id))
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
    [expandedParents, handleExpandParent, transactionCounts],
  )

  const renderItem = useCallback<CommandListRenderItemCallback<TimelineRow>>(
    (row, {activeIndex}) => {
      const paddingLeft = DEPTH_PADDING[Math.min(row.depth, DEPTH_PADDING.length - 1)]
      if (row.type === 'showMore') {
        return (
          <TimelineItemWrapper
            paddingRight={1}
            paddingLeft={paddingLeft}
            animate="animate"
            exit="exit"
            initial="initial"
            variants={CHILDREN_ITEMS_VARIANTS}
          >
            <Flex alignItems="center" style={{height: ITEM_HEIGHT}}>
              <Button
                data-testid="timeline-show-more-button"
                mode="bleed"
                onClick={handleShowMore(row.parentId)}
                text={tStructure('timeline-item.show-more')}
                width="fill"
              />
            </Flex>
          </TimelineItemWrapper>
        )
      }
      const {event} = row
      /**
       * The create version event will be present while expanding (loading the edits), so we are attaching to it the loading block at the top.
       * - publishEvent (expanding?)
       * --- loadingBlock  ~createEvent~
       * */
      const showExpandingLoader =
        isCreateDocumentVersionEvent(event) &&
        event.parentId &&
        expandingParents.has(event.parentId)

      const isLastEvent = activeIndex === rows.length - 1
      if (showExpandingLoader) {
        return (
          <TimelineItemWrapper
            animate={{opacity: 1}}
            initial={{opacity: 0}}
            transition={{duration: 0.2, delay: 0.2}}
          >
            {/* We need this item to match the same height as the rest of the list items, which is 57px */}
            <Flex alignItems="center" justifyContent="center" style={{height: ITEM_HEIGHT}}>
              <Spinner />
            </Flex>
          </TimelineItemWrapper>
        )
      }
      return (
        <TimelineItemWrapper
          key={event.timestamp}
          paddingBottom={1}
          paddingRight={1}
          animate="animate"
          exit="exit"
          initial="initial"
          variants={'parentId' in event ? CHILDREN_ITEMS_VARIANTS : undefined}
          paddingLeft={paddingLeft}
        >
          <EventTimelineItem
            event={event}
            isSelected={activeIndex === selectedIndex}
            onSelect={handleSelectChunk}
            optionsMenu={renderOptionsMenu(event)}
          />

          {isLastEvent && hasMoreEvents && <LoadingBlock />}
        </TimelineItemWrapper>
      )
    },
    [
      expandingParents,
      selectedIndex,
      handleSelectChunk,
      handleShowMore,
      renderOptionsMenu,
      rows.length,
      hasMoreEvents,
      tStructure,
    ],
  )

  // oxlint-disable-next-line react/set-state-in-effect -- pre-existing violation, to be fixed in a follow-up
  useEffect(() => setMounted(true), [])

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
      {rows.length > 0 ? (
        <ListWrapper
          flexDirection="column"
          $maxHeight={listMaxHeight}
          id={TIMELINE_LIST_WRAPPER_ID}
        >
          <CommandList
            activeItemDataAttr="data-hovered"
            ariaLabel={t('timeline.list.aria-label')}
            autoFocus="list"
            initialIndex={selectedIndex}
            initialScrollAlign="center"
            itemHeight={ITEM_HEIGHT}
            items={rows}
            onEndReached={onLoadMore}
            onEndReachedIndexOffset={20}
            overscan={5}
            renderItem={renderItem}
            wrapAround={false}
          />
        </ListWrapper>
      ) : (
        <Flex padding={3} gap={3} flexDirection="column">
          <Text size={1} weight="medium" as="div" trim={true}>
            {t('timeline.error.no-document-history-title')}
          </Text>
          <Text muted size={1} as="div" trim={true}>
            {t('timeline.error.no-document-history-description')}
          </Text>
        </Flex>
      )}
    </Root>
  )
}
