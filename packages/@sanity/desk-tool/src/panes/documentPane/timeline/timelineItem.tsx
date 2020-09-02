import React, {useCallback, createElement} from 'react'
import {Chunk, ChunkType} from '@sanity/field/diff'
import {
  formatTimelineEventDate,
  formatTimelineEventLabel,
  getTimelineEventIconComponent
} from './helpers'
import {TimelineItemState} from './types'

import styles from './timelineItem.css'

export function TimelineItem(props: {
  state: TimelineItemState
  title: string
  onSelect: (chunk: Chunk) => void
  chunk: Chunk
  timestamp: Date
  type: ChunkType
}) {
  const {state, onSelect, timestamp, chunk, title, type} = props
  const iconComponent = getTimelineEventIconComponent(type)

  const handleClick = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement>) => {
      evt.preventDefault()
      evt.stopPropagation()
      onSelect(chunk)
    },
    [onSelect, chunk]
  )

  return (
    <button
      className={styles.root}
      data-state={state}
      data-type={type}
      onClick={handleClick}
      title={title}
      type="button"
    >
      <div className={styles.wrapper}>
        <div className={styles.iconContainer}>{iconComponent && createElement(iconComponent)}</div>
        <div className={styles.text}>
          <div className={styles.typeName}>
            {formatTimelineEventLabel(type) || <code>{type}</code>}
          </div>
          <div className={styles.timestamp}>{formatTimelineEventDate(timestamp)}</div>
        </div>
      </div>
    </button>
  )
}
