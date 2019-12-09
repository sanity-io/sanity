import * as React from 'react'
import {useDocumentOperations} from '../test-action-tool/useDocumentOperations'
import {set} from './patch-helpers'

export default function WriteFieldAction(docInfo) {
  const doc = docInfo.isLiveEdit ? docInfo.published : docInfo.draft
  const [isWriting, setIsWriting] = React.useState(false)
  const {patch} = useDocumentOperations(docInfo.id, docInfo.type)

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
          onChange={event => patch([set('title', event.currentTarget.value)])}
        />
        <button onClick={() => setIsWriting(false)}>OK</button>
      </>
    )
  }
}
