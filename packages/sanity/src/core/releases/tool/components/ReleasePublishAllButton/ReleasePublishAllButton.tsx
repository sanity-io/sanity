import {ErrorOutlineIcon, PublishIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Flex, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {Button, Dialog} from '../../../../../ui-components'
import {Translate, useTranslation} from '../../../../i18n'
import {type ReleaseDocument} from '../../../../store'
import {useReleaseOperations} from '../../../../store/release/useReleaseOperations'
import {PublishedRelease} from '../../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../../i18n'
import {type DocumentInBundleResult} from '../../../tool/detail/useBundleDocuments'
import {useObserveDocumentRevisions} from './useObserveDocumentRevisions'

interface ReleasePublishAllButtonProps {
  release: ReleaseDocument
  releaseDocuments: DocumentInBundleResult[]
  disabled?: boolean
}

export const ReleasePublishAllButton = ({
  release,
  releaseDocuments,
  disabled,
}: ReleasePublishAllButtonProps) => {
  const toast = useToast()
  const {publishRelease} = useReleaseOperations()
  const {t} = useTranslation(releasesLocaleNamespace)
  const telemetry = useTelemetry()
  const [publishBundleStatus, setPublishBundleStatus] = useState<'idle' | 'confirm' | 'publishing'>(
    'idle',
  )

  const publishedDocumentsRevisions = useObserveDocumentRevisions(
    releaseDocuments.map(({document}) => document),
  )

  const isValidatingDocuments = releaseDocuments.some(({validation}) => validation.isValidating)
  const hasDocumentValidationErrors = releaseDocuments.some(({validation}) => validation.hasError)

  const isPublishButtonDisabled = disabled || isValidatingDocuments || hasDocumentValidationErrors

  const handleConfirmPublishAll = useCallback(async () => {
    if (!release || !publishedDocumentsRevisions) return

    try {
      setPublishBundleStatus('publishing')
      await publishRelease(
        release._id,
        releaseDocuments.map(({document}) => document),
        publishedDocumentsRevisions,
      )
      telemetry.log(PublishedRelease)
      toast.push({
        closable: true,
        status: 'success',
        title: (
          <Text muted size={1}>
            <Translate t={t} i18nKey="toast.published" values={{title: release.metadata.title}} />
          </Text>
        ),
      })
    } catch (publishingError) {
      toast.push({
        status: 'error',
        title: (
          <Text muted size={1}>
            <Translate t={t} i18nKey="toast.error" values={{title: release.metadata.title}} />
          </Text>
        ),
      })
      console.error(publishingError)
    } finally {
      setPublishBundleStatus('idle')
    }
  }, [release, releaseDocuments, publishRelease, publishedDocumentsRevisions, t, telemetry, toast])

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
                title: release.metadata.title,
                releaseDocumentsLength: releaseDocuments.length,
                count: releaseDocuments.length,
              }}
            />
          }
        </Text>
      </Dialog>
    )
  }, [
    release.metadata.title,
    releaseDocuments.length,
    handleConfirmPublishAll,
    publishBundleStatus,
    t,
  ])

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
