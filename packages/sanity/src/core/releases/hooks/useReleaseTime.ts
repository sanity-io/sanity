import {format} from 'date-fns/format'
import {useCallback} from 'react'

import {useTimeZone} from '../../hooks/useTimeZone'
import {type TableRelease} from '../tool/overview/ReleasesOverview'
import {getPublishDateFromRelease} from '../util/util'

export const useReleaseTime = (): ((
  release: TableRelease,
  opts?: {compact?: boolean},
) => string | null) => {
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
    (release: TableRelease, opts?: {compact?: boolean}) => {
      const publishDate = getPublishDateFromRelease(release)
      if (!publishDate) return null

      const zoned = utcToCurrentZoneDate(publishDate)
      // Compact: no seconds and no timezone suffix — for dense surfaces (e.g. the properties panel)
      // where the value must stay on a single line. `PPp` → "Jul 30, 2026, 12:27 AM".
      if (opts?.compact) return format(zoned, 'PPp')

      return `${format(zoned, 'PPpp')} ${getTimezoneAbbreviation()}`
    },
    [getTimezoneAbbreviation, utcToCurrentZoneDate],
  )
}
