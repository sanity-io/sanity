import {DocumentActionComponent, DocumentActionDescription} from 'sanity'
import {CheckmarkCircleIcon, CloseCircleIcon} from '@sanity/icons'
import {Button, Text, useToast} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'

export const TestConfirmDialogAction: DocumentActionComponent = (props) => {
  const {onComplete} = props
  const [modalOpen, setDialogOpen] = useState(false)
  const {push: pushToast} = useToast()

  const handleOpen = useCallback(() => {
    if (!modalOpen) {
      setDialogOpen(true)
      pushToast({closable: true, title: '[confirm] Opened'})
    }
  }, [modalOpen, pushToast])

  const handleClose = useCallback(() => {
    setDialogOpen(false)
    pushToast({closable: true, title: '[confirm] Closed'})
    onComplete()
  }, [onComplete, pushToast])

  const handleCancel = useCallback(() => {
    setDialogOpen(false)
    pushToast({closable: true, title: '[confirm] Cancelled'})
    onComplete()
  }, [onComplete, pushToast])

  const handleConfirm = useCallback(() => {
    setDialogOpen(false)
    pushToast({closable: true, title: '[confirm] Confirmed', status: 'info'})
    onComplete()
  }, [onComplete, pushToast])

  const modal: DocumentActionDescription['modal'] = useMemo(
    () =>
      modalOpen && {
        type: 'confirm',
        tone: 'positive',
        content: (
          <>
            <Text>
              This is the <code>confirm</code> modal
            </Text>
            <Button onClick={handleClose} text="Close" />
          </>
        ),
        message: 'Test confirm modal',
        onCancel: handleCancel,
        onConfirm: handleConfirm,
        cancelButtonIcon: CloseCircleIcon,
        cancelButtonText: 'No',
        confirmButtonIcon: CheckmarkCircleIcon,
        confirmButtonText: 'Yes',
      },
    [modalOpen, handleCancel, handleClose, handleConfirm]
  )

  return {
    tone: 'positive',
    modal,
    onHandle: handleOpen,
    label: 'Test confirm modal',
    shortcut: 'mod+p',
  }
}
