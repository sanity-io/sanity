import {type ReleaseDocument} from '@sanity/client'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {PublishIcon} from '@sanity/icons/Publish'
import {useTelemetry} from '@sanity/telemetry/react'
import {Card, Checkbox} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {type ChangeEvent, useCallback, useEffect, useId, useMemo, useRef, useState} from 'react'
import {IntentLink} from 'sanity/router'
import {Text, Flex, VStack, Icon} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {Dialog} from '../../../../../ui-components/dialog/Dialog'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {ToneIcon} from '../../../../../ui-components/toneIcon/ToneIcon'
import {type TooltipProps} from '../../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {Translate} from '../../../../i18n/Translate'
import {usePerspective} from '../../../../perspective/usePerspective'
import {useSetPerspective} from '../../../../perspective/useSetPerspective'
import {SanityDefaultPreview} from '../../../../preview/components/SanityDefaultPreview'
import {useWorkspace} from '../../../../studio/workspace'
import {useDocumentPreviewValues} from '../../../../tasks/hooks/useDocumentPreviewValues'
import {getPublishedId} from '../../../../util/draftUtils'
import {PublishedRelease} from '../../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../../i18n'
import {getReleaseImpact} from '../../../model/releaseImpact'
import {isReleaseDocument} from '../../../store/types'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {useReleasePermissions} from '../../../store/useReleasePermissions'
import {type DocumentInRelease} from '../../detail/types'

const DRAFTS_PERSPECTIVE_STACK = ['drafts']
const DRAFTS_SEARCH_PARAMS: [string, string][] = [['perspective', 'drafts']]

/**
 * A draft that would be discarded when the release runs. It opens the draft in a new tab, so the
 * editor can see what would be lost without closing the dialog.
 */
function DraftToDiscardLink({
  documentId,
  documentType,
}: {
  documentId: string
  documentType: string
}) {
  const publishedId = getPublishedId(documentId)
  const {isLoading, value} = useDocumentPreviewValues({
    documentId: publishedId,
    documentType,
    perspectiveStack: DRAFTS_PERSPECTIVE_STACK,
  })
  const params = useMemo(() => ({id: publishedId, type: documentType}), [publishedId, documentType])

  return (
    <Card
      as={IntentLink}
      data-as="a"
      intent="edit"
      params={params}
      searchParams={DRAFTS_SEARCH_PARAMS}
      target="_blank"
      rel="noreferrer"
      radius={2}
      tone="inherit"
    >
      <SanityDefaultPreview {...(value || {})} isPlaceholder={isLoading} layout="compact" />
    </Card>
  )
}

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

  // Members whose draft holds changes the release does not contain. Read from the model-neutral
  // impact, so this keeps working when releases point at lanes instead of holding versions.
  const draftDocuments = useMemo(
    () =>
      getReleaseImpact(documents)
        .filter((impact) => impact.draftDiffers)
        .map((impact) => ({
          _id: impact.lane.kind === 'release-version' ? impact.lane.versionId : impact.groupId,
          _type: impact.documentType,
        })),
    [documents],
  )
  const draftDocumentIds = useMemo(() => draftDocuments.map(({_id}) => _id), [draftDocuments])
  const updateDraftsDescriptionId = useId()
  const draftDocumentsCount = draftDocumentIds.length
  // Documents set to be unpublished are removed from published, so they are not counted as published.
  const unpublishCount = documents.filter(({document: doc}) => isGoingToUnpublish(doc)).length
  const publishCount = documents.length - unpublishCount
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
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- pre-existing violation, to be fixed in a follow-up
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
              <Text muted size={1} as="div" trim={true}>
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
          <Text muted size={1} as="div" trim={true}>
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
        header={t('publish-dialog.confirm-publish.title', {
          title: release.metadata.title || tCore('release.placeholder-untitled-release'),
        })}
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
        <VStack gap={4}>
          {publishCount > 0 && (
            <Text muted size={1} as="p" trim={true}>
              {t('publish-dialog.confirm-publish-description', {
                releaseDocumentsLength: publishCount,
                count: publishCount,
              })}
            </Text>
          )}
          {unpublishCount > 0 && (
            <Text muted size={1} as="p" trim={true}>
              {t('publish-dialog.confirm-unpublish-description', {count: unpublishCount})}
            </Text>
          )}
          {showUpdateDraftsOption && (
            <VStack gap={3}>
              <Flex alignItems="center" gap={3} as="label">
                <Checkbox
                  checked={shouldUpdateDrafts}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setShouldUpdateDrafts(event.currentTarget.checked)
                  }
                  data-testid="update-drafts-checkbox"
                  aria-describedby={updateDraftsDescriptionId}
                />
                <Text size={1} as="div" trim={true}>
                  {t('publish-dialog.confirm-publish.update-drafts-checkbox')}
                </Text>
              </Flex>
              <VStack gap={3} id={updateDraftsDescriptionId}>
                <Text muted size={1} as="p" trim={true}>
                  {t('publish-dialog.confirm-publish.update-drafts-description', {
                    count: draftDocumentsCount,
                    draftDocumentsLength: draftDocumentsCount,
                  })}
                </Text>
                <Text muted size={1} as="p" trim={true}>
                  {t('publish-dialog.confirm-publish.update-drafts-review')}
                </Text>
              </VStack>
              <VStack
                gap={1}
                as="ul"
                data-testid="update-drafts-list"
                style={{listStyle: 'none', margin: 0, padding: 0}}
              >
                {draftDocuments.map((draftDocument) => (
                  <li key={draftDocument._id}>
                    <DraftToDiscardLink
                      documentId={draftDocument._id}
                      documentType={draftDocument._type}
                    />
                  </li>
                ))}
              </VStack>
            </VStack>
          )}
        </VStack>
      </Dialog>
    )
  }, [
    publishBundleStatus,
    t,
    handleConfirmPublishAll,
    release.metadata.title,
    tCore,
    publishCount,
    unpublishCount,
    showUpdateDraftsOption,
    shouldUpdateDrafts,
    draftDocumentsCount,
    draftDocuments,
    updateDraftsDescriptionId,
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
      <Text muted size={1} as="div" trim={true}>
        <Flex alignItems="center" gap={3} padding={1}>
          <Flex style={{marginInline: '-0.375rem'}}>
            <Icon
              size={1}
              icon={
                <ToneIcon
                  icon={ErrorOutlineIcon}
                  tone={isValidatingDocuments ? 'default' : 'critical'}
                />
              }
            />
          </Flex>
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
