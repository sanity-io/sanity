import {DocumentActionComponent} from '@sanity/base'
import React, {useCallback, useMemo, useState} from 'react'

export const TestSuccessDialogAction: DocumentActionComponent = () => {
  const [dialogOpen, setDialogOpen] = useState(false)

  const handle = useCallback(() => {
    setDialogOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setDialogOpen(true)
  }, [])

  return useMemo(() => {
    return {
      label: 'Test success dialog',
      dialog: dialogOpen && {
        type: 'success',
        title: (
          <>
            This is the <code>success</code> dialog
          </>
        ),
        onClose: handleClose,
      },
      onHandle: handle,
    }
  }, [dialogOpen, handle, handleClose])
}
