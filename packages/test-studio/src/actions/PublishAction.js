import React from 'react'
import documentStore from 'part:@sanity/base/datastore/document'
import {omit} from 'lodash'

export default function PublishAction(docInfo) {
  if (docInfo.isLiveEditEnabled) {
    return null
  }
  console.log(docInfo)

  return {
    disabled: !docInfo.draft,
    label: 'Publish',
    handle: () => {
      documentStore.local.publish(docInfo.id, docInfo.type, doc => omit(doc, 'reviewers'))
    }
  }
}
