import {LockIcon} from '@sanity/icons/Lock'
import {Text} from '@sanity/ui'
import {type ReleaseDocument, Translate, useTranslation} from 'sanity'

import {useFormatRelativeLocalePublishDate} from '../../../../../core/releases/hooks/useFormatRelativeLocalePublishDate'
import {LATEST} from '../../../../../core/releases/util/const'
import {getReleaseTone} from '../../../../../core/releases/util/getReleaseTone'
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
