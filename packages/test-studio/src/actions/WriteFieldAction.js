import * as React from 'react'
import {mutate} from '../mockDocStateDatastore'
import {set} from './patch-helpers'

const WriteFieldAction = record => {
  const doc = record.isLiveEdit ? record.published : record.draft
  const [isWriting, setIsWriting] = React.useState(false)
  return {
    disabled: !doc,
    label: 'Edit title field',
    handle: () => {
      setIsWriting(true)
    },
    dialog: isWriting && {
      type: 'popover',
      children: (
        <>
          <h2>Edit title field</h2>
          <input type="text" value={doc.title || ''} onChange={(event) =>
            mutate(record.id, [set('title', event.currentTarget.value)])}/>
          <button onClick={() => setIsWriting(false)}>OK</button>
        </>
      )
    }
  }
}

export default {
  id: 'write-field-action',
  group: 'primary',
  action: WriteFieldAction
}
