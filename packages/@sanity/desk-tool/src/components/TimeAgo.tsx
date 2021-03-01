import React from 'react'
import {useTimeAgo} from '@sanity/base/hooks'

interface Props {
  time: string | Date
}

export default function TimeAgo({time}: Props) {
  const timeAgo = useTimeAgo(time)
  return <span title={timeAgo}>{timeAgo}</span>
}
