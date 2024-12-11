import {ErrorOutlineIcon, PublishIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Flex, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useRouter} from 'sanity/router'

import {Button, Dialog} from '../../../../../ui-components'
import {ToneIcon} from '../../../../../ui-components/toneIcon/ToneIcon'
import {Translate, useTranslation} from '../../../../i18n'
import {PublishedRelease} from '../../../__telemetry__/releases.telemetry'
import {usePerspective} from '../../../hooks/usePerspective'
import {releasesLocaleNamespace} from '../../../i18n'
import {type ReleaseDocument} from '../../../index'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {type DocumentInRelease} from '../../detail/useBundleDocuments'

interface ReleasePublishAllButtonProps {
  release: ReleaseDocument
  documents: DocumentInRelease[]
  disabled?: boolean
}

export const ReleasePublishAllButton = ({
  release,
  documents,
  disabled,
}: ReleasePublishAllButtonProps) => {
  const toast = useToast()
  const router = useRouter()
  const {publishRelease} = useReleaseOperations()
  const {t} = useTranslation(releasesLocaleNamespace)
  const perspective = usePerspective()
  const telemetry = useTelemetry()
  const [publishBundleStatus, setPublishBundleStatus] = useState<
    'idle' | 'confirm' | 'confirm-2' | 'publishing'
  >('idle')

  const isValidatingDocuments = documents.some(({validation}) => validation.isValidating)
  const hasDocumentValidationErrors = documents.some(({validation}) => validation.hasError)

  const isPublishButtonDisabled = disabled || isValidatingDocuments || hasDocumentValidationErrors

  const handleConfirmPublishAll = useCallback(async () => {
    if (!release) return

    try {
      const useUnstableAction = publishBundleStatus === 'confirm-2'
      setPublishBundleStatus('publishing')
      await publishRelease(release._id, useUnstableAction)
      telemetry.log(PublishedRelease)
      toast.push({
        closable: true,
        status: 'success',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey="toast.publish.success"
              values={{title: release.metadata.title}}
            />
          </Text>
        ),
      })
      // TODO: handle a published release on the document list
      router.navigate({})
      if (
        perspective.selectedPerspective !== 'published' &&
        perspective.selectedPerspective?._id === release._id
      ) {
        perspective.setPerspective('drafts')
      }
    } catch (publishingError) {
      toast.push({
        status: 'error',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey="toast.publish.error"
              values={{title: release.metadata.title}}
            />
          </Text>
        ),
      })
      console.error(publishingError)
    } finally {
      setPublishBundleStatus('idle')
    }
  }, [release, publishBundleStatus, publishRelease, telemetry, toast, t, router, perspective])

  const confirmPublishDialog = useMemo(() => {
    if (publishBundleStatus === 'idle') return null

    return (
      <Dialog
        id="confirm-publish-dialog"
        header={t('publish-dialog.confirm-publish.title')}
        onClose={() => setPublishBundleStatus('idle')}
        footer={{
          confirmButton: {
            text: t('action.publish-all-documents'),
            tone: 'positive',
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
                releaseDocumentsLength: documents.length,
                count: documents.length,
              }}
            />
          }
        </Text>
      </Dialog>
    )
  }, [publishBundleStatus, t, handleConfirmPublishAll, release, documents.length])

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

    // TODO: this is a duplicate of logic in ReleaseScheduleButton
    return (
      <Text muted size={1}>
        <Flex align="center" gap={3} padding={1}>
          <ToneIcon icon={ErrorOutlineIcon} tone={isValidatingDocuments ? 'default' : 'critical'} />
          {tooltipText()}
        </Flex>
      </Text>
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
        // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
        text={'Unstable Publish'}
        onClick={() => setPublishBundleStatus('confirm-2')}
        loading={publishBundleStatus === 'publishing'}
        data-testid="publish-all-button"
        tone="suggest"
      />
      <Button
        tooltipProps={{
          disabled: !isPublishButtonDisabled,
          content: publishTooltipContent,
          placement: 'bottom',
        }}
        icon={PublishIcon}
        disabled={isPublishButtonDisabled || publishBundleStatus === 'publishing'}
        text={t('action.publish-all-documents')}
        onClick={() => setPublishBundleStatus('confirm')}
        loading={publishBundleStatus === 'publishing'}
        data-testid="publish-all-button"
        tone="positive"
      />
      {confirmPublishDialog}
    </>
  )
}
