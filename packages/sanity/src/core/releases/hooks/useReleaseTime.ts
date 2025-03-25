import {format} from 'date-fns'
import {useCallback} from 'react'

import {useTimeZone} from '../../hooks/useTimeZone'
import {type TableRelease} from '../tool/overview/ReleasesOverview'
import {getPublishDateFromRelease} from '../util/util'

export const useReleaseTime = (): ((release: TableRelease) => string | null) => {
  const {timeZone, utcToCurrentZoneDate, getLocalTimeZone} = useTimeZone({
    type: 'contentReleases',
  } as const)
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
