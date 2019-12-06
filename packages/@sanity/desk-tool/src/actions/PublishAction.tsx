import * as React from 'react'
import {useDocumentOperation, useValidationStatus} from '@sanity/react-hooks'
import TimeAgo from '../components/TimeAgo'

const DISABLED_REASON_TITLE = {
  LIVE_EDIT_ENABLED: 'Cannot publish since liveEdit is enabled for this document type',
  ALREADY_PUBLISHED: 'Already published',
  NO_CHANGES: 'No unpublished changes'
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

export function PublishAction(props) {
  const {id, type, liveEdit} = props

  if (liveEdit) {
    return {
      label: 'Publish',
      title:
        'Live Edit is enabled for this content type and publishing happens automatically as you make changes',
      disabled: true
    }
  }

  const [publishStatus, setPublishStatus] = React.useState<'publishing' | 'published' | null>(null)

  const {publish}: any = useDocumentOperation(id, type)
  const validationStatus = useValidationStatus(id, type)

  const hasValidationErrors = validationStatus.markers.length > 0

  const title = publish.disabled
    ? getDisabledReason(publish.disabled, (props.published || {})._updatedAt) || ''
    : hasValidationErrors
    ? 'There are validation errors that needs to be fixed before this document can be published'
    : ''

  React.useEffect(() => {
    const delay = 4000
    const timer = setTimeout(() => {
      setPublishStatus(null)
    }, delay)
    return () => clearTimeout(timer)
  }, [publishStatus])

  const disabled = Boolean(validationStatus.isValidating || hasValidationErrors || publish.disabled)

  const didPublish = !props.draft && publishStatus === 'published'
  return {
    disabled,
    label: didPublish ? 'Published' : 'Publish',
    icon: didPublish ? () => '✓ ' : null,
    title: didPublish ? null : title,
    shortcut: disabled ? null : 'Ctrl+Alt+P',
    onHandle: () => {
      publish.execute()
      setPublishStatus('published')
    }
  }
}
