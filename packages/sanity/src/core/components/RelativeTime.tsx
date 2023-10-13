import React from 'react'
import {type RelativeTimeOptions, useRelativeTime} from '../hooks/useRelativeTime'

export interface RelativeTimeProps extends RelativeTimeOptions {
  time: string | Date
}

export function RelativeTime({time, ...options}: RelativeTimeProps) {
  const timestamp = time instanceof Date ? time : new Date(time)
  const timeAgo = useRelativeTime(timestamp, options)

  return (
    <time dateTime={timestamp.toISOString()} title={timeAgo}>
      {timeAgo}
    </time>
  )
}
