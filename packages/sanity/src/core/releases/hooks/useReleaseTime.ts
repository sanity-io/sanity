import {format} from 'date-fns'
import {useCallback} from 'react'

import useTimeZone, {getLocalTimeZone} from '../../scheduledPublishing/hooks/useTimeZone'
import {type TableRelease} from '../tool/overview/ReleasesOverview'
import {getPublishDateFromRelease} from '../util/util'

export const useReleaseTime = (): ((release: TableRelease) => string | null) => {
  const {timeZone, utcToCurrentZoneDate} = useTimeZone()
  const {abbreviation: localeTimeZoneAbbreviation} = getLocalTimeZone()

  const getTimezoneAbbreviation = useCallback(
    () =>
      timeZone.abbreviation === localeTimeZoneAbbreviation ? '' : `(${timeZone.abbreviation})`,
    [localeTimeZoneAbbreviation, timeZone.abbreviation],
  )

  return useCallback(
    (release: TableRelease) => {
      const publishDate = getPublishDateFromRelease(release)

      return publishDate
        ? `${format(utcToCurrentZoneDate(publishDate), 'PPpp')} ${getTimezoneAbbreviation()}`
        : null
    },
    [getTimezoneAbbreviation, utcToCurrentZoneDate],
  )
}
