import * as React from 'react'
import {useDocumentOperations} from '../test-action-tool/useDocumentOperations'
import {set} from './patch-helpers'

export default function WriteFieldAction(docInfo) {
  const doc = docInfo.isLiveEdit ? docInfo.published : docInfo.draft

  const [isWriting, setIsWriting] = React.useState(false)
  const {patch} = useDocumentOperations(docInfo.id, docInfo.type)
  const currentTitle = (doc && doc.title) || ''
  return {
    label: `Edit title field of ${currentTitle}`,
    handle: () => {
      setIsWriting(true)
    },
    dialog: isWriting && (
      <>
        <h2>Edit title field</h2>
        <input
          type="text"
          value={currentTitle}
          onChange={event => patch([set('title', event.currentTarget.value)])}
        />
        <button onClick={() => setIsWriting(false)}>OK</button>
      </>
    )
  }
}
