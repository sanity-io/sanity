import React from 'react'
import {publish} from '../mockDocStateDatastore'
import {omit} from 'lodash'

export default function PublishAction(docInfo) {
  const [isPublished, setPublished] = React.useState(false)
  const [isComplete, setIsComplete] = React.useState(false)

  if (docInfo.isLiveEdit) {
    return null
  }
  if (isComplete) {
    return null
  }
  return {
    disabled: !docInfo.draft || !!docInfo.published,
    label: isPublished && !isComplete ? 'Published 🎉' : 'Publish',
    handle: () => {
      publish(docInfo.id, doc => omit(doc, 'reviewers'))
      setPublished(true)
      setTimeout(() => {
        setIsComplete(true)
      }, 1000)
    },
    snackbar: isPublished && {type: 'success', content: <div>Published!</div>}
  }
}
