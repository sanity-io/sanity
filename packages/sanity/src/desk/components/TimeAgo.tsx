import React from 'react'
import {useTimeAgo} from 'sanity'

export interface TimeAgoProps {
  time: string | Date
}

export function TimeAgo({time}: TimeAgoProps) {
  const timeAgo = useTimeAgo(time)

  return <span title={timeAgo}>{timeAgo} ago</span>
}
