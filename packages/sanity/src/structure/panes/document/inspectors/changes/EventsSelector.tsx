import {BoundaryElementProvider, Card, Flex, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {
  type DocumentGroupEvent,
  isDeleteDocumentGroupEvent,
  isDeleteDocumentVersionEvent,
  isScheduleDocumentVersionEvent,
  isUnpublishDocumentEvent,
  isUnscheduleDocumentVersionEvent,
  LoadingBlock,
  ScrollContainer,
  useEvents,
  useTranslation,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'
import {styled} from 'styled-components'

import {EventsTimeline} from '../../timeline/events/EventsTimeline'
import {TimelineError} from '../../timeline/TimelineError'

const Scroller = styled(ScrollContainer)`
  height: 100%;
  overflow: auto;
  position: relative;
  scroll-behavior: smooth;
`

export function EventsSelector({showList}: {showList: boolean}) {
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null)
  const [listHeight, setListHeight] = useState(0)
  const {setTimelineRange} = useDocumentPane()
  const getScrollerRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (!listHeight && el) {
        /**
         * Hacky solution, the list height needs to be defined, it cannot be obtained from the parent using a `max-height: 100%`
         * Because the scroller won't work properly and it won't scroll to the selected element on mount.
         * To fix this, this component will set the list height to the height of the parent element - 1px, to avoid a double scroll line.
         */
        setListHeight(el.clientHeight ? el.clientHeight - 1 : 0)
        setScrollRef(el)
      }
    },
    [listHeight],
  )
  const {
    events,
    nextCursor,
    loading,
    error,
    revision,
    loadMoreEvents,
    findRangeForRevision,
    expandEvent,
  } = useEvents()

  const {t} = useTranslation('studio')
  const toast = useToast()

  const selectRev = useCallback(
    (event: DocumentGroupEvent) => {
      try {
        if (
          isDeleteDocumentVersionEvent(event) ||
          isDeleteDocumentGroupEvent(event) ||
          isUnpublishDocumentEvent(event) ||
          isScheduleDocumentVersionEvent(event) ||
          isUnscheduleDocumentVersionEvent(event)
        ) {
          console.error('Event is not selectable')
          return
        }
        const [since, rev] = findRangeForRevision(event.id)
        setTimelineRange(since, rev)
      } catch (err) {
        toast.push({
          closable: true,
          description: err.message,
          status: 'error',
          title: t('timeline.error.unable-to-load-revision'),
        })
      }
    },
    [t, toast, setTimelineRange, findRangeForRevision],
  )

  const initialLoad = loading && !events.length
  return (
    <Flex data-testid="review-changes-pane" direction="column" height="fill">
      <Card flex={1} padding={2} paddingTop={0}>
        {error ? (
          <TimelineError />
        ) : (
          <BoundaryElementProvider element={scrollRef}>
            <Scroller data-ui="Scroller" ref={getScrollerRef}>
              {listHeight &&
              // This forces the list to unmount and remount, which is needed to reset the scroll position
              showList &&
              !initialLoad ? (
                <EventsTimeline
                  events={events}
                  fetchEventChildren={expandEvent}
                  hasMoreEvents={Boolean(nextCursor)}
                  // If we have a revision, we select it, otherwise we select the first event
                  selectedEventId={revision?.revisionId || events[0]?.id}
                  onLoadMore={loadMoreEvents}
                  onSelect={selectRev}
                  listMaxHeight={`${listHeight}px`}
                />
              ) : null}
              {loading && <LoadingBlock />}
            </Scroller>
          </BoundaryElementProvider>
        )}
      </Card>
    </Flex>
  )
}
