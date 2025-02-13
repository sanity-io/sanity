import {ErrorOutlineIcon, PublishIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Flex, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'

import {Button, Dialog} from '../../../../../ui-components'
import {ToneIcon} from '../../../../../ui-components/toneIcon/ToneIcon'
import {Translate, useTranslation} from '../../../../i18n'
import {usePerspective} from '../../../../perspective/usePerspective'
import {useSetPerspective} from '../../../../perspective/useSetPerspective'
import {supportsLocalStorage} from '../../../../util/supportsLocalStorage'
import {PublishedRelease} from '../../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../../i18n'
import {isReleaseDocument, type ReleaseDocument} from '../../../index'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {useReleasePermissions} from '../../../store/useReleasePermissions'
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
  const {publishRelease} = useReleaseOperations()
  const {checkWithPermissionGuard} = useReleasePermissions()
  const {t} = useTranslation(releasesLocaleNamespace)
  const perspective = usePerspective()
  const setPerspective = useSetPerspective()
  const telemetry = useTelemetry()
  const publish2 = useMemo(() => {
    if (supportsLocalStorage) {
      return localStorage.getItem('publish2') === 'true'
    }
    return false
  }, [])

  const [publishBundleStatus, setPublishBundleStatus] = useState<
    'idle' | 'confirm' | 'confirm-2' | 'publishing'
  >('idle')

  const [publishPermission, setPublishPermission] = useState<boolean>(false)

  const isValidatingDocuments = documents.some(({validation}) => validation.isValidating)
  const hasDocumentValidationErrors = documents.some(({validation}) => validation.hasError)

  const isPublishButtonDisabled =
    disabled || isValidatingDocuments || hasDocumentValidationErrors || !publishPermission
  const useUnstableAction = publishBundleStatus === 'confirm-2'

  useEffect(() => {
    checkWithPermissionGuard(publishRelease, release._id, false).then((hasPermission) =>
      setPublishPermission(hasPermission),
    )
  }, [
    checkWithPermissionGuard,
    publishRelease,
    release._id,
    release.metadata.intendedPublishAt,
    useUnstableAction,
  ])

  const handleConfirmPublishAll = useCallback(async () => {
    if (!release) return

    try {
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
      if (
        isReleaseDocument(perspective.selectedPerspective) &&
        perspective.selectedPerspective?._id === release._id
      ) {
        setPerspective('drafts')
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
  }, [
    release,
    publishRelease,
    useUnstableAction,
    telemetry,
    toast,
    t,
    perspective.selectedPerspective,
    setPerspective,
  ])

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
    if (!hasDocumentValidationErrors && !isValidatingDocuments && publishPermission) return null

    const tooltipText = () => {
      if (!publishPermission) {
        return t('publish-dialog.validation.no-permission')
      }

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
  }, [hasDocumentValidationErrors, isValidatingDocuments, publishPermission, t])

  return (
    <>
      {publish2 && (
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
      )}
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
