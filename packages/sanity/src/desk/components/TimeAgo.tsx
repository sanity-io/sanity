import React from 'react'
import {useTimeAgo} from 'sanity'

/** @internal */
export interface TimeAgoProps {
  time: string | Date
}

/** @internal */
export function TimeAgo({time}: TimeAgoProps) {
  const timeAgo = useTimeAgo(time)

  return <span title={timeAgo}>{timeAgo} ago</span>
}
