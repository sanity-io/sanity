import * as React from 'react'
import {del} from '../mockDocStateDatastore'

const useDelete = record => {
  const [isConfirming, setIsConfirming] = React.useState(false)
  return {
    disabled: !record.draft && !record.published,
    label: isConfirming ? 'Confirm delete…' : 'Delete',
    handle: () => {
      if (isConfirming) {
        del(record.id)
        setIsConfirming(false)
      } else {
        setIsConfirming(true)
      }
    }
  }
}

export default {
  id: 'delete',
  group: 'primary',
  use: record => {
    const decorated = useDelete(record)
    return {...decorated, label: `DECORATED: ${decorated.label}`}
  }
}
