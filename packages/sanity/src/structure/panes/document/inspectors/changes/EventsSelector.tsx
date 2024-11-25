import {BoundaryElementProvider, Card, Flex, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {type DocumentGroupEvent, LoadingBlock, ScrollContainer, useTranslation} from 'sanity'
import {useDocumentPane} from 'sanity/structure'
import {styled} from 'styled-components'

import {useEvents} from '../../HistoryProvider'
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
  const getScrollerRef = useCallback((el: HTMLDivElement | null) => {
    /**
     * Hacky solution, the list height needs to be defined, it cannot be obtained from the parent using a `max-height: 100%`
     * Because the scroller won't work properly and it won't scroll to the selected element on mount.
     * To fix this, this component will set the list height to the height of the parent element - 1px, to avoid a double scroll line.
     */
    setListHeight(el?.clientHeight ? el.clientHeight - 1 : 0)
    setScrollRef(el)
  }, [])
  const {events, nextCursor, loading, error, revision, documentVariantType} = useEvents()

  const {t} = useTranslation('studio')
  const toast = useToast()

  const selectRev = useCallback(
    (event: DocumentGroupEvent) => {
      try {
        if (
          event.type === 'DeleteDocumentVersion' ||
          event.type === 'DeleteDocumentGroup' ||
          event.type === 'UnpublishDocument' ||
          event.type === 'ScheduleDocumentVersion' ||
          event.type === 'UnscheduleDocumentVersion'
        ) {
          console.error('Event is not selectable')
          return
        }
        setTimelineRange(null, event.id)
      } catch (err) {
        toast.push({
          closable: true,
          description: err.message,
          status: 'error',
          title: t('timeline.error.unable-to-load-revision'),
        })
      }
    },
    [t, toast, setTimelineRange],
  )

  const handleLoadMore = useCallback(() => {
    // If updated, be sure to update the TimeLineMenu component as well
    if (!loading) {
      // timelineStore.loadMore()
    }
  }, [loading])

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
              !loading ? (
                <EventsTimeline
                  events={events}
                  hasMoreEvents={Boolean(nextCursor)}
                  selectedEventId={revision?.revisionId}
                  onLoadMore={handleLoadMore}
                  onSelect={selectRev}
                  listMaxHeight={`${listHeight}px`}
                  documentVariantType={documentVariantType}
                />
              ) : (
                <LoadingBlock />
              )}
            </Scroller>
          </BoundaryElementProvider>
        )}
      </Card>
    </Flex>
  )
}
