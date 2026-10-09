import {PublishIcon} from '@sanity/icons/Publish'
import {useTelemetry} from '@sanity/telemetry/react'
import {isValidationErrorMarker} from '@sanity/types'
import {Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
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
  useImmediateValidation,
  usePerspective,
  useRelativeTime,
  useSyncState,
  useTranslation,
  useValidationStatus,
} from 'sanity'

import {Button} from '../../ui-components/button/Button'
import {structureLocaleNamespace} from '../i18n'
import {useDocumentPane} from '../panes/document/useDocumentPane'
import {
  DocumentPublished,
  PublishButtonDisabledComplete,
  PublishButtonDisabledStart,
  PublishButtonClicked,
} from './__telemetry__/documentActions.telemetry'
import {PUBLISH_DISABLED_REASON} from './operationDisabledReasons'
import {PublishProgress} from './PublishProgress'

const PUBLISHED_STATE = {status: 'published'} as const

/**
 * How long a publish may take, validation and publishing included, before a dialog takes over the
 * view to show how far it has got. A publish still waiting on validation at that point also gets
 * its own validation run without idle-callback pacing (see `useImmediateValidation`): until then
 * editing-style pacing keeps the studio responsive, after that the user is clearly waiting on the
 * result.
 */
const PUBLISH_PROGRESS_DIALOG_DELAY = 3000

/** How long a completed publish stays on screen in the progress dialog before it closes. */
const PUBLISH_PROGRESS_CLOSE_DELAY = 2000

/** One publish, from the click until it has been published, failed, or was dismissed. */
interface PublishAttempt {
  startedAt: number
  /** The outcome of the validation this attempt is gated on, once it is complete. */
  validation?: {errorCount: number}
  /** Set once `publish.execute()` has been called, with the published revision at that moment. */
  publishing?: {revision: string | undefined}
  /** The operation event current at the click, so only a later publish error counts as this attempt's. */
  eventAtStart: ReturnType<typeof useDocumentOperationEvent>
}

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

  const documentToValidate = editState?.version || editState?.draft || editState?.published
  const revision = documentToValidate?._rev
  const toast = useToast()

  const validationErrorCount = validationStatus.validation.filter(isValidationErrorMarker).length
  const hasValidationErrors = validationErrorCount > 0
  // we use this to "schedule" publish after pending tasks (e.g. validation and sync) has completed
  const [publishScheduled, setPublishScheduled] = useState<boolean>(false)
  const isSyncing = syncState.isSyncing
  const isValidating = validationStatus.isValidating

  // The publish in progress, and whether its progress dialog has been shown.
  const [attempt, setAttempt] = useState<PublishAttempt | null>(null)
  const [progressShown, setProgressShown] = useState(false)
  const operationEvent = useDocumentOperationEvent(id, type)
  const operationEventRef = useRef(operationEvent)
  useEffect(() => {
    operationEventRef.current = operationEvent
  }, [operationEvent])

  const currentPublishRevision = publishedInfo?._rev
  const publishError =
    attempt !== null &&
    operationEvent !== attempt.eventAtStart &&
    operationEvent?.type === 'error' &&
    operationEvent.op === 'publish'
  const validationFailed =
    attempt !== null && !attempt.publishing && (attempt.validation?.errorCount ?? 0) > 0
  const publishSucceeded =
    attempt?.publishing !== undefined && currentPublishRevision !== attempt.publishing.revision
  const attemptOutcome = !attempt
    ? null
    : publishError || validationFailed
      ? 'failed'
      : publishSucceeded
        ? 'succeeded'
        : 'in-progress'

  // Show the dialog once the publish has been going for a while and has not finished.
  useEffect(() => {
    if (!attempt || attemptOutcome !== 'in-progress' || progressShown) return undefined
    const timer = setTimeout(
      () => setProgressShown(true),
      Math.max(0, PUBLISH_PROGRESS_DIALOG_DELAY - (Date.now() - attempt.startedAt)),
    )
    return () => clearTimeout(timer)
  }, [attempt, attemptOutcome, progressShown])

  // Escape hatch for validation that is taking long: once the dialog is up and the publish is
  // still waiting on validation, validate the document right away, without the idle-callback
  // pacing of the store's validation (a busy or hidden page grants few or none), blocking the
  // main thread if need be. The dialog is committed before the run starts, so it is on screen
  // first. The store's validation carries on untouched, and whichever of the two finishes first
  // for the current revision decides the publish.
  const immediateValidation = useImmediateValidation(
    documentToValidate,
    !release,
    progressShown && publishScheduled,
  )
  const completedValidation = [immediateValidation, validationStatus].find(isCompleteFor(revision))

  // A finished publish leaves the dialog up for a moment; a failed one stays until dismissed,
  // unless the dialog never showed.
  useEffect(() => {
    if (attemptOutcome !== 'succeeded' && !(attemptOutcome === 'failed' && !progressShown)) {
      return undefined
    }
    const timer = setTimeout(
      () => {
        setAttempt(null)
        setProgressShown(false)
      },
      attemptOutcome === 'succeeded' && progressShown ? PUBLISH_PROGRESS_CLOSE_DELAY : 0,
    )
    return () => clearTimeout(timer)
  }, [attemptOutcome, progressShown])
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

  const telemetry = useTelemetry()

  const doPublish = useCallback(() => {
    publish.execute(isVariantTarget ? {publishedRevisionId: currentPublishRevision} : undefined)
    telemetry.log(PublishButtonClicked, {documentId: id, stage: 'started'})
    setPublishState({status: 'publishing', publishRevision: currentPublishRevision})
    setAttempt((current) =>
      current ? {...current, publishing: {revision: currentPublishRevision}} : current,
    )
  }, [publish, isVariantTarget, currentPublishRevision, telemetry, id, setAttempt])

  useEffect(() => {
    if (!publishScheduled || isSyncing || !completedValidation) {
      return
    }

    const errorCount = completedValidation.validation.filter(isValidationErrorMarker).length
    // oxlint-disable-next-line react/set-state-in-effect -- the result arrives as hook state, not as an event; same pre-existing shape as `doPublish()` below
    setAttempt((current) => (current ? {...current, validation: {errorCount}} : current))
    if (errorCount === 0) {
      doPublish()
    } else if (!progressShown) {
      // User tried to publish before validation was complete; the progress dialog, when it is up,
      // already shows the errors
      toast.push({
        title: t('action.publish.validation-issues-toast.title'),
        description: t('action.publish.validation-issues-toast.description'),
        status: 'error',
      })
    }
    setPublishScheduled(false)
  }, [completedValidation, doPublish, isSyncing, progressShown, publishScheduled, t, toast])

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
    const waitForValidation = shouldSetPublishScheduledRef.current
    setAttempt({
      startedAt: Date.now(),
      eventAtStart: operationEventRef.current,
      // the button is only enabled once the current document has validated without errors
      validation: waitForValidation ? undefined : {errorCount: 0},
    })
    setProgressShown(false)
    if (waitForValidation) {
      setPublishScheduled(true)
    } else {
      doPublish()
    }
  }, [
    publishedImmediately,
    previouslyPublished,
    telemetry,
    setAttempt,
    setProgressShown,
    setPublishScheduled,
    doPublish,
  ])

  const closeProgress = useCallback(() => {
    setAttempt(null)
    setProgressShown(false)
  }, [setAttempt, setProgressShown])

  // While the publish is in progress nothing else should be reachable, so the dialog cannot be
  // closed; once it has failed it can.
  const progressDialogOpen = progressShown && attempt !== null
  // `undefined` while the validation the attempt is gated on is still running
  const validatedErrorCount = attempt?.validation?.errorCount
  const publishStarted = attempt?.publishing !== undefined
  const progressDialog = useMemo(
    () =>
      progressDialogOpen
        ? ({
            type: 'dialog' as const,
            header: t('action.publish.progress.title'),
            content: (
              <PublishProgress
                validation={
                  validatedErrorCount === undefined
                    ? {status: 'running'}
                    : validatedErrorCount > 0
                      ? {status: 'failed', errorCount: validatedErrorCount}
                      : {status: 'passed'}
                }
                publish={
                  publishError
                    ? 'failed'
                    : publishSucceeded
                      ? 'succeeded'
                      : publishStarted
                        ? 'running'
                        : 'pending'
                }
              />
            ),
            onClose: attemptOutcome === 'failed' ? closeProgress : () => undefined,
            showCloseButton: attemptOutcome === 'failed',
            footer:
              attemptOutcome === 'failed' ? (
                <Button
                  mode="ghost"
                  text={t('action.publish.progress.close')}
                  onClick={closeProgress}
                  data-testid="publish-progress-close"
                />
              ) : undefined,
            width: 'small' as const,
          } satisfies DocumentActionDescription['dialog'])
        : undefined,
    [
      attemptOutcome,
      closeProgress,
      progressDialogOpen,
      publishError,
      publishStarted,
      publishSucceeded,
      t,
      validatedErrorCount,
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
