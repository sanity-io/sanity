import {LockIcon} from '@sanity/icons/Lock'
import {Text} from '@sanity/ui'
import {type ReleaseDocument, Translate, useTranslation} from 'sanity'

import {useFormatRelativeLocalePublishDate} from '../../../../../core/releases/hooks/useFormatRelativeLocalePublishDate'
import {LATEST} from '../../../../../core/releases/util/const'
import {getReleaseTone} from '../../../../../core/releases/util/getReleaseTone'
import {usePauseToEditScheduledDraft} from '../../../../../core/singleDocRelease/hooks/usePauseToEditScheduledDraft'
import {isCardinalityOneRelease} from '../../../../../core/util/releaseUtils'
import {useDocumentTitle} from '../../useDocumentTitle'
import {Banner} from './Banner'

export function ScheduledReleaseBanner({
  currentRelease,
}: {
  currentRelease: ReleaseDocument
}): React.JSX.Element {
  const tone = getReleaseTone(currentRelease ?? LATEST)

  const {t: tCore} = useTranslation()
  const formatPublishDate = useFormatRelativeLocalePublishDate()
  const {title} = useDocumentTitle()
  const isCardinalityOne = isCardinalityOneRelease(currentRelease)
  const {pauseToEdit, isPausing} = usePauseToEditScheduledDraft({
    release: isCardinalityOne ? currentRelease : undefined,
    documentTitle: title,
  })

  return (
    <Banner
      tone={tone}
      icon={LockIcon}
      data-testid="scheduled-release-banner"
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
      action={
        isCardinalityOne
          ? {
              text: tCore('release.action.pause-to-edit'),
              onClick: pauseToEdit,
              disabled: isPausing,
              mode: 'default',
              tone: tone,
            }
          : undefined
      }
    />
  )
}
