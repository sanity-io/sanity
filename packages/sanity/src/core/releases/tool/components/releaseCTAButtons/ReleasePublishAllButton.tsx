import {type ReleaseDocument} from '@sanity/client'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {PublishIcon} from '@sanity/icons/Publish'
import {useTelemetry} from '@sanity/telemetry/react'
import {Checkbox, Flex, Stack, Text, useToast} from '@sanity/ui'
import {type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {Button, Dialog, MenuItem, type TooltipProps} from '../../../../../ui-components'
import {ToneIcon} from '../../../../../ui-components/toneIcon/ToneIcon'
import {Translate, useTranslation} from '../../../../i18n'
import {usePerspective} from '../../../../perspective/usePerspective'
import {useSetPerspective} from '../../../../perspective/useSetPerspective'
import {useWorkspace} from '../../../../studio/workspace'
import {PublishedRelease} from '../../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../../i18n'
import {isReleaseDocument} from '../../../index'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {useReleasePermissions} from '../../../store/useReleasePermissions'
import {isGoingToUnpublish} from '../../../util/isGoingToUnpublish'
import {type DocumentInRelease} from '../../detail/types'

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
  const {publishRelease, discardDrafts} = useReleaseOperations()
  const {checkWithPermissionGuard} = useReleasePermissions()
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const perspective = usePerspective()
  const setPerspective = useSetPerspective()
  const telemetry = useTelemetry()
  const {document} = useWorkspace()
  const {
    drafts: {enabled: isDraftModelEnabled},
  } = document

  const [publishBundleStatus, setPublishBundleStatus] = useState<'idle' | 'confirm' | 'publishing'>(
    'idle',
  )
  const [shouldUpdateDrafts, setShouldUpdateDrafts] = useState(false)

  const [publishPermission, setPublishPermission] = useState<boolean>(false)

  // documents that also have an existing draft, which would become outdated once the release
  // is published (documents set to be unpublished are excluded, since publishing intentionally
  // keeps or creates a draft for them so that their content is not lost)
  const draftDocumentIds = useMemo(
    () =>
      documents
        .filter(
          (releaseDocument) =>
            releaseDocument.document.draftDocumentExists &&
            !isGoingToUnpublish(releaseDocument.document),
        )
        .map((releaseDocument) => releaseDocument.document._id),
    [documents],
  )
  const draftDocumentsCount = draftDocumentIds.length
  const showUpdateDraftsOption = isDraftModelEnabled && draftDocumentsCount > 0

  const isValidatingDocuments = documents.some(({validation}) => validation.isValidating)
  const hasDocumentValidationErrors = documents.some(({validation}) => validation.hasError)

  const isPublishButtonDisabled =
    disabled || isValidatingDocuments || hasDocumentValidationErrors || !publishPermission

  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true

    void checkWithPermissionGuard(publishRelease, release._id).then((hasPermission) => {
      if (isMounted.current) setPublishPermission(hasPermission)
    })

    return () => {
      isMounted.current = false
    }
  }, [checkWithPermissionGuard, publishRelease, release._id, release.metadata.intendedPublishAt])

  const handleConfirmPublishAll = useCallback(async () => {
    if (!release) return

    // Workaround for React Compiler not yet fully supporting try/catch/finally syntax
    const run = async () => {
      setPublishBundleStatus('publishing')
      await publishRelease(release._id)
      telemetry.log(PublishedRelease)
      if (showUpdateDraftsOption && shouldUpdateDrafts) {
        // the release has been published at this point, so a failure to update the drafts should
        // not surface as a failure to publish the release
        await discardDrafts(draftDocumentIds).catch((updateDraftsError) => {
          toast.push({
            status: 'warning',
            title: (
              <Text muted size={1}>
                <Translate
                  t={t}
                  i18nKey="toast.publish.update-drafts-error"
                  values={{error: updateDraftsError.message}}
                />
              </Text>
            ),
          })
          console.error(updateDraftsError)
        })
      }
      if (
        isReleaseDocument(perspective.selectedPerspective) &&
        perspective.selectedPerspective?._id === release._id
      ) {
        setPerspective(isDraftModelEnabled ? 'drafts' : 'published')
      }
    }
    try {
      await run()
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
    }
    onConfirmDialogClose?.()
    setPublishBundleStatus('idle')
  }, [
    release,
    publishRelease,
    telemetry,
    showUpdateDraftsOption,
    shouldUpdateDrafts,
    discardDrafts,
    draftDocumentIds,
    perspective.selectedPerspective,
    setPerspective,
    isDraftModelEnabled,
    toast,
    t,
    tCore,
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
        <Stack space={4}>
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
          {showUpdateDraftsOption && (
            <Stack space={3}>
              <Flex align="center" gap={3} as="label">
                <Checkbox
                  checked={shouldUpdateDrafts}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setShouldUpdateDrafts(event.currentTarget.checked)
                  }
                  data-testid="update-drafts-checkbox"
                />
                <Text size={1}>{t('publish-dialog.confirm-publish.update-drafts-checkbox')}</Text>
              </Flex>
              <Text muted size={1}>
                {t('publish-dialog.confirm-publish.update-drafts-description', {
                  count: draftDocumentsCount,
                  draftDocumentsLength: draftDocumentsCount,
                })}
              </Text>
            </Stack>
          )}
        </Stack>
      </Dialog>
    )
  }, [
    publishBundleStatus,
    t,
    handleConfirmPublishAll,
    release.metadata.title,
    tCore,
    documents.length,
    showUpdateDraftsOption,
    shouldUpdateDrafts,
    draftDocumentsCount,
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
    setShouldUpdateDrafts(false)
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
