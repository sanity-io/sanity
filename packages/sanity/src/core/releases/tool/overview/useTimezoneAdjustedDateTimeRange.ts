import {endOfDay, startOfDay} from 'date-fns'
import {useCallback} from 'react'

import {useTimeZone} from '../../../hooks/useTimeZone'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../../studio/constants'

export const useTimezoneAdjustedDateTimeRange = () => {
  const {zoneDateToUtc} = useTimeZone(CONTENT_RELEASES_TIME_ZONE_SCOPE)

  return useCallback(
    (date: Date) => [startOfDay(date), endOfDay(date)].map(zoneDateToUtc),
    [zoneDateToUtc],
  )
}
