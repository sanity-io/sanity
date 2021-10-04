import {DocumentActionComponent} from '@sanity/base'
import {useSyncState, useDocumentOperation, useValidationStatus} from '@sanity/react-hooks'
import {CheckmarkIcon, PublishIcon} from '@sanity/icons'
import React, {useCallback, useEffect, useState} from 'react'
import {
  unstable_useCheckDocumentPermission as useCheckDocumentPermission,
  useCurrentUser,
} from '@sanity/base/hooks'
import {InsufficientPermissionsMessage} from '@sanity/base/components'
import {TimeAgo} from '../components/TimeAgo'
import {useDocumentPane} from '../panes/document/useDocumentPane'

const DISABLED_REASON_TITLE = {
  LIVE_EDIT_ENABLED: 'Cannot publish since liveEdit is enabled for this document type',
  ALREADY_PUBLISHED: 'Already published',
  NO_CHANGES: 'No unpublished changes',
}

function getDisabledReason(reason, publishedAt) {
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
  const [publishState, setPublishState] = useState<'publishing' | 'published' | null>(null)
  const {publish}: any = useDocumentOperation(id, type)
  const validationStatus = useValidationStatus(id, type)
  const syncState = useSyncState(id)
  const {changesOpen, handleHistoryOpen} = useDocumentPane()
  const hasValidationErrors = validationStatus.markers.some((marker) => marker.level === 'error')
  // we use this to "schedule" publish after pending tasks (e.g. validation and sync) has completed
  const [publishScheduled, setPublishScheduled] = useState<boolean>(false)
  const isNeitherSyncingNorValidating = !syncState.isSyncing && !validationStatus.isValidating
  const publishPermission = useCheckDocumentPermission(id, type, 'publish')
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
    setPublishState('publishing')
  }, [publish])

  useEffect(() => {
    if (publishScheduled && isNeitherSyncingNorValidating) {
      if (!hasValidationErrors) {
        doPublish()
      }

      setPublishScheduled(false)
    }
  }, [isNeitherSyncingNorValidating, doPublish, hasValidationErrors, publishScheduled])

  useEffect(() => {
    const didPublish = publishState === 'publishing' && !hasDraft
    if (didPublish) {
      if (changesOpen) {
        // Re-open the panel
        handleHistoryOpen()
      }
    }
    const nextState = didPublish ? 'published' : null
    const delay = didPublish ? 200 : 4000
    const timer = setTimeout(() => {
      setPublishState(nextState)
    }, delay)
    return () => clearTimeout(timer)
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

  if (!publishPermission.granted) {
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
      publishState === 'publishing' ||
      publishState === 'published' ||
      hasValidationErrors ||
      publish.disabled
  )

  return {
    disabled,
    color: 'success',
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
