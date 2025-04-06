import {LockIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import {
  formatRelativeLocalePublishDate,
  getReleaseTone,
  LATEST,
  type ReleaseDocument,
  Translate,
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
              date: formatRelativeLocalePublishDate(currentRelease),
            }}
          />
        </Text>
      }
    />
  )
}
