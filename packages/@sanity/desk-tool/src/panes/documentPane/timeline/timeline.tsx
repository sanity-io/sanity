import React, {forwardRef, useCallback, useEffect, useRef, useState} from 'react'
import {Chunk} from '@sanity/field/diff'
import Spinner from 'part:@sanity/components/loading/spinner'
import {Timeline as TimelineModel} from '../documentHistory/history/timeline'
import {TimelineItem} from './timelineItem'
import {TimelineItemState} from './types'

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

// Must be a positive number
const LOAD_MORE_OFFSET = 20

export const Timeline = forwardRef<HTMLDivElement, TimelineProps>(
  (
    {timeline, disabledBeforeSelection, topSelection, bottomSelection, onSelect, onLoadMore},
    ref
  ) => {
    const rootRef = useRef<HTMLDivElement | null>(null)
    const listRef = useRef<HTMLOListElement | null>(null)
    const [loadingElement, setLoadingElement] = useState<HTMLDivElement | null>(null)

    let state: TimelineItemState = disabledBeforeSelection ? 'disabled' : 'enabled'

    const checkIfLoadIsNeeded = useCallback(() => {
      const rootEl = rootRef.current

      if (loadingElement && rootEl) {
        const {offsetHeight, scrollTop} = rootEl
        const bottomPosition = offsetHeight + scrollTop + LOAD_MORE_OFFSET
        const isVisible = loadingElement.offsetTop < bottomPosition

        if (isVisible) {
          // @todo: find out why, for some reason, it won't load without RAF wrapper
          requestAnimationFrame(() => onLoadMore(isVisible))
        }
      }
    }, [onLoadMore, loadingElement])

    // This is needed because we set the reference element both for
    // the provided `ref` from `forwardRef`, and the local `rootRef`.
    const setRef = useCallback(
      (el: HTMLDivElement | null) => {
        if (ref) {
          if (typeof ref === 'function') ref(el)
          if (typeof ref === 'object') (ref as any).current = el
        }
        rootRef.current = el
      },
      [ref]
    )

    // Load whenever it's needed
    useEffect(checkIfLoadIsNeeded, [checkIfLoadIsNeeded])

    // On mount: Scroll to selected timeline item
    useEffect(() => {
      const selectedEl = listRef.current?.querySelector('[data-state="selected"]')

      if (selectedEl) {
        window.requestAnimationFrame(() => {
          selectedEl.scrollIntoView({block: 'center'})
        })
      }
    }, [])

    return (
      <div className={styles.root} ref={setRef} onScroll={checkIfLoadIsNeeded}>
        <ol className={styles.list} ref={listRef}>
          {timeline.mapChunks((chunk) => {
            const isSelectionTop = topSelection === chunk
            const isSelectionBottom = bottomSelection === chunk

            if (isSelectionTop) {
              state = 'withinSelection'
            }

            if (isSelectionBottom) {
              state = 'selected'
            }

            const item = (
              <TimelineItem
                chunk={chunk}
                isSelectionBottom={isSelectionBottom}
                isSelectionTop={isSelectionTop}
                key={chunk.id}
                state={state}
                onSelect={onSelect}
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
        </ol>

        {!timeline.reachedEarliestEntry && (
          <div className={styles.loading} ref={setLoadingElement}>
            <Spinner center />
          </div>
        )}
      </div>
    )
  }
)

Timeline.displayName = 'Timeline'
