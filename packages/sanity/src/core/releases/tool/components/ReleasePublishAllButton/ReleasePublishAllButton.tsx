import {ErrorOutlineIcon, PublishIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Flex, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {type BundleDocument} from 'sanity'

import {Button, Dialog} from '../../../../../ui-components'
import {PublishedRelease} from '../../../../bundles/__telemetry__/releases.telemetry'
import {Translate, useTranslation} from '../../../../i18n'
import {useBundleOperations} from '../../../../store/bundles/useBundleOperations'
import {releasesLocaleNamespace} from '../../../i18n'
import {type DocumentInBundleResult} from '../../../tool/detail/useBundleDocuments'
import {useObserveDocumentRevisions} from './useObserveDocumentRevisions'

interface ReleasePublishAllButtonProps {
  bundle: BundleDocument
  bundleDocuments: DocumentInBundleResult[]
  disabled?: boolean
}

export const ReleasePublishAllButton = ({
  bundle,
  bundleDocuments,
  disabled,
}: ReleasePublishAllButtonProps) => {
  const toast = useToast()
  const {publishBundle} = useBundleOperations()
  const {t} = useTranslation(releasesLocaleNamespace)
  const telemetry = useTelemetry()
  const [publishBundleStatus, setPublishBundleStatus] = useState<'idle' | 'confirm' | 'publishing'>(
    'idle',
  )

  const publishedDocumentsRevisions = useObserveDocumentRevisions(
    bundleDocuments.map(({document}) => document),
  )

  const isValidatingDocuments = bundleDocuments.some(({validation}) => validation.isValidating)
  const hasDocumentValidationErrors = bundleDocuments.some(({validation}) => validation.hasError)

  const isPublishButtonDisabled = disabled || isValidatingDocuments || hasDocumentValidationErrors

  const handleConfirmPublishAll = useCallback(async () => {
    if (!bundle || !publishedDocumentsRevisions) return

    try {
      setPublishBundleStatus('publishing')
      await publishBundle(
        bundle._id,
        bundleDocuments.map(({document}) => document),
        publishedDocumentsRevisions,
      )
      telemetry.log(PublishedRelease)
      toast.push({
        closable: true,
        status: 'success',
        title: (
          <Text muted size={1}>
            <Translate t={t} i18nKey="toast.published" values={{title: bundle.title}} />
          </Text>
        ),
      })
    } catch (publishingError) {
      toast.push({
        status: 'error',
        title: (
          <Text muted size={1}>
            <Translate t={t} i18nKey="toast.error" values={{title: bundle.title}} />
          </Text>
        ),
      })
      console.error(publishingError)
    } finally {
      setPublishBundleStatus('idle')
    }
  }, [bundle, bundleDocuments, publishBundle, publishedDocumentsRevisions, t, telemetry, toast])

  const confirmPublishDialog = useMemo(() => {
    if (publishBundleStatus === 'idle') return null

    return (
      <Dialog
        id="confirm-publish-dialog"
        header={t('publish-dialog.confirm-publish.title')}
        onClose={() => setPublishBundleStatus('idle')}
        footer={{
          confirmButton: {
            text: t('action.publish'),
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
              i18nKey="publish-dialog.confirm-publish-description"
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
        return t('publish-dialog.validation.loading')
      }

      if (hasDocumentValidationErrors) {
        return t('publish-dialog.validation.error')
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
        text={t('action.publish-all')}
        onClick={() => setPublishBundleStatus('confirm')}
        loading={publishBundleStatus === 'publishing'}
        data-testid="publish-all-button"
      />
      {confirmPublishDialog}
    </>
  )
}
