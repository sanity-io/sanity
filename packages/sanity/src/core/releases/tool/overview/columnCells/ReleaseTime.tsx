import {format} from 'date-fns'
import {useCallback, useMemo} from 'react'

import {useTranslation} from '../../../../i18n'
import useTimeZone, {getLocalTimeZone} from '../../../../scheduledPublishing/hooks/useTimeZone'
import {getPublishDateFromRelease} from '../../../util/util'
import {type TableRelease} from '../ReleasesOverview'

export const ReleaseTime = ({release}: {release: TableRelease}) => {
  const {t} = useTranslation()
  const {timeZone, utcToCurrentZoneDate} = useTimeZone()
  const {abbreviation: localeTimeZoneAbbreviation} = getLocalTimeZone()

  const {metadata} = release

  const getTimezoneAbbreviation = useCallback(
    () =>
      timeZone.abbreviation === localeTimeZoneAbbreviation ? '' : `(${timeZone.abbreviation})`,
    [localeTimeZoneAbbreviation, timeZone.abbreviation],
  )

  const timeString = useMemo(() => {
    if (metadata.releaseType === 'asap') {
      return t('release.type.asap')
    }
    if (metadata.releaseType === 'undecided') {
      return t('release.type.undecided')
    }

    const publishDate = getPublishDateFromRelease(release)

    return publishDate
      ? `${format(utcToCurrentZoneDate(publishDate), 'PPpp')} ${getTimezoneAbbreviation()}`
      : null
  }, [metadata.releaseType, release, utcToCurrentZoneDate, getTimezoneAbbreviation, t])

  return timeString
}
