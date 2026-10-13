import {PublishIcon} from '@sanity/icons/Publish'
import {useTelemetry} from '@sanity/telemetry/react'
import {isValidationErrorMarker} from '@sanity/types'
import {Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import debounce from 'lodash-es/debounce.js'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  getDefaultVariant,
  getPairTarget,
  getTargetScopeId,
  getTargetSiblings,
  InsufficientPermissionsMessage,
  isPublishedPerspective,
  type TFunction,
  useCurrentUser,
  useDocumentOperation,
  useDocumentOperationEvent,
  useDocumentPairPermissions,
  useEditState,
  usePerspective,
  useRelativeTime,
  useSyncState,
  useTranslation,
  useValidationStatus,
} from 'sanity'

import {structureLocaleNamespace} from '../i18n'
import {useDocumentPane} from '../panes/document/useDocumentPane'
import {
  DocumentPublished,
  PublishButtonDisabledComplete,
  PublishButtonDisabledStart,
  PublishButtonClicked,
} from './__telemetry__/documentActions.telemetry'
import {PUBLISH_DISABLED_REASON} from './operationDisabledReasons'
import {type PublishPhase, PublishProgressDialog} from './PublishProgressDialog'

const PUBLISHED_STATE = {status: 'published'} as const

/**
 * How long a publish may take, validation and publishing included, before a dialog takes over the
 * view to show how far it has got (see `PublishProgressDialog`). Until then the publish behaves
 * as it always has; after that the user is clearly waiting on the result.
 */
const PUBLISH_PROGRESS_DIALOG_DELAY = 5000

/** How long a completed publish stays on screen in the progress dialog before it closes. */
const PUBLISH_PROGRESS_CLOSE_DELAY = 2000

type ValidationStatus = ReturnType<typeof useValidationStatus>

/** Whether `status` is a finished validation of the document at `revision`, not an earlier one. */
function isCompleteFor(revision: string | undefined) {
  return (status: ValidationStatus | null): status is ValidationStatus =>
    status !== null && !status.isValidating && status.revision === revision
}

function getDisabledReason(
  reason: keyof typeof PUBLISH_DISABLED_REASON,
  publishedAt: string | undefined,
  t: TFunction,
) {
  if (reason === 'ALREADY_PUBLISHED' && publishedAt) {
    return <AlreadyPublished publishedAt={publishedAt} />
  }
  return t(PUBLISH_DISABLED_REASON[reason])
}

function AlreadyPublished({publishedAt}: {publishedAt: string}) {
  const {t} = useTranslation(structureLocaleNamespace)
  const timeSincePublished = useRelativeTime(publishedAt, {useTemporalPhrase: true})
  return <Text>{t('action.publish.already-published.tooltip', {timeSincePublished})}</Text>
}

// React Compiler needs functions that are hooks to have the `use` prefix, pascal case are treated as a component, these are hooks even though they're confusingly named `DocumentActionComponent`
/** @internal */
export const usePublishAction: DocumentActionComponent = (props) => {
  const {id, type, liveEdit, draft, published, release, version} = props
  const {selectedPerspective, selectedVariantNames} = usePerspective()
  const selectedVariantName = getDefaultVariant(selectedVariantNames)
  const [publishState, setPublishState] = useState<
    {status: 'publishing'; publishRevision: string | undefined} | {status: 'published'} | null
  >(null)

  const {changesOpen, documentId, documentType, value, targetDocumentState} = useDocumentPane()
  // The scope of the document targeted by the selected perspective (undefined when the target is
  // still resolving or the draft/published pair applies). While resolving, the action is disabled
  // below instead of silently operating on the base pair.
  const isTargetReady = targetDocumentState.status === 'ready'
  const scopeId = getTargetScopeId(targetDocumentState)
  const isVariantTarget = isTargetReady && targetDocumentState.variant !== undefined
  const siblings = getTargetSiblings(targetDocumentState)
  // Publish-state timestamps and completion tracking live on the current lane's published sibling.
  // (While the target is resolving, the action is disabled below.)
  const publishedInfo = siblings?.published

  const {publish} = useDocumentOperation(id, type, getPairTarget(targetDocumentState))
  const validationStatus = useValidationStatus(value._id, type, !release)
  const syncState = useSyncState(id, type, scopeId)
  const editState = useEditState(documentId, documentType, 'default', scopeId)
  const {t} = useTranslation(structureLocaleNamespace)

  const revision = (editState?.version || editState?.draft || editState?.published || {})._rev
  const toast = useToast()

  const hasValidationErrors = validationStatus.validation.some(isValidationErrorMarker)
  // we use this to "schedule" publish after pending tasks (e.g. validation and sync) has completed
  const [publishScheduled, setPublishScheduled] = useState<boolean>(false)
  const isSyncing = syncState.isSyncing
  const isValidating = validationStatus.isValidating

  // The progress dialog shows up once a publish has been going on for a while: `open` is asked
  // for at the click and `close` when the publish is done, and the debounce lets the last call
  // win, so a publish that is done within the delay never shows it.
  const [dialogOpen, setDialogOpen] = useState(false)
  const toggleDialog = useMemo(
    () =>
      debounce(
        (state: 'open' | 'close') => setDialogOpen(state === 'open'),
        PUBLISH_PROGRESS_DIALOG_DELAY,
      ),
    [setDialogOpen],
  )
  useEffect(() => () => toggleDialog.cancel(), [toggleDialog])
  const closeDialog = useCallback(() => {
    toggleDialog.cancel()
    setDialogOpen(false)
  }, [setDialogOpen, toggleDialog])
  // Once the dialog is up it validates the document on its own, without idle pacing; its status
  // counts as much as the store's: whichever is a complete validation of the current revision
  // first decides. `null` while the dialog is not running one.
  const [immediateValidation, setImmediateValidation] = useState<ValidationStatus | null>(null)
  const completedValidation = [immediateValidation, validationStatus].find(isCompleteFor(revision))
  const completedValidationErrorCount =
    completedValidation?.validation.filter(isValidationErrorMarker).length ?? 0
  // The number of errors the validation this publish waited on ended with, for the dialog. Kept
  // apart from the statuses, which move on (the store validates again on its own).
  const [validationFailure, setValidationFailure] = useState<number | null>(null)
  // The operation event current at the click, so that only a later publish error counts.
  const operationEvent = useDocumentOperationEvent(id, type)
  const operationEventRef = useRef(operationEvent)
  useEffect(() => {
    operationEventRef.current = operationEvent
  }, [operationEvent])
  const [eventAtClick, setEventAtClick] = useState(operationEvent)
  const publishError =
    operationEvent !== eventAtClick &&
    operationEvent?.type === 'error' &&
    operationEvent.op === 'publish'
  // The published revision when this publish was executed: the publish has landed once it has
  // changed. `publishState` cannot tell the dialog that, as it gives up after a few seconds.
  const [dialogPublish, setDialogPublish] = useState<{revision: string | undefined} | null>(null)

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    version: scopeId,
    permission: 'publish',
  })

  const currentUser = useCurrentUser()

  const title = publish.disabled
    ? getDisabledReason(publish.disabled, publishedInfo?._updatedAt, t) || ''
    : hasValidationErrors
      ? t('action.publish.validation-issues.tooltip')
      : ''

  const currentPublishRevision = publishedInfo?._rev

  const telemetry = useTelemetry()

  const doPublish = useCallback(() => {
    publish.execute(isVariantTarget ? {publishedRevisionId: currentPublishRevision} : undefined)
    telemetry.log(PublishButtonClicked, {documentId: id, stage: 'started'})
    setPublishState({status: 'publishing', publishRevision: currentPublishRevision})
    setDialogPublish({revision: currentPublishRevision})
  }, [publish, isVariantTarget, currentPublishRevision, telemetry, id, setDialogPublish])

  useEffect(() => {
    // make sure the validation status is about the current revision and not an earlier one
    if (!publishScheduled || isSyncing || !completedValidation) {
      return
    }

    if (completedValidationErrorCount === 0) {
      // oxlint-disable-next-line react/set-state-in-effect -- pre-existing violation, to be fixed in a follow-up
      doPublish()
    } else {
      setValidationFailure(completedValidationErrorCount)
      // the progress dialog, once it is up, shows the errors itself and stays until dismissed
      if (!dialogOpen) {
        // User tried to publish before validation was complete
        toast.push({
          title: t('action.publish.validation-issues-toast.title'),
          description: t('action.publish.validation-issues-toast.description'),
          status: 'error',
        })
        toggleDialog.cancel()
      }
    }
    setPublishScheduled(false)
  }, [
    isSyncing,
    doPublish,
    publishScheduled,
    completedValidation,
    completedValidationErrorCount,
    dialogOpen,
    toggleDialog,
    toast,
    t,
  ])

  useEffect(() => {
    const didPublish =
      // All we need to check here is for the revision of the current published document
      // to be different from what it was at the time of publish
      // a successful publish will always lead to a new published revision
      publishState?.status === 'publishing' &&
      currentPublishRevision !== publishState.publishRevision

    if (didPublish) {
      telemetry.log(PublishButtonClicked, {documentId: id, stage: 'completed'})
    }

    const nextState = didPublish ? PUBLISHED_STATE : null
    const delay = didPublish ? 200 : 4000
    const timer = setTimeout(() => {
      if (
        publishState?.status === 'publishing' &&
        currentPublishRevision === publishState.publishRevision
      ) {
        telemetry.log(PublishButtonClicked, {documentId: id, stage: 'failed'})
      }
      setPublishState(nextState)
    }, delay)
    return () => clearTimeout(timer)
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- pre-existing violation, to be fixed in a follow-up
  }, [changesOpen, publishState, currentPublishRevision, telemetry, id])

  // Where the publish has got to, for the progress dialog; `null` once there is nothing to show.
  const publishLanded = dialogPublish !== null && currentPublishRevision !== dialogPublish.revision
  const phase: PublishPhase | null = publishError
    ? 'publish-failed'
    : publishScheduled
      ? 'validating'
      : dialogPublish !== null
        ? publishLanded
          ? 'published'
          : 'publishing'
        : validationFailure !== null
          ? 'validation-failed'
          : null
  // The dialog can be dismissed once the publish has failed, and once `publishState` has given
  // up on a publish that has not landed, so that a publish that silently went nowhere does not
  // hold the view.
  const dialogDismissible =
    phase === 'validation-failed' ||
    phase === 'publish-failed' ||
    (phase === 'publishing' && publishState === null)

  // Closing the dialog: a publish that is done (or has failed, which is the toast's to report)
  // before it showed never shows it; one that is done while it is up leaves both steps on screen
  // for a moment first; a failed phase stays until dismissed.
  useEffect(() => {
    if (phase === 'published' && dialogOpen) {
      const timer = setTimeout(closeDialog, PUBLISH_PROGRESS_CLOSE_DELAY)
      return () => clearTimeout(timer)
    }
    if ((phase === 'published' || phase === 'publish-failed' || phase === null) && !dialogOpen) {
      toggleDialog.cancel()
    }
    return undefined
  }, [closeDialog, dialogOpen, phase, toggleDialog])

  const isWaitingToPublish = Boolean(
    (draft || version) &&
    (publishScheduled || editState?.transactionSyncLock?.enabled || isPermissionsLoading),
  )

  useEffect(() => {
    if (!isWaitingToPublish) return undefined
    telemetry.log(PublishButtonDisabledStart, {
      documentId: id,
      isRemoteEvent: editState?.transactionSyncLock?.enabled,
    })
    return () => {
      telemetry.log(PublishButtonDisabledComplete, {
        documentId: id,
        isRemoteEvent: editState?.transactionSyncLock?.enabled,
      })
    }
  }, [isWaitingToPublish, telemetry, id, editState?.transactionSyncLock?.enabled])

  const publishedImmediately = !draft?._createdAt
  const previouslyPublished = Boolean(publishedInfo)
  const shouldSetPublishScheduled =
    isSyncing || isValidating || validationStatus.revision !== revision

  // This value flips on every keystroke (`isSyncing`), so it lives in a ref to keep `handle`
  // stable; the hook collection compares the action description by reference for functions.
  const shouldSetPublishScheduledRef = useRef(shouldSetPublishScheduled)
  useEffect(() => {
    shouldSetPublishScheduledRef.current = shouldSetPublishScheduled
  }, [shouldSetPublishScheduled])

  const handle = useCallback(() => {
    telemetry.log(DocumentPublished, {
      publishedImmediately,
      previouslyPublished,
    })
    setImmediateValidation(null)
    setValidationFailure(null)
    setEventAtClick(operationEventRef.current)
    setDialogPublish(null)
    setDialogOpen(false)
    toggleDialog('open')
    if (shouldSetPublishScheduledRef.current) {
      setPublishScheduled(true)
    } else {
      doPublish()
    }
  }, [
    publishedImmediately,
    previouslyPublished,
    telemetry,
    setImmediateValidation,
    setValidationFailure,
    setEventAtClick,
    setDialogPublish,
    setDialogOpen,
    setPublishScheduled,
    doPublish,
    toggleDialog,
  ])

  const documentToValidate = editState?.version || editState?.draft || editState?.published
  const requirePublishedReferences = !release
  const progressDialog = useMemo(
    () =>
      dialogOpen && phase !== null
        ? ({
            type: 'custom' as const,
            component: (
              <PublishProgressDialog
                phase={phase}
                errorCount={validationFailure ?? 0}
                validationTarget={documentToValidate}
                requirePublishedReferences={requirePublishedReferences}
                onValidation={setImmediateValidation}
                onClose={dialogDismissible ? closeDialog : undefined}
              />
            ),
          } satisfies DocumentActionDescription['dialog'])
        : undefined,
    [
      closeDialog,
      dialogDismissible,
      dialogOpen,
      documentToValidate,
      phase,
      requirePublishedReferences,
      setImmediateValidation,
      validationFailure,
    ],
  )

  return useMemo(() => {
    if (isPublishedPerspective(selectedPerspective)) {
      // never show publish action on a published document
      return null
    }

    if (release && version) {
      // release versions are not publishable by this action, they should be published as part of a release
      return null
    }

    if (liveEdit && !version) {
      // disable publish if liveEdit is true and we're not on a version
      // e.g. if liveEdit is true and we have a version, we want to allow publish
      // note that liveEdit is "forced" on version documents as a hack of sorts
      return null
    }

    /**
     * When draft is null, if not a published or version document
     * then it means the draft is yet to be saved - in this case don't disabled
     * the publish button due to ALREADY_PUBLISHED reason
     *
     * Skipped when a variant is selected: the base published document says nothing about the
     * variant's publish state (the store-level disabled reasons and target guards apply instead).
     */
    if (published && !draft && !version && !selectedVariantName) {
      return {
        tone: 'default',
        icon: PublishIcon,
        label: t('action.publish.label'),
        title: getDisabledReason('ALREADY_PUBLISHED', published?._updatedAt, t),
        disabled: true,
        // publishing removes the draft, which lands here while the progress dialog is still up
        dialog: progressDialog,
      }
    }

    if (!isPermissionsLoading && !permissions?.granted) {
      return {
        tone: 'default',
        icon: PublishIcon,
        label: t('action.publish.label'),
        title: (
          <InsufficientPermissionsMessage context="publish-document" currentUser={currentUser} />
        ),
        disabled: true,
        dialog: progressDialog,
      }
    }

    const disabled = Boolean(
      publishScheduled ||
      editState?.transactionSyncLock?.enabled ||
      publishState?.status === 'publishing' ||
      publishState?.status === 'published' ||
      hasValidationErrors ||
      publish.disabled ||
      !isTargetReady,
    )

    return {
      disabled: disabled || isPermissionsLoading,
      tone: 'default',
      label:
        publishState?.status === 'published'
          ? t('action.publish.published.label')
          : publishScheduled
            ? t('action.publish.validation-in-progress.label')
            : publishState?.status === 'publishing'
              ? t('action.publish.running.label')
              : t('action.publish.draft.label'),
      // @todo: Implement loading state, to show a `<Button loading />` state
      // loading: publishScheduled || publishState === 'publishing',
      icon: PublishIcon,
      title: publishScheduled
        ? t('action.publish.waiting')
        : publishState?.status === 'published' || publishState?.status === 'publishing'
          ? null
          : title,
      shortcut: disabled || publishScheduled ? null : 'Ctrl+Alt+P',
      onHandle: handle,
      dialog: progressDialog,
    }
  }, [
    selectedPerspective,
    selectedVariantName,
    release,
    liveEdit,
    version,
    draft,
    published,
    isPermissionsLoading,
    permissions?.granted,
    publishScheduled,
    editState?.transactionSyncLock?.enabled,
    publishState,
    hasValidationErrors,
    publish.disabled,
    isTargetReady,
    t,
    title,
    handle,
    currentUser,
    progressDialog,
  ])
}

usePublishAction.action = 'publish'
usePublishAction.displayName = 'PublishAction'
