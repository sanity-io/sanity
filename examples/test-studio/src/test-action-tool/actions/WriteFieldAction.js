import * as React from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import {set} from './patch-helpers'

export function WriteFieldAction({id, type, published, draft}) {
  const doc = draft || published

  const [isWriting, setIsWriting] = React.useState(false)
  const {patch} = useDocumentOperation(id, type)
  const currentTitle = (doc && doc.title) || ''
  return {
    label: `Edit title field of ${currentTitle}`,
    onHandle: () => {
      setIsWriting(true)
    },
    dialog: isWriting && (
      <>
        <h2>Edit title field</h2>
        <input
          type="text"
          value={currentTitle}
          onChange={(event) => patch.execute([set('title', event.currentTarget.value)])}
        />
        <button onClick={() => setIsWriting(false)}>OK</button>
      </>
    ),
  }
}
