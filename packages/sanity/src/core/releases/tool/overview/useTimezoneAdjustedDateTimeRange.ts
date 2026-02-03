import {useTimeZone} from '../../../hooks/useTimeZone'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../../studio/constants'
import {endOfDay, startOfDay} from 'date-fns'
import {useCallback} from 'react'

export const useTimezoneAdjustedDateTimeRange = (): ((date: Date) => [Date, Date]) => {
  const {zoneDateToUtc} = useTimeZone(CONTENT_RELEASES_TIME_ZONE_SCOPE)

  return useCallback(
    (date: Date) => [startOfDay(date), endOfDay(date)].map(zoneDateToUtc) as [Date, Date],
    [zoneDateToUtc],
  )
}
