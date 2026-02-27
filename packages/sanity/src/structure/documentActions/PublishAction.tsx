import {PublishIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {isValidationErrorMarker} from '@sanity/types'
import {Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  type DocumentActionComponent,
  getVersionFromId,
  InsufficientPermissionsMessage,
  isPublishedPerspective,
  type TFunction,
  useCurrentUser,
  useDocumentOperation,
  useDocumentPairPermissions,
  useEditState,
  usePerspective,
  useRelativeTime,
  useSyncState,
  useTranslation,
  useValidationStatus,
} from 'sanity'

import {structureLocaleNamespace, type StructureLocaleResourceKeys} from '../i18n'
import {useDocumentPane} from '../panes/document/useDocumentPane'
import {
  DocumentPublished,
  PublishButtonDisabledComplete,
  PublishButtonDisabledStart,
  PublishButtonClicked,
} from './__telemetry__/documentActions.telemetry'

const DISABLED_REASON_TITLE_KEY: Record<string, StructureLocaleResourceKeys> = {
  LIVE_EDIT_ENABLED: 'action.publish.live-edit.publish-disabled',
  ALREADY_PUBLISHED: 'action.publish.already-published.no-time-ago.tooltip',
  NO_CHANGES: 'action.publish.no-changes.tooltip',
  NOT_READY: 'action.publish.disabled.not-ready',
} as const

const PUBLISHED_STATE = {status: 'published'} as const

function getDisabledReason(
  reason: keyof typeof DISABLED_REASON_TITLE_KEY,
  publishedAt: string | undefined,
  t: TFunction,
) {
  if (reason === 'ALREADY_PUBLISHED' && publishedAt) {
    return <AlreadyPublished publishedAt={publishedAt} />
  }
  return t(DISABLED_REASON_TITLE_KEY[reason])
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
  const {selectedPerspective} = usePerspective()
  const [publishState, setPublishState] = useState<
    {status: 'publishing'; publishRevision: string | undefined} | {status: 'published'} | null
  >(null)

  const bundleId = version?._id && getVersionFromId(version._id)

  const {publish} = useDocumentOperation(id, type, bundleId)
  const {changesOpen, documentId, documentType, value} = useDocumentPane()
  const validationStatus = useValidationStatus(value._id, type, !release)
  const syncState = useSyncState(id, type)
  const editState = useEditState(documentId, documentType, 'default', bundleId)
  const {t} = useTranslation(structureLocaleNamespace)

  const revision = (editState?.version || editState?.draft || editState?.published || {})._rev
  const toast = useToast()

  const hasValidationErrors = validationStatus.validation.some(isValidationErrorMarker)
  // we use this to "schedule" publish after pending tasks (e.g. validation and sync) has completed
  const [publishScheduled, setPublishScheduled] = useState<boolean>(false)
  const isSyncing = syncState.isSyncing
  const isValidating = validationStatus.isValidating
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'publish',
  })

  const currentUser = useCurrentUser()

  const title = publish.disabled
    ? getDisabledReason(publish.disabled, (published || {})._updatedAt, t) || ''
    : hasValidationErrors
      ? t('action.publish.validation-issues.tooltip')
      : ''

  const currentPublishRevision = published?._rev

  const telemetry = useTelemetry()

  const doPublish = useCallback(() => {
    publish.execute()
    telemetry.log(PublishButtonClicked, {documentId: id, stage: 'started'})
    setPublishState({status: 'publishing', publishRevision: currentPublishRevision})
  }, [publish, currentPublishRevision, telemetry, id])

  useEffect(() => {
    // make sure the validation status is about the current revision and not an earlier one
    const validationComplete =
      !validationStatus.isValidating && validationStatus.revision === revision

    if (!publishScheduled || isSyncing || !validationComplete) {
      return
    }

    if (!hasValidationErrors) {
      doPublish()
    } else {
      // User tried to publish before validation was complete
      toast.push({
        title: t('action.publish.validation-issues-toast.title'),
        description: t('action.publish.validation-issues-toast.description'),
        status: 'error',
      })
    }
    setPublishScheduled(false)
  }, [
    isSyncing,
    doPublish,
    hasValidationErrors,
    publishScheduled,
    validationStatus.revision,
    revision,
    isValidating,
    validationStatus.isValidating,
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

  const handle = useCallback(() => {
    telemetry.log(DocumentPublished, {
      publishedImmediately: !draft?._createdAt,
      previouslyPublished: Boolean(published),
    })
    if (
      syncState.isSyncing ||
      validationStatus.isValidating ||
      validationStatus.revision !== revision
    ) {
      setPublishScheduled(true)
    } else {
      doPublish()
    }
  }, [
    telemetry,
    draft?._createdAt,
    published,
    syncState.isSyncing,
    validationStatus.isValidating,
    validationStatus.revision,
    revision,
    doPublish,
  ])

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
     */
    if (published && !draft && !version) {
      return {
        tone: 'default',
        icon: PublishIcon,
        label: t('action.publish.label'),
        title: getDisabledReason('ALREADY_PUBLISHED', published?._updatedAt, t),
        disabled: true,
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
      }
    }

    const disabled = Boolean(
      publishScheduled ||
      editState?.transactionSyncLock?.enabled ||
      publishState?.status === 'publishing' ||
      publishState?.status === 'published' ||
      hasValidationErrors ||
      publish.disabled,
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
    }
  }, [
    selectedPerspective,
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
    t,
    title,
    handle,
    currentUser,
  ])
}

usePublishAction.action = 'publish'
usePublishAction.displayName = 'PublishAction'
