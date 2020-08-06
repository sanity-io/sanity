import React from 'react'
import { format } from 'date-fns'
import { Timeline, TimeRef } from './history/timeline'

type Props = {
  timeline: Timeline
  onSelect: (id: string) => void
}

export default function HistoryTimeline(props: Props) {
  const {timeline, onSelect} = props

  return (
    <div>
      <div>
        Timeline
      </div>

      {timeline.mapChunks((chunk, idx) => (
        <div key={chunk.id} title={chunk.id} onClick={evt => {
          evt.preventDefault()
          evt.stopPropagation();
          onSelect(timeline.createTimeId(idx, chunk))
        }}>
          {chunk.type} - {format(chunk.startTimestamp)}
        </div>
      ))}
    </div>
  )
}
