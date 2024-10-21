import {DocumentRemoveIcon, ReadOnlyIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {
  type BundleDocument,
  Translate,
  useDocumentOperation,
  usePerspective,
  useReleases,
  useTimelineSelector,
  useTranslation,
} from 'sanity'
import {useRouter} from 'sanity/router'

import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {Banner} from './Banner'

const useIsLocaleBundleDeleted = () => {
  const {currentGlobalBundle} = usePerspective()
  const {data: bundles, deletedReleases} = useReleases()
  const {_id: currentGlobalBundleId} = currentGlobalBundle
  const [checkedOutBundleId, setCheckedOutBundleId] = useState<string | undefined>(
    currentGlobalBundleId,
  )

  useEffect(() => {
    /**
     * only named versions other than default (drafts and published) are considered checked-out
     */
    if (currentGlobalBundleId !== 'drafts') {
      setCheckedOutBundleId(currentGlobalBundleId)
    }
  }, [currentGlobalBundleId, setCheckedOutBundleId])

  if (!checkedOutBundleId || !Object.keys(deletedReleases).length || !bundles?.length) {
    return null
  }
  return deletedReleases[checkedOutBundleId]
}

export function DeletedDocumentBanners() {
  const {isDeleted, isDeleting} = useDocumentPane()
  const deletedCheckedOutBundle = useIsLocaleBundleDeleted()

  if (deletedCheckedOutBundle)
    return <DeletedBundleBanner deletedBundle={deletedCheckedOutBundle} />

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

const DeletedBundleBanner = ({deletedBundle}: {deletedBundle: BundleDocument}) => {
  const {t} = useTranslation()

  const {title: deletedBundleTitle} = deletedBundle

  return (
    <Banner
      tone="caution"
      content={
        <Text size={1} weight="medium">
          <Translate
            t={t}
            i18nKey="banners.deleted-bundle-banner.text"
            values={{title: deletedBundleTitle}}
          />
        </Text>
      }
      data-testid="deleted-bundle-banner"
      icon={DocumentRemoveIcon}
    />
  )
}
