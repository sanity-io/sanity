import React, {useCallback} from 'react'
import {format} from 'date-fns'
import {useDocumentHistory} from '../../../../documentHistory'

import styles from './timeline.css'

export function Timeline() {
  const {historyDisplayed, startTime, timeline, toggleHistory} = useDocumentHistory()
  const handleTimelineSelect = useCallback(time => toggleHistory(time), [toggleHistory])

  // @todo
  let isFirst = true
  let isSelected = false

  return (
    <div className={styles.root}>
      {timeline.mapChunks((chunk, idx) => {
        const isStartTime = startTime && startTime.chunk === chunk
        const isEndTime = startTime && isFirst

        if (isEndTime) {
          isSelected = true
        }

        const item = (
          <div
            className={styles.item}
            data-selected={isSelected}
            data-selection-displayed={historyDisplayed === 'from' ? isStartTime : isEndTime}
            key={chunk.id}
            title={chunk.id}
            onClick={evt => {
              evt.preventDefault()
              evt.stopPropagation()
              handleTimelineSelect(timeline.createTimeId(idx, chunk))
            }}
          >
            <div className={styles.item__typeName}>{chunk.type}</div>
            <div className={styles.item__timestamp}>{format(chunk.startTimestamp)}</div>
          </div>
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
