import {format} from 'date-fns'
import {useCallback} from 'react'

import {useTranslation} from '../../../../i18n'
import useTimeZone, {getLocalTimeZone} from '../../../../scheduledPublishing/hooks/useTimeZone'
import {getPublishDateFromRelease} from '../../../util/util'
import {type TableRelease} from '../ReleasesOverview'

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

export const ReleaseTime: React.FC<{release: TableRelease}> = ({release}) => {
  const {t} = useTranslation()
  const getReleaseTime = useReleaseTime()

  const {metadata} = release

  if (metadata.releaseType === 'asap') {
    return t('release.type.asap')
  }
  if (metadata.releaseType === 'undecided') {
    return t('release.type.undecided')
  }

  return getReleaseTime(release)
}
