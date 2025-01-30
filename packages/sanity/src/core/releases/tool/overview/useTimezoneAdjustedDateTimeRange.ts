import {endOfDay, startOfDay} from 'date-fns'
import {useCallback} from 'react'

import useTimeZone from '../../../scheduledPublishing/hooks/useTimeZone'

export const useTimezoneAdjustedDateTimeRange = () => {
  const {zoneDateToUtc} = useTimeZone()

  return useCallback(
    (date: Date) => [startOfDay(date), endOfDay(date)].map(zoneDateToUtc),
    [zoneDateToUtc],
  )
}
