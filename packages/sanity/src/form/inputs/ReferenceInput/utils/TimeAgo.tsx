import React, {useEffect, useReducer} from 'react'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'

function useInterval(ms: number) {
  const [tick, update] = useReducer((n) => n + 1, 0)

  useEffect(() => {
    const i = setInterval(update, ms)
    return () => clearInterval(i)
  }, [ms])
  return tick
}

export function TimeAgo({time}: {time: string}) {
  useInterval(1000)
  const timeSince = formatDistanceToNow(new Date(time))
  return <span title={timeSince}>{timeSince} ago</span>
}
