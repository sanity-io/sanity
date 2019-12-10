import * as React from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import {set} from './patch-helpers'
import {createAction} from './createAction'

export default createAction(function WriteFieldAction(docInfo) {
  const doc = docInfo.isLiveEdit ? docInfo.published : docInfo.draft

  const [isWriting, setIsWriting] = React.useState(false)
  const {patch} = useDocumentOperation(docInfo.id, docInfo.type)
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
})
