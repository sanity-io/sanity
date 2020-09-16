import React, {forwardRef, useCallback, useEffect, useRef} from 'react'
import {Chunk} from '@sanity/field/diff'
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

// Must be a positive number
const LOAD_MORE_OFFSET = 200

export const Timeline = forwardRef<HTMLDivElement, TimelineProps>(
  (
    {timeline, disabledBeforeSelection, topSelection, bottomSelection, onSelect, onLoadMore},
    ref
  ) => {
    const rootRef = useRef<HTMLDivElement | null>(null)
    const loadingRef = useRef<HTMLDivElement | null>(null)
    const listRef = useRef<HTMLOListElement | null>(null)

    let state: TimelineItemState = disabledBeforeSelection ? 'disabled' : 'enabled'

    const loadMoreIfNeeded = useCallback(() => {
      const rootEl = rootRef.current
      const loadingEl = loadingRef.current

      if (loadingEl && rootEl) {
        const {offsetHeight, scrollTop} = rootEl
        const bottomPosition = offsetHeight + scrollTop + LOAD_MORE_OFFSET
        const isVisible = loadingEl.offsetTop < bottomPosition

        if (isVisible) onLoadMore(isVisible)
      }
    }, [onLoadMore])

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

    useEffect(loadMoreIfNeeded, [loadMoreIfNeeded])

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
      <div className={styles.root} ref={setRef} onScroll={loadMoreIfNeeded}>
        <ol className={styles.list} ref={listRef}>
          {timeline.mapChunks(chunk => {
            const isSelectionTop = topSelection === chunk
            const isSelectionBottom = bottomSelection === chunk

            if (isSelectionTop) {
              state = 'withinSelection'
            }

            if (isSelectionBottom) {
              state = 'selected'
            }

            const item = (
              <li key={chunk.id}>
                <TimelineItem
                  chunk={chunk}
                  isSelectionBottom={isSelectionBottom}
                  isSelectionTop={isSelectionTop}
                  state={state}
                  onSelect={onSelect}
                  title={chunk.id}
                  type={chunk.type}
                  timestamp={chunk.endTimestamp}
                />
              </li>
            )

            // Flip it back to normal after we've rendered the active one.
            if (state === 'selected') {
              state = 'enabled'
            }

            return item
          })}
        </ol>

        {!timeline.reachedEarliestEntry && (
          <div className={styles.loading} ref={loadingRef}>
            Loading events…
          </div>
        )}
      </div>
    )
  }
)

Timeline.displayName = 'Timeline'
