import React, {useCallback, createElement} from 'react'
import {Chunk, ChunkType} from '@sanity/field/diff'
import {
  formatTimelineEventDate,
  formatTimelineEventLabel,
  getTimelineEventIconComponent
} from './helpers'
import {TimelineItemState} from './types'
import {UserAvatarStack} from './userAvatarStack'

import styles from './timelineItem.css'

export function TimelineItem(props: {
  isSelectionBottom: boolean
  isSelectionTop: boolean
  state: TimelineItemState
  title: string
  onSelect: (chunk: Chunk) => void
  chunk: Chunk
  timestamp: Date
  type: ChunkType
}) {
  const {isSelectionBottom, isSelectionTop, state, onSelect, timestamp, chunk, title, type} = props
  const iconComponent = getTimelineEventIconComponent(type)
  const authorUserIds = Array.from(chunk.authors)

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
      data-selection-bottom={isSelectionBottom}
      data-selection-top={isSelectionTop}
      data-type={type}
      disabled={state === 'disabled' || state === 'selected'}
      onClick={handleClick}
      title={title}
      type="button"
    >
      <div className={styles.wrapper}>
        <div className={styles.iconContainer}>{iconComponent && createElement(iconComponent)}</div>
        <div className={styles.textContainer}>
          <div className={styles.typeName}>
            {formatTimelineEventLabel(type) || <code>{type}</code>}
          </div>
          <div className={styles.timestamp}>{formatTimelineEventDate(timestamp)}</div>
        </div>
        <div className={styles.avatarStackContainer}>
          <UserAvatarStack maxLength={3} userIds={authorUserIds} />
        </div>
      </div>
    </button>
  )
}
