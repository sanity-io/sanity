import React, {useCallback, createElement} from 'react'
import {useTimeAgo} from '@sanity/base/hooks'
import {Chunk, ChunkType} from '@sanity/field/diff'
import {formatTimelineEventLabel, getTimelineEventIconComponent} from './helpers'
import {TimelineItemState} from './types'
import {UserAvatarStack} from './userAvatarStack'

import styles from './timelineItem.css'

export function TimelineItem(props: {
  isSelectionBottom: boolean
  isSelectionTop: boolean
  state: TimelineItemState
  onSelect: (chunk: Chunk) => void
  chunk: Chunk
  timestamp: string
  type: ChunkType
}) {
  const {isSelectionBottom, isSelectionTop, state, onSelect, timestamp, chunk, type} = props
  const iconComponent = getTimelineEventIconComponent(type)
  const authorUserIds = Array.from(chunk.authors)
  const timeAgo = useTimeAgo(timestamp, {minimal: true})

  const handleClick = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement>) => {
      evt.preventDefault()
      evt.stopPropagation()
      onSelect(chunk)
    },
    [onSelect, chunk]
  )

  return (
    <li
      className={styles.root}
      data-chunk-id={chunk.id}
      data-state={state}
      data-selection-bottom={isSelectionBottom}
      data-selection-top={isSelectionTop}
      data-type={type}
    >
      <button
        disabled={state === 'disabled' || state === 'selected'}
        onClick={handleClick}
        type="button"
      >
        <div className={styles.wrapper}>
          <div className={styles.iconContainer}>
            {iconComponent && createElement(iconComponent)}
          </div>
          <div className={styles.textContainer}>
            <div className={styles.typeName}>
              {formatTimelineEventLabel(type) || <code>{type}</code>}
            </div>
            <div className={styles.timestamp}>{timeAgo}</div>
          </div>
          <div className={styles.avatarStackContainer}>
            <UserAvatarStack maxLength={3} userIds={authorUserIds} />
          </div>
        </div>
      </button>
    </li>
  )
}
