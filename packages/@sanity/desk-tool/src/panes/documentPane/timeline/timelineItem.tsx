import EditIcon from 'part:@sanity/base/edit-icon'
import PlusIcon from 'part:@sanity/base/plus-icon'
import PublishIcon from 'part:@sanity/base/publish-icon'
import UnpublishIcon from 'part:@sanity/base/unpublish-icon'
import React, {useCallback, createElement} from 'react'
import {Chunk} from '@sanity/field/diff'
import {formatDate} from './helpers'
import {TimelineItemState} from './types'

import styles from './timelineItem.css'

const ICON_COMPONENTS: {[key: string]: React.ComponentType<{}>} = {
  initial: PlusIcon,
  editDraft: EditIcon,
  publish: PublishIcon,
  unpublish: UnpublishIcon
}

const LABELS: {[key: string]: string} = {
  initial: 'Created',
  editDraft: 'Edited',
  publish: 'Published',
  unpublish: 'Unpublished'
}

export function TimelineItem(props: {
  state: TimelineItemState
  title: string
  onSelect: (chunk: Chunk) => void
  chunk: Chunk
  timestamp: Date
  type: string
}) {
  const {state, onSelect, timestamp, chunk, title, type} = props
  const iconComponent = ICON_COMPONENTS[type]
  const label = LABELS[type] || <code>{type}</code>

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
          <div className={styles.typeName}>{label}</div>
          <div className={styles.timestamp}>{formatDate(timestamp)}</div>
        </div>
      </div>
    </button>
  )
}
