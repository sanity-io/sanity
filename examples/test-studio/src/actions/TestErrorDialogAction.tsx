import {DocumentActionComponent} from '@sanity/base'
import {ErrorOutlineIcon} from '@sanity/icons'
import React, {useCallback, useState} from 'react'

export const TestErrorDialogAction: DocumentActionComponent = (props) => {
  const {onComplete} = props
  const [dialogOpen, setDialogOpen] = useState(false)

  const handle = useCallback(() => {
    setDialogOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setDialogOpen(true)
    onComplete()
  }, [onComplete])

  return {
    color: 'danger',
    icon: ErrorOutlineIcon,
    label: 'Test error dialog',
    dialog: dialogOpen && {
      type: 'error',
      title: (
        <>
          This is the <code>error</code> dialog
        </>
      ),
      onClose: handleClose,
    },
    onHandle: handle,
  }
}
