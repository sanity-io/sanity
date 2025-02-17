import {endOfDay, startOfDay} from 'date-fns'
import {useCallback} from 'react'

import useTimeZone from '../../../hooks/useTimeZone'

export const useTimezoneAdjustedDateTimeRange = () => {
  const {zoneDateToUtc} = useTimeZone({type: 'contentReleases'})

  return useCallback(
    (date: Date) => [startOfDay(date), endOfDay(date)].map(zoneDateToUtc),
    [zoneDateToUtc],
  )
}
