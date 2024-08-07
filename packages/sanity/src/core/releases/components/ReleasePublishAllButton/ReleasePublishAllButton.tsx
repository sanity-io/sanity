import {ErrorOutlineIcon, PublishIcon} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'
import {Flex, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {type BundleDocument, Translate, useTranslation} from 'sanity'

import {Button, Dialog} from '../../../../ui-components'
import {useBundleOperations} from '../../../store/bundles/useBundleOperations'
import {releasesLocaleNamespace} from '../../i18n'
import {type DocumentValidationStatus} from '../../tool/detail/bundleDocumentsValidation'
import {useObserveDocumentRevisions} from './useObserveDocumentRevisions'

interface ReleasePublishAllButtonProps {
  bundle: BundleDocument
  bundleDocuments: SanityDocument[]
  disabled?: boolean
  validation: Record<string, DocumentValidationStatus>
}

export const ReleasePublishAllButton = ({
  bundle,
  bundleDocuments,
  disabled,
  validation,
}: ReleasePublishAllButtonProps) => {
  const toast = useToast()
  const {publishBundle} = useBundleOperations()
  const {t} = useTranslation(releasesLocaleNamespace)
  const [publishBundleStatus, setPublishBundleStatus] = useState<'idle' | 'confirm' | 'publishing'>(
    'idle',
  )

  const publishedDocumentsRevisions = useObserveDocumentRevisions(bundleDocuments)

  const isValidatingDocuments = Object.values(validation).some(({isValidating}) => isValidating)
  const hasDocumentValidationErrors = Object.values(validation).some(({hasError}) => hasError)

  const isPublishButtonDisabled =
    disabled || isValidatingDocuments || hasDocumentValidationErrors || !publishedDocumentsRevisions

  const handleConfirmPublishAll = useCallback(async () => {
    if (!bundle || !publishedDocumentsRevisions) return

    try {
      setPublishBundleStatus('publishing')
      await publishBundle(bundle._id, bundleDocuments, publishedDocumentsRevisions)
      toast.push({
        closable: true,
        status: 'success',
        title: (
          <Text muted size={1}>
            <Translate t={t} i18nKey="release.toast.published" values={{title: bundle.title}} />
          </Text>
        ),
      })
    } catch (publishingError) {
      toast.push({
        status: 'error',
        title: (
          <Text muted size={1}>
            <Translate t={t} i18nKey="release.toast.error" values={{title: bundle.title}} />
          </Text>
        ),
      })
      console.error(publishingError)
    } finally {
      setPublishBundleStatus('idle')
    }
  }, [bundle, bundleDocuments, publishBundle, publishedDocumentsRevisions, t, toast])

  const confirmPublishDialog = useMemo(() => {
    if (publishBundleStatus === 'idle') return null

    return (
      <Dialog
        id="confirm-publish-dialog"
        header={t('release.publish-dialog.confirm-publish.title')}
        onClose={() => setPublishBundleStatus('idle')}
        footer={{
          confirmButton: {
            text: t('release.action.publish'),
            tone: 'default',
            onClick: handleConfirmPublishAll,
            loading: publishBundleStatus === 'publishing',
            disabled: publishBundleStatus === 'publishing',
          },
        }}
      >
        <Text muted size={1}>
          {
            <Translate
              t={t}
              i18nKey="release.publish-dialog.confirm-publish-description"
              values={{
                title: bundle.title,
                bundleDocumentsLength: bundleDocuments.length,
                count: bundleDocuments.length,
              }}
            />
          }
        </Text>
      </Dialog>
    )
  }, [bundle.title, bundleDocuments.length, handleConfirmPublishAll, publishBundleStatus, t])

  const publishTooltipContent = useMemo(() => {
    if (!hasDocumentValidationErrors && !isValidatingDocuments) return null

    const tooltipText = () => {
      if (isValidatingDocuments) {
        return t('release.publish-dialog.validation.loading')
      }

      if (hasDocumentValidationErrors) {
        return t('release.publish-dialog.validation.error')
      }

      return null
    }

    return (
      <Flex gap={1} align="center">
        <ErrorOutlineIcon />
        <Text muted size={1}>
          {tooltipText()}
        </Text>
      </Flex>
    )
  }, [hasDocumentValidationErrors, isValidatingDocuments, t])

  return (
    <>
      <Button
        tooltipProps={{
          disabled: !isPublishButtonDisabled,
          content: publishTooltipContent,
          placement: 'bottom',
        }}
        icon={PublishIcon}
        disabled={isPublishButtonDisabled || publishBundleStatus === 'publishing'}
        text={t('release.action.publish-all')}
        onClick={() => setPublishBundleStatus('confirm')}
        loading={publishBundleStatus === 'publishing'}
      />
      {confirmPublishDialog}
    </>
  )
}
