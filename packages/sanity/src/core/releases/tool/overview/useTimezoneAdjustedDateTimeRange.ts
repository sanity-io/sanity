import {endOfDay} from 'date-fns/endOfDay'
import {startOfDay} from 'date-fns/startOfDay'
import {useCallback} from 'react'

import {useTimeZone} from '../../../hooks/useTimeZone'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../../studio/constants'

export const useTimezoneAdjustedDateTimeRange = (): ((date: Date) => [Date, Date]) => {
  const {zoneDateToUtc} = useTimeZone(CONTENT_RELEASES_TIME_ZONE_SCOPE)

  return useCallback(
    (date: Date) => [startOfDay(date), endOfDay(date)].map(zoneDateToUtc) as [Date, Date],
    [zoneDateToUtc],
  )
}
