import {ReadOnlyIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import {useCallback} from 'react'
import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {Banner} from './Banner'
import {useDocumentOperation, useTranslation} from 'sanity'
import {useRouter} from 'sanity/router'

interface DeletedDocumentBannerProps {
  revisionId?: string | null
}

export function DeletedDocumentBanner({revisionId}: DeletedDocumentBannerProps) {
  const {documentId, documentType} = useDocumentPane()
  const {restore} = useDocumentOperation(documentId, documentType)
  const {navigateIntent} = useRouter()
  const handleRestore = useCallback(() => {
    if (revisionId) {
      restore.execute(revisionId)
      navigateIntent('edit', {id: documentId, type: documentType})
    }
  }, [documentId, documentType, navigateIntent, restore, revisionId])
  const {t} = useTranslation(structureLocaleNamespace)

  return (
    <Banner
      action={
        revisionId
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
