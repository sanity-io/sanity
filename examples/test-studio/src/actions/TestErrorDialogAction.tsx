import {DocumentActionComponent} from '@sanity/base'
import React, {useCallback, useMemo, useState} from 'react'

export const TestErrorDialogAction: DocumentActionComponent = () => {
  const [dialogOpen, setDialogOpen] = useState(false)

  const handle = useCallback(() => {
    setDialogOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setDialogOpen(true)
  }, [])

  return useMemo(() => {
    return {
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
  }, [dialogOpen, handle, handleClose])
}
