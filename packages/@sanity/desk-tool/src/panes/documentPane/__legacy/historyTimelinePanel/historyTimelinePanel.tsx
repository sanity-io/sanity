import React from 'react'
import {format} from 'date-fns'
import {Timeline, TimeRef} from '../../documentHistory/history/timeline'

import styles from './historyTimelinePanel.css'

interface HistoryTimelinePanelProps {
  timeline: Timeline
  onSelect: (id: string) => void
  displayed: 'from' | 'to'
  startTime: TimeRef | null
}

export function HistoryTimelinePanel(props: HistoryTimelinePanelProps) {
  const {timeline, onSelect, displayed} = props

  // @todo
  let isFirst = true
  let isSelected = false

  return (
    <div className={styles.root}>
      <div className={styles.header}>Timeline</div>

      {timeline.mapChunks((chunk, idx) => {
        const isStartTime = props.startTime && props.startTime.chunk === chunk
        const isEndTime = props.startTime && isFirst

        if (isEndTime) {
          isSelected = true
        }

        const item = (
          <div
            className={styles.item}
            data-selected={isSelected}
            data-selection-displayed={displayed === 'from' ? isStartTime : isEndTime}
            key={chunk.id}
            title={chunk.id}
            onClick={evt => {
              evt.preventDefault()
              evt.stopPropagation()
              onSelect(timeline.createTimeId(idx, chunk))
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
