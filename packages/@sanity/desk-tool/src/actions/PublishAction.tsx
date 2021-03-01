import {useSyncState, useDocumentOperation, useValidationStatus} from '@sanity/react-hooks'
import CheckmarkIcon from 'part:@sanity/base/check-icon'
import PublishIcon from 'part:@sanity/base/publish-icon'
import React, {useCallback, useEffect, useState} from 'react'
import TimeAgo from '../components/TimeAgo'
import {useDocumentHistory} from '../panes/documentPane/documentHistory'

const DISABLED_REASON_TITLE = {
  LIVE_EDIT_ENABLED: 'Cannot publish since liveEdit is enabled for this document type',
  ALREADY_PUBLISHED: 'Already published',
  NO_CHANGES: 'No unpublished changes',
}

function getDisabledReason(reason, publishedAt) {
  if (reason === 'ALREADY_PUBLISHED' && publishedAt) {
    return (
      <>
        Published <TimeAgo time={publishedAt} />
      </>
    )
  }
  return DISABLED_REASON_TITLE[reason]
}

// eslint-disable-next-line complexity
export function PublishAction(props) {
  const {id, type, liveEdit, draft, published} = props
  const [publishState, setPublishState] = useState<'publishing' | 'published' | null>(null)
  const {publish}: any = useDocumentOperation(id, type)
  const validationStatus = useValidationStatus(id, type)
  const syncState = useSyncState(id)
  const {open: historyOpen, historyController} = useDocumentHistory()

  const hasValidationErrors = validationStatus.markers.some((marker) => marker.level === 'error')

  // we use this to "schedule" publish after pending tasks (e.g. validation and sync) has completed
  const [publishScheduled, setPublishScheduled] = useState<boolean>(false)

  const doPublish = useCallback(() => {
    publish.execute()
    setPublishState('publishing')
  }, [publish])

  const isNeitherSyncingNorValidating = !syncState.isSyncing && !validationStatus.isValidating

  useEffect(() => {
    if (publishScheduled && isNeitherSyncingNorValidating) {
      if (!hasValidationErrors) {
        doPublish()
      }

      setPublishScheduled(false)
    }
  }, [isNeitherSyncingNorValidating, doPublish, hasValidationErrors, publishScheduled])

  // eslint-disable-next-line no-nested-ternary
  const title = publish.disabled
    ? getDisabledReason(publish.disabled, (published || {})._updatedAt) || ''
    : hasValidationErrors
    ? 'There are validation errors that need to be fixed before this document can be published'
    : ''

  const hasDraft = Boolean(draft)

  useEffect(() => {
    const didPublish = publishState === 'publishing' && !hasDraft
    if (didPublish) {
      if (historyController.changesPanelActive()) {
        // Re-open the panel
        historyOpen()
      }
    }
    const nextState = didPublish ? 'published' : null
    const delay = didPublish ? 200 : 4000
    const timer = setTimeout(() => {
      setPublishState(nextState)
    }, delay)
    return () => clearTimeout(timer)
  }, [publishState, hasDraft, historyController, historyOpen])

  const disabled = Boolean(
    publishScheduled ||
      publishState === 'publishing' ||
      publishState === 'published' ||
      hasValidationErrors ||
      publish.disabled
  )

  const handle = useCallback(() => {
    if (syncState.isSyncing || validationStatus.isValidating) {
      setPublishScheduled(true)
    } else {
      doPublish()
    }
  }, [syncState.isSyncing, validationStatus.isValidating, doPublish])

  if (liveEdit) {
    return {
      label: 'Publish',
      title:
        'Live Edit is enabled for this content type and publishing happens automatically as you make changes',
      disabled: true,
    }
  }

  return {
    disabled,
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
