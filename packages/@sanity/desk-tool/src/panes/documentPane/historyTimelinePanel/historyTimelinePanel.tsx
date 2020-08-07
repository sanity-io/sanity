import React from 'react'
import {format} from 'date-fns'
import {Timeline, TimeRef} from '../history/timeline'

import styles from './historyTimelinePanel.css'

interface HistoryTimelinePanelProps {
  timeline: Timeline
  onSelect: (id: string) => void
  startTimeId?: string
}

export function HistoryTimelinePanel(props: HistoryTimelinePanelProps) {
  const {timeline, onSelect} = props

  return (
    <div className={styles.root}>
      <div className={styles.header}>Timeline</div>

      {timeline.mapChunks((chunk, idx) => {
        const startTimeId = timeline.createTimeId(idx, chunk)
        const isSelected = props.startTimeId === startTimeId

        return (
          <div
            className={styles.item}
            data-selected={isSelected}
            key={chunk.id}
            title={chunk.id}
            onClick={evt => {
              evt.preventDefault()
              evt.stopPropagation()
              onSelect(startTimeId)
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
