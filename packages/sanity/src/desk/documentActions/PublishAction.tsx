import {CheckmarkIcon, PublishIcon} from '@sanity/icons'
import {isValidationErrorMarker} from '@sanity/types'
import React, {useCallback, useEffect, useState} from 'react'
import {TimeAgo} from '../components'
import {useDocumentPane} from '../panes/document/useDocumentPane'
import {
  DocumentActionComponent,
  InsufficientPermissionsMessage,
  useCurrentUser,
  useDocumentOperation,
  useDocumentPairPermissions,
  useEditState,
  useSyncState,
  useValidationStatus,
} from 'sanity'

const DISABLED_REASON_TITLE = {
  LIVE_EDIT_ENABLED: 'Cannot publish since liveEdit is enabled for this document type',
  ALREADY_PUBLISHED: 'Already published',
  NO_CHANGES: 'No unpublished changes',
  NOT_READY: 'Operation not ready',
}

function getDisabledReason(
  reason: keyof typeof DISABLED_REASON_TITLE,
  publishedAt: string | undefined,
) {
  if (reason === 'ALREADY_PUBLISHED' && publishedAt) {
    return (
      <>
        <span>
          Published <TimeAgo time={publishedAt} />
        </span>
      </>
    )
  }
  return DISABLED_REASON_TITLE[reason]
}

/** @internal */
// eslint-disable-next-line complexity
export const PublishAction: DocumentActionComponent = (props) => {
  const {id, type, liveEdit, draft, published} = props
  const [publishState, setPublishState] = useState<'publishing' | 'published' | null>(null)
  const {publish} = useDocumentOperation(id, type)
  const validationStatus = useValidationStatus(id, type)
  const syncState = useSyncState(id, type)
  const {changesOpen, onHistoryOpen, documentId, documentType} = useDocumentPane()
  const editState = useEditState(documentId, documentType)

  const revision = (editState?.draft || editState?.published || {})._rev

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

  // eslint-disable-next-line no-nested-ternary
  const title = publish.disabled
    ? getDisabledReason(publish.disabled, (published || {})._updatedAt) || ''
    : hasValidationErrors
    ? 'There are validation errors that need to be fixed before this document can be published'
    : ''

  const hasDraft = Boolean(draft)

  const doPublish = useCallback(() => {
    publish.execute()
    setPublishState('publishing')
  }, [publish])

  useEffect(() => {
    // make sure the validation status is about the current revision and not an earlier one
    const validationComplete =
      validationStatus.isValidating === false && validationStatus.revision !== revision

    if (!publishScheduled || isSyncing || !validationComplete) {
      return
    }

    if (!hasValidationErrors) {
      doPublish()
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
  ])

  useEffect(() => {
    const didPublish = publishState === 'publishing' && !hasDraft
    if (didPublish) {
      if (changesOpen) {
        // Re-open the panel
        onHistoryOpen()
      }
    }
    const nextState = didPublish ? 'published' : null
    const delay = didPublish ? 200 : 4000
    const timer = setTimeout(() => {
      setPublishState(nextState)
    }, delay)
    return () => clearTimeout(timer)
  }, [changesOpen, publishState, hasDraft, onHistoryOpen])

  const handle = useCallback(() => {
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
    syncState.isSyncing,
    validationStatus.isValidating,
    validationStatus.revision,
    revision,
    doPublish,
  ])

  if (liveEdit) {
    return {
      tone: 'default',
      label: 'Publish',
      title:
        'Live Edit is enabled for this content type and publishing happens automatically as you make changes',
      disabled: true,
    }
  }

  if (!isPermissionsLoading && !permissions?.granted) {
    return {
      tone: 'default',
      label: 'Publish',
      title: (
        <InsufficientPermissionsMessage
          operationLabel="publish this document"
          currentUser={currentUser}
        />
      ),
      disabled: true,
    }
  }

  const disabled = Boolean(
    publishScheduled ||
      editState?.transactionSyncLock?.enabled ||
      publishState === 'publishing' ||
      publishState === 'published' ||
      hasValidationErrors ||
      publish.disabled,
  )

  return {
    disabled: disabled || isPermissionsLoading,
    tone: 'default',
    label:
      // eslint-disable-next-line no-nested-ternary
      publishState === 'published'
        ? 'Published'
        : publishScheduled || publishState === 'publishing'
        ? 'Publishing…'
        : 'Publish',
    // @todo: Implement loading state, to show a `<Button loading />` state
    // loading: publishScheduled || publishState === 'publishing',
    icon: publishState === 'published' ? CheckmarkIcon : PublishIcon,
    // eslint-disable-next-line no-nested-ternary
    title: publishScheduled
      ? 'Waiting for tasks to finish before publishing'
      : publishState === 'published' || publishState === 'publishing'
      ? null
      : title,
    shortcut: disabled || publishScheduled ? null : 'Ctrl+Alt+P',
    onHandle: handle,
  }
}

PublishAction.action = 'publish'
