import React from 'react'
import {publish} from '../mockDocStateDatastore'
import {omit} from 'lodash'

export default function PublishAction(docInfo) {
  const [isPublished, setPublished] = React.useState(false)
  if (docInfo.isLiveEdit) {
    return null
  }
  return {
    disabled: !docInfo.draft || !!docInfo.published,
    label: 'Publish',
    handle: () => {
      publish(docInfo.id, doc => omit(doc, 'reviewers'))
      setPublished(true)
    },
    snackbar: isPublished && {type: 'success', content: <div>Published!</div>}
  }
}
