import {LockIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import {
  CONTENT_RELEASES_TIME_ZONE_SCOPE,
  formatRelativeTzPublishDate,
  getReleaseTone,
  LATEST,
  type ReleaseDocument,
  Translate,
  useTimeZone,
  useTranslation,
} from 'sanity'

import {Banner} from './Banner'

export function ScheduledReleaseBanner({
  currentRelease,
}: {
  currentRelease: ReleaseDocument
}): React.JSX.Element {
  const tone = getReleaseTone(currentRelease ?? LATEST)

  const {t: tCore} = useTranslation()
  const {formatDateTz, timeZone, getLocalTimeZone} = useTimeZone(CONTENT_RELEASES_TIME_ZONE_SCOPE)

  return (
    <Banner
      tone={tone}
      icon={LockIcon}
      content={
        <Text size={1}>
          <Translate
            t={tCore}
            i18nKey="release.banner.scheduled-for-publishing-on"
            values={{
              date: formatRelativeTzPublishDate(currentRelease, formatDateTz, {
                abbreviation: timeZone.abbreviation,
                localAbbreviation: getLocalTimeZone().abbreviation,
              }),
            }}
          />
        </Text>
      }
    />
  )
}
