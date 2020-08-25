import React, {useCallback} from 'react'
import {format} from 'date-fns'
import {useDocumentHistory} from '../../../documentHistory'

import styles from './timeline.css'

export function Timeline({onSelect}: {onSelect?: (timeId: string | null) => void}) {
  const {historyDisplayed, startTime, timeline, toggleHistory} = useDocumentHistory()
  const handleTimelineSelect = useCallback(
    (time: string | null) => {
      toggleHistory(time)
      if (onSelect) onSelect(time)
    },
    [toggleHistory]
  )

  // @todo
  let isFirst = true
  let isSelected = false

  return (
    <div className={styles.root}>
      {timeline.mapChunks((chunk, idx) => {
        const isStartTime = Boolean(startTime && startTime.chunk === chunk)
        const isEndTime = Boolean(startTime && isFirst)

        if (isEndTime) {
          isSelected = true
        }

        const isWithinSelection = historyDisplayed === 'from' ? isStartTime : isEndTime

        const item = (
          <TimelineItem
            isSelected={isSelected}
            isWithinSelection={isWithinSelection}
            key={chunk.id}
            onSelect={handleTimelineSelect}
            startTimestamp={chunk.startTimestamp}
            timeId={timeline.createTimeId(idx, chunk)}
            title={chunk.id}
            type={chunk.type}
          />
        )

        if (isStartTime) {
          isSelected = false
        }

        isFirst = false

        return item
      })}
    </div>
  )
}

function TimelineItem(props: {
  isSelected: boolean
  isWithinSelection: boolean
  onSelect: (timeId: string | null) => void
  title: string
  timeId: string
  startTimestamp: Date
  type: string
}) {
  const {isSelected, isWithinSelection, onSelect, startTimestamp, timeId, title, type} = props

  const handleClick = useCallback(
    (evt: React.MouseEvent<HTMLDivElement>) => {
      evt.preventDefault()
      evt.stopPropagation()
      onSelect(timeId)
    },
    [onSelect, timeId]
  )

  return (
    <div
      className={styles.item}
      data-selected={isSelected}
      data-selection-displayed={isWithinSelection}
      title={title}
      onClick={handleClick}
    >
      <div className={styles.item__typeName}>{type}</div>
      <div className={styles.item__timestamp}>{format(startTimestamp)}</div>
    </div>
  )
}
