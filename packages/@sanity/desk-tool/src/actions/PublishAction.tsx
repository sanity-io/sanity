import {DocumentActionComponent} from '@sanity/base'
import {useSyncState, useDocumentOperation, useValidationStatus} from '@sanity/react-hooks'
import {CheckmarkIcon, PublishIcon} from '@sanity/icons'
import React, {useCallback, useEffect, useState} from 'react'
import {
  useCurrentUser,
  unstable_useDocumentPairPermissions as useDocumentPairPermissions,
} from '@sanity/base/hooks'
import {InsufficientPermissionsMessage} from '@sanity/base/components'
import {useToast} from '@sanity/ui'
import {TimeAgo} from '../components/TimeAgo'
import {useDocumentPane} from '../panes/document/useDocumentPane'

const DISABLED_REASON_TITLE = {
  LIVE_EDIT_ENABLED: 'Cannot publish since liveEdit is enabled for this document type',
  ALREADY_PUBLISHED: 'Already published',
  NO_CHANGES: 'No unpublished changes',
  NOT_READY: 'Operation not ready',
}

function getDisabledReason(
  reason: keyof typeof DISABLED_REASON_TITLE,
  publishedAt: string | undefined
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

// eslint-disable-next-line complexity
export const PublishAction: DocumentActionComponent = (props) => {
  const {id, type, liveEdit, draft, published} = props
  const {publish} = useDocumentOperation(id, type)
  const validationStatus = useValidationStatus(id, type)
  const syncState = useSyncState(id, type)
  const toast = useToast()
  const {changesOpen, editState, handleHistoryOpen} = useDocumentPane()
  const hasValidationErrors = validationStatus.markers.some((marker) => marker.level === 'error')
  // we use this to "schedule" publish after pending tasks (e.g. validation and sync) has completed
  const [publishScheduled, setPublishScheduled] = useState<boolean>(false)
  const isNeitherSyncingNorValidating = !syncState.isSyncing && !validationStatus.isValidating
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'publish',
  })

  const {value: currentUser} = useCurrentUser()

  // eslint-disable-next-line no-nested-ternary
  const title = publish.disabled
    ? getDisabledReason(publish.disabled, (published || {})._updatedAt) || ''
    : hasValidationErrors
    ? 'There are validation errors that need to be fixed before this document can be published'
    : ''

  const hasDraft = Boolean(draft)

  const doPublish = useCallback(() => {
    publish.execute()
  }, [publish])

  useEffect(() => {
    if (publishScheduled && isNeitherSyncingNorValidating) {
      if (!hasValidationErrors) {
        doPublish()
      }

      setPublishScheduled(false)
    }
  }, [isNeitherSyncingNorValidating, doPublish, hasValidationErrors, publishScheduled])

  const publishState = editState?.publishState

  useEffect(() => {
    if (publishState) {
      toast.push({
        id: `publish-progress-${id}`,
        status: publishState.phase === 'success' ? 'success' : 'info',
        duration: publishState.phase === 'success' ? 2_000 : 3_600_000,
        title:
          // eslint-disable-next-line no-nested-ternary
          publishState.phase === 'init' || publishState.phase === 'received'
            ? publishState.local
              ? `Publishing document…`
              : 'The document is being published…'
            : publishState.phase === 'success'
            ? 'The document was published'
            : null,
        description: `${
          !publishState.local &&
          (publishState.phase === 'init' || publishState.phase === 'received')
            ? 'Someone is publishing this document right now. Please hang on.'
            : ''
        }`,
      })
    }
  }, [toast, publishState, id])

  useEffect(() => {
    const didPublish = publishState?.phase === 'success' && !hasDraft
    if (didPublish) {
      if (changesOpen) {
        // Re-open the panel
        handleHistoryOpen()
      }
    }
  }, [changesOpen, publishState, hasDraft, handleHistoryOpen])

  const handle = useCallback(() => {
    if (syncState.isSyncing || validationStatus.isValidating) {
      setPublishScheduled(true)
    } else {
      doPublish()
    }
  }, [syncState.isSyncing, validationStatus.isValidating, doPublish])

  if (liveEdit) {
    return {
      color: 'success',
      label: 'Publish',
      title:
        'Live Edit is enabled for this content type and publishing happens automatically as you make changes',
      disabled: true,
    }
  }

  if (!isPermissionsLoading && !permissions?.granted) {
    return {
      color: 'success',
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
      (publishState && publishState?.phase !== 'success') ||
      hasValidationErrors ||
      publish.disabled
  )

  return {
    disabled: disabled || isPermissionsLoading,
    color: 'success',
    label:
      // eslint-disable-next-line no-nested-ternary
      publishState?.phase === 'success' ? 'Published' : publishState ? 'Publishing…' : 'Publish',
    icon: publishState?.phase === 'success' ? CheckmarkIcon : PublishIcon,
    // eslint-disable-next-line no-nested-ternary
    title: publishScheduled
      ? 'Waiting for tasks to finish before publishing'
      : publishState?.phase
      ? // note: we're letting the toast deal with this
        ''
      : title,
    shortcut: disabled || publishScheduled ? null : 'Ctrl+Alt+P',
    onHandle: handle,
  }
}
