import * as React from 'react'
import {mutate} from '../mockDocStateDatastore'
import {set} from './patch-helpers'

export default function WriteFieldAction(docInfo) {
  const doc = docInfo.isLiveEdit ? docInfo.published : docInfo.draft
  const [isWriting, setIsWriting] = React.useState(false)
  return {
    disabled: !doc,
    label: 'Edit title field',
    handle: () => {
      setIsWriting(true)
    },
    dialog: isWriting && (
      <>
        <h2>Edit title field</h2>
        <input
          type="text"
          value={doc.title || ''}
          onChange={event => mutate(docInfo.id, [set('title', event.currentTarget.value)])}
        />
        <button onClick={() => setIsWriting(false)}>OK</button>
      </>
    )
  }
}
