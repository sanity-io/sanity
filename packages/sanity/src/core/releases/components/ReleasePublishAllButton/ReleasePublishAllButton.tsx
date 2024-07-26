import {ErrorOutlineIcon, PublishIcon} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'
import {Flex, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {type BundleDocument} from 'sanity'

import {Button, Dialog} from '../../../../ui-components'
import {useBundleOperations} from '../../../store/bundles/useBundleOperations'
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
            The <strong>{bundle.title}</strong> release was published
          </Text>
        ),
      })
    } catch (publishingError) {
      toast.push({
        status: 'error',
        title: (
          <Text muted size={1}>
            Failed to publish the <strong>{bundle.title}</strong> release
          </Text>
        ),
      })
      console.error(publishingError)
    } finally {
      setPublishBundleStatus('idle')
    }
  }, [bundle, bundleDocuments, publishBundle, publishedDocumentsRevisions, toast])

  const confirmPublishDialog = useMemo(() => {
    if (publishBundleStatus === 'idle') return null

    return (
      <Dialog
        id="confirm-publish-dialog"
        header="Are you sure you want to publish the release and all document versions?"
        onClose={() => setPublishBundleStatus('idle')}
        footer={{
          confirmButton: {
            text: 'Publish',
            tone: 'default',
            onClick: handleConfirmPublishAll,
            loading: publishBundleStatus === 'publishing',
            disabled: publishBundleStatus === 'publishing',
          },
        }}
      >
        <Text muted size={1}>
          The <strong>{bundle?.title}</strong> release and its {bundleDocuments.length} document
          version{bundleDocuments.length > 1 ? 's' : ''} will be published.
        </Text>
      </Dialog>
    )
  }, [bundle?.title, bundleDocuments.length, handleConfirmPublishAll, publishBundleStatus])

  const publishTooltipContent = useMemo(() => {
    if (!hasDocumentValidationErrors && !isValidatingDocuments) return null

    const tooltipText = () => {
      if (isValidatingDocuments) {
        return 'Validating documents...'
      }

      if (hasDocumentValidationErrors) {
        return 'Some documents have validation errors'
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
  }, [hasDocumentValidationErrors, isValidatingDocuments])

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
        text="Publish all"
        onClick={() => setPublishBundleStatus('confirm')}
        loading={publishBundleStatus === 'publishing'}
      />
      {confirmPublishDialog}
    </>
  )
}
