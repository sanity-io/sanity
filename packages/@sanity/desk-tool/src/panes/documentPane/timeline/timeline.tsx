/* eslint-disable react/prop-types */
import React, {useCallback, forwardRef, useRef} from 'react'
import {format} from 'date-fns'
import {Chunk} from '@sanity/field/diff'
import {Timeline as TimelineModel} from '../documentHistory/history/timeline'
import VisibilityContainer from './visibilityContainer'

import styles from './timeline.css'

interface TimelineProps {
  timeline: TimelineModel
  onSelect: (chunk: Chunk) => void
  onLoadMore: (state: boolean) => void

  /** Are the chunks above the topSelection enabled? */
  disabledBeforeSelection?: boolean
  /** The first chunk of the selection. */
  topSelection: Chunk
  /** The final chunk of the selection. */
  bottomSelection: Chunk
}

export function sinceTimelineProps(since: Chunk, rev: Chunk) {
  return {
    topSelection: rev,
    bottomSelection: since,
    disabledBeforeSelection: true
  }
}

export function revTimelineProps(rev: Chunk) {
  return {
    topSelection: rev,
    bottomSelection: rev
  }
}

export const Timeline = forwardRef<HTMLDivElement, TimelineProps>(
  (
    {timeline, disabledBeforeSelection, topSelection, bottomSelection, onSelect, onLoadMore},
    ref
  ) => {
    const visibilityContainerRef = useRef<VisibilityContainer | null>(null)

    const handleScroll = useCallback(() => {
      visibilityContainerRef.current?.recalculate()
    }, [visibilityContainerRef.current])

    let state: ItemState = disabledBeforeSelection ? 'disabled' : 'enabled'

    return (
      <div className={styles.root} ref={ref} onScroll={handleScroll}>
        {timeline.mapChunks(chunk => {
          if (topSelection === chunk) {
            state = 'withinSelection'
          }

          if (bottomSelection === chunk) {
            state = 'selected'
          }

          const item = (
            <TimelineItem
              key={chunk.id}
              chunk={chunk}
              state={state}
              onSelect={onSelect}
              title={chunk.id}
              type={chunk.type}
              timestamp={chunk.endTimestamp}
            />
          )

          // Flip it back to normal after we've rendered the active one.
          if (state === 'selected') {
            state = 'enabled'
          }

          return item
        })}

        {!timeline.reachedEarliestEntry && (
          <VisibilityContainer ref={visibilityContainerRef} padding={20} setVisibility={onLoadMore}>
            <div>Loading...</div>
          </VisibilityContainer>
        )}
      </div>
    )
  }
)

Timeline.displayName = 'Timeline'

type ItemState = 'enabled' | 'disabled' | 'withinSelection' | 'selected'

function TimelineItem(props: {
  state: ItemState
  title: string
  onSelect: (chunk: Chunk) => void
  chunk: Chunk
  timestamp: Date
  type: string
}) {
  const {state, onSelect, timestamp, chunk, title, type} = props

  const handleClick = useCallback(
    (evt: React.MouseEvent<HTMLDivElement>) => {
      evt.preventDefault()
      evt.stopPropagation()
      onSelect(chunk)
    },
    [onSelect, chunk]
  )

  return (
    <div className={`${styles.item} ${styles[state]}`} title={title} onClick={handleClick}>
      <div className={styles.item__typeName}>{type}</div>
      <div className={styles.item__timestamp}>{format(timestamp)}</div>
    </div>
  )
}
