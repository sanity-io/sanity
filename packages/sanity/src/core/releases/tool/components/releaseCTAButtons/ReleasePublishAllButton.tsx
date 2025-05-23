import {type ReleaseDocument} from '@sanity/client'
import {ErrorOutlineIcon, PublishIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Flex, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {Button, Dialog, MenuItem, type TooltipProps} from '../../../../../ui-components'
import {ToneIcon} from '../../../../../ui-components/toneIcon/ToneIcon'
import {Translate, useTranslation} from '../../../../i18n'
import {usePerspective} from '../../../../perspective/usePerspective'
import {useSetPerspective} from '../../../../perspective/useSetPerspective'
import {PublishedRelease} from '../../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../../i18n'
import {isReleaseDocument} from '../../../index'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {useReleasePermissions} from '../../../store/useReleasePermissions'
import {type DocumentInRelease} from '../../detail/useBundleDocuments'

interface ReleasePublishAllButtonProps {
  release: ReleaseDocument
  documents: DocumentInRelease[]
  disabled?: boolean
  isMenuItem?: boolean
  onConfirmDialogOpen?: () => void
  onConfirmDialogClose?: () => void
}

export const ReleasePublishAllButton = ({
  release,
  documents,
  disabled,
  isMenuItem = false,
  onConfirmDialogOpen,
  onConfirmDialogClose,
}: ReleasePublishAllButtonProps) => {
  const toast = useToast()
  const {publishRelease} = useReleaseOperations()
  const {checkWithPermissionGuard} = useReleasePermissions()
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const perspective = usePerspective()
  const setPerspective = useSetPerspective()
  const telemetry = useTelemetry()

  const [publishBundleStatus, setPublishBundleStatus] = useState<'idle' | 'confirm' | 'publishing'>(
    'idle',
  )

  const [publishPermission, setPublishPermission] = useState<boolean>(false)

  const isValidatingDocuments = documents.some(({validation}) => validation.isValidating)
  const hasDocumentValidationErrors = documents.some(({validation}) => validation.hasError)

  const isPublishButtonDisabled =
    disabled || isValidatingDocuments || hasDocumentValidationErrors || !publishPermission

  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true

    checkWithPermissionGuard(publishRelease, release._id).then((hasPermission) => {
      if (isMounted.current) setPublishPermission(hasPermission)
    })

    return () => {
      isMounted.current = false
    }
  }, [checkWithPermissionGuard, publishRelease, release._id, release.metadata.intendedPublishAt])

  const handleConfirmPublishAll = useCallback(async () => {
    if (!release) return

    try {
      setPublishBundleStatus('publishing')
      await publishRelease(release._id)
      telemetry.log(PublishedRelease)
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
              values={{
                title: release.metadata.title || tCore('release.placeholder-untitled-release'),
                error: publishingError.message,
              }}
            />
          </Text>
        ),
      })
      console.error(publishingError)
    } finally {
      onConfirmDialogClose?.()
      setPublishBundleStatus('idle')
    }
  }, [
    release,
    publishRelease,
    telemetry,
    toast,
    t,
    tCore,
    perspective.selectedPerspective,
    setPerspective,
    onConfirmDialogClose,
  ])

  const confirmPublishDialog = useMemo(() => {
    if (publishBundleStatus === 'idle') return null

    return (
      <Dialog
        id="confirm-publish-dialog"
        data-testid="confirm-publish-dialog"
        header={t('publish-dialog.confirm-publish.title')}
        onClose={() => {
          onConfirmDialogClose?.()
          setPublishBundleStatus('idle')
        }}
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
                title: release.metadata.title || tCore('release.placeholder-untitled-release'),
                releaseDocumentsLength: documents.length,
                count: documents.length,
              }}
            />
          }
        </Text>
      </Dialog>
    )
  }, [
    publishBundleStatus,
    t,
    handleConfirmPublishAll,
    release.metadata.title,
    tCore,
    documents.length,
    onConfirmDialogClose,
  ])

  const publishTooltipContent = useMemo(() => {
    if (!hasDocumentValidationErrors && !isValidatingDocuments && publishPermission) return null

    const tooltipText = () => {
      if (documents.length === 0) {
        return t('publish-action.validation.no-documents')
      }

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
  }, [documents.length, hasDocumentValidationErrors, isValidatingDocuments, publishPermission, t])

  const handleInitialPublish = useCallback(() => {
    setPublishBundleStatus('confirm')
    onConfirmDialogOpen?.()
  }, [onConfirmDialogOpen])

  const sharedProps = useMemo(
    () => ({
      icon: PublishIcon,
      disabled:
        isPublishButtonDisabled || publishBundleStatus === 'publishing' || documents.length === 0,
      text: t('action.publish-all-documents'),
      handleOnClick: handleInitialPublish,
      tooltipProps: {
        disabled: !isPublishButtonDisabled,
        content: publishTooltipContent,
        placement: 'bottom',
      } as Partial<TooltipProps>,
    }),
    [
      documents.length,
      handleInitialPublish,
      isPublishButtonDisabled,
      publishBundleStatus,
      publishTooltipContent,
      t,
    ],
  )

  return (
    <>
      {isMenuItem ? (
        <MenuItem
          tooltipProps={sharedProps.tooltipProps}
          icon={sharedProps.icon}
          disabled={sharedProps.disabled}
          text={sharedProps.text}
          onClick={sharedProps.handleOnClick}
          data-testid="publish-all-button-menu-item"
        />
      ) : (
        <Button
          tooltipProps={sharedProps.tooltipProps}
          icon={sharedProps.icon}
          disabled={sharedProps.disabled}
          text={sharedProps.text}
          onClick={sharedProps.handleOnClick}
          loading={publishBundleStatus === 'publishing'}
          data-testid="publish-all-button"
          tone="positive"
        />
      )}
      {confirmPublishDialog}
    </>
  )
}
