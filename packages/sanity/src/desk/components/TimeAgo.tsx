import React from 'react'
import {useRelativeTime} from 'sanity'

export interface TimeAgoProps {
  time: string | Date
}

/**
 * @deprecated Use {@link RelativeTime} instead
 * @internal
 */
export function TimeAgo({time}: TimeAgoProps) {
  const timeAgo = useRelativeTime(time)

  return <span title={timeAgo}>{timeAgo} ago</span>
}
