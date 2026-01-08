import {type SanityDocument} from '@sanity/client'
import {WarningOutlineIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import {getPublishedId, Translate, useTranslation} from 'sanity'

import {useScheduledDraftDocument} from '../../../../../core/singleDocRelease/hooks/useScheduledDraftDocument'
import {structureLocaleNamespace} from '../../../../i18n'
import {Banner} from './Banner'

interface ScheduledDraftOverrideBannerProps {
  releaseId: string
  draftDocument: Partial<SanityDocument> | null
}

export function ScheduledDraftOverrideBanner({
  releaseId,
  draftDocument,
}: ScheduledDraftOverrideBannerProps): React.JSX.Element | null {
  const {t} = useTranslation(structureLocaleNamespace)
  const {firstDocument: scheduledDraftDocument} = useScheduledDraftDocument(releaseId)

  const draftPublishedId = draftDocument?._id ? getPublishedId(draftDocument._id) : null
  const scheduledPublishedId = scheduledDraftDocument?._id
    ? getPublishedId(scheduledDraftDocument._id)
    : null

  const draftRev = draftDocument?._rev
  const scheduledBaseRev = scheduledDraftDocument?._system?.base?.rev

  const documentsMatch = draftPublishedId === scheduledPublishedId
  const revisionsDiffer = !draftRev || !scheduledBaseRev || draftRev !== scheduledBaseRev

  if (!documentsMatch || !revisionsDiffer) {
    return null
  }

  return (
    <Banner
      tone="caution"
      icon={WarningOutlineIcon}
      content={
        <Text size={1}>
          <Translate t={t} i18nKey="banners.scheduled-draft-override-banner.text" />
        </Text>
      }
    />
  )
}
