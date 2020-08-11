import React from 'react'
import {format} from 'date-fns'
import {Timeline, TimeRef} from '../history/timeline'

import styles from './historyTimelinePanel.css'

interface HistoryTimelinePanelProps {
  timeline: Timeline
  onSelect: (id: string) => void
  displayed: 'from' | 'to'
  startTimeId?: string
  endTimeId?: string
}

export function HistoryTimelinePanel(props: HistoryTimelinePanelProps) {
  const {timeline, onSelect, displayed} = props

  // @todo
  let isFirst = true
  let isSelected = true

  return (
    <div className={styles.root}>
      <div className={styles.header}>Timeline</div>

      {timeline.mapChunks((chunk, idx) => {
        const timeId = timeline.createTimeId(idx, chunk)
        const isStartTime = props.startTimeId === timeId
        const isEndTime = isFirst && !props.endTimeId ? true : props.endTimeId === timeId

        isFirst = false

        if (isStartTime) {
          isSelected = false
        }

        return (
          <div
            className={styles.item}
            data-selected={isSelected}
            data-selection-displayed={displayed === 'from' ? isStartTime : isEndTime}
            key={chunk.id}
            title={chunk.id}
            onClick={evt => {
              evt.preventDefault()
              evt.stopPropagation()
              onSelect(timeId)
            }}
          >
            <div className={styles.item__typeName}>{chunk.type}</div>
            <div className={styles.item__timestamp}>{format(chunk.startTimestamp)}</div>
          </div>
        )
      })}
    </div>
  )
}
