import {BoundaryElementProvider, Card, Flex, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {
  type Chunk,
  ScrollContainer,
  usePerspective,
  useTimelineSelector,
  useTranslation,
} from 'sanity'
import {styled} from 'styled-components'

import {Timeline} from '../../timeline'
import {TimelineError} from '../../timeline/TimelineError'
import {useDocumentPane} from '../../useDocumentPane'

const Scroller = styled(ScrollContainer)`
  height: 100%;
  overflow: auto;
  position: relative;
  scroll-behavior: smooth;
`

export function HistorySelector({showList}: {showList: boolean}) {
  const {timelineError, setTimelineRange, timelineStore} = useDocumentPane()
  const {selectedReleaseId} = usePerspective()
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null)
  const [listHeight, setListHeight] = useState(0)

  const getScrollerRef = useCallback((el: HTMLDivElement | null) => {
    if (!el?.clientHeight) return
    /**
     * Hacky solution, the list height needs to be defined, it cannot be obtained from the parent using a `max-height: 100%`
     * Because the scroller won't work properly and it won't scroll to the selected element on mount.
     * To fix this, this component will set the list height to the height of the parent element - 1px, to avoid a double scroll line.
     */
    setListHeight(el.clientHeight - 1)
    setScrollRef(el)
  }, [])

  const chunks = useTimelineSelector(timelineStore, (state) => state.chunks)
  const realRevChunk = useTimelineSelector(timelineStore, (state) => state.realRevChunk)
  const hasMoreChunks = useTimelineSelector(timelineStore, (state) => state.hasMoreChunks)
  const loading = useTimelineSelector(timelineStore, (state) => state.isLoading)

  const {t} = useTranslation('studio')
  const toast = useToast()
  const selectRev = useCallback(
    (revChunk: Chunk) => {
      try {
        const [sinceId, revId] = timelineStore?.findRangeForRev(revChunk) || [null, null]
        setTimelineRange(sinceId, revId)
      } catch (err) {
        toast.push({
          closable: true,
          description: err.message,
          status: 'error',
          title: t('timeline.error.unable-to-load-revision'),
        })
      }
    },
    [setTimelineRange, t, timelineStore, toast],
  )

  const handleLoadMore = useCallback(() => {
    // If updated, be sure to update the TimeLineMenu component as well
    if (!loading) {
      timelineStore?.loadMore()
    }
  }, [loading, timelineStore])

  return (
    <Flex data-testid="review-changes-pane" direction="column" height="fill">
      <Card flex={1} padding={2} paddingTop={0}>
        {timelineError || selectedReleaseId ? (
          <TimelineError versionError={Boolean(selectedReleaseId)} />
        ) : (
          <BoundaryElementProvider element={scrollRef}>
            <Scroller data-ui="Scroller" ref={getScrollerRef}>
              {listHeight &&
              // This forces the list to unmount and remount, which is needed to reset the scroll position
              showList ? (
                <Timeline
                  chunks={chunks}
                  hasMoreChunks={hasMoreChunks}
                  lastChunk={realRevChunk}
                  onLoadMore={handleLoadMore}
                  onSelect={selectRev}
                  listMaxHeight={`${listHeight}px`}
                />
              ) : null}
            </Scroller>
          </BoundaryElementProvider>
        )}
      </Card>
    </Flex>
  )
}
