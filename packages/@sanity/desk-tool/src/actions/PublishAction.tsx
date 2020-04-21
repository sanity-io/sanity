/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from 'react'
import {useDocumentOperation, useValidationStatus} from '@sanity/react-hooks'
import TimeAgo from '../components/TimeAgo'
import {useSyncState} from '@sanity/react-hooks'
import Spinner from 'part:@sanity/components/loading/spinner'

const DISABLED_REASON_TITLE = {
  LIVE_EDIT_ENABLED: 'Cannot publish since liveEdit is enabled for this document type',
  ALREADY_PUBLISHED: 'Already published',
  NO_CHANGES: 'No unpublished changes'
}

const InlineSpinner = () => <Spinner inline />
const Checkmark = () => '✓ '

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

export function PublishAction(props) {
  const {id, type, liveEdit, draft, published} = props

  if (liveEdit) {
    return {
      label: 'Publish',
      title:
        'Live Edit is enabled for this content type and publishing happens automatically as you make changes',
      disabled: true
    }
  }

  const [publishState, setPublishState] = React.useState<'publishing' | 'published' | null>(null)

  const {publish}: any = useDocumentOperation(id, type)
  const validationStatus = useValidationStatus(id, type)
  const syncState = useSyncState(id, type)

  const hasValidationErrors = validationStatus.markers.some(marker => marker.level === 'error')

  // we use this to "schedule" publish after pending tasks (e.g. validation and sync) has completed
  const [publishScheduled, setPublishScheduled] = React.useState<boolean>(false)

  const doPublish = React.useCallback(() => {
    publish.execute()
    setPublishState('publishing')
  }, [publish])

  React.useEffect(() => {
    if (publishScheduled && !syncState.isSyncing && !validationStatus.isValidating) {
      if (!hasValidationErrors) {
        doPublish()
      }
      setPublishScheduled(false)
    }
  }, [!syncState.isSyncing && !validationStatus.isValidating])

  const title = publish.disabled
    ? getDisabledReason(publish.disabled, (published || {})._updatedAt) || ''
    : hasValidationErrors
    ? 'There are validation errors that needs to be fixed before this document can be published'
    : ''

  React.useEffect(() => {
    const didPublish = publishState === 'publishing' && !draft
    const nextState = didPublish ? 'published' : null
    const delay = didPublish ? 200 : 4000
    const timer = setTimeout(() => {
      setPublishState(nextState)
    }, delay)
    return () => clearTimeout(timer)
  }, [publishState, Boolean(draft)])

  const disabled = Boolean(
    publishScheduled ||
      publishState === 'publishing' ||
      publishState === 'published' ||
      hasValidationErrors ||
      publish.disabled
  )

  const onHandle = React.useCallback(() => {
    if (syncState.isSyncing || validationStatus.isValidating) {
      setPublishScheduled(true)
    } else {
      doPublish()
    }
  }, [syncState.isSyncing, validationStatus.isValidating])

  return {
    disabled,
    label:
      publishState === 'published'
        ? 'Published'
        : publishScheduled || publishState === 'publishing'
        ? 'Publishing…'
        : 'Publish',
    icon:
      publishState === 'published'
        ? Checkmark
        : publishScheduled || publishState === 'publishing'
        ? InlineSpinner
        : null,
    title: publishScheduled
      ? 'Waiting for tasks to finish before publishing'
      : publishState === 'published' || publishState === 'publishing'
      ? null
      : title,
    shortcut: disabled || publishScheduled ? null : 'Ctrl+Alt+P',
    onHandle: onHandle
  }
}
