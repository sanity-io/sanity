import {useRelativeTime} from '../../../../hooks/useRelativeTime'

export interface TimeAgoProps {
  time: string | Date
}

export function TimeAgo({time}: TimeAgoProps) {
  const timeAgo = useRelativeTime(time)

  return <span title={timeAgo}>{timeAgo} ago</span>
}
