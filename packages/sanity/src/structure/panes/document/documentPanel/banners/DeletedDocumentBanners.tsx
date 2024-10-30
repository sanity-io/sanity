import {DocumentRemoveIcon, ReadOnlyIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import {useCallback} from 'react'
import {
  isDraftPerspective,
  isPublishedPerspective,
  type ReleaseDocument,
  Translate,
  useDocumentOperation,
  usePerspective,
  useTimelineSelector,
  useTranslation,
} from 'sanity'
import {useRouter} from 'sanity/router'

import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {Banner} from './Banner'

export function DeletedDocumentBanners() {
  const {isDeleted, isDeleting} = useDocumentPane()
  const {currentGlobalBundle} = usePerspective()

  if (
    !isPublishedPerspective(currentGlobalBundle) &&
    !isDraftPerspective(currentGlobalBundle) &&
    currentGlobalBundle.state === 'archived'
  ) {
    return <ArchivedReleaseBanner release={currentGlobalBundle as ReleaseDocument} />
  }
  if (isDeleted && !isDeleting) return <DeletedDocumentBanner />
}

function DeletedDocumentBanner() {
  const {documentId, documentType, timelineStore} = useDocumentPane()
  const {restore} = useDocumentOperation(documentId, documentType)
  const {navigateIntent} = useRouter()
  const lastNonDeletedRevId = useTimelineSelector(
    timelineStore,
    (state) => state.lastNonDeletedRevId,
  )
  const handleRestore = useCallback(() => {
    if (lastNonDeletedRevId) {
      restore.execute(lastNonDeletedRevId)
      navigateIntent('edit', {id: documentId, type: documentType})
    }
  }, [documentId, documentType, navigateIntent, restore, lastNonDeletedRevId])

  const {t} = useTranslation(structureLocaleNamespace)

  return (
    <Banner
      action={
        lastNonDeletedRevId
          ? {
              onClick: handleRestore,
              text: t('banners.deleted-document-banner.restore-button.text'),
            }
          : undefined
      }
      content={
        <Text size={1} weight="medium">
          {t('banners.deleted-document-banner.text')}
        </Text>
      }
      data-testid="deleted-document-banner"
      icon={ReadOnlyIcon}
    />
  )
}

const ArchivedReleaseBanner = ({release}: {release: ReleaseDocument}) => {
  const {t} = useTranslation()

  return (
    <Banner
      tone="caution"
      content={
        <Text size={1} weight="medium">
          <Translate
            t={t}
            i18nKey="banners.deleted-release-banner.text"
            values={{title: release.metadata?.title}}
          />
        </Text>
      }
      data-testid="deleted-release-banner"
      icon={DocumentRemoveIcon}
    />
  )
}
