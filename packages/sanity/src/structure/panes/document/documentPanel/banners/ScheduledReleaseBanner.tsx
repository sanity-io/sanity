import {LockIcon} from '@sanity/icons/Lock'
import {Text} from '@sanity/ui'
import {type ReleaseDocument, Translate, useTranslation} from 'sanity'
import {
  getReleaseTone,
  LATEST,
  useFormatRelativeLocalePublishDate,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

import {Banner} from './Banner'

export function ScheduledReleaseBanner({
  currentRelease,
}: {
  currentRelease: ReleaseDocument
}): React.JSX.Element {
  const tone = getReleaseTone(currentRelease ?? LATEST)

  const {t: tCore} = useTranslation()
  const formatPublishDate = useFormatRelativeLocalePublishDate()

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
              date: formatPublishDate(currentRelease),
            }}
          />
        </Text>
      }
    />
  )
}
